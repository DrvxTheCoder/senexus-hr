import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/employees/:id/documents/:documentId - Get single document
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, documentId } = await params;

    const document = await db.employeeDocument.findUnique({
      where: { id: documentId },
      include: {
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
            name: true,
            email: true
          }
        }
      }
    });

    if (!document || document.employeeId !== employeeId) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: document.firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

// PATCH /api/employees/:id/documents/:documentId - Update document (verify, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, documentId } = await params;
    const body = await req.json();

    const document = await db.employeeDocument.findUnique({
      where: { id: documentId },
      select: { firmId: true, employeeId: true }
    });

    if (!document || document.employeeId !== employeeId) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: document.firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update document
    const updatedDocument = await db.employeeDocument.update({
      where: { id: documentId },
      data: {
        description: body.description,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        isVerified: body.isVerified,
        verifiedBy: body.isVerified ? session.user.id : null,
        verifiedAt: body.isVerified ? new Date() : null
      },
      include: {
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
            name: true,
            email: true
          }
        }
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId: document.firmId,
        actorId: session.user.id,
        action: 'UPDATE',
        entity: 'EMPLOYEE_DOCUMENT',
        entityId: documentId,
        metadata: {
          employeeId,
          changes: body
        }
      }
    });

    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/:id/documents/:documentId - Delete document
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, documentId } = await params;

    const document = await db.employeeDocument.findUnique({
      where: { id: documentId },
      select: { firmId: true, employeeId: true, fileName: true }
    });

    if (!document || document.employeeId !== employeeId) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: document.firmId
        }
      }
    });

    if (!userFirm || (userFirm.role !== 'OWNER' && userFirm.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete document
    await db.employeeDocument.delete({
      where: { id: documentId }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId: document.firmId,
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'EMPLOYEE_DOCUMENT',
        entityId: documentId,
        metadata: {
          employeeId,
          fileName: document.fileName
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
