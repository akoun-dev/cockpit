import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/alerts — list with ?type=&severity=&status=&page=&limit= filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? undefined
    const severity = searchParams.get('severity') ?? undefined
    const status = searchParams.get('status') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    const where: Record<string, unknown> = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (severity && severity !== 'all') {
      where.severity = severity
    }

    if (status === 'unread') {
      where.isRead = false
      where.isResolved = false
    } else if (status === 'resolved') {
      where.isResolved = true
    }

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.alert.count({ where }),
    ])

    return NextResponse.json({
      data: alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[GET /api/admin/alerts]', error)
    return NextResponse.json(
      { error: 'Échec du chargement des alertes' },
      { status: 500 },
    )
  }
}

// POST /api/admin/alerts — create alert
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { type, severity, title, message, source } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Le titre et le message sont requis' },
        { status: 400 },
      )
    }

    const alert = await db.alert.create({
      data: {
        type: type ?? 'kpi',
        severity: severity ?? 'info',
        title,
        message,
        source: source ?? null,
      },
    })

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_ALERT',
        category: 'alert',
        details: `Création alerte "${alert.title}" (${alert.severity})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: alert }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/alerts]', error)
    return NextResponse.json(
      { error: 'Échec de la création de l\'alerte' },
      { status: 500 },
    )
  }
}