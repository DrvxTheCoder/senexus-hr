import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import EmployeeDetailsPage from '@/modules/hr/pages/employee-details';

interface PageProps {
  params: Promise<{
    firmSlug: string;
    moduleSlug: string;
    id: string;
  }>;
}

export default async function EmployeeDetailServerPage({ params }: PageProps) {
  const { firmSlug, moduleSlug, id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get firm by slug
  const firm = await db.firm.findUnique({
    where: { slug: firmSlug },
    include: {
      userFirms: {
        where: { userId: session.user.id },
        select: { role: true }
      }
    }
  });

  if (!firm || firm.userFirms.length === 0) {
    notFound();
  }

  // Check if firm has the HR module installed and enabled
  const firmModule = await db.firmModule.findFirst({
    where: {
      firmId: firm.id,
      module: { slug: moduleSlug },
      isEnabled: true
    },
    include: {
      module: true
    }
  });

  if (!firmModule) {
    notFound();
  }

  // Verify employee exists and belongs to this firm
  const employee = await db.employee.findUnique({
    where: { id },
    select: { firmId: true }
  });

  if (!employee || employee.firmId !== firm.id) {
    notFound();
  }

  return <EmployeeDetailsPage />;
}
