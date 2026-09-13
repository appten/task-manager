'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import {
  Zap,
  BatteryCharging,
  BatteryMedium,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Sparkles,
  Info,
} from 'lucide-react';

interface CircadianStateInfo {
  phase: string;
  timeRange: string;
  energyLevel: 'Tinggi' | 'Moderat' | 'Stabil' | 'Menurun' | 'Pemulihan';
  energyPercent: number;
  icon: any;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  summary: string;
  recommendation: string;
}

export const CircadianEnergyCard: React.FC = () => {
  const { aiAnalysis } = useTask();
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTimeStr(`${hh}:${mm} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getCircadianData = (hour: number): CircadianStateInfo => {
    if (hour >= 5 && hour < 11) {
      return {
        phase: 'Fase Pagi: Puncak Kognitif & Analitis',
        timeRange: '05:00 - 11:00',
        energyLevel: 'Tinggi',
        energyPercent: 92,
        icon: Sunrise,
        iconColor: '#f59e0b',
        badgeBg: '#fef3c7',
        badgeColor: '#b45309',
        summary: 'Kortisol alami berada di level optimal. Daya konsentrasi dan pemecahan masalah berada pada puncaknya.',
        recommendation: 'Selesaikan tugas berbobot tinggi (P1) atau keputusan strategis sebelum siang hari.',
      };
    } else if (hour >= 11 && hour < 14) {
      return {
        phase: 'Fase Siang: Ritme Transisi & Pemulihan Ringan',
        timeRange: '11:00 - 14:00',
        energyLevel: 'Moderat',
        energyPercent: 65,
        icon: Sun,
        iconColor: '#f97316',
        badgeBg: '#ffedd5',
        badgeColor: '#c2410c',
        summary: 'Ritme sirkadian mengalami penurunan alami (post-lunch dip) akibat metabolisme pencernaan.',
        recommendation: 'Hindari multitasking berat. Cocok untuk tugas rutin, meeting ringan, atau istirahat singkat.',
      };
    } else if (hour >= 14 && hour < 18) {
      return {
        phase: 'Fase Sore: Puncak Motorik & Ketahanan Kerja',
        timeRange: '14:00 - 18:00',
        energyLevel: 'Stabil',
        energyPercent: 80,
        icon: Zap,
        iconColor: '#0ea5e9',
        badgeBg: '#e0f2fe',
        badgeColor: '#0369a1',
        summary: 'Suhu tubuh dan koordinasi mencapai level tertinggi kedua. Efisien untuk eksekusi teknis.',
        recommendation: 'Tuntaskan tugas Today yang tertunda atau lakukan eksekusi terfokus tanpa distraksi.',
      };
    } else if (hour >= 18 && hour < 22) {
      return {
        phase: 'Fase Petang: Refleksi, Evaluasi & Penurunan Ritme',
        timeRange: '18:00 - 22:00',
        energyLevel: 'Menurun',
        energyPercent: 45,
        icon: Sunset,
        iconColor: '#8b5cf6',
        badgeBg: '#f3e8ff',
        badgeColor: '#6b21a8',
        summary: 'Melatonin mulai diproduksi tubuh. Energi kognitif menurun secara bertahap.',
        recommendation: 'Evaluasi hasil hari ini, rencanakan tugas esok, dan kurangi paparan beban mental berat.',
      };
    } else {
      return {
        phase: 'Fase Malam: Regenerasi Sel & Istirahat Biologis',
        timeRange: '22:00 - 05:00',
        energyLevel: 'Pemulihan',
        energyPercent: 20,
        icon: Moon,
        iconColor: '#64748b',
        badgeBg: '#f1f5f9',
        badgeColor: '#334155',
        summary: 'Waktu biologis tubuh untuk detoksifikasi saraf dan konsolidasi memori otak.',
        recommendation: 'Prioritaskan tidur berkualitas untuk memulihkan kapasitas kognitif esok hari.',
      };
    }
  };

  const info = getCircadianData(currentHour);
  const IconComponent = info.icon;

  return (
    <div className="circadian-energy-card animate-fade-in">
      <div className="circadian-card-header">
        <div className="circadian-left">
          <div className="circadian-icon-wrap" style={{ color: info.iconColor }}>
            <IconComponent size={18} />
          </div>
          <div className="circadian-title-box">
            <div className="circadian-pill-row">
              <span className="circadian-time-badge">{currentTimeStr || info.timeRange}</span>
              <span
                className="circadian-energy-badge"
                style={{ backgroundColor: info.badgeBg, color: info.badgeColor }}
              >
                ⚡ Energi: {info.energyLevel} ({info.energyPercent}%)
              </span>
            </div>
            <h4 className="circadian-phase-title">{info.phase}</h4>
          </div>
        </div>
      </div>

      <div className="circadian-card-body">
        {/* Progress Bar Energi Tubuh */}
        <div className="circadian-energy-bar-wrap">
          <div className="circadian-energy-bar-track">
            <div
              className="circadian-energy-bar-fill"
              style={{
                width: `${info.energyPercent}%`,
                background:
                  info.energyPercent >= 80
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : info.energyPercent >= 60
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
              }}
            />
          </div>
        </div>

        <p className="circadian-summary-text">
          {aiAnalysis?.circadianAdvice ? (
            <span>
              <Sparkles size={12} className="inline-sparkle" /> {aiAnalysis.circadianAdvice}
            </span>
          ) : (
            info.recommendation
          )}
        </p>
      </div>
    </div>
  );
};
