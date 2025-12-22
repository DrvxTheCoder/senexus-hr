import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { generateNextMatricule } from '@/lib/utils/matricule';
import { prisma } from '@/core/db/client';

// GET /api/employees/next-matricule?firmId=xxx - Get the next available matricule
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const firmId = searchParams.get('firmId');

    if (!firmId) {
      return NextResponse.json(
        { error: 'Firm ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this firm
    const userFirm = await prisma.userFirm.findUnique({
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

    const nextMatricule = await generateNextMatricule(firmId);

    return NextResponse.json({ matricule: nextMatricule });
  } catch (error) {
    console.error('Error generating next matricule:', error);
    return NextResponse.json(
      { error: 'Failed to generate matricule' },
      { status: 500 }
    );
  }
}
