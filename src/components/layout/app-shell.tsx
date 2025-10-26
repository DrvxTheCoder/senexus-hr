import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ThemeColorProvider } from '@/components/theme-color-provider';
import { cookies } from 'next/headers';
import { ScrollArea } from '../ui/scroll-area';

type AppShellProps = {
  children: React.ReactNode;
  firmSlug?: string;
  firm?: {
    id: string;
    name: string;
    logo: string | null;
    themeColor: string | null;
  } | null;
};

export default async function AppShell({
  children,
  firmSlug,
  firm
}: AppShellProps) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <KBar>
      <ThemeColorProvider themeColor={firm?.themeColor} />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar firmSlug={firmSlug} firm={firm} />
        <SidebarInset>
          <Header />
          <ScrollArea className='h-[calc(95vh-64px)] px-6 py-4'>
            {children}
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
