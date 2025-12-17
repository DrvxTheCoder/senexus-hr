import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { safeDeleteFromZipline } from '@/lib/zipline';

// GET /api/firms/:id/documents/:documentId - Get single document
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, documentId } = await params;

    // Verify user has access to firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch document
    const document = await db.employeeDocument.findFirst({
      where: {
        id: documentId,
        firmId
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            email: true,
            phone: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        verifier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT /api/firms/:id/documents/:documentId - Update document metadata
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, documentId } = await params;
    const body = await req.json();

    // Verify user has access and proper role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['OWNER', 'ADMIN', 'MANAGER'].includes(userFirm.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify document exists and belongs to firm
    const existingDocument = await db.employeeDocument.findFirst({
      where: {
        id: documentId,
        firmId
      }
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document metadata
    const document = await db.employeeDocument.update({
      where: { id: documentId },
      data: {
        documentType:
          body.documentType !== undefined ? body.documentType : undefined,
        description:
          body.description !== undefined ? body.description : undefined,
        tags: body.tags !== undefined ? body.tags : undefined,
        metadata: body.metadata !== undefined ? body.metadata : undefined,
        expiryDate:
          body.expiryDate !== undefined
            ? body.expiryDate
              ? new Date(body.expiryDate)
              : null
            : undefined,
        isVerified: body.isVerified !== undefined ? body.isVerified : undefined,
        verifiedBy: body.isVerified === true ? session.user.id : undefined,
        verifiedAt: body.isVerified === true ? new Date() : undefined
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true
          }
        },
        uploader: {
          select: {
            id: true,
            name: true
          }
        },
        verifier: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'UPDATE',
        entity: 'DOCUMENT',
        entityId: document.id,
        metadata: {
          changes: body
        }
      }
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/firms/:id/documents/:documentId - Delete document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, documentId } = await params;

    // Verify user has access and proper role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['OWNER', 'ADMIN'].includes(userFirm.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify document exists and belongs to firm
    const document = await db.employeeDocument.findFirst({
      where: {
        id: documentId,
        firmId
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete file from Zipline
    if (document.fileUrl) {
      await safeDeleteFromZipline(document.fileUrl);
    }

    // Delete document from database
    await db.employeeDocument.delete({
      where: { id: documentId }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'DOCUMENT',
        entityId: documentId,
        metadata: {
          fileName: document.fileName,
          employeeId: document.employeeId
        }
      }
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
