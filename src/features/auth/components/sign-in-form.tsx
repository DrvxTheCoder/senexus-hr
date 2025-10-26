'use client';

import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { is } from 'zod/v4/locales';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        toast.error('Email ou mot de passe invalide');
      } else if (result?.ok) {
        toast.success('Bienvenue !');
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-center text-2xl font-bold'>
          <img
            src='/assets/img/logos/senexus-mini.png'
            alt='Senexus Group Logo'
            className='mx-auto mb-2 h-10 w-auto rounded-md'
          />
          Connexion
        </CardTitle>
        <CardDescription className='text-center'>
          Connexion à la plateforme{' '}
          <b className='font-extrabold'>Senexus Multi-App</b>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='name@example.com'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='password'>Mot de passe</Label>
            <Input
              id='password'
              type='password'
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner />
                Patientez...
              </>
            ) : (
              <>Connexion</>
            )}
          </Button>
        </form>

        <div className='text-muted-foreground mt-4 text-center text-sm'>
          <p>Identifiants de démonstration :</p>
          <p className='mt-1 font-mono text-xs'>
            flanpaul19@gmail.com / password123!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
