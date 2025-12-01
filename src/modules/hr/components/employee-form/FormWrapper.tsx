'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FormWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
}

const formVariants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export function FormWrapper({
  title,
  description,
  children
}: FormWrapperProps) {
  return (
    <motion.div
      className='flex flex-col gap-6 pt-0 pb-12'
      variants={formVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
    >
      <div className='flex flex-col gap-1'>
        <h2 className='text-2xl font-semibold'>{title}</h2>
        <p className='text-muted-foreground text-sm'>{description}</p>
      </div>
      {children}
    </motion.div>
  );
}
