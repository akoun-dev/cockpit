import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/require-auth'

// GET /api/admin/roles — list all roles with user count and permissions
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    const [roles, total] = await Promise.all([
      db.role.findMany({
        include: {
          permissions: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { level: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.role.count(),
    ])

    return NextResponse.json({ data: roles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[GET /api/admin/roles]', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 },
    )
  }
}

// POST /api/admin/roles — create a new role
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof Response) return session
    const body = await request.json()
    const { name, label, description, level, color } = body

    if (!name || !label) {
      return NextResponse.json(
        { error: 'name and label are required' },
        { status: 400 },
      )
    }

    const role = await db.role.create({
      data: {
        name,
        label,
        description: description ?? null,
        level: level ?? 0,
        color: color ?? '#1c55a3',
      },
      include: { permissions: true },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_ROLE',
        category: 'role',
        userId: session.user.id,
        details: `Created role "${role.label}" (${role.name})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: role }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/admin/roles]', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A role with this name already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 },
    )
  }
}
