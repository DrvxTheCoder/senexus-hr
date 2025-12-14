import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { differenceInBusinessDays } from 'date-fns';

// GET /api/firms/:id/leaves - Get all leave requests for a firm
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
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');

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

    const where: any = { firmId };

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const leaveRequests = await db.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true,
            photoUrl: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Convert Decimal fields to strings
    const serialized = leaveRequests.map((leave) => ({
      ...leave,
      totalDays: leave.totalDays.toString()
    }));

    return NextResponse.json({ leaveRequests: serialized });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave requests' },
      { status: 500 }
    );
  }
}

// POST /api/firms/:id/leaves - Create a new leave request
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
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const {
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      isPaid,
      isJustified,
      justification,
      supportingDoc
    } = body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify employee belongs to this firm
    const employee = await db.employee.findFirst({
      where: {
        id: employeeId,
        firmId
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate total days (excluding weekends)
    const totalDays = differenceInBusinessDays(end, start) + 1;

    if (totalDays <= 0) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    // Check if employee has sufficient leave balance for ANNUAL leave
    if (leaveType === 'ANNUAL') {
      const currentYear = new Date().getFullYear();
      const leaveBalance = await db.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId,
            year: currentYear,
            leaveType: 'ANNUAL'
          }
        }
      });

      if (!leaveBalance) {
        // Initialize leave balance for this employee
        await db.leaveBalance.create({
          data: {
            employeeId,
            year: currentYear,
            leaveType: 'ANNUAL',
            totalDays: 20,
            usedDays: 0,
            remainingDays: 20,
            carriedOver: 0
          }
        });
      } else {
        const remaining = parseFloat(leaveBalance.remainingDays.toString());
        if (remaining < totalDays) {
          return NextResponse.json(
            {
              error: `Insufficient leave balance. Available: ${remaining} days, Requested: ${totalDays} days`
            },
            { status: 400 }
          );
        }
      }
    }

    // Create leave request
    const leaveRequest = await db.leaveRequest.create({
      data: {
        firmId,
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        isPaid: isPaid ?? true,
        reason,
        isJustified: isJustified ?? false,
        justification,
        supportingDoc,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true
          }
        }
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'LEAVE_REQUEST',
        entityId: leaveRequest.id,
        metadata: {
          employeeName: `${leaveRequest.employee.firstName} ${leaveRequest.employee.lastName}`,
          leaveType,
          totalDays,
          startDate: startDate,
          endDate: endDate
        }
      }
    });

    const response = {
      ...leaveRequest,
      totalDays: leaveRequest.totalDays.toString()
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    );
  }
}
