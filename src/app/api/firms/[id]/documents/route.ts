import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { uploadToZipline, deleteFromZipline } from '@/lib/zipline';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_EMPLOYEE_STORAGE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

// GET /api/firms/:id/documents - List all documents with filters
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId } = await params;
    const { searchParams } = new URL(req.url);

    const employeeId = searchParams.get('employeeId');
    const documentType = searchParams.get('documentType');
    const tags = searchParams.get('tags');
    const search = searchParams.get('search');
    const isVerified = searchParams.get('isVerified');

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

    // Build where clause
    const where: any = {
      firmId
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (isVerified !== null && isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (tags) {
      const tagArray = tags.split(',').filter(Boolean);
      where.tags = {
        hasSome: tagArray
      };
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch documents
    const documents = await db.employeeDocument.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/firms/:id/documents - Upload new document
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId } = await params;

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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;
    const metadataString = formData.get('metadata') as string | null;
    const subfolder = formData.get('subfolder') as string | null;

    if (!file || !employeeId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, employeeId, documentType' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed. Only PDF and images (JPEG, PNG) are supported.`
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds 2MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }

    // Check employee exists and belongs to firm
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        firmId
      },
      select: {
        id: true,
        matricule: true,
        firstName: true,
        lastName: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or does not belong to this firm' },
        { status: 404 }
      );
    }

    // Calculate current storage usage for employee
    const existingDocs = await db.employeeDocument.findMany({
      where: { employeeId },
      select: { fileSize: true }
    });

    const currentUsage = existingDocs.reduce(
      (sum, doc) => sum + (doc.fileSize || 0),
      0
    );

    if (currentUsage + file.size > MAX_EMPLOYEE_STORAGE) {
      const usageMB = (currentUsage / 1024 / 1024).toFixed(2);
      const limitMB = (MAX_EMPLOYEE_STORAGE / 1024 / 1024).toFixed(0);
      return NextResponse.json(
        {
          error: `Storage limit exceeded. Current usage: ${usageMB}MB / ${limitMB}MB`,
          currentUsage,
          limit: MAX_EMPLOYEE_STORAGE
        },
        { status: 400 }
      );
    }

    // Parse tags and metadata before upload
    const tags = tagsString
      ? tagsString
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const metadata = metadataString ? JSON.parse(metadataString) : null;

    // Build folder path: employees/[matricule]/[subfolder]
    let folderPath = `employees/${employee.matricule}`;
    if (subfolder) {
      folderPath += `/${subfolder}`;
    }

    // Upload file to Zipline with folder organization
    let fileUrl: string;
    try {
      fileUrl = await uploadToZipline(file, {
        maxFileSize: MAX_FILE_SIZE,
        allowedTypes: ALLOWED_FILE_TYPES,
        folder: folderPath,
        compressionPercent: 80
      });
    } catch (uploadError) {
      console.error('Error uploading to Zipline:', uploadError);
      return NextResponse.json(
        {
          error:
            uploadError instanceof Error
              ? uploadError.message
              : 'Failed to upload file to Zipline'
        },
        { status: 500 }
      );
    }

    // Create document record - if this fails, we need to clean up the uploaded file
    let document;
    try {
      document = await db.employeeDocument.create({
        data: {
          firmId,
          employeeId,
          documentType,
          fileName: file.name,
          storageKey: `${folderPath}/${file.name}`, // Store the full path for reference
          fileUrl,
          fileSize: file.size,
          mimeType: file.type,
          uploadedBy: session.user.id,
          description,
          tags,
          metadata,
          expiryDate: expiryDate ? new Date(expiryDate) : null
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
          }
        }
      });
    } catch (dbError) {
      // Database save failed - clean up the uploaded file from Zipline
      console.error('Error creating document record:', dbError);
      try {
        await deleteFromZipline(fileUrl);
        console.log('Successfully cleaned up uploaded file from Zipline');
      } catch (deleteError) {
        console.error(
          'Failed to clean up file from Zipline after DB error:',
          deleteError
        );
      }
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'DOCUMENT',
        entityId: document.id,
        metadata: {
          employeeId,
          documentType,
          fileName: file.name,
          fileSize: file.size
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
