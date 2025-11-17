import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/employees/:id/documents - Get all documents for an employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    // Verify employee exists and user has access
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { firmId: true }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: employee.firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch documents
    const documents = await db.employeeDocument.findMany({
      where: { employeeId },
      select: {
        id: true,
        documentType: true,
        fileName: true,
        storageKey: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        description: true,
        expiryDate: true,
        isVerified: true,
        verifiedBy: true,
        verifiedAt: true,
        uploadedBy: true,
        createdAt: true,
        updatedAt: true,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/employees/:id/documents - Upload a new document
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await req.json();

    // Verify employee exists and user has access
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { firmId: true }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: employee.firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create document record
    const document = await db.employeeDocument.create({
      data: {
        employeeId,
        firmId: employee.firmId,
        documentType: body.documentType,
        fileName: body.fileName,
        storageKey: body.storageKey,
        fileUrl: body.fileUrl || null,
        fileSize: body.fileSize || null,
        mimeType: body.mimeType || null,
        description: body.description || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        uploadedBy: session.user.id
      },
      include: {
        uploader: {
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
        firmId: employee.firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'EMPLOYEE_DOCUMENT',
        entityId: document.id,
        metadata: {
          employeeId,
          documentType: document.documentType,
          fileName: document.fileName
        }
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
