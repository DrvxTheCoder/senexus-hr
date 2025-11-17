'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfilePhotoPreview } from '@/components/profile-photo-preview';
import { UserFormData, UserFormErrors } from './types';

interface PersonalDetailsFormProps {
  formData: UserFormData;
  errors: UserFormErrors;
  onChange: (field: keyof UserFormData, value: any) => void;
  onPhotoFileChange: (file: File | null) => void;
}

export function PersonalDetailsForm({
  formData,
  errors,
  onChange,
  onPhotoFileChange
}: PersonalDetailsFormProps) {
  return (
    <div className='space-y-4'>
      {/* Profile Photo */}
      <div className='flex pb-3'>
        <ProfilePhotoPreview
          value={formData.image || ''}
          onFileChange={onPhotoFileChange}
        />
      </div>

      {/* Name */}
      <div className='space-y-1'>
        <Label htmlFor='name'>
          Nom <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='name'
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder='Jean Dupont'
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className='text-destructive text-xs'>{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className='space-y-1'>
        <Label htmlFor='email'>
          Email <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='email'
          type='email'
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder='jean.dupont@example.com'
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className='text-destructive text-xs'>{errors.email}</p>
        )}
      </div>
    </div>
  );
}
