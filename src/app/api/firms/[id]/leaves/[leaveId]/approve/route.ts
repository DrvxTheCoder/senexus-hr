import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// POST /api/firms/:id/leaves/:leaveId/approve - Approve a leave request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; leaveId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, leaveId } = await params;

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
        {
          error: 'Only owners, admins, and managers can approve leave requests'
        },
        { status: 403 }
      );
    }

    // Get leave request
    const leaveRequest = await db.leaveRequest.findFirst({
      where: {
        id: leaveId,
        firmId
      }
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only approve pending leave requests' },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      // Update leave request
      const updatedLeave = await tx.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: 'APPROVED',
          reviewedBy: session.user.id,
          reviewedAt: new Date()
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Update leave balance if it's ANNUAL leave
      if (updatedLeave.leaveType === 'ANNUAL') {
        const currentYear = new Date().getFullYear();
        const totalDays = parseFloat(updatedLeave.totalDays.toString());

        const leaveBalance = await tx.leaveBalance.findUnique({
          where: {
            employeeId_year_leaveType: {
              employeeId: updatedLeave.employeeId,
              year: currentYear,
              leaveType: 'ANNUAL'
            }
          }
        });

        if (leaveBalance) {
          const newUsedDays =
            parseFloat(leaveBalance.usedDays.toString()) + totalDays;
          const newRemainingDays =
            parseFloat(leaveBalance.totalDays.toString()) - newUsedDays;

          await tx.leaveBalance.update({
            where: {
              employeeId_year_leaveType: {
                employeeId: updatedLeave.employeeId,
                year: currentYear,
                leaveType: 'ANNUAL'
              }
            },
            data: {
              usedDays: newUsedDays,
              remainingDays: Math.max(0, newRemainingDays)
            }
          });
        }
      }

      return updatedLeave;
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'APPROVE',
        entity: 'LEAVE_REQUEST',
        entityId: leaveId,
        metadata: {
          employeeName: `${result.employee.firstName} ${result.employee.lastName}`,
          leaveType: result.leaveType,
          totalDays: result.totalDays.toString()
        }
      }
    });

    const response = {
      ...result,
      totalDays: result.totalDays.toString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error approving leave request:', error);
    return NextResponse.json(
      { error: 'Failed to approve leave request' },
      { status: 500 }
    );
  }
}
