import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/documents — list documents with optional ?module= filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleFilter = searchParams.get('module') ?? undefined;

    const where = moduleFilter ? { module: moduleFilter } : undefined;

    const documents = await db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('[GET /api/admin/documents]', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}

// POST /api/admin/documents — create a document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, type, module, description, visibility, createdBy } = body;

    if (!name || !url || !module) {
      return NextResponse.json(
        { error: 'name, url, and module are required' },
        { status: 400 },
      );
    }

    const validTypes = ['lien', 'sharepoint', 'onedrive', 'teams'];
    const validModules = ['accueil', 'governance', 'finance', 'operational', 'rh', 'risque', 'pta', 'admin'];

    if (!validModules.includes(module)) {
      return NextResponse.json(
        { error: `Invalid module "${module}". Must be one of: ${validModules.join(', ')}` },
        { status: 400 },
      );
    }

    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type "${type}". Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const document = await db.document.create({
      data: {
        name,
        url,
        type: type || 'lien',
        module,
        description: description || null,
        visibility: visibility || 'all',
        createdBy: createdBy || null,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_DOCUMENT',
        category: 'document',
        details: `Created document "${name}" for module "${module}" (type: ${type || 'lien'})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/admin/documents]', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 },
    );
  }
}
