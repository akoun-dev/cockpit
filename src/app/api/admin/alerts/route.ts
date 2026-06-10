import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/alerts — list with ?type=&severity=&status= filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? undefined
    const severity = searchParams.get('severity') ?? undefined
    const status = searchParams.get('status') ?? undefined

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
      }),
      db.alert.count({ where }),
    ])

    return NextResponse.json({
      data: alerts,
      pagination: { total },
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

    return NextResponse.json({ data: alert }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/alerts]', error)
    return NextResponse.json(
      { error: 'Échec de la création de l\'alerte' },
      { status: 500 },
    )
  }
}