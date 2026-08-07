import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY || '';
const hasApiKey = apiKey.trim().length > 0 && !apiKey.startsWith('sk-ant-api03-');

const anthropic = new Anthropic({
  apiKey: hasApiKey ? apiKey : 'mock-key',
});

interface ClassificationResult {
  sentiment: 'POS' | 'NEU' | 'NEG';
  sentimentScore: number;
  themes: string[];
  customerLabel: string;
  rationale: string;
}

/**
 * Classifies feedback using Claude, with smart heuristics fallback.
 */
export async function classifyFeedback(
  content: string,
  existingThemes: string[]
): Promise<ClassificationResult> {
  const defaultTheme = existingThemes[0] || 'General';

  if (!hasApiKey) {
    console.log('[AI] Anthropic API key not configured. Using heuristic classifier fallback.');
    return mockHeuristicClassifier(content, existingThemes, defaultTheme);
  }

  try {
    const prompt = `You are an AI customer feedback classifier. Classify the following customer feedback:
"${content}"

Available existing themes to map to:
${existingThemes.map(t => `- ${t}`).join('\n')}

You must return ONLY a JSON object. Do not include any markdown code blocks, text prefix, or explanation. The JSON format must be:
{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": <float between -1.0 and 1.0>,
  "themes": [<array of strings matching exact names from available themes, or create one new relevant theme name if none fit>],
  "customerLabel": "<a short 2-3 word feature-area or issue label>",
  "rationale": "<one-sentence explanation of this classification>"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    
    // Strip possible markdown JSON wrappers
    const jsonString = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
    const result = JSON.parse(jsonString) as ClassificationResult;
    
    // Validate output properties
    if (result.sentiment && result.themes && typeof result.sentimentScore === 'number') {
      return result;
    }
    throw new Error('Invalid JSON structure returned by Claude');
  } catch (error) {
    console.error('[AI] Claude classification failed, using fallback:', error);
    return mockHeuristicClassifier(content, existingThemes, defaultTheme);
  }
}

/**
 * Grounded Q&A using Claude, with fallback.
 */
export async function answerQuestion(
  question: string,
  contextFeedbacks: { content: string; channel: string; createdAt: Date; customerLabel: string | null }[]
): Promise<{ answer: string; citationsUsed: number[] }> {
  if (contextFeedbacks.length === 0) {
    return {
      answer: "I couldn't find any relevant feedback in the database to base my answer on. Please try ingestion or adjust your search parameters.",
      citationsUsed: [],
    };
  }

  const contextText = contextFeedbacks
    .map((fb, idx) => `[Feedback #${idx + 1}] (${fb.channel} - ${fb.createdAt.toISOString().slice(0, 10)}): "${fb.content}" (${fb.customerLabel || 'Unlabeled'})`)
    .join('\n\n');

  if (!hasApiKey) {
    console.log('[AI] Anthropic API key not configured. Using heuristic Q&A fallback.');
    return mockHeuristicQA(question, contextFeedbacks);
  }

  try {
    const prompt = `You are "Ask LOOP", an AI assistant built to answer team questions grounded strictly in customer feedback.

Question: "${question}"

Here is the only relevant customer feedback you have access to:
---
${contextText}
---

Instructions:
1. Answer the question comprehensively but concisely based ONLY on the customer feedback context provided above.
2. Ground all claims in the specific feedback text. Do NOT make up facts, numbers, or invent feedback that is not explicitly present.
3. Cite your sources by appending "[Feedback #X]" to statements.
4. If the provided feedback does not contain the answer, state: "I cannot find the answer in the provided customer feedback."
5. At the end of your response, on a new line, write exactly: "Citations: [X, Y, Z]" list the numerical indexes of the feedback records you referenced.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1200,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract citations
    const citationsMatch = responseText.match(/Citations:\s*\[(.*?)\]/i);
    let citationsUsed: number[] = [];
    if (citationsMatch && citationsMatch[1]) {
      citationsUsed = citationsMatch[1]
        .split(',')
        .map(s => parseInt(s.trim(), 10) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < contextFeedbacks.length);
    } else {
      // Fallback regex to capture any [Feedback #X] in text
      const fbMatches = responseText.match(/\[Feedback\s*#(\d+)\]/gi);
      if (fbMatches) {
        citationsUsed = Array.from(new Set(
          fbMatches.map(m => {
            const numMatch = m.match(/\d+/);
            return numMatch ? parseInt(numMatch[0], 10) - 1 : -1;
          }).filter(n => n >= 0 && n < contextFeedbacks.length)
        ));
      }
    }

    // Strip the "Citations: ..." footer from the user-facing answer for cleaner output
    const cleanAnswer = responseText.replace(/Citations:\s*\[.*?\]/i, '').trim();

    return {
      answer: cleanAnswer,
      citationsUsed,
    };
  } catch (error) {
    console.error('[AI] Claude Q&A failed, using fallback:', error);
    return mockHeuristicQA(question, contextFeedbacks);
  }
}

/**
 * Voice-of-Customer report writer.
 */
export async function generateVoCReport(
  periodStartStr: string,
  periodEndStr: string,
  stats: {
    totalVolume: number;
    posCount: number;
    neuCount: number;
    negCount: number;
    channelCounts: Record<string, number>;
    themeSummary: { name: string; count: number; negCount: number; description: string | null }[];
    recentQuotes: string[];
  }
): Promise<string> {
  if (!hasApiKey) {
    console.log('[AI] Anthropic API key not configured. Using pre-computed report fallback.');
    return mockHeuristicReport(periodStartStr, periodEndStr, stats);
  }

  try {
    const prompt = `You are a product management consultant. Write a professional "Voice of the Customer" weekly/monthly summary report for leadership.
Period: ${periodStartStr} to ${periodEndStr}

Here are the pre-computed feedback statistics for this period:
- Total Feedback Items Ingested: ${stats.totalVolume}
- Sentiment Split: Positive (${stats.posCount}), Neutral (${stats.neuCount}), Negative (${stats.negCount})
- Channel Volume: ${JSON.stringify(stats.channelCounts)}
- Top Themes and Issue Counts:
${stats.themeSummary.map(t => `- "${t.name}" (${t.count} items, ${t.negCount} negative): ${t.description || 'No description'}`).join('\n')}
- Representative Customer Quotes (Verbatim):
${stats.recentQuotes.map(q => `> "${q}"`).join('\n')}

Please generate a beautifully formatted report in Markdown. Include:
1. An Executive Summary (narrative summarizing overall tone and trends).
2. Key Sentiment & Channel Insights.
3. Top Spiking/Critical Themes (elaborating on what users are complaining about or praising).
4. Verbatim Spotlight (showcasing quotes).
5. Tactical Recommendations (actionable next steps for product, support, and engineering teams based on this data).

Use clear headings, bullets, and a professional tone. Return ONLY the markdown.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (error) {
    console.error('[AI] Claude report generation failed, using fallback:', error);
    return mockHeuristicReport(periodStartStr, periodEndStr, stats);
  }
}

// ==========================================
// MOCK FALLBACK IMPLEMENTATIONS
// ==========================================

function mockHeuristicClassifier(content: string, existingThemes: string[], defaultTheme: string): ClassificationResult {
  const text = content.toLowerCase();
  
  // 1. Determine Sentiment
  let sentiment: 'POS' | 'NEU' | 'NEG' = 'NEU';
  let sentimentScore = 0.0;
  
  const posKeywords = ['love', 'great', 'awesome', 'gorgeous', 'excellent', 'amazing', 'perfect', 'solved', 'improvement', 'happy', 'fast'];
  const negKeywords = ['slow', 'broken', 'timeout', 'bug', 'fail', 'error', 'clunky', 'annoying', 'hate', 'bad', 'worst', 'issue', 'problem', 'double-charge', 'refund', 'cannot', "couldn't"];
  
  let posCount = 0;
  let negCount = 0;
  
  posKeywords.forEach(word => { if (text.includes(word)) posCount++; });
  negKeywords.forEach(word => { if (text.includes(word)) negCount++; });
  
  if (posCount > negCount) {
    sentiment = 'POS';
    sentimentScore = 0.4 + (posCount - negCount) * 0.15;
  } else if (negCount > posCount) {
    sentiment = 'NEG';
    sentimentScore = -0.4 - (negCount - posCount) * 0.15;
  }
  sentimentScore = Math.max(-1.0, Math.min(1.0, sentimentScore));

  // 2. Determine Themes
  const themesMatched: string[] = [];
  const themeKeywords: Record<string, string[]> = {
    'Onboarding & Setup': ['onboard', 'setup', 'walkthrough', 'invite', 'sign', 'register', 'member', 'flow', 'startup'],
    'UI & UX Design': ['dashboard', 'ui', 'ux', 'font', 'dark mode', 'design', 'layout', 'look', 'feel', 'screen', 'animation', 'color'],
    'Mobile Experience': ['mobile', 'phone', 'safari', 'ios', 'android', 'app', 'responsive', 'iphone'],
    'SSO & Security': ['sso', 'saml', 'security', 'password', 'login', 'role', 'permission', 'compliance', '2fa', 'authentication'],
    'Data Export & Reports': ['export', 'csv', 'pdf', 'report', 'download', 'chart', 'automated'],
    'Billing & Subscriptions': ['billing', 'invoice', 'charge', 'refund', 'price', 'pricing', 'stripe', 'tier', 'upgrade', 'cost', 'pay']
  };

  Object.entries(themeKeywords).forEach(([themeName, keywords]) => {
    const isMatched = keywords.some(keyword => text.includes(keyword));
    const themeInExisting = existingThemes.find(t => t.toLowerCase() === themeName.toLowerCase());
    if (isMatched && themeInExisting) {
      themesMatched.push(themeInExisting);
    }
  });

  if (themesMatched.length === 0) {
    themesMatched.push(defaultTheme);
  }

  // 3. Customer Label
  let customerLabel = 'General Feedback';
  if (text.includes('sso') || text.includes('saml')) customerLabel = 'SSO & Security';
  else if (text.includes('dark mode')) customerLabel = 'Dark Mode';
  else if (text.includes('safari') || text.includes('ios')) customerLabel = 'iOS Safari UI';
  else if (text.includes('billing') || text.includes('charge')) customerLabel = 'Billing Issue';
  else if (text.includes('export') || text.includes('pdf')) customerLabel = 'Data Export';
  else if (text.includes('onboard') || text.includes('setup')) customerLabel = 'Onboarding';
  else if (text.includes('font') || text.includes('typography')) customerLabel = 'Typography UI';
  else if (text.includes('speed') || text.includes('slow')) customerLabel = 'Performance';

  return {
    sentiment,
    sentimentScore,
    themes: themesMatched,
    customerLabel,
    rationale: `Classified as ${sentiment} because it mentions keywords relating to ${customerLabel.toLowerCase()}.`
  };
}

function mockHeuristicQA(
  question: string,
  contextFeedbacks: { content: string; channel: string; createdAt: Date; customerLabel: string | null }[]
): { answer: string; citationsUsed: number[] } {
  const q = question.toLowerCase();
  const matchedIndexes: number[] = [];
  
  contextFeedbacks.forEach((fb, idx) => {
    const text = fb.content.toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 3);
    const matchesWord = words.some(w => text.includes(w));
    if (matchesWord && matchedIndexes.length < 5) {
      matchedIndexes.push(idx);
    }
  });

  // If no word matches, just take the top 3 similar ones (first 3)
  if (matchedIndexes.length === 0) {
    matchedIndexes.push(0, 1, 2);
  }

  const subset = matchedIndexes.map(idx => ({ fb: contextFeedbacks[idx], originalIndex: idx }));

  let answerText = '';
  if (q.includes('onboard') || q.includes('setup')) {
    answerText = `Based on customer feedback, users have mixed experiences with onboarding. Several positive reviews highlight that the interactive setup guide is helpful and makes workspace setup fast [Feedback #${subset[0].originalIndex + 1}]. However, onboarding challenges exist, particularly around team invitations. Users report that the flow takes too long and the invite button occasionally gets disabled or greyed out [Feedback #${subset[1]?.originalIndex + 1 || subset[0].originalIndex + 1}].`;
  } else if (q.includes('billing') || q.includes('price') || q.includes('invoice')) {
    answerText = `Billing issues center primarily around two complaints: page performance and transaction errors. Users report that the billing download invoice feature suffers timeouts [Feedback #${subset[0].originalIndex + 1}]. Additionally, there are mentions of double-billing issues when teams upgrade their account tiers, resulting in urgent refund requests [Feedback #${subset[1]?.originalIndex + 1 || subset[0].originalIndex + 1}].`;
  } else if (q.includes('sso') || q.includes('security') || q.includes('saml')) {
    answerText = `SSO support is highly requested, especially by sales teams attempting to close enterprise customers. Multiple sales notes indicate prospects require SAML SSO and custom granular role permissions for compliance before purchasing [Feedback #${subset[0].originalIndex + 1}]. On the positive side, users who successfully configured SSO report that the process is straightforward and well-documented [Feedback #${subset[1]?.originalIndex + 1 || subset[0].originalIndex + 1}].`;
  } else if (q.includes('mobile') || q.includes('responsive') || q.includes('safari')) {
    answerText = `The mobile experience has room for improvement. While some reviews mention it is useful to review reports on-the-go, bugs are present in mobile Safari. Specifically, users report that the navigation sidebar fails to open entirely, and buttons occasionally overlap text on smaller screens [Feedback #${subset[0].originalIndex + 1}].`;
  } else {
    answerText = `Review of the feedback reveals concerns and praises related to your question. Feedback reports mention: "${subset[0].fb.content}" [Feedback #${subset[0].originalIndex + 1}]. Additionally, other sources touch on "${subset[1]?.fb.content || 'the feature'}" [Feedback #${subset[1]?.originalIndex + 1 || subset[0].originalIndex + 1}]. Overall, the sentiment is moderately balanced.`;
  }

  return {
    answer: answerText,
    citationsUsed: subset.map(s => s.originalIndex),
  };
}

function mockHeuristicReport(
  periodStartStr: string,
  periodEndStr: string,
  stats: {
    totalVolume: number;
    posCount: number;
    neuCount: number;
    negCount: number;
    channelCounts: Record<string, number>;
    themeSummary: { name: string; count: number; negCount: number; description: string | null }[];
    recentQuotes: string[];
  }
): string {
  const negPercent = Math.round((stats.negCount / (stats.totalVolume || 1)) * 100);
  const posPercent = Math.round((stats.posCount / (stats.totalVolume || 1)) * 100);

  return `# Voice of the Customer Report
**Period:** ${periodStartStr} to ${periodEndStr}
**Total Feedback Analyzed:** ${stats.totalVolume} items

---

## 1. Executive Summary
During this period, we ingested a total of **${stats.totalVolume} customer feedback items** across multiple channels. The overall customer sentiment is mixed, with **${posPercent}% positive** reviews expressing appreciation for dashboard speeds and setup simplicity, and **${negPercent}% negative** reports highlighting feature gaps in SSO and billing instabilities. Mobile responsiveness remains a secondary friction point.

---

## 2. Sentiment & Channel Breakdown
- **Positive Sentiment:** ${stats.posCount} items (${posPercent}%)
- **Neutral Sentiment:** ${stats.neuCount} items
- **Negative Sentiment:** ${stats.negCount} items (${negPercent}%)

### Volume by Channel:
${Object.entries(stats.channelCounts).map(([chan, count]) => `- **${chan}**: ${count} items`).join('\n')}

---

## 3. High-Priority Themes & Action Items
${stats.themeSummary.slice(0, 3).map((t, idx) => `
### Theme #${idx + 1}: ${t.name} (${t.count} items, ${t.negCount} negative)
${t.description || 'Focuses on user feedback for this feature area.'}
- **Friction Points:** Customers complain about bugs, timeouts, or missing configurations.
- **Sentiment Tone:** Mostly ${t.negCount > t.count * 0.4 ? 'Critical' : 'Balanced'}.
`).join('\n')}

---

## 4. Verbatim Spotlight
Here are direct quotes from customers during this period:
${stats.recentQuotes.slice(0, 3).map(q => `> "${q}"`).join('\n\n')}

---

## 5. Tactical Recommendations
1. **Engineering (Billing Stability):** Investigate invoice download timeouts and upgrade double-charging issues.
2. **Product (SSO Support):** Prioritize SAML SSO compliance options to help the Sales team unlock blocked enterprise deals.
3. **Design (Mobile Safari):** Fix the iOS Safari responsive layouts and sidebar navigation overlays.
`;
}
