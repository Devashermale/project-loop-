import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { classifyFeedback } from '@/lib/ai';
import { getEmbedding } from '@/lib/embeddings';

/**
 * GET: Fetch paginated, filtered feedback items for the workspace.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = session.user;
  const searchParams = req.nextUrl.searchParams;
  
  // Pagination
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
  const skip = (page - 1) * limit;

  // Filters
  const channel = searchParams.get('channel');
  const sentiment = searchParams.get('sentiment');
  const status = searchParams.get('status');
  const themeId = searchParams.get('themeId');
  const search = searchParams.get('search');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  // Build prisma query where clause
  const where: any = {
    workspaceId: workspaceId,
  };

  if (channel && channel !== 'ALL') {
    where.channel = channel;
  }
  
  if (sentiment && sentiment !== 'ALL') {
    where.sentiment = sentiment;
  }
  
  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (themeId && themeId !== 'ALL') {
    where.themes = {
      some: {
        themeId: themeId,
      },
    };
  }

  if (search) {
    where.content = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (startDateStr || endDateStr) {
    where.createdAt = {};
    if (startDateStr) {
      where.createdAt.gte = new Date(startDateStr);
    }
    if (endDateStr) {
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  try {
    const [total, feedbacks] = await Promise.all([
      db.feedback.count({ where }),
      db.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
      }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      feedbacks,
      pagination: {
        total,
        pages,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

/**
 * POST: Ingest single feedback item. Automatically classifies and generates embeddings.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }



  try {
    const body = await req.json();
    const { content, channel } = body;

    if (!content || !channel) {
      return NextResponse.json({ error: 'Content and Channel are required parameters' }, { status: 400 });
    }

    const { workspaceId } = session.user;

    // 1. Save Initial raw feedback item
    const feedback = await db.feedback.create({
      data: {
        content,
        channel,
        status: 'NEW',
        workspaceId,
      },
    });

    // 2. Fetch existing workspace themes for AI taxonomy reuse
    const dbThemes = await db.theme.findMany({
      where: { workspaceId },
    });
    const themeNames = dbThemes.map(t => t.name);

    // 3. Trigger Claude Structured Classification
    const aiResult = await classifyFeedback(content, themeNames);

    // 4. Resolve themes (Link existing ones, create new ones if needed)
    const linkedThemes: string[] = [];
    for (const aiThemeName of aiResult.themes) {
      // Find matching theme or create it
      let themeObj = dbThemes.find(t => t.name.toLowerCase() === aiThemeName.toLowerCase());
      if (!themeObj) {
        // Create new theme
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
      }

      // Link feedback to theme if not already linked
      await db.feedbackTheme.upsert({
        where: {
          feedbackId_themeId: {
            feedbackId: feedback.id,
            themeId: themeObj.id,
          },
        },
        create: {
          feedbackId: feedback.id,
          themeId: themeObj.id,
          confidence: 0.9,
        },
        update: {},
      });
      linkedThemes.push(themeObj.id);
    }

    // 5. Update feedback record with classification outputs
    const updatedFeedback = await db.feedback.update({
      where: { id: feedback.id },
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

    // 6. Generate Vector Embeddings (background task simulator, run asynchronously/synchronously)
    const vector = await getEmbedding(content);
    await db.embedding.upsert({
      where: { feedbackId: feedback.id },
      create: {
        feedbackId: feedback.id,
        vector: JSON.stringify(vector),
      },
      update: {
        vector: JSON.stringify(vector),
      },
    });

    return NextResponse.json(updatedFeedback);
  } catch (error: any) {
    console.error('Error ingesting feedback:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
