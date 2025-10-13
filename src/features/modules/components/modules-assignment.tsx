'use client';

import {
  Package,
  Users,
  Calendar,
  Heart,
  FileText,
  BarChart
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

const AVAILABLE_MODULES = [
  {
    id: 'hr',
    name: 'Ressources Humaines',
    description: 'Gestion des employés, contrats, congés et missions',
    icon: Users,
    color: 'text-blue-500'
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Gestion de la relation client',
    icon: Package,
    color: 'text-green-500'
  },
  {
    id: 'ipm',
    name: 'Assurance Maladie (IPM)',
    description: 'Gestion des prestations santé, sinistres et partenaires',
    icon: Heart,
    color: 'text-red-500'
  },
  {
    id: 'planning',
    name: 'Planning',
    description: 'Gestion des plannings et emplois du temps',
    icon: Calendar,
    color: 'text-purple-500'
  },
  {
    id: 'documents',
    name: 'Gestion Documentaire',
    description: 'Stockage et organisation des documents',
    icon: FileText,
    color: 'text-orange-500'
  },
  {
    id: 'analytics',
    name: 'Analytics & BI',
    description: 'Tableaux de bord et rapports personnalisés',
    icon: BarChart,
    color: 'text-indigo-500'
  }
];

export function ModulesAssignment() {
  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Modules Disponibles</CardTitle>
          <CardDescription>
            Fonctionnalité à venir : Assignez les modules aux entreprises pour
            contrôler leurs fonctionnalités disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {AVAILABLE_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className='bg-card rounded-lg border p-4 transition-shadow hover:shadow-md'
                >
                  <div className='flex items-start gap-3'>
                    <div className='mt-1'>
                      <Icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <div>
                      <h3 className='font-semibold'>{module.name}</h3>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {module.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités à Implémenter</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='text-muted-foreground space-y-2 text-sm'>
            <li className='flex items-center gap-2'>
              <div className='bg-primary h-2 w-2 rounded-full' />
              Sélection des entreprises et visualisation de leurs modules actifs
            </li>
            <li className='flex items-center gap-2'>
              <div className='bg-primary h-2 w-2 rounded-full' />
              Activation/désactivation des modules par entreprise
            </li>
            <li className='flex items-center gap-2'>
              <div className='bg-primary h-2 w-2 rounded-full' />
              Configuration des paramètres spécifiques par module
            </li>
            <li className='flex items-center gap-2'>
              <div className='bg-primary h-2 w-2 rounded-full' />
              Gestion des droits d&apos;accès par module et rôle
            </li>
            <li className='flex items-center gap-2'>
              <div className='bg-primary h-2 w-2 rounded-full' />
              Historique des modifications de configuration
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
