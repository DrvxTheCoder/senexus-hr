import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { differenceInMonths, differenceInDays } from 'date-fns';

// POST /api/firms/:id/contracts/:id/renew - Renew contract
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

    // Business rule validation: Check if contract can be renewed

    // 1. Cannot renew if already TERMINATED or EXPIRED
    if (
      existingContract.status === 'TERMINATED' ||
      existingContract.status === 'EXPIRED'
    ) {
      return NextResponse.json(
        { error: 'Cannot renew a terminated or expired contract' },
        { status: 400 }
      );
    }

    // 2. Calculate contract duration
    const contractDurationMonths = differenceInMonths(
      existingContract.endDate || new Date(),
      existingContract.startDate
    );

    // 3. Only allow renewal if previous contract duration ≤ 12 months
    if (contractDurationMonths > 12) {
      return NextResponse.json(
        {
          error:
            'Cannot renew contracts longer than 12 months. Contract must be ≤ 12 months to be eligible for renewal.'
        },
        { status: 400 }
      );
    }

    // 4. Calculate cumulative duration for this employee (only for CDD, INTERIM, PRESTATION)
    if (['CDD', 'INTERIM', 'PRESTATION'].includes(existingContract.type)) {
      const allContracts = await db.contract.findMany({
        where: {
          employeeId: existingContract.employeeId,
          type: { in: ['CDD', 'INTERIM', 'PRESTATION'] },
          OR: [{ status: 'ACTIVE' }, { status: 'RENEWED' }, { id }]
        },
        orderBy: {
          startDate: 'asc'
        }
      });

      // Calculate total cumulative duration
      let totalDurationDays = 0;
      for (const contract of allContracts) {
        if (contract.startDate && contract.endDate) {
          const duration = differenceInDays(
            contract.endDate,
            contract.startDate
          );
          totalDurationDays += duration;
        }
      }

      // Convert to months (approximate)
      const totalDurationMonths = totalDurationDays / 30;

      // 5. Check if renewal would exceed 24-month limit
      const newContractDurationDays = differenceInDays(
        new Date(body.endDate),
        new Date(body.startDate)
      );
      const newTotalMonths = (totalDurationDays + newContractDurationDays) / 30;

      if (newTotalMonths > 24) {
        return NextResponse.json(
          {
            error: `Cannot renew: Total cumulative duration would exceed 24 months (2-year interim law limit). Current: ${totalDurationMonths.toFixed(1)} months, After renewal: ${newTotalMonths.toFixed(1)} months.`,
            currentDuration: totalDurationMonths,
            proposedDuration: newTotalMonths,
            remainingMonths: 24 - totalDurationMonths
          },
          { status: 400 }
        );
      }
    }

    // Validation for new contract data
    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: startDate, endDate' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Mark old contract as RENEWED
      await tx.contract.update({
        where: { id },
        data: {
          status: 'RENEWED',
          isActive: false
        }
      });

      // Create new contract
      const newContract = await tx.contract.create({
        data: {
          firmId,
          employeeId: existingContract.employeeId,
          clientId:
            body.clientId !== undefined
              ? body.clientId
              : existingContract.clientId,
          clientFirmId:
            body.clientFirmId !== undefined
              ? body.clientFirmId
              : existingContract.clientFirmId,
          type: existingContract.type,
          status: 'ACTIVE',
          startDate: new Date(body.startDate),
          endDate: new Date(body.endDate),
          renewedFromId: id,
          position: body.position || existingContract.position,
          salary: body.salary || existingContract.salary,
          workingHours: body.workingHours || existingContract.workingHours,
          notes: body.notes || existingContract.notes,
          alertThreshold: body.alertThreshold || existingContract.alertThreshold
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
          client: {
            select: {
              id: true,
              name: true
            }
          },
          clientFirm: {
            select: {
              id: true,
              name: true
            }
          },
          renewedFrom: {
            select: {
              id: true,
              type: true,
              startDate: true,
              endDate: true
            }
          }
        }
      });

      return newContract;
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'RENEW',
        entity: 'CONTRACT',
        entityId: result.id,
        metadata: {
          employeeId: existingContract.employeeId,
          previousContractId: id,
          newStartDate: result.startDate,
          newEndDate: result.endDate
        }
      }
    });

    // Convert Decimal fields to strings for JSON serialization
    const serialized = {
      ...result,
      salary: result.salary?.toString() || null
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('Error renewing contract:', error);
    return NextResponse.json(
      { error: 'Failed to renew contract' },
      { status: 500 }
    );
  }
}
