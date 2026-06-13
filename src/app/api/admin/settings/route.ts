import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/require-auth';

// GET /api/admin/settings — returns all settings as a flat object (key-value pairs, parse JSON values)
export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.systemSetting.findMany();
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[GET /api/admin/settings]', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

// PUT /api/admin/settings — accepts { key, value } and upserts the setting
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session instanceof Response) return session
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 },
      );
    }

    const strValue = typeof value === 'string' ? value : JSON.stringify(value);

    const setting = await db.systemSetting.upsert({
      where: { key },
      update: { value: strValue },
      create: { key, value: strValue },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_SETTING',
        category: 'settings',
        details: `Mise à jour paramètre "${key}"`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('[PUT /api/admin/settings]', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 },
    );
  }
}