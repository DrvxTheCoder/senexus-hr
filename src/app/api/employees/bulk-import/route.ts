import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/core/db/client';
import { generateNextMatricule } from '@/lib/utils/matricule';

interface BulkImportError {
  rowNumber?: number;
  employeeName?: string;
  field?: string;
  message: string;
  code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { firmId, clientId, employees } = body;

    if (!firmId || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Verify user has access to the firm
    const userFirm = await prisma.userFirm.findFirst({
      where: {
        userId: session.user.id,
        firmId
      }
    });

    if (!userFirm) {
      return NextResponse.json(
        { error: 'Accès refusé à cette firme' },
        { status: 403 }
      );
    }

    // If clientId is provided, verify it belongs to the firm
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          firmId
        }
      });

      if (!client) {
        return NextResponse.json({ error: 'Client invalide' }, { status: 400 });
      }
    }

    const errors: BulkImportError[] = [];
    const createdEmployees: any[] = [];
    let successCount = 0;

    // Process each employee individually to provide better error handling
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const rowNumber = i + 1;
      const employeeName = `${emp.firstName} ${emp.lastName}`;

      try {
        // Validate required fields
        if (!emp.firstName || !emp.lastName) {
          errors.push({
            rowNumber,
            employeeName,
            message: 'Prénom et nom sont obligatoires',
            code: 'MISSING_REQUIRED_FIELDS'
          });
          continue;
        }

        if (!emp.hireDate) {
          errors.push({
            rowNumber,
            employeeName,
            field: 'DATE ENTREE',
            message: "Date d'entrée obligatoire",
            code: 'MISSING_HIRE_DATE'
          });
          continue;
        }

        if (!emp.contract || !emp.contract.type) {
          errors.push({
            rowNumber,
            employeeName,
            field: 'TYPE CONTRAT',
            message: 'Type de contrat obligatoire',
            code: 'MISSING_CONTRACT_TYPE'
          });
          continue;
        }

        // Validate contract type
        const validContractTypes = [
          'CDI',
          'CDD',
          'INTERIM',
          'STAGE',
          'PRESTATION'
        ];
        if (!validContractTypes.includes(emp.contract.type)) {
          errors.push({
            rowNumber,
            employeeName,
            field: 'TYPE CONTRAT',
            message: `Type de contrat invalide. Utilisez: ${validContractTypes.join(', ')}`,
            code: 'INVALID_CONTRACT_TYPE'
          });
          continue;
        }

        // Validate CDD/INTERIM end date
        if (
          (emp.contract.type === 'CDD' || emp.contract.type === 'INTERIM') &&
          !emp.contract.endDate
        ) {
          errors.push({
            rowNumber,
            employeeName,
            field: 'DATE SORTIE',
            message: `Date de fin obligatoire pour un contrat ${emp.contract.type}`,
            code: 'MISSING_CONTRACT_END_DATE'
          });
          continue;
        }

        // Check for potential duplicates by comparing key fields
        // We'll check if an employee with 4+ matching fields already exists
        const existingEmployees = await prisma.employee.findMany({
          where: {
            firmId,
            OR: [
              {
                AND: [{ firstName: emp.firstName }, { lastName: emp.lastName }]
              },
              // Match by CNI if provided
              emp.cni ? { cni: emp.cni } : {}
            ]
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            cni: true,
            hireDate: true,
            jobTitle: true,
            placeOfBirth: true,
            matricule: true
          }
        });

        // Check if any existing employee matches 4+ fields
        for (const existing of existingEmployees) {
          let matchCount = 0;

          if (existing.firstName === emp.firstName) matchCount++;
          if (existing.lastName === emp.lastName) matchCount++;

          if (emp.dateOfBirth && existing.dateOfBirth) {
            const empDOB = new Date(emp.dateOfBirth)
              .toISOString()
              .split('T')[0];
            const existingDOB = existing.dateOfBirth
              .toISOString()
              .split('T')[0];
            if (empDOB === existingDOB) matchCount++;
          }

          if (emp.cni && existing.cni === emp.cni) matchCount++;

          if (emp.hireDate && existing.hireDate) {
            const empHire = new Date(emp.hireDate).toISOString().split('T')[0];
            const existingHire = existing.hireDate.toISOString().split('T')[0];
            if (empHire === existingHire) matchCount++;
          }

          if (emp.jobTitle && existing.jobTitle === emp.jobTitle) matchCount++;
          if (emp.placeOfBirth && existing.placeOfBirth === emp.placeOfBirth)
            matchCount++;

          if (matchCount >= 4) {
            errors.push({
              rowNumber,
              employeeName,
              field: 'DUPLICATE',
              message: `Employé probablement déjà existant (Matricule: ${existing.matricule}, ${matchCount} champs identiques)`,
              code: 'DUPLICATE_EMPLOYEE'
            });
            // Use a flag to skip creation
            continue;
          }
        }

        // Skip if duplicate was detected
        if (
          errors.some(
            (e) => e.rowNumber === rowNumber && e.code === 'DUPLICATE_EMPLOYEE'
          )
        ) {
          continue;
        }

        // Generate unique matricule for this employee
        const matricule = await generateNextMatricule(firmId);

        // Check if matricule already exists (extra safety)
        const existingEmployee = await prisma.employee.findUnique({
          where: {
            firmId_matricule: {
              firmId,
              matricule
            }
          }
        });

        if (existingEmployee) {
          // If somehow the matricule exists, generate a new one
          const retryMatricule = await generateNextMatricule(firmId);
          emp.matricule = retryMatricule;
        } else {
          emp.matricule = matricule;
        }

        // Create employee and contract in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create employee
          const createdEmployee = await tx.employee.create({
            data: {
              firmId,
              assignedClientId: clientId || emp.assignedClientId,
              firstName: emp.firstName,
              lastName: emp.lastName,
              matricule: emp.matricule,
              dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : null,
              placeOfBirth: emp.placeOfBirth,
              maritalStatus: emp.maritalStatus,
              nationality: emp.nationality,
              cni: emp.cni,
              jobTitle: emp.jobTitle,
              category: emp.category,
              hireDate: new Date(emp.hireDate),
              contractEndDate: emp.contractEndDate
                ? new Date(emp.contractEndDate)
                : null,
              status: emp.status || 'ACTIVE'
            }
          });

          // Create contract
          const createdContract = await tx.contract.create({
            data: {
              firmId,
              employeeId: createdEmployee.id,
              clientId: clientId || emp.assignedClientId,
              type: emp.contract.type,
              status: 'ACTIVE',
              startDate: new Date(emp.contract.startDate),
              endDate: emp.contract.endDate
                ? new Date(emp.contract.endDate)
                : null,
              position: emp.contract.position,
              salary: emp.contract.salary,
              isActive: true,
              alertThreshold: 30
            }
          });

          return { employee: createdEmployee, contract: createdContract };
        });

        createdEmployees.push(result.employee);
        successCount++;
      } catch (error: any) {
        console.error(`Error importing employee ${employeeName}:`, error);

        // Handle specific Prisma errors
        if (error.code === 'P2002') {
          const field = error.meta?.target?.[0] || 'unknown';
          errors.push({
            rowNumber,
            employeeName,
            field: field === 'matricule' ? 'MATRICULE' : field.toUpperCase(),
            message:
              field === 'matricule'
                ? 'Matricule en doublon (ceci ne devrait pas arriver)'
                : `Valeur en doublon pour le champ ${field}`,
            code: 'DUPLICATE_VALUE'
          });
        } else if (error.code === 'P2003') {
          errors.push({
            rowNumber,
            employeeName,
            message: 'Référence invalide (client ou département)',
            code: 'INVALID_REFERENCE'
          });
        } else if (
          error.message?.includes('Invalid') ||
          error.message?.includes('invalid')
        ) {
          errors.push({
            rowNumber,
            employeeName,
            message: error.message,
            code: 'VALIDATION_ERROR'
          });
        } else {
          errors.push({
            rowNumber,
            employeeName,
            message: "Erreur lors de la création de l'employé",
            code: 'CREATION_ERROR'
          });
        }
      }
    }

    // Return comprehensive result
    const response: any = {
      success: errors.length === 0,
      count: successCount,
      total: employees.length,
      employees: createdEmployees
    };

    if (errors.length > 0) {
      response.errors = errors;
      response.message = `${successCount} employé(s) importé(s), ${errors.length} erreur(s)`;
    }

    // Return 207 Multi-Status if there are partial successes
    const statusCode =
      errors.length === 0
        ? 200
        : errors.length === employees.length
          ? 400
          : 207;

    return NextResponse.json(response, { status: statusCode });
  } catch (error: any) {
    console.error('Bulk import error:', error);

    return NextResponse.json(
      {
        error: "Erreur lors de l'importation",
        message: error.message || "Une erreur inconnue s'est produite"
      },
      { status: 500 }
    );
  }
}
