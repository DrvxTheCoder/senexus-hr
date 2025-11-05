import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/core/db/client';

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

    // Create employees in a transaction
    const createdEmployees = await prisma.$transaction(
      employees.map((emp: any) =>
        prisma.employee.create({
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
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdEmployees.length,
      employees: createdEmployees
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Un ou plusieurs matricules existent déjà' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'importation" },
      { status: 500 }
    );
  }
}
