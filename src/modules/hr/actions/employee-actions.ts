'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput
} from '../schemas/employee-schema';

type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Get all employees for a firm with optional filters
 */
export async function getEmployees(
  firmId: string,
  filters?: {
    status?: string;
    departmentId?: string;
    search?: string;
  }
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
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
      return { success: false, error: 'Accès refusé à cette organisation' };
    }

    const where: any = { firmId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { matricule: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const employees = await db.employee.findMany({
      where,
      include: {
        department: true,
        assignedClient: true,
        contracts: {
          where: { isActive: true },
          orderBy: { startDate: 'desc' },
          take: 1
        }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });

    return { success: true, data: employees };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return {
      success: false,
      error: 'Erreur lors de la récupération des employés'
    };
  }
}

/**
 * Get a single employee by ID
 */
export async function getEmployee(employeeId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        assignedClient: true,
        firm: true,
        contracts: {
          orderBy: { startDate: 'desc' },
          include: { client: true }
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        leaveBalances: {
          where: { year: new Date().getFullYear() }
        },
        absences: {
          orderBy: { date: 'desc' },
          take: 10
        },
        requestedMissions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!employee) {
      return { success: false, error: 'Employé non trouvé' };
    }

    // Verify user has access to this firm
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: employee.firmId
        }
      }
    });

    if (!userFirm) {
      return { success: false, error: 'Accès refusé' };
    }

    return { success: true, data: employee };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return {
      success: false,
      error: "Erreur lors de la récupération de l'employé"
    };
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(
  firmId: string,
  input: CreateEmployeeInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Verify user has ADMIN or MANAGER role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId
        }
      }
    });

    if (!userFirm || !['ADMIN', 'OWNER', 'MANAGER'].includes(userFirm.role)) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    // Validate input
    const validatedData = createEmployeeSchema.parse(input);

    // Check if matricule already exists for this firm
    const existing = await db.employee.findUnique({
      where: {
        firmId_matricule: {
          firmId,
          matricule: validatedData.matricule
        }
      }
    });

    if (existing) {
      return { success: false, error: 'Ce matricule existe déjà' };
    }

    // Create employee
    const employee = await db.employee.create({
      data: {
        ...validatedData,
        firmId,
        hireDate: new Date(validatedData.hireDate),
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : null,
        contractEndDate: validatedData.contractEndDate
          ? new Date(validatedData.contractEndDate)
          : null
      },
      include: {
        department: true,
        assignedClient: true
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId,
        actorId: session.user.id,
        action: 'CREATE',
        entity: 'EMPLOYEE',
        entityId: employee.id,
        metadata: {
          employeeName: `${employee.firstName} ${employee.lastName}`,
          matricule: employee.matricule
        }
      }
    });

    revalidatePath(`/${firmId}/hr/employees`);

    return { success: true, data: employee };
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return {
      success: false,
      error: error.message || "Erreur lors de la création de l'employé"
    };
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Get employee to verify access
    const existingEmployee = await db.employee.findUnique({
      where: { id: employeeId }
    });

    if (!existingEmployee) {
      return { success: false, error: 'Employé non trouvé' };
    }

    // Verify user has ADMIN or MANAGER role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: existingEmployee.firmId
        }
      }
    });

    if (!userFirm || !['ADMIN', 'OWNER', 'MANAGER'].includes(userFirm.role)) {
      return { success: false, error: 'Permissions insuffisantes' };
    }

    // Validate input
    const validatedData = updateEmployeeSchema.parse(input);

    // Check matricule uniqueness if it's being changed
    if (
      validatedData.matricule &&
      validatedData.matricule !== existingEmployee.matricule
    ) {
      const duplicate = await db.employee.findUnique({
        where: {
          firmId_matricule: {
            firmId: existingEmployee.firmId,
            matricule: validatedData.matricule
          }
        }
      });

      if (duplicate) {
        return { success: false, error: 'Ce matricule existe déjà' };
      }
    }

    // Prepare update data
    const updateData: any = { ...validatedData };

    if (validatedData.hireDate) {
      updateData.hireDate = new Date(validatedData.hireDate);
    }
    if (validatedData.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    }
    if (validatedData.contractEndDate) {
      updateData.contractEndDate = new Date(validatedData.contractEndDate);
    }

    // Update employee
    const employee = await db.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        department: true,
        assignedClient: true
      }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId: existingEmployee.firmId,
        actorId: session.user.id,
        action: 'UPDATE',
        entity: 'EMPLOYEE',
        entityId: employee.id,
        metadata: {
          employeeName: `${employee.firstName} ${employee.lastName}`,
          changes: validatedData
        }
      }
    });

    revalidatePath(`/${existingEmployee.firmId}/hr/employees`);
    revalidatePath(`/${existingEmployee.firmId}/hr/employees/${employeeId}`);

    return { success: true, data: employee };
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return {
      success: false,
      error: error.message || "Erreur lors de la mise à jour de l'employé"
    };
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(
  employeeId: string
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'Non autorisé' };
    }

    // Get employee to verify access
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        contracts: true,
        leaveRequests: true
      }
    });

    if (!employee) {
      return { success: false, error: 'Employé non trouvé' };
    }

    // Verify user has ADMIN or OWNER role
    const userFirm = await db.userFirm.findUnique({
      where: {
        userId_firmId: {
          userId: session.user.id,
          firmId: employee.firmId
        }
      }
    });

    if (!userFirm || !['ADMIN', 'OWNER'].includes(userFirm.role)) {
      return {
        success: false,
        error:
          'Permissions insuffisantes. Seuls les ADMINs peuvent supprimer des employés.'
      };
    }

    // Check if employee has active contracts
    const hasActiveContracts = employee.contracts.some((c) => c.isActive);
    if (hasActiveContracts) {
      return {
        success: false,
        error:
          "Impossible de supprimer un employé avec des contrats actifs. Veuillez d'abord résilier les contrats."
      };
    }

    // Instead of deleting, mark as TERMINATED (soft delete)
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: { status: 'TERMINATED' }
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        firmId: employee.firmId,
        actorId: session.user.id,
        action: 'DELETE',
        entity: 'EMPLOYEE',
        entityId: employee.id,
        metadata: {
          employeeName: `${employee.firstName} ${employee.lastName}`,
          matricule: employee.matricule
        }
      }
    });

    revalidatePath(`/${employee.firmId}/hr/employees`);

    return {
      success: true,
      data: updatedEmployee,
      error: 'Employé marqué comme terminé'
    };
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return {
      success: false,
      error: error.message || "Erreur lors de la suppression de l'employé"
    };
  }
}

/**
 * Calculate interim duration for an employee
 * Returns days since hire date
 * Note: firstInterimDate field has been removed, using hireDate instead
 */
export async function calculateInterimDuration(
  employeeId: string
): Promise<ActionResponse> {
  try {
    const employee = await db.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return { success: false, error: 'Employé non trouvé' };
    }

    const hireDate = new Date(employee.hireDate);
    const now = new Date();
    const twoYearsLater = new Date(hireDate);
    twoYearsLater.setFullYear(twoYearsLater.getFullYear() + 2);

    const daysElapsed = Math.floor(
      (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.floor(
      (twoYearsLater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = 730; // 2 years
    const percentageComplete = Math.min(100, (daysElapsed / totalDays) * 100);

    return {
      success: true,
      data: {
        hireDate,
        endDate: twoYearsLater,
        daysElapsed,
        daysRemaining: Math.max(0, daysRemaining),
        percentageComplete,
        isApproachingLimit: daysRemaining <= 90 && daysRemaining > 0, // Within 3 months
        hasExceededLimit: daysRemaining < 0
      }
    };
  } catch (error) {
    console.error('Error calculating interim duration:', error);
    return {
      success: false,
      error: "Erreur lors du calcul de la durée d'intérim"
    };
  }
}
