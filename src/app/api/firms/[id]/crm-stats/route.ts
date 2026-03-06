import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

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

    const userFirm = await db.userFirm.findUnique({
      where: { userId_firmId: { userId: session.user.id, firmId } }
    });

    if (!userFirm) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch clients with assigned employees and salaries
    const clients = await db.client.findMany({
      where: { firmId, status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        name: true,
        status: true,
        contractEndDate: true,
        assignedEmployees: {
          select: {
            id: true,
            netSalary: true,
            status: true
          }
        }
      }
    });

    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
    const prospects = clients.filter((c) => c.status === 'PROSPECT').length;
    const inactiveClients = clients.filter(
      (c) => c.status === 'INACTIVE'
    ).length;

    // Total employees assigned across all clients
    const allAssignedEmployeeIds = new Set<string>();
    clients.forEach((c) =>
      c.assignedEmployees.forEach((e) => allAssignedEmployeeIds.add(e.id))
    );
    const totalAssignedEmployees = allAssignedEmployeeIds.size;

    // Contracts expiring within 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringContracts = await db.contract.count({
      where: {
        firmId,
        status: 'ACTIVE',
        endDate: { gte: now, lte: thirtyDaysFromNow },
        isAutoRenewal: false
      }
    });

    // Employees by client (for pie chart) — active employees only
    const employeesByClient = clients
      .map((c) => ({
        clientId: c.id,
        name: c.name,
        count: c.assignedEmployees.filter((e) => e.status === 'ACTIVE').length
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);

    // Salary mass by client (for donut chart)
    const salaryByClient = clients
      .map((c) => {
        const totalSalary = c.assignedEmployees
          .filter((e) => e.status === 'ACTIVE' && e.netSalary)
          .reduce((sum, e) => sum + Number(e.netSalary), 0);
        return {
          clientId: c.id,
          name: c.name,
          totalSalary
        };
      })
      .filter((c) => c.totalSalary > 0)
      .sort((a, b) => b.totalSalary - a.totalSalary);

    const totalSalaryMass = salaryByClient.reduce(
      (s, c) => s + c.totalSalary,
      0
    );

    return NextResponse.json({
      summary: {
        totalClients,
        activeClients,
        prospects,
        inactiveClients,
        totalAssignedEmployees,
        expiringContracts
      },
      employeesByClient,
      salaryByClient,
      totalSalaryMass
    });
  } catch (error) {
    console.error('Error fetching CRM stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM statistics' },
      { status: 500 }
    );
  }
}
