import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/firms/:id/documents/folders - List folders for an employee
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

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Missing required parameter: employeeId' },
        { status: 400 }
      );
    }

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

    // Verify employee exists and belongs to firm
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        firmId
      },
      select: {
        id: true,
        matricule: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or does not belong to this firm' },
        { status: 404 }
      );
    }

    // Get all documents for this employee
    const documents = await db.employeeDocument.findMany({
      where: {
        employeeId,
        firmId
      },
      select: {
        storageKey: true
      }
    });

    // Extract unique folders from storage keys
    // Storage key format: employees/[matricule]/[subfolder]/filename
    const folderSet = new Set<string>();
    const basePath = `employees/${employee.matricule}`;

    documents.forEach((doc) => {
      const parts = doc.storageKey.split('/');
      // If there's a subfolder (more than 3 parts: employees/matricule/subfolder/file)
      if (parts.length > 3) {
        // Get subfolder path (everything between matricule and filename)
        const subfolders = parts.slice(2, -1).join('/');
        folderSet.add(subfolders);
      }
    });

    const folders = Array.from(folderSet).sort();

    return NextResponse.json({
      employeeId,
      basePath,
      folders,
      totalFolders: folders.length
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST /api/firms/:id/documents/folders - Create a new folder (metadata only)
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
    const body = await req.json();
    const { employeeId, folderName } = body;

    if (!employeeId || !folderName) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, folderName' },
        { status: 400 }
      );
    }

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

    // Verify employee exists and belongs to firm
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        firmId
      },
      select: {
        id: true,
        matricule: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found or does not belong to this firm' },
        { status: 404 }
      );
    }

    // Sanitize folder name
    const sanitizedFolderName = folderName
      .replace(/[^a-zA-Z0-9-_\s]/g, '_')
      .trim();

    if (!sanitizedFolderName) {
      return NextResponse.json(
        { error: 'Invalid folder name' },
        { status: 400 }
      );
    }

    const folderPath = `employees/${employee.matricule}/${sanitizedFolderName}`;

    // Note: In Zipline, folders are created implicitly when files are uploaded
    // We just return the folder path that can be used for uploads
    return NextResponse.json(
      {
        message: 'Folder path created',
        folderPath,
        folderName: sanitizedFolderName,
        employeeId,
        note: 'Folder will be created in Zipline when first file is uploaded'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
