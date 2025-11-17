import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/employees/:id/contracts - Get all contracts for an employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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

    // Fetch contracts
    const contracts = await db.contract.findMany({
      where: { employeeId },
      select: {
        id: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        renewalDate: true,
        renewedFromId: true,
        position: true,
        salary: true,
        workingHours: true,
        trialPeriodEnd: true,
        isActive: true,
        notes: true,
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
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Convert Decimal fields to strings for JSON serialization
    const serializedContracts = contracts.map((contract) => ({
      ...contract,
      salary: contract.salary?.toString() || null
    }));

    return NextResponse.json(serializedContracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

// POST /api/employees/:id/contracts - Create a new contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await req.json();

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

    if (
      !userFirm ||
      (userFirm.role !== 'OWNER' &&
        userFirm.role !== 'ADMIN' &&
        userFirm.role !== 'MANAGER')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create contract
    const contract = await db.contract.create({
      data: {
        firmId: employee.firmId,
        employeeId,
        clientId: body.clientId || null,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : null,
        alertThreshold: body.alertThreshold || 30,
        isAutoRenewal: body.isAutoRenewal || false,
        position: body.position,
        salary: body.salary,
        workingHours: body.workingHours,
        trialPeriodEnd: body.trialPeriodEnd
          ? new Date(body.trialPeriodEnd)
          : null,
        notes: body.notes,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log the action
    await db.auditLog.create({
      data: {
        firmId: employee.firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'CONTRACT',
        entityId: contract.id,
        metadata: {
          employeeId,
          type: contract.type,
          startDate: contract.startDate
        }
      }
    });

    // Convert Decimal fields to strings for JSON serialization
    const serialized = {
      ...contract,
      salary: contract.salary?.toString() || null
    };

    return NextResponse.json(serialized, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
