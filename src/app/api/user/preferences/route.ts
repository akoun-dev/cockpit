import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { buildAuthOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/user/preferences — load user preferences
export async function GET() {
  const authOptions = await buildAuthOptions();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
  }

  let prefs: Record<string, unknown> = {};
  try {
    prefs = JSON.parse(user.preferences || '{}');
  } catch { /* empty */ }

  return NextResponse.json(prefs);
}

// PUT /api/user/preferences — save user preferences
export async function PUT(request: NextRequest) {
  const authOptions = await buildAuthOptions();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json() as Record<string, unknown>;

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}
