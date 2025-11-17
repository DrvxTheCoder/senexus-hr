import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/employees/:id - Get single employee by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const employee = await db.employee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matricule: true,
        email: true,
        phone: true,
        photoUrl: true,
        status: true,
        hireDate: true,
        address: true,
        dateOfBirth: true,
        placeOfBirth: true,
        gender: true,
        maritalStatus: true,
        nationality: true,
        cni: true,
        fatherName: true,
        motherName: true,
        jobTitle: true,
        category: true,
        netSalary: true,
        firmId: true,
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        assignedClient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this employee's firm
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

    // Convert Decimal fields to strings for JSON serialization
    const serialized = {
      ...employee,
      netSalary: employee.netSalary?.toString() || null
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/:id - Update employee
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // First, verify the employee exists and user has access
    const existingEmployee = await db.employee.findUnique({
      where: { id },
      select: { firmId: true }
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: existingEmployee.firmId
        }
      }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the employee
    const employee = await db.employee.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        placeOfBirth: body.placeOfBirth,
        gender: body.gender,
        maritalStatus: body.maritalStatus,
        nationality: body.nationality,
        cni: body.cni,
        fatherName: body.fatherName,
        motherName: body.motherName,
        jobTitle: body.jobTitle,
        category: body.category,
        netSalary: body.netSalary,
        departmentId: body.departmentId,
        assignedClientId: body.assignedClientId
      },
      include: {
        department: true,
        assignedClient: true
      }
    });

    // Convert Decimal fields to strings for JSON serialization
    const serialized = {
      ...employee,
      netSalary: employee.netSalary?.toString() || null
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/:id - Delete employee
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify employee exists and user has access
    const employee = await db.employee.findUnique({
      where: { id },
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

    if (!userFirm || (userFirm.role !== 'OWNER' && userFirm.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.employee.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
