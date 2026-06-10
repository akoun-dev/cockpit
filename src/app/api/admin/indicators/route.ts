import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/indicators — list all indicators with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain') ?? undefined
    const search = searchParams.get('search') ?? undefined
    const status = searchParams.get('status') ?? undefined

    const where: Record<string, unknown> = {}

    if (domain) {
      where.domain = domain
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (status === 'actif') {
      where.isActive = true
    } else if (status === 'inactif') {
      where.isActive = false
    }

    const indicators = await db.indicator.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: [{ domain: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ data: indicators })
  } catch (error) {
    console.error('[GET /api/admin/indicators]', error)
    return NextResponse.json(
      { error: 'Failed to fetch indicators' },
      { status: 500 },
    )
  }
}

// POST /api/admin/indicators — create indicator
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      code,
      description,
      domain,
      subDomain,
      unit,
      targetValue,
      alertValue,
      criticalValue,
      formula,
      frequency,
      sourceSystem,
      departmentId,
    } = body

    if (!name || !code || !domain) {
      return NextResponse.json(
        { error: 'Nom, code et domaine sont obligatoires' },
        { status: 400 },
      )
    }

    // Check uniqueness of code
    const existing = await db.indicator.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json(
        { error: `Un indicateur avec le code "${code}" existe déjà` },
        { status: 409 },
      )
    }

    const validFrequencies = ['journalier', 'hebdomadaire', 'mensuel', 'trimestriel', 'annuel', 'manuel']

    if (frequency && !validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `Fréquence invalide "${frequency}". Valeurs: ${validFrequencies.join(', ')}` },
        { status: 400 },
      )
    }

    const indicator = await db.indicator.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || null,
        domain,
        subDomain: subDomain || null,
        unit: unit || '%',
        targetValue: targetValue !== undefined ? parseFloat(targetValue) : null,
        alertValue: alertValue !== undefined ? parseFloat(alertValue) : null,
        criticalValue: criticalValue !== undefined ? parseFloat(criticalValue) : null,
        formula: formula || null,
        frequency: frequency || 'mensuel',
        sourceSystem: sourceSystem || 'manuel',
        departmentId: departmentId || null,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_INDICATOR',
        category: 'indicator',
        details: `Créé l'indicateur "${name}" (${code}) dans le domaine "${domain}"`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    })

    return NextResponse.json({ data: indicator }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/indicators]', error)
    return NextResponse.json(
      { error: 'Failed to create indicator' },
      { status: 500 },
    )
  }
}
