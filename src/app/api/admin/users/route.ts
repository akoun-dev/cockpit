import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/users — list all users with role & department; ?search= filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''

    const users = await db.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      include: {
        role: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: users })
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
        password: password ?? 'ansut2025',
        isActive: isActive ?? true,
        roleId: roleId ?? null,
        departmentId: departmentId ?? null,
      },
      include: { role: true, department: true },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_USER',
        category: 'user',
        userId: user.id,
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
