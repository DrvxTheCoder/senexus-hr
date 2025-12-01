'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { EmployeeFormData, EmployeeFormErrors } from './types';
import { useEffect, useState } from 'react';

interface ProfessionalInfoFormProps {
  formData: EmployeeFormData;
  errors: EmployeeFormErrors;
  onChange: (field: keyof EmployeeFormData, value: any) => void;
  firmId: string;
}

interface Client {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export function ProfessionalInfoForm({
  formData,
  errors,
  onChange,
  firmId
}: ProfessionalInfoFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (!firmId) return;

    // Fetch clients
    fetch(`/api/clients?firmId=${firmId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch clients');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setClients(data);
        } else if (data.data && Array.isArray(data.data)) {
          setClients(data.data);
        } else {
          setClients([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching clients:', error);
        setClients([]);
      });

    // Fetch departments
    fetch(`/api/departments?firmId=${firmId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch departments');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        } else if (data.data && Array.isArray(data.data)) {
          setDepartments(data.data);
        } else {
          setDepartments([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      });
  }, [firmId]);

  return (
    <div className='space-y-6'>
      {/* Row 1: Job Title, Category, Net Salary */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='jobTitle'>
            Poste <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='jobTitle'
            value={formData.jobTitle}
            onChange={(e) => onChange('jobTitle', e.target.value)}
            className={errors.jobTitle ? 'border-destructive' : ''}
          />
          {errors.jobTitle && (
            <p className='text-destructive text-xs'>{errors.jobTitle}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='category'>
            Catégorie <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='category'
            value={formData.category}
            onChange={(e) => onChange('category', e.target.value)}
            className={errors.category ? 'border-destructive' : ''}
          />
          {errors.category && (
            <p className='text-destructive text-xs'>{errors.category}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='netSalary'>
            Salaire net <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='netSalary'
            type='number'
            step='0.01'
            value={formData.netSalary}
            onChange={(e) => onChange('netSalary', e.target.value)}
            className={errors.netSalary ? 'border-destructive' : ''}
          />
          {errors.netSalary && (
            <p className='text-destructive text-xs'>{errors.netSalary}</p>
          )}
        </div>
      </div>

      {/* Row 2: Hire Date, Contract End Date, Status */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='hireDate'>
            Date d'embauche <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='hireDate'
            type='date'
            value={formData.hireDate}
            onChange={(e) => onChange('hireDate', e.target.value)}
            className={errors.hireDate ? 'border-destructive' : ''}
          />
          {errors.hireDate && (
            <p className='text-destructive text-xs'>{errors.hireDate}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='contractEndDate'>Date de fin de contrat</Label>
          <Input
            id='contractEndDate'
            type='date'
            value={formData.contractEndDate}
            onChange={(e) => onChange('contractEndDate', e.target.value)}
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='status'>
            Statut <span className='text-destructive'>*</span>
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => onChange('status', value)}
          >
            <SelectTrigger
              className={errors.status ? 'border-destructive' : ''}
            >
              <SelectValue placeholder='Sélectionner' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ACTIVE'>Actif</SelectItem>
              <SelectItem value='INACTIVE'>Inactif</SelectItem>
              <SelectItem value='ON_LEAVE'>En congé</SelectItem>
              <SelectItem value='SUSPENDED'>Suspendu</SelectItem>
              <SelectItem value='TERMINATED'>Résilié</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className='text-destructive text-xs'>{errors.status}</p>
          )}
        </div>
      </div>

      {/* Row 3: Department, Assigned Client */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='departmentId'>Département</Label>
          <Select
            value={formData.departmentId || 'NONE'}
            onValueChange={(value) =>
              onChange('departmentId', value === 'NONE' ? '' : value)
            }
          >
            <SelectTrigger
              className={errors.departmentId ? 'border-destructive' : ''}
            >
              <SelectValue placeholder='Aucun' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='NONE'>Aucun</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departmentId && (
            <p className='text-destructive text-xs'>{errors.departmentId}</p>
          )}
        </div>

        <div className='space-y-2'>
          <Label htmlFor='assignedClientId'>Client assigné</Label>
          <Select
            value={formData.assignedClientId || undefined}
            onValueChange={(value) => onChange('assignedClientId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Aucun' />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Emergency Contact Section */}
      <div className='space-y-4 border-t pt-4'>
        <h3 className='text-lg font-semibold'>Contact d'urgence</h3>

        <div className='grid grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Label htmlFor='emergencyContactName'>
              Nom <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='emergencyContactName'
              value={formData.emergencyContact.name}
              onChange={(e) =>
                onChange('emergencyContact', {
                  ...formData.emergencyContact,
                  name: e.target.value
                })
              }
              className={
                errors['emergencyContact.name'] ? 'border-destructive' : ''
              }
            />
            {errors['emergencyContact.name'] && (
              <p className='text-destructive text-xs'>
                {errors['emergencyContact.name']}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='emergencyContactPhone'>
              Téléphone <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='emergencyContactPhone'
              value={formData.emergencyContact.phone}
              onChange={(e) =>
                onChange('emergencyContact', {
                  ...formData.emergencyContact,
                  phone: e.target.value
                })
              }
              className={
                errors['emergencyContact.phone'] ? 'border-destructive' : ''
              }
            />
            {errors['emergencyContact.phone'] && (
              <p className='text-destructive text-xs'>
                {errors['emergencyContact.phone']}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='emergencyContactRelationship'>
              Relation <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='emergencyContactRelationship'
              value={formData.emergencyContact.relationship}
              onChange={(e) =>
                onChange('emergencyContact', {
                  ...formData.emergencyContact,
                  relationship: e.target.value
                })
              }
              className={
                errors['emergencyContact.relationship']
                  ? 'border-destructive'
                  : ''
              }
            />
            {errors['emergencyContact.relationship'] && (
              <p className='text-destructive text-xs'>
                {errors['emergencyContact.relationship']}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
