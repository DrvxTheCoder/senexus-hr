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
        contractEndDate: true,
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
        emergencyContact: true,
        firmId: true,
        departmentId: true,
        assignedClientId: true,
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

    console.log('[PUT /api/employees/:id] Updating employee:', id);
    console.log(
      '[PUT /api/employees/:id] Request body:',
      JSON.stringify(body, null, 2)
    );

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

    // Build update data object, only including defined fields
    const updateData: any = {};

    // Basic info
    if (body.firstName !== undefined) updateData.firstName = body.firstName;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.matricule !== undefined) updateData.matricule = body.matricule;
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.address !== undefined) updateData.address = body.address;

    // Personal info
    if (body.dateOfBirth !== undefined)
      updateData.dateOfBirth = new Date(body.dateOfBirth);
    if (body.placeOfBirth !== undefined)
      updateData.placeOfBirth = body.placeOfBirth;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.maritalStatus !== undefined)
      updateData.maritalStatus = body.maritalStatus;
    if (body.nationality !== undefined)
      updateData.nationality = body.nationality;
    if (body.cni !== undefined) updateData.cni = body.cni;
    if (body.fatherName !== undefined) updateData.fatherName = body.fatherName;
    if (body.motherName !== undefined) updateData.motherName = body.motherName;

    // Professional info
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.netSalary !== undefined) updateData.netSalary = body.netSalary;
    if (body.hireDate !== undefined)
      updateData.hireDate = new Date(body.hireDate);
    if (body.contractEndDate !== undefined)
      updateData.contractEndDate = new Date(body.contractEndDate);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.departmentId !== undefined)
      updateData.departmentId = body.departmentId;
    if (body.assignedClientId !== undefined)
      updateData.assignedClientId = body.assignedClientId;

    // Emergency contact (JSON field)
    if (body.emergencyContact !== undefined)
      updateData.emergencyContact = body.emergencyContact;

    console.log(
      '[PUT /api/employees/:id] Update data:',
      JSON.stringify(updateData, null, 2)
    );

    // Update the employee
    const employee = await db.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        assignedClient: true
      }
    });

    console.log('[PUT /api/employees/:id] Employee updated successfully');

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
