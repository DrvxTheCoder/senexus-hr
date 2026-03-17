import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import { generateNextMatricule } from '@/lib/utils/matricule';

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

    const isRestrictedRole = !['OWNER', 'ADMIN'].includes(userFirm.role);
    const employeeWhere: any = { firmId };

    if (isRestrictedRole) {
      const assignments = await db.userClientAssignment.findMany({
        where: { userId: session.user.id, firmId },
        select: { clientId: true }
      });
      employeeWhere.assignedClientId = {
        in: assignments.map((a) => a.clientId)
      };
    }

    const employees = await db.employee.findMany({
      where: employeeWhere,
      include: {
        department: true,
        assignedClient: true,
        contracts: true
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    // Convert Decimal fields to strings for JSON serialization
    const serializedEmployees = employees.map((employee) => ({
      ...employee,
      netSalary: employee.netSalary?.toString() || null,
      contracts: employee.contracts.map((contract) => ({
        ...contract,
        salary: contract.salary?.toString() || null
      }))
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

// POST /api/employees - Create a new employee with initial contract
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { firmId, ...employeeData } = body;

    if (!firmId) {
      return NextResponse.json(
        { error: 'Firm ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this firm with proper role
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

    // Generate matricule if not provided
    let matricule = employeeData.matricule;
    if (!matricule) {
      matricule = await generateNextMatricule(firmId);
    }

    // Check if matricule already exists for this firm
    const existingEmployee = await db.employee.findUnique({
      where: {
        firmId_matricule: {
          firmId,
          matricule: matricule
        }
      }
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Matricule already exists' },
        { status: 400 }
      );
    }

    // Create employee and contract in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create employee
      const employee = await tx.employee.create({
        data: {
          firmId,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          matricule: matricule,
          email: employeeData.email,
          phone: employeeData.phone,
          address: employeeData.address,
          dateOfBirth: employeeData.dateOfBirth
            ? new Date(employeeData.dateOfBirth)
            : null,
          placeOfBirth: employeeData.placeOfBirth,
          gender: employeeData.gender,
          maritalStatus: employeeData.maritalStatus,
          nationality: employeeData.nationality,
          cni: employeeData.cni,
          fatherName: employeeData.fatherName,
          motherName: employeeData.motherName,
          photoUrl: employeeData.photoUrl,
          jobTitle: employeeData.jobTitle,
          category: employeeData.category,
          netSalary: employeeData.netSalary,
          hireDate: employeeData.hireDate
            ? new Date(employeeData.hireDate)
            : new Date(),
          contractEndDate: employeeData.contractEndDate
            ? new Date(employeeData.contractEndDate)
            : null,
          departmentId: employeeData.departmentId || null,
          assignedClientId: employeeData.assignedClientId || null,
          status: employeeData.status || 'ACTIVE',
          emergencyContact: employeeData.emergencyContact || null
        }
      });

      // Create initial contract
      const contract = await tx.contract.create({
        data: {
          firmId,
          employeeId: employee.id,
          clientId: employeeData.assignedClientId || null,
          type: employeeData.contractType || 'CDD',
          status: 'ACTIVE',
          startDate: employeeData.hireDate
            ? new Date(employeeData.hireDate)
            : new Date(),
          endDate: employeeData.contractEndDate
            ? new Date(employeeData.contractEndDate)
            : null,
          position: employeeData.jobTitle || null,
          salary: employeeData.netSalary || null,
          workingHours: employeeData.workingHours || null,
          notes: `Initial contract created during employee onboarding`
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          firmId,
          actorId: session.user.id,
          action: 'CREATE',
          entity: 'EMPLOYEE',
          entityId: employee.id,
          metadata: {
            employeeName: `${employee.firstName} ${employee.lastName}`,
            matricule: employee.matricule,
            contractId: contract.id
          }
        }
      });

      return { employee, contract };
    });

    // Convert Decimal fields for response
    const response = {
      ...result.employee,
      netSalary: result.employee.netSalary?.toString() || null,
      contract: {
        ...result.contract,
        salary: result.contract.salary?.toString() || null
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
