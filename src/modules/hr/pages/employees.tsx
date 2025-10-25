'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Download } from 'lucide-react';

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - in real implementation, this would come from the database
  const employees = [
    {
      id: '1',
      name: 'Marie Dubois',
      email: 'marie.dubois@example.com',
      department: 'IT & Développement',
      role: 'Développeur Senior',
      status: 'Actif',
      hireDate: '2023-01-15'
    },
    {
      id: '2',
      name: 'Jean Martin',
      email: 'jean.martin@example.com',
      department: 'Marketing',
      role: 'Chef de projet',
      status: 'Actif',
      hireDate: '2022-06-20'
    },
    {
      id: '3',
      name: 'Sophie Laurent',
      email: 'sophie.laurent@example.com',
      department: 'Ressources Humaines',
      role: 'RH Manager',
      status: 'Actif',
      hireDate: '2021-03-10'
    },
    {
      id: '4',
      name: 'Pierre Durand',
      email: 'pierre.durand@example.com',
      department: 'Ventes',
      role: 'Directeur Commercial',
      status: 'Actif',
      hireDate: '2020-11-05'
    },
    {
      id: '5',
      name: 'Claire Moreau',
      email: 'claire.moreau@example.com',
      department: 'Support Client',
      role: 'Support Specialist',
      status: 'En congé',
      hireDate: '2023-08-22'
    }
  ];

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Employés</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer tous les employés de l&apos;entreprise
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Ajouter un employé
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total employés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {employees.filter((e) => e.status === 'Actif').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>En congé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {employees.filter((e) => e.status === 'En congé').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Départements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {new Set(employees.map((e) => e.department)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Liste des employés</CardTitle>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                <Input
                  placeholder='Rechercher...'
                  className='w-[300px] pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant='outline' size='icon'>
                <Filter className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='icon'>
                <Download className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date d&apos;embauche</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className='font-medium'>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.status === 'Actif' ? 'default' : 'secondary'
                      }
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(employee.hireDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button variant='ghost' size='sm'>
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEmployees.length === 0 && (
            <div className='text-muted-foreground py-8 text-center'>
              Aucun employé trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
