import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/documents/[id] — get a single document
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const document = await db.document.findUnique({ where: { id } });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: document });
  } catch (error) {
    console.error(`[GET /api/admin/documents/{id}]`, error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 },
    );
  }
}

// PUT /api/admin/documents/[id] — update a document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, type, module, description, visibility } = body;

    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    const validTypes = ['lien', 'sharepoint', 'onedrive', 'teams'];
    const validModules = ['accueil', 'governance', 'finance', 'operational', 'rh', 'risque', 'pta', 'admin'];

    if (module && !validModules.includes(module)) {
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

    const document = await db.document.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(type && { type }),
        ...(module && { module }),
        ...(description !== undefined && { description: description || null }),
        ...(visibility && { visibility }),
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_DOCUMENT',
        category: 'document',
        details: `Updated document "${document.name}" (id: ${id})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({ data: document });
  } catch (error) {
    console.error(`[PUT /api/admin/documents/{id}]`, error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/documents/[id] — delete a document
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const existing = await db.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    await db.document.delete({ where: { id } });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE_DOCUMENT',
        category: 'document',
        details: `Deleted document "${existing.name}" (id: ${id})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/admin/documents/{id}]`, error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 },
    );
  }
}
