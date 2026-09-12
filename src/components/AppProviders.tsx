'use client';

import React from 'react';
import { TaskProvider } from '../context/TaskContext';
import { SyncConflictModal } from './SyncConflictModal';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TaskProvider>
      {children}
      <SyncConflictModal />
    </TaskProvider>
  );
};
