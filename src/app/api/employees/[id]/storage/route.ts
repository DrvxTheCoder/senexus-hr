import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

const MAX_EMPLOYEE_STORAGE = 100 * 1024 * 1024; // 100MB

// GET /api/employees/:id/storage - Get storage usage for an employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    // Get all documents for employee
    const documents = await db.employeeDocument.findMany({
      where: { employeeId },
      select: {
        fileSize: true,
        documentType: true
      }
    });

    // Calculate total usage
    const totalUsed = documents.reduce(
      (sum, doc) => sum + (doc.fileSize || 0),
      0
    );

    // Calculate usage by document type
    const usageByType: Record<string, number> = {};
    documents.forEach((doc) => {
      if (!usageByType[doc.documentType]) {
        usageByType[doc.documentType] = 0;
      }
      usageByType[doc.documentType] += doc.fileSize || 0;
    });

    const percentageUsed = (totalUsed / MAX_EMPLOYEE_STORAGE) * 100;

    return NextResponse.json({
      employeeId,
      totalUsed,
      totalLimit: MAX_EMPLOYEE_STORAGE,
      remaining: MAX_EMPLOYEE_STORAGE - totalUsed,
      percentageUsed: parseFloat(percentageUsed.toFixed(2)),
      totalDocuments: documents.length,
      usageByType,
      // Format for display
      formatted: {
        totalUsed: `${(totalUsed / 1024 / 1024).toFixed(2)} MB`,
        totalLimit: `${(MAX_EMPLOYEE_STORAGE / 1024 / 1024).toFixed(0)} MB`,
        remaining: `${((MAX_EMPLOYEE_STORAGE - totalUsed) / 1024 / 1024).toFixed(2)} MB`
      }
    });
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage usage' },
      { status: 500 }
    );
  }
}
