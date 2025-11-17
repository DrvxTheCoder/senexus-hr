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
import { ProfilePhotoUpload } from '@/components/profile-photo-upload';
import { EmployeeFormData, EmployeeFormErrors } from './types';

interface PersonalInfoFormProps {
  formData: EmployeeFormData;
  errors: EmployeeFormErrors;
  onChange: (field: keyof EmployeeFormData, value: any) => void;
}

export function PersonalInfoForm({
  formData,
  errors,
  onChange
}: PersonalInfoFormProps) {
  return (
    <div className='space-y-3'>
      {/* Profile Photo */}
      <div className='flex pb-3'>
        <ProfilePhotoUpload
          value={formData.photoUrl}
          onValueChange={(url) => onChange('photoUrl', url || '')}
        />
      </div>

      {/* Row 1: First Name, Last Name, Matricule */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-1'>
          <Label htmlFor='firstName'>
            Prénom <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='firstName'
            value={formData.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className='text-destructive text-xs'>{errors.firstName}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='lastName'>
            Nom <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='lastName'
            value={formData.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className='text-destructive text-xs'>{errors.lastName}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='matricule'>
            Matricule <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='matricule'
            value={formData.matricule}
            onChange={(e) => onChange('matricule', e.target.value)}
            className={errors.matricule ? 'border-destructive' : ''}
          />
          {errors.matricule && (
            <p className='text-destructive text-xs'>{errors.matricule}</p>
          )}
        </div>
      </div>

      {/* Row 2: Email, Phone, Gender */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-1'>
          <Label htmlFor='email'>
            Email <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) => onChange('email', e.target.value)}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className='text-destructive text-xs'>{errors.email}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='phone'>
            Téléphone <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='phone'
            value={formData.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className='text-destructive text-xs'>{errors.phone}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='gender'>Genre</Label>
          <Select
            value={formData.gender || ''}
            onValueChange={(value) => onChange('gender', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Sélectionner' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='MALE'>Homme</SelectItem>
              <SelectItem value='FEMALE'>Femme</SelectItem>
              <SelectItem value='OTHER'>Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Date of Birth, Place of Birth, Nationality */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-1'>
          <Label htmlFor='dateOfBirth'>
            Date de naissance <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='dateOfBirth'
            type='date'
            value={formData.dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className={errors.dateOfBirth ? 'border-destructive' : ''}
          />
          {errors.dateOfBirth && (
            <p className='text-destructive text-xs'>{errors.dateOfBirth}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='placeOfBirth'>
            Lieu de naissance <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='placeOfBirth'
            value={formData.placeOfBirth}
            onChange={(e) => onChange('placeOfBirth', e.target.value)}
            className={errors.placeOfBirth ? 'border-destructive' : ''}
          />
          {errors.placeOfBirth && (
            <p className='text-destructive text-xs'>{errors.placeOfBirth}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='nationality'>
            Nationalité <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='nationality'
            value={formData.nationality}
            onChange={(e) => onChange('nationality', e.target.value)}
            className={errors.nationality ? 'border-destructive' : ''}
          />
          {errors.nationality && (
            <p className='text-destructive text-xs'>{errors.nationality}</p>
          )}
        </div>
      </div>

      {/* Row 4: CNI, Marital Status, Address */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-1'>
          <Label htmlFor='cni'>
            CNI <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='cni'
            value={formData.cni}
            onChange={(e) => onChange('cni', e.target.value)}
            className={errors.cni ? 'border-destructive' : ''}
          />
          {errors.cni && (
            <p className='text-destructive text-xs'>{errors.cni}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='maritalStatus'>
            État civil <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='maritalStatus'
            value={formData.maritalStatus}
            onChange={(e) => onChange('maritalStatus', e.target.value)}
            className={errors.maritalStatus ? 'border-destructive' : ''}
          />
          {errors.maritalStatus && (
            <p className='text-destructive text-xs'>{errors.maritalStatus}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='address'>
            Adresse <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='address'
            value={formData.address}
            onChange={(e) => onChange('address', e.target.value)}
            className={errors.address ? 'border-destructive' : ''}
          />
          {errors.address && (
            <p className='text-destructive text-xs'>{errors.address}</p>
          )}
        </div>
      </div>

      {/* Row 5: Father Name, Mother Name */}
      <div className='grid grid-cols-3 gap-4'>
        <div className='space-y-1'>
          <Label htmlFor='fatherName'>
            Nom du père <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='fatherName'
            value={formData.fatherName}
            onChange={(e) => onChange('fatherName', e.target.value)}
            className={errors.fatherName ? 'border-destructive' : ''}
          />
          {errors.fatherName && (
            <p className='text-destructive text-xs'>{errors.fatherName}</p>
          )}
        </div>

        <div className='space-y-1'>
          <Label htmlFor='motherName'>
            Nom de la mère <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='motherName'
            value={formData.motherName}
            onChange={(e) => onChange('motherName', e.target.value)}
            className={errors.motherName ? 'border-destructive' : ''}
          />
          {errors.motherName && (
            <p className='text-destructive text-xs'>{errors.motherName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
