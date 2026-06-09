import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
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
