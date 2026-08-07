import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { classifyFeedback } from '@/lib/ai';
import { getEmbedding } from '@/lib/embeddings';

/**
 * Parses raw CSV text into mapped feedback objects.
 */
function parseCSV(csvText: string): { content: string; channel: string; customerLabel: string }[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const rows: { content: string; channel: string; customerLabel: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, preserving commas within quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const values = matches.map(v => v.trim().replace(/^["']|["']$/g, '').replace(/""/g, '"'));

    const rowData: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    // Handle flexible CSV headers
    const content = rowData.content || rowData.feedback || rowData.text || rowData.comment || '';
    let channel = (rowData.channel || rowData.source || 'SUPPORT').toUpperCase();
    
    // Normalize channels
    const validChannels = ['SUPPORT', 'APP_STORE', 'NPS', 'SALES', 'COMMUNITY'];
    if (!validChannels.includes(channel)) {
      channel = 'SUPPORT';
    }

    const customerLabel = rowData.customer_label || rowData.customerlabel || rowData.label || rowData.feature || '';

    if (content.trim()) {
      rows.push({
        content: content.trim(),
        channel,
        customerLabel: customerLabel.trim() || 'Imported CSV',
      });
    }
  }

  return rows;
}

/**
 * POST: Bulk ingest feedback. Accepts a CSV file/text or JSON array.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot bulk upload' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { csvText, rows: jsonRows } = body;
    const { workspaceId } = session.user;

    let itemsToIngest: { content: string; channel: string; customerLabel: string }[] = [];

    if (csvText) {
      itemsToIngest = parseCSV(csvText);
    } else if (Array.isArray(jsonRows)) {
      itemsToIngest = jsonRows.map((r: any) => ({
        content: r.content || '',
        channel: (r.channel || 'SUPPORT').toUpperCase(),
        customerLabel: r.customerLabel || 'API Bulk Ingestion',
      })).filter(r => r.content.trim().length > 0);
    }

    if (itemsToIngest.length === 0) {
      return NextResponse.json({ error: 'No valid feedback items detected' }, { status: 400 });
    }

    // Ingest feedbacks inside database (batch creation)
    const createdFeedbacks = [];
    for (const item of itemsToIngest) {
      const fb = await db.feedback.create({
        data: {
          content: item.content,
          channel: item.channel,
          customerLabel: item.customerLabel,
          status: 'NEW',
          workspaceId,
        },
      });
      createdFeedbacks.push(fb);
    }

    // Asynchronously classify and embed the feedbacks in background to prevent request timeout.
    // We start the background processing task but do NOT await its full completion.
    processFeedbacksInBackground(createdFeedbacks, workspaceId);

    return NextResponse.json({
      success: true,
      message: `Successfully queued ${createdFeedbacks.length} feedback items for ingestion.`,
      count: createdFeedbacks.length,
    });
  } catch (error: any) {
    console.error('Error in bulk feedback ingestion:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * Runs classification and embedding processes for a list of feedback records in the background.
 */
async function processFeedbacksInBackground(
  feedbacks: { id: string; content: string }[],
  workspaceId: string
) {
  console.log(`[Bulk AI] Starting background processing for ${feedbacks.length} items...`);
  
  try {
    // Fetch workspace themes
    const dbThemes = await db.theme.findMany({
      where: { workspaceId },
    });
    const themeNames = dbThemes.map(t => t.name);

    // Process each feedback item sequentially to avoid hitting Anthropic rate limits
    for (const fb of feedbacks) {
      try {
        // 1. AI Classification
        const aiResult = await classifyFeedback(fb.content, themeNames);
        
        // 2. Resolve themes (Link existing, create new)
        for (const aiThemeName of aiResult.themes) {
          let themeObj = dbThemes.find(t => t.name.toLowerCase() === aiThemeName.toLowerCase());
          if (!themeObj) {
            const randomColors = ['#6366F1', '#A855F7', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#14B8A6'];
            const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
            themeObj = await db.theme.create({
              data: {
                name: aiThemeName,
                description: `Auto-generated theme for ${aiThemeName}`,
                color: randomColor,
                workspaceId,
              },
            });
            // Push to local list to allow reuse on subsequent loops
            dbThemes.push(themeObj);
            themeNames.push(themeObj.name);
          }

          await db.feedbackTheme.upsert({
            where: {
              feedbackId_themeId: {
                feedbackId: fb.id,
                themeId: themeObj.id,
              },
            },
            create: {
              feedbackId: fb.id,
              themeId: themeObj.id,
              confidence: 0.9,
            },
            update: {},
          });
        }

        // 3. Generate Embedding
        const vector = await getEmbedding(fb.content);
        await db.embedding.upsert({
          where: { feedbackId: fb.id },
          create: {
            feedbackId: fb.id,
            vector: JSON.stringify(vector),
          },
          update: {
            vector: JSON.stringify(vector),
          },
        });

        // 4. Update core attributes
        await db.feedback.update({
          where: { id: fb.id },
          data: {
            sentiment: aiResult.sentiment,
            sentimentScore: aiResult.sentimentScore,
            customerLabel: aiResult.customerLabel,
          },
        });
      } catch (err) {
        console.error(`[Bulk AI] Failed to process feedback ID ${fb.id}:`, err);
      }
    }
    console.log(`[Bulk AI] Background processing completed for ${feedbacks.length} items.`);
  } catch (err) {
    console.error(`[Bulk AI] Fatal background task failure:`, err);
  }
}
