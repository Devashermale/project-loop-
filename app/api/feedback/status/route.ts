import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

/**
 * PATCH: Triage feedback status.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role === 'VIEWER') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot change feedback status' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and Status are required parameters' }, { status: 400 });
    }

    const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value. Must be NEW, REVIEWED, or ACTIONED' }, { status: 400 });
    }

    const { workspaceId } = session.user;

    // Fetch to verify ownership
    const feedback = await db.feedback.findUnique({
      where: { id },
    });

    if (!feedback || feedback.workspaceId !== workspaceId) {
      return NextResponse.json({ error: 'Feedback item not found' }, { status: 404 });
    }

    const updated = await db.feedback.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating feedback status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
