'use client';

import React, { useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InboxView } from './InboxView';
import { TodayView } from './TodayView';
import { CalendarView } from './CalendarView';
import { AIView } from './AIView';
import { AccountView } from './AccountView';
import { EditTaskModal } from './EditTaskModal';
import { WelcomeDemoModal } from './WelcomeDemoModal';
import { Toast } from './Toast';
import { TabType } from '../types/task';

interface MainScreenProps {
  initialTab?: TabType;
}

export const MainScreen: React.FC<MainScreenProps> = ({ initialTab }) => {
  const { activeTab, setActiveTab } = useTask();

  useEffect(() => {
    if (initialTab && activeTab !== initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="mobile-viewport-wrapper">
      {/* Toast Alert */}
      <Toast />

      {/* Top Mobile Bar & Header */}
      <Header />

      {/* Main Scrollable View Area */}
      <main className="app-screen">
        <div className="scrollable-content">
          {activeTab === 'inbox' && <InboxView />}
          {activeTab === 'ai' && <AIView />}
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'account' && <AccountView />}
        </div>
      </main>

      {/* Bottom Navigation for Main Menus */}
      <BottomNav />

      {/* Edit Task Modal / Sheet */}
      <EditTaskModal />

      {/* Welcome Demo Notification Modal */}
      <WelcomeDemoModal />
    </div>
  );
};
