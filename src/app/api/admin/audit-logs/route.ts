import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/audit-logs — list with user info; ?limit, ?offset, ?category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 1), 200)
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0)
    const category = searchParams.get('category') ?? undefined

    const where = category ? { category } : undefined

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({
      data: logs,
      pagination: { total, limit, offset },
    })
  } catch (error) {
    console.error('[GET /api/admin/audit-logs]', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 },
    )
  }
}
