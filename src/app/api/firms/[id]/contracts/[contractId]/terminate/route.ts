import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// POST /api/firms/:id/contracts/:id/terminate - Terminate contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contractId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId, contractId } = await params;
    const id = contractId;
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify contract exists and belongs to firm
    const existingContract = await db.contract.findFirst({
      where: {
        id,
        firmId
      }
    });

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract is already terminated or expired
    if (
      existingContract.status === 'TERMINATED' ||
      existingContract.status === 'EXPIRED'
    ) {
      return NextResponse.json(
        { error: 'Contract is already terminated or expired' },
        { status: 400 }
      );
    }

    // Terminate contract
    const contract = await db.contract.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        isActive: false,
        terminationDate: new Date(),
        terminationReason: body.reason || null
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

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'TERMINATE',
        entity: 'CONTRACT',
        entityId: contract.id,
        metadata: {
          employeeId: contract.employeeId,
          terminationReason: body.reason,
          terminationDate: new Date()
        }
      }
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error terminating contract:', error);
    return NextResponse.json(
      { error: 'Failed to terminate contract' },
      { status: 500 }
    );
  }
}
