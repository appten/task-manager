'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { TaskProvider } from '../context/TaskContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SessionProvider>
      <TaskProvider>{children}</TaskProvider>
    </SessionProvider>
  );
};
