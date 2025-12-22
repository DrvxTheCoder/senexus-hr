import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: firmId } = await params;

    // Get all employees for this firm
    const employees = await prisma.employee.findMany({
      where: { firmId },
      include: {
        contracts: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: { startDate: 'desc' }
        },
        leaveRequests: {
          where: {
            status: 'APPROVED',
            endDate: { gte: new Date() }
          }
        }
      }
    });

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(
      (e) => e.status === 'ACTIVE'
    ).length;
    const onLeave = employees.filter((e) => e.status === 'ON_LEAVE').length;
    const inactive = employees.filter((e) => e.status === 'INACTIVE').length;

    // Calculate contract statistics
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const contracts = await prisma.contract.findMany({
      where: {
        firmId,
        status: 'ACTIVE'
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

    const expiredContracts = contracts.filter(
      (c) => c.endDate && c.endDate < now
    );

    const contractsCloseToExpiration = contracts.filter(
      (c) =>
        c.endDate &&
        c.endDate >= now &&
        c.endDate <= thirtyDaysFromNow &&
        !c.isAutoRenewal
    );

    // Get employees currently on approved leave
    const currentLeaves = await prisma.leaveRequest.findMany({
      where: {
        firmId,
        status: 'APPROVED',
        startDate: { lte: now },
        endDate: { gte: now }
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

    // Calculate gender distribution
    const genderDistribution = {
      male: employees.filter((e) => e.gender === 'MALE').length,
      female: employees.filter((e) => e.gender === 'FEMALE').length,
      other: employees.filter((e) => e.gender === 'OTHER').length
    };

    // Calculate age group distribution
    const getAge = (birthDate: Date | null) => {
      if (!birthDate) return null;
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        return age - 1;
      }
      return age;
    };

    const ageGroups = {
      '18-30': 0,
      '30-60': 0,
      '60+': 0,
      unknown: 0
    };

    employees.forEach((emp) => {
      const age = getAge(emp.dateOfBirth);
      if (age === null) {
        ageGroups.unknown++;
      } else if (age >= 18 && age < 30) {
        ageGroups['18-30']++;
      } else if (age >= 30 && age < 60) {
        ageGroups['30-60']++;
      } else if (age >= 60) {
        ageGroups['60+']++;
      } else {
        ageGroups.unknown++;
      }
    });

    return NextResponse.json({
      stats: {
        totalEmployees,
        activeEmployees,
        onLeave,
        inactive
      },
      contracts: {
        total: contracts.length,
        expiredCount: expiredContracts.length,
        closeToExpirationCount: contractsCloseToExpiration.length,
        expired: expiredContracts.slice(0, 5).map((c) => ({
          id: c.id,
          employee: c.employee,
          type: c.type,
          endDate: c.endDate
        })),
        closeToExpiration: contractsCloseToExpiration.slice(0, 5).map((c) => ({
          id: c.id,
          employee: c.employee,
          type: c.type,
          endDate: c.endDate
        }))
      },
      leaves: {
        currentCount: currentLeaves.length,
        current: currentLeaves.slice(0, 5).map((l) => ({
          id: l.id,
          employee: l.employee,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate
        }))
      },
      demographics: {
        gender: genderDistribution,
        ageGroups
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
