import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { generateVoCReport } from '@/lib/ai';

/**
 * GET: Fetch all saved VoC reports for the workspace.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = session.user;

  try {
    const reports = await db.report.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        generatedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

/**
 * POST: Generate a new VoC report for a selected date range.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot generate reports' }, { status: 403 });
  }

  try {
    const { title, periodStart, periodEnd } = await req.json();

    if (!title || !periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Title, periodStart, and periodEnd are required fields' }, { status: 400 });
    }

    const { workspaceId, id: userId } = session.user;

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    // 1. Fetch feedbacks in the date range
    const feedbacks = await db.feedback.findMany({
      where: {
        workspaceId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (feedbacks.length === 0) {
      return NextResponse.json(
        { error: 'No feedback items found in the database during the selected date range. Cannot generate report.' },
        { status: 400 }
      );
    }

    // 2. Pre-compute statistics to ground the AI and avoid hallucinations
    let posCount = 0;
    let neuCount = 0;
    let negCount = 0;
    const channelCounts: Record<string, number> = {
      SUPPORT: 0,
      APP_STORE: 0,
      NPS: 0,
      SALES: 0,
      COMMUNITY: 0,
    };
    
    const themeMap: Record<string, { name: string; count: number; negCount: number; description: string | null }> = {};
    const recentQuotes: string[] = [];

    feedbacks.forEach(fb => {
      // Sentiment
      if (fb.sentiment === 'POS') posCount++;
      else if (fb.sentiment === 'NEG') negCount++;
      else neuCount++;

      // Channel
      const chan = fb.channel.toUpperCase();
      channelCounts[chan] = (channelCounts[chan] || 0) + 1;

      // Verbatim Quotes (Take a sample of up to 10)
      if (recentQuotes.length < 10 && fb.content) {
        recentQuotes.push(fb.content);
      }

      // Themes mapping
      fb.themes.forEach(ft => {
        const tName = ft.theme.name;
        if (!themeMap[tName]) {
          themeMap[tName] = {
            name: tName,
            count: 0,
            negCount: 0,
            description: ft.theme.description,
          };
        }
        themeMap[tName].count++;
        if (fb.sentiment === 'NEG') {
          themeMap[tName].negCount++;
        }
      });
    });

    const stats = {
      totalVolume: feedbacks.length,
      posCount,
      neuCount,
      negCount,
      channelCounts,
      themeSummary: Object.values(themeMap).sort((a, b) => b.count - a.count),
      recentQuotes,
    };

    // 3. Ask Claude to generate the report narrative
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const markdownContent = await generateVoCReport(startStr, endStr, stats);

    // 4. Save report payload in database
    const savedReport = await db.report.create({
      data: {
        title,
        periodStart: start,
        periodEnd: end,
        contentJson: JSON.stringify({
          markdownContent,
          stats,
        }),
        workspaceId,
        generatedById: userId,
      },
      include: {
        generatedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(savedReport);
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
