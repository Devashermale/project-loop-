import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { classifyFeedback } from '@/lib/ai';
import { getEmbedding } from '@/lib/embeddings';

/**
 * POST: Manually trigger AI re-classification and embeddings regeneration for a feedback item.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot re-classify feedback' }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }

    const { workspaceId } = session.user;

    // Fetch the feedback item to verify workspace ownership
    const feedback = await db.feedback.findUnique({
      where: { id },
    });

    if (!feedback || feedback.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 });
    }

    // 1. Fetch workspace themes
    const dbThemes = await db.theme.findMany({
      where: { workspaceId },
    });
    const themeNames = dbThemes.map(t => t.name);

    // 2. Clear current FeedbackThemes for this item before re-association
    await db.feedbackTheme.deleteMany({
      where: { feedbackId: id },
    });

    // 3. Re-run Claude Classification
    const aiResult = await classifyFeedback(feedback.content, themeNames);

    // 4. Resolve and write new Theme links
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
        dbThemes.push(themeObj);
      }

      await db.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: themeObj.id,
          confidence: 0.95,
        },
      });
    }

    // 5. Regenerate vector embedding
    const vector = await getEmbedding(feedback.content);
    await db.embedding.upsert({
      where: { feedbackId: id },
      create: {
        feedbackId: id,
        vector: JSON.stringify(vector),
      },
      update: {
        vector: JSON.stringify(vector),
      },
    });

    // 6. Update the feedback attributes
    const updatedFeedback = await db.feedback.update({
      where: { id },
      data: {
        sentiment: aiResult.sentiment,
        sentimentScore: aiResult.sentimentScore,
        customerLabel: aiResult.customerLabel,
      },
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error: any) {
    console.error('Error re-classifying feedback:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
