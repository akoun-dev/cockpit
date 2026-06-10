import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/sync-logs — list sync logs with optional ?status=&sourceId= filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const sourceId = searchParams.get('sourceId') ?? undefined;

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (sourceId) where.dataSourceId = sourceId;

    const logs = await db.syncLog.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        dataSource: {
          select: { id: true, name: true, module: true, type: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error('[GET /api/admin/sync-logs]', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync logs' },
      { status: 500 },
    );
  }
}

// POST /api/admin/sync-logs — trigger a sync (create a sync log entry)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataSourceId } = body;

    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'dataSourceId is required' },
        { status: 400 },
      );
    }

    // Verify the data source exists
    const source = await db.dataSource.findUnique({
      where: { id: dataSourceId },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Data source not found' },
        { status: 404 },
      );
    }

    // Simulate a sync by creating a log entry
    const startedAt = new Date();
    const duration = Math.floor(Math.random() * 2000) + 500; // 500ms - 2500ms
    const completedAt = new Date(startedAt.getTime() + duration);

    // Random status with weights: 70% success, 20% warning, 10% error
    const rand = Math.random();
    const status = rand < 0.7 ? 'success' : rand < 0.9 ? 'warning' : 'error';
    const recordsSynced = status === 'error' ? 0 : Math.floor(Math.random() * 500) + 50;
    const errorMessage = status === 'error'
      ? 'Timeout lors de la connexion à la source'
      : status === 'warning'
        ? 'Certains enregistrements ont été ignorés (format invalide)'
        : null;

    const syncLog = await db.syncLog.create({
      data: {
        dataSourceId,
        status,
        recordsSynced,
        duration,
        errorMessage,
        startedAt,
        completedAt,
      },
    });

    // Update the data source's lastSync
    await db.dataSource.update({
      where: { id: dataSourceId },
      data: { lastSync: completedAt },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'TRIGGER_SYNC',
        category: 'data',
        details: `Triggered sync for data source "${source.name}" (${source.module}) — status: ${status}`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({ data: syncLog }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/sync-logs]', error);
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 },
    );
  }
}
