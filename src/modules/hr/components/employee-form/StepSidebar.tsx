'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  name: string;
  // description: string;
}

interface StepSidebarProps {
  currentStep: number;
  steps: Step[];
}

export function StepSidebar({ currentStep, steps }: StepSidebarProps) {
  return (
    <div className='bg-muted/30 w-64 rounded-l-lg border-r p-6'>
      <div className='space-y-6'>
        {steps.map((step) => (
          <div key={step.id} className='flex items-start gap-3'>
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-all',
                currentStep > step.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : currentStep === step.id
                    ? 'border-primary bg-background text-primary'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground'
              )}
            >
              {currentStep > step.id ? (
                <Check className='h-4 w-4' />
              ) : (
                <span>{step.id}</span>
              )}
            </div>
            <div className='flex flex-col'>
              <span className='text-muted-foreground text-xs tracking-wide uppercase'>
                Étape {step.id}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  currentStep >= step.id
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {step.name}
              </span>
              {/* <span className='text-xs text-muted-foreground mt-0.5'>
                {step.description}
              </span> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
