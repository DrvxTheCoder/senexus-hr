import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/employees?firmId=xxx - Get all employees for a firm
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const firmId = searchParams.get('firmId');

    // If no firmId provided, return employees not linked to users (legacy behavior)
    if (!firmId) {
      const employees = await db.employee.findMany({
        where: {
          userId: null
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          matricule: true,
          firmId: true
        },
        orderBy: {
          lastName: 'asc'
        }
      });

      return NextResponse.json({ employees });
    }

    // Verify user has access to this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json(
        { error: 'Access denied to this firm' },
        { status: 403 }
      );
    }

    const employees = await db.employee.findMany({
      where: {
        firmId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
        email: true,
        phone: true,
        status: true,
        hireDate: true,
        photoUrl: true,
        jobTitle: true,
        departmentId: true,
        assignedClientId: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: {
            id: true,
            name: true
          }
        },
        assignedClient: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    // Convert Decimal fields to strings for JSON serialization
    const serializedEmployees = employees.map((employee) => ({
      ...employee,
      netSalary: employee.netSalary?.toString() || null
    }));

    return NextResponse.json(serializedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
