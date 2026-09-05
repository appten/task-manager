'use client';

import React from 'react';
import { TaskProvider, useTask } from '../context/TaskContext';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { TaskList } from '../components/TaskList';
import { TaskForm } from '../components/TaskForm';
import { CalendarView } from '../components/CalendarView';
import { EditTaskModal } from '../components/EditTaskModal';
import { GoalSettingsModal } from '../components/GoalSettingsModal';
import { Toast } from '../components/Toast';

const MainScreen: React.FC = () => {
  const { activeTab } = useTask();

  return (
    <div className="mobile-viewport-wrapper">
      {/* Toast Alert */}
      <Toast />

      {/* Top Mobile Bar & Header */}
      <Header />

      {/* Main Scrollable View Area */}
      <main className="app-screen">
        <div className="scrollable-content">
          {activeTab === 'tasks' && <TaskList />}
          {activeTab === 'new' && <TaskForm />}
          {activeTab === 'calendar' && <CalendarView />}
        </div>
      </main>

      {/* Bottom Navigation for 3 Main Menus */}
      <BottomNav />

      {/* Edit Task Modal / Sheet */}
      <EditTaskModal />

      {/* Yearly Goals & AI Personalization Settings Modal */}
      <GoalSettingsModal />
    </div>
  );
};

export default function Home() {
  return (
    <TaskProvider>
      <MainScreen />
    </TaskProvider>
  );
}
