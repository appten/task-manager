'use client';

import React from 'react';
import { StatusBar } from '../../components/StatusBar';
import { Toast } from '../../components/Toast';
import { GoalView } from '../../components/GoalView';

export default function GoalPage() {
  return (
    <div className="mobile-viewport-wrapper">
      <Toast />
      <StatusBar />
      <main className="app-screen">
        <div className="scrollable-content" style={{ paddingBottom: '30px' }}>
          <GoalView />
        </div>
      </main>
    </div>
  );
}
