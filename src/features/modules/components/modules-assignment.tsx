'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Power, Trash2, Building2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface Module {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  version: string;
  icon: string | null;
  isSystem: boolean;
  isActive: boolean;
  _count: {
    firmModules: number;
  };
}

interface Firm {
  id: string;
  name: string;
  slug: string;
}

export function ModulesAssignment() {
  const [modules, setModules] = useState<Module[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<string>('');
  const [firmModules, setFirmModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for adding new module
  const [newModule, setNewModule] = useState({
    slug: '',
    name: '',
    description: '',
    version: '1.0.0',
    icon: 'Package',
    basePath: '',
    isSystem: false
  });

  useEffect(() => {
    fetchModules();
    fetchFirms();
  }, []);

  useEffect(() => {
    if (selectedFirm) {
      fetchFirmModules(selectedFirm);
    }
  }, [selectedFirm]);

  const fetchModules = async () => {
    try {
      const res = await fetch('/api/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Erreur lors du chargement des modules');
    } finally {
      setLoading(false);
    }
  };

  const fetchFirms = async () => {
    try {
      const res = await fetch('/api/firms');
      if (res.ok) {
        const data = await res.json();
        setFirms(data);
      }
    } catch (error) {
      console.error('Error fetching firms:', error);
    }
  };

  const fetchFirmModules = async (firmId: string) => {
    try {
      const res = await fetch(`/api/firms/${firmId}/modules`);
      if (res.ok) {
        const data = await res.json();
        setFirmModules(data);
      }
    } catch (error) {
      console.error('Error fetching firm modules:', error);
    }
  };

  const handleAddModule = async () => {
    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule)
      });

      if (res.ok) {
        toast.success('Module ajouté avec succès');
        setIsAddDialogOpen(false);
        fetchModules();
        setNewModule({
          slug: '',
          name: '',
          description: '',
          version: '1.0.0',
          icon: 'Package',
          basePath: '',
          isSystem: false
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'ajout du module");
      }
    } catch (error) {
      toast.error("Erreur lors de l'ajout du module");
    }
  };

  const handleInstallModule = async (moduleId: string) => {
    if (!selectedFirm) {
      toast.error('Veuillez sélectionner une entreprise');
      return;
    }

    try {
      const res = await fetch(`/api/firms/${selectedFirm}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, isEnabled: true })
      });

      if (res.ok) {
        toast.success('Module installé avec succès');
        fetchFirmModules(selectedFirm);
        fetchModules();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'installation");
      }
    } catch (error) {
      toast.error("Erreur lors de l'installation du module");
    }
  };

  const handleToggleModule = async (
    moduleId: string,
    currentState: boolean
  ) => {
    if (!selectedFirm) return;

    try {
      const res = await fetch(
        `/api/firms/${selectedFirm}/modules/${moduleId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: !currentState })
        }
      );

      if (res.ok) {
        toast.success(`Module ${!currentState ? 'activé' : 'désactivé'}`);
        fetchFirmModules(selectedFirm);
      }
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleUninstallModule = async (moduleId: string) => {
    if (!selectedFirm) return;

    if (!confirm('Êtes-vous sûr de vouloir désinstaller ce module ?')) return;

    try {
      const res = await fetch(
        `/api/firms/${selectedFirm}/modules/${moduleId}`,
        {
          method: 'DELETE'
        }
      );

      if (res.ok) {
        toast.success('Module désinstallé');
        fetchFirmModules(selectedFirm);
        fetchModules();
      }
    } catch (error) {
      toast.error('Erreur lors de la désinstallation');
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className='space-y-6'>
      {/* Header with Add Module Button */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold'>Modules</h2>
          <p className='text-muted-foreground'>
            Gestion des modules du système
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Ajouter un module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau module</DialogTitle>
              <DialogDescription>
                Enregistrer un nouveau module dans le système
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <Label>Slug</Label>
                <Input
                  placeholder='hr, crm, etc.'
                  value={newModule.slug}
                  onChange={(e) =>
                    setNewModule({ ...newModule, slug: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Nom</Label>
                <Input
                  placeholder='Ressources Humaines'
                  value={newModule.name}
                  onChange={(e) =>
                    setNewModule({ ...newModule, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder='Gestion des employés...'
                  value={newModule.description}
                  onChange={(e) =>
                    setNewModule({ ...newModule, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Chemin de base</Label>
                <Input
                  placeholder='/hr'
                  value={newModule.basePath}
                  onChange={(e) =>
                    setNewModule({ ...newModule, basePath: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button onClick={handleAddModule}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modules Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {modules.map((module) => (
          <Card key={module.id} className='transition-shadow hover:shadow-lg'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <Package className='text-primary h-5 w-5' />
                  <CardTitle className='text-lg'>{module.name}</CardTitle>
                </div>
                <div className='flex gap-1'>
                  {module.isSystem && (
                    <Badge variant='secondary'>Système</Badge>
                  )}
                  {module.isActive && <Badge variant='default'>Actif</Badge>}
                </div>
              </div>
              <CardDescription className='mt-2'>
                {module.description || 'Aucune description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {module._count.firmModules} entreprise(s)
                </span>
                <span className='text-muted-foreground'>v{module.version}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Firm Module Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Installation par Entreprise</CardTitle>
          <CardDescription>
            Sélectionnez une entreprise pour gérer ses modules
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center gap-4'>
            <Building2 className='text-muted-foreground h-5 w-5' />
            <Select value={selectedFirm} onValueChange={setSelectedFirm}>
              <SelectTrigger className='w-[300px]'>
                <SelectValue placeholder='Sélectionner une entreprise' />
              </SelectTrigger>
              <SelectContent>
                {firms.map((firm) => (
                  <SelectItem key={firm.id} value={firm.id}>
                    {firm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFirm && (
            <div className='rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => {
                    const installed = firmModules.find(
                      (fm) => fm.moduleId === module.id
                    );
                    return (
                      <TableRow key={module.id}>
                        <TableCell className='font-medium'>
                          {module.name}
                        </TableCell>
                        <TableCell>{module.version}</TableCell>
                        <TableCell>
                          {installed ? (
                            <Badge
                              variant={
                                installed.isEnabled ? 'default' : 'secondary'
                              }
                            >
                              {installed.isEnabled ? 'Activé' : 'Désactivé'}
                            </Badge>
                          ) : (
                            <Badge variant='outline'>Non installé</Badge>
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          {installed ? (
                            <div className='flex justify-end gap-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  handleToggleModule(
                                    module.id,
                                    installed.isEnabled
                                  )
                                }
                              >
                                <Power className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleUninstallModule(module.id)}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size='sm'
                              onClick={() => handleInstallModule(module.id)}
                            >
                              Installer
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
