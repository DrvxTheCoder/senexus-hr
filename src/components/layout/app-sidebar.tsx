'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { navItems, adminNavItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { signOut, useSession } from 'next-auth/react';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
export const company = {
  name: 'Acme Inc',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

const tenants = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' }
];

type AppSidebarProps = {
  firmSlug?: string;
  firm?: {
    id: string;
    name: string;
    logo: string | null;
    themeColor: string | null;
  } | null;
};

export default function AppSidebar({ firmSlug, firm }: AppSidebarProps) {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { data: session } = useSession();
  const router = useRouter();
  const [firms, setFirms] = React.useState<any[]>([]);
  const [currentFirm, setCurrentFirm] = React.useState(firm);

  React.useEffect(() => {
    // Fetch user's firms
    const fetchFirms = async () => {
      try {
        const res = await fetch('/api/user/firms');
        if (res.ok) {
          const data = await res.json();
          setFirms(data);
        }
      } catch (error) {
        console.error('Failed to fetch firms:', error);
      }
    };

    fetchFirms();
  }, []);

  const handleSwitchTenant = (tenantId: string) => {
    const selectedFirm = firms.find((f) => f.id === tenantId);
    if (selectedFirm) {
      router.push(`/select-firm?firmId=${selectedFirm.id}`);
    }
  };

  const user = session?.user;
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user?.email?.[0].toUpperCase() ||
    'U';

  // Determine if this is an admin context
  const isAdminRoute = pathname.startsWith('/admin');
  const navigation = isAdminRoute ? adminNavItems : navItems;

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher
          tenants={firms.map((f) => ({
            id: f.id,
            name: f.name,
            slug: f.slug,
            logo: f.logo,
            themeColor: f.themeColor,
            role: f.role
          }))}
          defaultTenant={
            currentFirm
              ? {
                  id: currentFirm.id,
                  name: currentFirm.name,
                  logo: currentFirm.logo,
                  themeColor: currentFirm.themeColor
                }
              : tenants[0]
          }
          onTenantSwitch={handleSwitchTenant}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isAdminRoute ? 'Administration' : 'Navigation'}
          </SidebarGroupLabel>
          <SidebarMenu>
            {navigation.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8 rounded-lg'>
                        <AvatarImage
                          src={user.image || ''}
                          alt={user.name || ''}
                        />
                        <AvatarFallback className='rounded-lg'>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid flex-1 text-left text-sm leading-tight'>
                        <span className='truncate font-semibold'>
                          {user.name}
                        </span>
                        <span className='truncate text-xs'>{user.email}</span>
                      </div>
                    </div>
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  {user && (
                    <div className='flex items-center gap-2 px-1 py-1.5'>
                      <Avatar className='h-8 w-8 rounded-lg'>
                        <AvatarImage
                          src={user.image || ''}
                          alt={user.name || ''}
                        />
                        <AvatarFallback className='rounded-lg'>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className='grid flex-1 text-left text-sm leading-tight'>
                        <span className='truncate font-semibold'>
                          {user.name}
                        </span>
                        <span className='truncate text-xs'>{user.email}</span>
                      </div>
                    </div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    Facturation
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
                  className='cursor-pointer'
                >
                  <IconLogout className='mr-2 h-4 w-4' />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
