import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/require-auth'

// GET /api/admin/users — list all users with role & department; ?search=&page=&limit= filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          role: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({ data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[GET /api/admin/users]', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 },
    )
  }
}

// POST /api/admin/users — create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof Response) return session
    const body = await request.json()
    const { email, name, password, roleId, departmentId, isActive } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 },
      )
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        password: password ?? require('crypto').randomBytes(6).toString('hex'),
        isActive: isActive ?? true,
        roleId: roleId ?? null,
        departmentId: departmentId ?? null,
      },
      include: { role: true, department: true },
    })

    // Audit log — record the admin who created the user
    await db.auditLog.create({
      data: {
        action: 'CREATE_USER',
        category: 'user',
        userId: session.user.id,
        details: `Created user "${user.name}" (${user.email})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error: unknown) {
    console.error('[POST /api/admin/users]', error)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 },
      )
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    )
  }
}
