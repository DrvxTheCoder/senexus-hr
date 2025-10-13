import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';

// GET /api/employees - List all employees
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employees = await db.employee.findMany({
      where: {
        userId: null // Only show employees not yet linked to a user
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
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
