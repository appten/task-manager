'use client';

import React, { useEffect } from 'react';

export const PwaRegister: React.FC = () => {
  useEffect(() => {
    // 1. Daftarkan Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Cek pembaruan berkala jika ada versi baru
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Versi baru TEN Tasks tersedia. Memperbarui...');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('PWA Service Worker registration warning:', err);
          });
      });
    }

    // 2. Tangkap event prompt instalasi PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa_prompt_ready'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return null;
};
