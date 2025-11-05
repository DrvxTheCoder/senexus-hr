import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth/auth.config';
import { db } from '@/lib/db';
import AppShell from '@/components/layout/app-shell';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
  ContextMenuTrigger
} from '@/components/ui/context-menu';

export default async function FirmDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ firmSlug: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/sign-in');
  }

  const { firmSlug } = await params;

  // Find the firm by slug
  const firm = await db.firm.findUnique({
    where: { slug: firmSlug }
  });

  if (!firm) {
    notFound();
  }

  // Check if user has access to this firm
  const userFirm = await db.userFirm.findUnique({
    where: {
      userId_firmId: {
        userId: session.user.id,
        firmId: firm.id
      }
    }
  });

  if (!userFirm) {
    redirect('/select-firm');
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <AppShell
            firmSlug={firmSlug}
            firm={{
              id: firm.id,
              name: firm.name,
              logo: firm.logo,
              themeColor: firm.themeColor
            }}
          >
            {children}
          </AppShell>
        </ContextMenuTrigger>
        <ContextMenuContent className='w-52'>
          <ContextMenuItem inset>
            Arrière
            <ContextMenuShortcut>{'⌘['}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem inset>
            Rafraichir
            <ContextMenuShortcut>{'⌘R'}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger inset>
              Plus d&pos;outils
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className='w-44'>
              <ContextMenuItem>Enregistrer la page...</ContextMenuItem>
              <ContextMenuItem>Créer un raccourci...</ContextMenuItem>
              <ContextMenuItem>Nommer la fenêtre...</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem inset className='text-destructive'>
            Déconnexion
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
