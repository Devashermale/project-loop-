import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import * as bcrypt from 'bcryptjs';

/**
 * POST: Register user & workspace. Creator becomes ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, workspaceName } = await req.json();

    if (!name || !email || !password || !workspaceName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered. Please log in.' }, { status: 400 });
    }

    // 1. Create Workspace
    const workspace = await db.workspace.create({
      data: {
        name: workspaceName.trim(),
      },
    });

    // 2. Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create User in the Workspace as ADMIN
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'ADMIN',
        workspaceId: workspace.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        workspaceId: true,
      },
    });

    // Create a default theme for the workspace so classification has at least one fallback theme
    await db.theme.create({
      data: {
        name: 'General Insights',
        description: 'Catch-all category for general feedback items.',
        color: '#6366F1',
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
