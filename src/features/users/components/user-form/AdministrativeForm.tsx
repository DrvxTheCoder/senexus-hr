'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserFormData, UserFormErrors } from './types';

interface AdministrativeFormProps {
  formData: UserFormData;
  errors: UserFormErrors;
  onChange: (field: keyof UserFormData, value: any) => void;
  isEditing: boolean;
}

type Firm = { id: string; name: string };
type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
};

export function AdministrativeForm({
  formData,
  errors,
  onChange,
  isEditing
}: AdministrativeFormProps) {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Load firms and employees
  useEffect(() => {
    async function loadData() {
      setLoadingFirms(true);
      setLoadingEmployees(true);

      try {
        const [firmsRes, employeesRes] = await Promise.all([
          fetch('/api/firms'),
          fetch('/api/employees')
        ]);

        if (firmsRes.ok) {
          const firmsData = await firmsRes.json();
          setFirms(
            Array.isArray(firmsData) ? firmsData : firmsData.firms || []
          );
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          setEmployees(employeesData.employees || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingFirms(false);
        setLoadingEmployees(false);
      }
    }

    loadData();
  }, []);

  const isOwnerOrAdmin = formData.role === 'OWNER' || formData.role === 'ADMIN';

  // Auto-select all firms for OWNER/ADMIN
  useEffect(() => {
    if (isOwnerOrAdmin && firms.length > 0) {
      onChange(
        'firmIds',
        firms.map((f) => f.id)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerOrAdmin, firms]);

  return (
    <div className='space-y-4'>
      {/* Role */}
      <div className='space-y-1'>
        <Label htmlFor='role'>
          Rôle <span className='text-destructive'>*</span>
        </Label>
        <Select
          value={formData.role}
          onValueChange={(value) => onChange('role', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder='Sélectionner un rôle' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='OWNER'>Propriétaire</SelectItem>
            <SelectItem value='ADMIN'>Administrateur</SelectItem>
            <SelectItem value='MANAGER'>Manager</SelectItem>
            <SelectItem value='STAFF'>Personnel</SelectItem>
            <SelectItem value='VIEWER'>Observateur</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className='text-destructive text-xs'>{errors.role}</p>
        )}
      </div>

      {/* Assigned Firms */}
      <div className='space-y-1'>
        <Label>
          Entreprises <span className='text-destructive'>*</span>
        </Label>
        {isOwnerOrAdmin && (
          <p className='text-muted-foreground mb-2 text-xs'>
            Les propriétaires et administrateurs sont automatiquement assignés à
            toutes les entreprises
          </p>
        )}
        {!isOwnerOrAdmin && (
          <div className='max-h-40 space-y-2 overflow-y-auto rounded-md border p-3'>
            {loadingFirms ? (
              <p className='text-muted-foreground text-sm'>Chargement...</p>
            ) : firms.length === 0 ? (
              <p className='text-muted-foreground text-sm'>
                Aucune entreprise disponible
              </p>
            ) : (
              firms.map((firm) => (
                <div
                  key={firm.id}
                  className='flex items-start space-y-0 space-x-3'
                >
                  <Checkbox
                    checked={formData.firmIds?.includes(firm.id)}
                    onCheckedChange={(checked) => {
                      const newFirmIds = checked
                        ? [...formData.firmIds, firm.id]
                        : formData.firmIds.filter((id) => id !== firm.id);
                      onChange('firmIds', newFirmIds);
                    }}
                  />
                  <Label className='cursor-pointer font-normal'>
                    {firm.name}
                  </Label>
                </div>
              ))
            )}
          </div>
        )}
        {isOwnerOrAdmin && firms.length > 0 && (
          <div className='text-muted-foreground text-sm'>
            {firms.map((f) => f.name).join(', ')}
          </div>
        )}
        {errors.firmIds && (
          <p className='text-destructive text-xs'>{errors.firmIds}</p>
        )}
      </div>

      {/* Employee Profile (Optional) */}
      <div className='space-y-1'>
        <Label htmlFor='employeeId'>Employé (optionnel)</Label>
        <Select
          value={formData.employeeId || ''}
          onValueChange={(value) => onChange('employeeId', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder='Sélectionner un employé' />
          </SelectTrigger>
          <SelectContent>
            {loadingEmployees ? (
              <SelectItem value='loading' disabled>
                Chargement...
              </SelectItem>
            ) : employees.length === 0 ? (
              <SelectItem value='none' disabled>
                Aucun employé disponible
              </SelectItem>
            ) : (
              employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName} ({employee.matricule}
                  )
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className='text-muted-foreground text-xs'>
          Lier ce compte utilisateur à un employé existant
        </p>
        {errors.employeeId && (
          <p className='text-destructive text-xs'>{errors.employeeId}</p>
        )}
      </div>

      {/* Password fields (only for new users) */}
      {!isEditing && (
        <>
          <div className='space-y-1'>
            <Label htmlFor='password'>
              Mot de passe <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='password'
              type='password'
              value={formData.password || ''}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder='Entrer le mot de passe'
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className='text-destructive text-xs'>{errors.password}</p>
            )}
          </div>

          <div className='space-y-1'>
            <Label htmlFor='confirmPassword'>
              Confirmer le mot de passe{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='confirmPassword'
              type='password'
              value={formData.confirmPassword || ''}
              onChange={(e) => onChange('confirmPassword', e.target.value)}
              placeholder='Répéter le mot de passe'
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className='text-destructive text-xs'>
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
