import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

export async function GET() {
  const session = await requireAuth()
  if (session instanceof Response) return session
  try {
    const projects = await db.project.findMany({
      include: { department: true },
      orderBy: { priority: 'desc' },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
