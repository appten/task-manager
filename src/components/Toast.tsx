'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { CheckCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useTask();

  if (!toastMessage) return null;

  return (
    <div className="toast-container">
      <div className="toast-box">
        <CheckCircle size={15} color="#38bdf8" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};
