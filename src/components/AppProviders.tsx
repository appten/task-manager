'use client';

import React from 'react';
import { TaskProvider } from '../context/TaskContext';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <TaskProvider>{children}</TaskProvider>;
};
