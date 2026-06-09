import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/data-sources — list all data sources, optionally ?module=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleFilter = searchParams.get('module') ?? undefined

    const where = moduleFilter ? { module: moduleFilter } : undefined

    const sources = await db.dataSource.findMany({
      where,
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ data: sources })
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
