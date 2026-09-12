'use client';

import React from 'react';
import {
  Layers,
  CloudDownload,
  UploadCloud,
  CheckCircle2,
  HardDrive,
  Cloud,
  ArrowRightLeft,
  X,
  Loader2,
} from 'lucide-react';
import { useTask } from '../context/TaskContext';

export const SyncConflictModal: React.FC = () => {
  const { syncConflict, isReconciling, resolveSyncConflict, dismissSyncConflict } = useTask();

  if (!syncConflict) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderBottom: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              }}
            >
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '16.5px',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  margin: 0,
                }}
              >
                Penyesuaian Catatan Tugas
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: '#3b82f6',
                  fontWeight: 500,
                  margin: '2px 0 0 0',
                }}
              >
                Akun terhubung: {syncConflict.cloudEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissSyncConflict}
            disabled={isReconciling}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Tutup dialog (Data tetap terpisah aman)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Isi Modal */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '13px',
              color: '#334155',
              lineHeight: 1.55,
            }}
          >
            Sistem mendeteksi ada catatan tugas di <strong>perangkat ini</strong> dan juga di{' '}
            <strong>akun cloud Anda</strong>. Demi menjaga keamanan agar tidak ada data yang tertimpa secara sepihak, silakan pilih bagaimana catatan ini ingin disinkronkan:
          </div>

          {/* Perbandingan Ringkas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <HardDrive size={22} className="text-slate-600" />
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>
                  Di Perangkat Ini
                </span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                  {syncConflict.localCount} Tugas
                </strong>
              </div>
            </div>

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Cloud size={22} className="text-blue-600" />
              <div>
                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, display: 'block' }}>
                  Di Akun Cloud
                </span>
                <strong style={{ fontSize: '15px', color: '#1e3a8a' }}>
                  {syncConflict.cloudCount} Tugas
                </strong>
              </div>
            </div>
          </div>

          {/* Tombol Pilihan Rekonsiliasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            {/* Opsi 1: Gabungkan Data (Rekomendasi Utama) */}
            <button
              type="button"
              onClick={() => resolveSyncConflict('merge')}
              disabled={isReconciling}
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: isReconciling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Layers size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13.5px' }}>Gabungkan Kedua Data</strong>
                  <span
                    style={{
                      fontSize: '10.5px',
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                    }}
                  >
                    Disarankan
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    margin: '3px 0 0 0',
                    opacity: 0.92,
                    lineHeight: 1.4,
                  }}
                >
                  Satukan seluruh tugas dari perangkat ini dan akun cloud tanpa ada data yang hilang.
                </p>
              </div>
            </button>

            {/* Opsi 2: Gunakan Data Cloud */}
            <button
              type="button"
              onClick={() => resolveSyncConflict('use_cloud')}
              disabled={isReconciling}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#1e293b',
                borderRadius: '14px',
                padding: '13px 16px',
                textAlign: 'left',
                cursor: isReconciling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <CloudDownload size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '13px', display: 'block' }}>Gunakan Data Akun Cloud</strong>
                <p
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    margin: '2px 0 0 0',
                    lineHeight: 1.35,
                  }}
                >
                  Muat catatan dari cloud ({syncConflict.cloudCount} tugas). Catatan lokal sebelumnya tetap tersimpan di cadangan darurat perangkat.
                </p>
              </div>
            </button>

            {/* Opsi 3: Gunakan Data Perangkat Ini */}
            <button
              type="button"
              onClick={() => resolveSyncConflict('use_local')}
              disabled={isReconciling}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#1e293b',
                borderRadius: '14px',
                padding: '13px 16px',
                textAlign: 'left',
                cursor: isReconciling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <UploadCloud size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '13px', display: 'block' }}>Gunakan Data Perangkat Ini</strong>
                <p
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    margin: '2px 0 0 0',
                    lineHeight: 1.35,
                  }}
                >
                  Simpan catatan dari perangkat ini ({syncConflict.localCount} tugas) ke cloud akun.
                </p>
              </div>
            </button>
          </div>

          {/* Jaminan Keamanan Snapshot Otomatis */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              color: '#059669',
              background: '#ecfdf5',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>Salinan cadangan otomatis telah dibuat sebelum proses ini agar data tidak pernah hilang.</span>
          </div>

          {isReconciling && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12.5px',
                color: '#2563eb',
                fontWeight: 600,
                marginTop: '4px',
              }}
            >
              <Loader2 size={16} className="spin-animation" />
              <span>Memproses penyesuaian catatan tugas...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
