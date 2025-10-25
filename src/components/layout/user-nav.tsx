'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SidebarMenuButton } from '../ui/sidebar';
import {
  IconBell,
  IconChevronsDown,
  IconCreditCard,
  IconExternalLink,
  IconKey,
  IconLogout,
  IconShield,
  IconUserCircle
} from '@tabler/icons-react';
import { Icon } from 'lucide-react';

export function UserNav() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
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
                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                <AvatarFallback className='rounded-lg'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{user.name}</span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className='cursor-pointer'>
            <IconUserCircle className='mr-2 h-4 w-4' />
            Préférences
          </DropdownMenuItem>
          <DropdownMenuItem className='cursor-pointer'>
            <IconKey className='mr-2 h-4 w-4' />
            Compte
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/select-firm')}
          className='cursor-pointer'
        >
          <IconExternalLink className='mr-2 h-4 w-4' />
          Entreprises
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/auth/sign-in' })}
          className='cursor-pointer'
        >
          <IconLogout className='mr-2 h-4 w-4' />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
