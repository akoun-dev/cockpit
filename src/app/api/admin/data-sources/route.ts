import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/admin/data-sources — list all data sources, optionally ?module=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleFilter = searchParams.get('module') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10) || 20))

    const where = moduleFilter ? { module: moduleFilter } : undefined

    const [sources, total] = await Promise.all([
      db.dataSource.findMany({
        where,
        orderBy: [{ module: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.dataSource.count({ where }),
    ])

    return NextResponse.json({ data: sources, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('[GET /api/admin/data-sources]', error)
    return NextResponse.json(
      { error: 'Failed to fetch data sources' },
      { status: 500 },
    )
  }
}

// POST /api/admin/data-sources — create a new data source
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const body = await request.json()
    const { module: mod, name, type, host, port, endpoint, database, username, password, description, refreshFreq } = body

    if (!mod || !name) {
      return NextResponse.json(
        { error: 'Module and name are required' },
        { status: 400 },
      )
    }

    const validTypes = ['manuel', 'api', 'base_de_donnees', 'fichier', 'erp', 'erp_dynamics', 'fichier_excel', 'fichier_csv', 'sharepoint', 'sftp']
    const validModules = ['accueil', 'governance', 'finance', 'operational', 'rh', 'risque', 'pta', 'admin']

    if (!validModules.includes(mod)) {
      return NextResponse.json(
        { error: `Invalid module "${mod}". Must be one of: ${validModules.join(', ')}` },
        { status: 400 },
      )
    }

    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type "${type}". Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      )
    }

    const source = await db.dataSource.create({
      data: {
        module: mod,
        name,
        type: type || 'manuel',
        host: host || null,
        port: port || null,
        endpoint: endpoint || null,
        database: database || null,
        username: username || null,
        password: password || null,
        description: description || null,
        refreshFreq: refreshFreq || 'manuel',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_DATASOURCE',
        category: 'data',
        userId: session.user.id,
        details: `Created data source "${name}" for module "${mod}" (type: ${type || 'manuel'})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: source }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/data-sources]', error)
    return NextResponse.json(
      { error: 'Failed to create data source' },
      { status: 500 },
    )
  }
}
