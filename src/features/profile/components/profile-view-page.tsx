'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';

export default function ProfileViewPage() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) {
    return <div>Chargement...</div>;
  }

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user.email?.[0].toUpperCase() ||
    'U';

  return (
    <div className='flex w-full flex-col gap-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Vos informations de compte</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-4'>
            <Avatar className='h-20 w-20'>
              <AvatarImage src={user.image || ''} alt={user.name || ''} />
              <AvatarFallback className='text-2xl'>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className='text-lg font-semibold'>{user.name}</p>
              <p className='text-muted-foreground text-sm'>{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
