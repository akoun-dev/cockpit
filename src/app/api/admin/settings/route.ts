import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/settings — returns all settings as a flat object (key-value pairs, parse JSON values)
export async function GET() {
  try {
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

    return NextResponse.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('[PUT /api/admin/settings]', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 },
    );
  }
}