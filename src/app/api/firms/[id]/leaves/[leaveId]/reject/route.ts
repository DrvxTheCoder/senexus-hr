import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// POST /api/firms/:id/leaves/:leaveId/reject - Reject a leave request
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
    const body = await req.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
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
      return NextResponse.json(
        {
          error: 'Only owners, admins, and managers can reject leave requests'
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
        { error: 'Can only reject pending leave requests' },
        { status: 400 }
      );
    }

    // Update leave request
    const updatedLeave = await db.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason
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

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'REJECT',
        entity: 'LEAVE_REQUEST',
        entityId: leaveId,
        metadata: {
          employeeName: `${updatedLeave.employee.firstName} ${updatedLeave.employee.lastName}`,
          leaveType: updatedLeave.leaveType,
          totalDays: updatedLeave.totalDays.toString(),
          rejectionReason: reason
        }
      }
    });

    const response = {
      ...updatedLeave,
      totalDays: updatedLeave.totalDays.toString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    return NextResponse.json(
      { error: 'Failed to reject leave request' },
      { status: 500 }
    );
  }
}
