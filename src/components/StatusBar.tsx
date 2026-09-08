'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState({
    date: 'Rabu, 9 Sep 2026',
    time: '10:00',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const dateStr = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      setCurrentDateTime({
        date: dateStr,
        time: `${hours}:${minutes}`,
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="android-status-bar">
      <div className="status-bar-datetime">
        <span className="status-bar-date">{currentDateTime.date}</span>
        <span className="status-bar-dot">•</span>
        <span className="status-bar-time">{currentDateTime.time}</span>
      </div>
      <div className="android-system-icons">
        <Signal size={13} />
        <Wifi size={14} />
        <BatteryMedium size={16} />
      </div>
    </div>
  );
};
