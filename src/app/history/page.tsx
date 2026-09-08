'use client';

import React from 'react';
import { StatusBar } from '../../components/StatusBar';
import { Toast } from '../../components/Toast';
import { CompletedHistoryView } from '../../components/CompletedHistoryView';

export default function HistoryPage() {
  return (
    <div className="mobile-viewport-wrapper">
      <Toast />
      <StatusBar />
      <main className="app-screen">
        <div className="scrollable-content" style={{ paddingBottom: '30px' }}>
          <CompletedHistoryView />
        </div>
      </main>
    </div>
  );
}
