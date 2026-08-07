import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

/**
 * GET: Retrieve all themes for the active workspace, along with count of tagged feedback items.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workspaceId } = session.user;

  try {
    const themes = await db.theme.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { feedback: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

/**
 * POST: Create a new custom feedback theme (Admin/Analyst only).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot create themes' }, { status: 403 });
  }

  try {
    const { name, description, color } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Theme name is required' }, { status: 400 });
    }

    const { workspaceId } = session.user;

    // Check if theme name already exists in workspace
    const existing = await db.theme.findFirst({
      where: {
        workspaceId,
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A theme with this name already exists' }, { status: 400 });
    }

    const defaultColors = ['#6366F1', '#A855F7', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#14B8A6'];
    const chosenColor = color || defaultColors[Math.floor(Math.random() * defaultColors.length)];

    const theme = await db.theme.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        color: chosenColor,
        workspaceId,
      },
    });

    return NextResponse.json(theme);
  } catch (error: any) {
    console.error('Error creating theme:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
