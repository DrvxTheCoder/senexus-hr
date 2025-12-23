import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/firms/:id/leave-balances - Get leave balances for all employees
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
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear();

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

    const where: any = {
      year,
      employee: {
        firmId
      }
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const balances = await db.leaveBalance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            matricule: true
          }
        }
      },
      orderBy: {
        employee: {
          lastName: 'asc'
        }
      }
    });

    // Convert Decimal fields
    const serialized = balances.map((balance) => ({
      ...balance,
      totalDays: balance.totalDays.toString(),
      usedDays: balance.usedDays.toString(),
      remainingDays: balance.remainingDays.toString(),
      carriedOver: balance.carriedOver.toString()
    }));

    return NextResponse.json({ balances: serialized });
  } catch (error) {
    console.error('Error fetching leave balances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave balances' },
      { status: 500 }
    );
  }
}

// POST /api/firms/:id/leave-balances/rollover - Rollover unused leave days from previous year
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

    if (!userFirm || !['OWNER', 'ADMIN'].includes(userFirm.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can perform rollover' },
        { status: 403 }
      );
    }

    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;

    // Get all active employees for the firm
    const employees = await db.employee.findMany({
      where: {
        firmId,
        status: 'ACTIVE'
      }
    });

    let created = 0;
    let rolledOver = 0;

    for (const employee of employees) {
      // Get previous year balance
      const prevBalance = await db.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId: employee.id,
            year: previousYear,
            leaveType: 'ANNUAL'
          }
        }
      });

      const carriedOverDays = prevBalance
        ? parseFloat(prevBalance.remainingDays.toString())
        : 0;

      // Check if current year balance exists
      const existingBalance = await db.leaveBalance.findUnique({
        where: {
          employeeId_year_leaveType: {
            employeeId: employee.id,
            year: currentYear,
            leaveType: 'ANNUAL'
          }
        }
      });

      if (!existingBalance) {
        // Create new balance with carryover
        const totalDays = 20 + carriedOverDays;
        await db.leaveBalance.create({
          data: {
            employeeId: employee.id,
            year: currentYear,
            leaveType: 'ANNUAL',
            totalDays,
            usedDays: 0,
            remainingDays: totalDays,
            carriedOver: carriedOverDays
          }
        });
        created++;
      } else if (
        carriedOverDays > 0 &&
        existingBalance.carriedOver.toString() === '0'
      ) {
        // Update existing balance with carryover
        const newTotalDays =
          parseFloat(existingBalance.totalDays.toString()) + carriedOverDays;
        const newRemainingDays =
          parseFloat(existingBalance.remainingDays.toString()) +
          carriedOverDays;

        await db.leaveBalance.update({
          where: {
            employeeId_year_leaveType: {
              employeeId: employee.id,
              year: currentYear,
              leaveType: 'ANNUAL'
            }
          },
          data: {
            totalDays: newTotalDays,
            remainingDays: newRemainingDays,
            carriedOver: carriedOverDays
          }
        });
        rolledOver++;
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'LEAVE_BALANCE',
        entityId: firmId, // Using firmId as this is a bulk operation
        metadata: {
          year: currentYear,
          employeesProcessed: employees.length,
          balancesCreated: created,
          balancesRolledOver: rolledOver
        }
      }
    });

    return NextResponse.json({
      message: 'Rollover completed successfully',
      employeesProcessed: employees.length,
      balancesCreated: created,
      balancesRolledOver: rolledOver
    });
  } catch (error) {
    console.error('Error performing rollover:', error);
    return NextResponse.json(
      { error: 'Failed to perform rollover' },
      { status: 500 }
    );
  }
}
