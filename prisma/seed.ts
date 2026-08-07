import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
    },
  });
  console.log(`Created workspace: ${workspace.name} (${workspace.id})`);

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'admin@acme.com',
      passwordHash,
      role: 'ADMIN',
      workspaceId: workspace.id,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'analyst@acme.com',
      passwordHash,
      role: 'ANALYST',
      workspaceId: workspace.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: 'Marcus Chen',
      email: 'viewer@acme.com',
      passwordHash,
      role: 'VIEWER',
      workspaceId: workspace.id,
    },
  });

  console.log('Created users:');
  console.log(`- Admin: admin@acme.com (Sarah Jenkins)`);
  console.log(`- Analyst: analyst@acme.com (Alex Rivera)`);
  console.log(`- Viewer: viewer@acme.com (Marcus Chen)`);

  // 3. Create Themes
  const themesData = [
    { name: 'Onboarding & Setup', description: 'User registration, walkthroughs, team invitations, and initial setup flows.', color: '#6366F1' },
    { name: 'UI & UX Design', description: 'Layout, styles, navigation, dark mode, loading states, and general look and feel.', color: '#A855F7' },
    { name: 'Mobile Experience', description: 'Mobile responsive design, mobile browser compatibility, and app layouts.', color: '#3B82F6' },
    { name: 'SSO & Security', description: 'Single sign-on, authentication, access controls, permissions, and security standards.', color: '#EF4444' },
    { name: 'Data Export & Reports', description: 'Downloading CSV/PDF data, integrations, APIs, and custom reporting capabilities.', color: '#10B981' },
    { name: 'Billing & Subscriptions', description: 'Pricing tiers, invoices, checkout, payment gateway errors, and plans.', color: '#F59E0B' },
  ];

  const themes = [];
  for (const t of themesData) {
    const theme = await prisma.theme.create({
      data: {
        name: t.name,
        description: t.description,
        color: t.color,
        workspaceId: workspace.id,
      },
    });
    themes.push(theme);
  }
  console.log(`Created ${themes.length} themes.`);

  // 4. Ingest 120 Feedback Items
  // We specify varied contents, channels, sentiment, sentimentScore, status and date distribution
  const feedbackTemplates = [
    // Onboarding & Setup
    { content: "Onboarding took forever — I couldn't figure out how to invite my team.", channel: 'SUPPORT', label: 'Team Invitations', sentiment: 'NEG', score: -0.7, themeIdx: 0 },
    { content: "The interactive setup guide was super helpful. Set up my workspace in 2 minutes!", channel: 'NPS', label: 'Setup Guide', sentiment: 'POS', score: 0.9, themeIdx: 0 },
    { content: "I got stuck on the team invite page because the invite button was greyed out.", channel: 'SUPPORT', label: 'Bug', sentiment: 'NEG', score: -0.5, themeIdx: 0 },
    { content: "Adding new members to our workspace during onboarding is clunky.", channel: 'COMMUNITY', label: 'Member Invites', sentiment: 'NEG', score: -0.4, themeIdx: 0 },
    { content: "The signup flow is clean and simple. Great first impression.", channel: 'APP_STORE', label: 'Registration', sentiment: 'POS', score: 0.8, themeIdx: 0 },
    { content: "Could you add a skipped onboarding walkthrough button? I already know the UI.", channel: 'COMMUNITY', label: 'Feature Request', sentiment: 'NEU', score: 0.1, themeIdx: 0 },
    
    // UI & UX Design
    { content: "The new dashboard is gorgeous and finally fast. Huge improvement.", channel: 'APP_STORE', label: 'Dashboard', sentiment: 'POS', score: 0.95, themeIdx: 1 },
    { content: "Fonts are too small on the analytics page. I have to zoom in to read standard stats.", channel: 'SUPPORT', label: 'Typography', sentiment: 'NEG', score: -0.3, themeIdx: 1 },
    { content: "I love the new dark mode. My eyes thank you during night shifts!", channel: 'COMMUNITY', label: 'Dark Mode', sentiment: 'POS', score: 0.9, themeIdx: 1 },
    { content: "The screen layout feels cluttered on standard 13-inch laptops.", channel: 'NPS', label: 'Dashboard UX', sentiment: 'NEG', score: -0.4, themeIdx: 1 },
    { content: "Clean UI, modern look. The charts look very professional.", channel: 'NPS', label: 'Visuals', sentiment: 'POS', score: 0.85, themeIdx: 1 },
    { content: "Transitions between pages are a bit laggy. Needs optimization.", channel: 'SUPPORT', label: 'Performance', sentiment: 'NEG', score: -0.4, themeIdx: 1 },

    // Mobile Experience
    { content: "It does the job, but the mobile experience needs work.", channel: 'NPS', label: 'Mobile App', sentiment: 'NEU', score: 0.0, themeIdx: 2 },
    { content: "The app is completely broken on Safari for iOS. The sidebar doesn't open at all.", channel: 'SUPPORT', label: 'iOS Safari Bug', sentiment: 'NEG', score: -0.8, themeIdx: 2 },
    { content: "Dashboard layout looks weird on my iPhone 14. Buttons overlap text.", channel: 'APP_STORE', label: 'Responsive Bug', sentiment: 'NEG', score: -0.6, themeIdx: 2 },
    { content: "Great mobile layout! Very easy to review insights on the go.", channel: 'APP_STORE', label: 'Mobile View', sentiment: 'POS', score: 0.8, themeIdx: 2 },
    { content: "Can we get a native mobile application? Web wrapper in browser feels slow.", channel: 'COMMUNITY', label: 'Feature Request', sentiment: 'NEU', score: 0.2, themeIdx: 2 },

    // SSO & Security
    { content: "Prospect wants SSO before they'll sign — third time this month.", channel: 'SALES', label: 'SSO Integration', sentiment: 'NEG', score: -0.5, themeIdx: 3 },
    { content: "Our enterprise customer requires SAML SSO integration to close the $50k deal.", channel: 'SALES', label: 'Enterprise Security', sentiment: 'NEU', score: 0.0, themeIdx: 3 },
    { content: "Does the system support two-factor authentication? Need this for compliance.", channel: 'SUPPORT', label: 'Security', sentiment: 'NEU', score: 0.1, themeIdx: 3 },
    { content: "Role permissions are not granular enough. We need custom roles for security compliance.", channel: 'COMMUNITY', label: 'RBAC Access', sentiment: 'NEG', score: -0.4, themeIdx: 3 },
    { content: "Setting up SSO was straightforward. Great documentation.", channel: 'NPS', label: 'SAML Setup', sentiment: 'POS', score: 0.85, themeIdx: 3 },

    // Data Export & Reports
    { content: "Love the new export feature, saved me an hour today.", channel: 'COMMUNITY', label: 'Data Export', sentiment: 'POS', score: 0.9, themeIdx: 4 },
    { content: "CSV export fails if we have more than 5,000 feedback rows in a search.", channel: 'SUPPORT', label: 'Export Bug', sentiment: 'NEG', score: -0.6, themeIdx: 4 },
    { content: "We need automated PDF weekly reports emailed to our product managers.", channel: 'SALES', label: 'Automated Reports', sentiment: 'NEU', score: 0.2, themeIdx: 4 },
    { content: "The PDF export design looks messy. The charts are cut off at the page edge.", channel: 'SUPPORT', label: 'PDF Export Layout', sentiment: 'NEG', score: -0.4, themeIdx: 4 },
    { content: "Very clean CSV structure. Made it easy to import into our BI tool.", channel: 'NPS', label: 'CSV Structure', sentiment: 'POS', score: 0.8, themeIdx: 4 },

    // Billing & Subscriptions
    { content: "Billing page keeps timing out when I try to download an invoice.", channel: 'SUPPORT', label: 'Billing Bug', sentiment: 'NEG', score: -0.7, themeIdx: 5 },
    { content: "We were double-charged for our team upgrade. Please refund ASAP.", channel: 'SUPPORT', label: 'Double Charge', sentiment: 'NEG', score: -0.85, themeIdx: 5 },
    { content: "The pricing page is confusing. It's not clear what features are in the Growth tier.", channel: 'SALES', label: 'Pricing Clarity', sentiment: 'NEU', score: -0.1, themeIdx: 5 },
    { content: "Upgrading our plan was super fast. Stripe integration works perfectly.", channel: 'NPS', label: 'Billing UI', sentiment: 'POS', score: 0.9, themeIdx: 5 },
    { content: "Do you offer discounts for non-profit organizations?", channel: 'SUPPORT', label: 'Pricing Query', sentiment: 'NEU', score: 0.2, themeIdx: 5 },
  ];

  const statuses = ['NEW', 'REVIEWED', 'ACTIONED'];

  // Let's generate 120 items. We loop and clone templates with slight text variations and dates distributed over the last 30 days.
  const recordsToCreate = [];
  for (let i = 0; i < 120; i++) {
    const template = feedbackTemplates[i % feedbackTemplates.length];
    
    // Distribute date over the last 30 days
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));
    // Introduce random hours/mins
    createdDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    // Choose random status
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    // Add a differentiator to the content
    const suffix = i >= feedbackTemplates.length ? ` (Ref #${100 + i})` : '';
    const content = template.content + suffix;

    recordsToCreate.push({
      content,
      channel: template.channel,
      customerLabel: template.label,
      sentiment: template.sentiment,
      sentimentScore: template.score,
      status,
      workspaceId: workspace.id,
      createdAt: createdDate,
      themeIdx: template.themeIdx,
    });
  }

  // Create feedback items and link to themes
  let createdCount = 0;
  for (const item of recordsToCreate) {
    const createdFeedback = await prisma.feedback.create({
      data: {
        content: item.content,
        channel: item.channel,
        customerLabel: item.customerLabel,
        sentiment: item.sentiment,
        sentimentScore: item.sentimentScore,
        status: item.status,
        workspaceId: item.workspaceId,
        createdAt: item.createdAt,
      },
    });

    // Link theme
    const theme = themes[item.themeIdx];
    await prisma.feedbackTheme.create({
      data: {
        feedbackId: createdFeedback.id,
        themeId: theme.id,
        confidence: 0.8 + Math.random() * 0.2,
      },
    });

    // Seed mock embedding (384-dimensional vector with small random values to satisfy non-null and format checks)
    // We make sure items in the same theme have slightly similar mock vectors
    const mockVector = Array.from({ length: 384 }, () => (Math.random() - 0.5) * 0.1);
    // Bias based on theme index so similarity queries still yield somewhat logical matches
    for (let k = 0; k < 10; k++) {
      if (mockVector[item.themeIdx * 10 + k] !== undefined) {
        mockVector[item.themeIdx * 10 + k] += 0.8; // Bias
      }
    }
    
    // Normalize mock vector
    const magnitude = Math.sqrt(mockVector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = mockVector.map(val => val / magnitude);

    await prisma.embedding.create({
      data: {
        feedbackId: createdFeedback.id,
        vector: JSON.stringify(normalizedVector),
      },
    });

    createdCount++;
  }

  console.log(`Seeded ${createdCount} feedback items, matched themes, and generated mock vector embeddings successfully.`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
