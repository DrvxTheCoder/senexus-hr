import { ModulesAssignment } from '@/features/modules/components/modules-assignment';

export default function AdminModulesPage() {
  return (
    <div className='space-y-6 p-8'>
      <div>
        <h1 className='text-3xl font-bold'>Gestion des Modules</h1>
        <p className='text-muted-foreground'>
          Assignez et configurez les modules disponibles pour chaque entreprise
        </p>
      </div>

      <ModulesAssignment />
    </div>
  );
}
