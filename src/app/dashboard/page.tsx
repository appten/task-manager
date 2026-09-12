'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Shield, User, Mail, AtSign, Key, LogOut, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ fontSize: '15px', color: '#64748b' }}>Memverifikasi sesi SSO TEN...</p>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '24px 16px 48px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link
          href="/inbox"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#0284c7',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Aplikasi
        </Link>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/account' })}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            padding: '7px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} /> Keluar (Sign Out)
        </button>
      </div>

      {/* Main Profile Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || 'User Avatar'}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #3b82f6',
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {user?.name || 'Pengguna TEN'}
              </h1>
              <span
                style={{
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                {user?.role || 'user'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              {user?.username ? user.username : '@user'} &bull; Terhubung via SSO TEN
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '12px' }}>
          Informasi Session Token OIDC
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* User ID */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} /> ID Akun (sub)
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>
              {user?.id || '-'}
            </span>
          </div>

          {/* Nama */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Nama Lengkap
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              {user?.name || '-'}
            </span>
          </div>

          {/* Username */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AtSign size={14} /> Username
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#2563eb' }}>
              {user?.username || '-'}
            </span>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Email
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
              {user?.email || '-'}
            </span>
          </div>

          {/* Role */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} /> Peran (Role)
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#16a34a' }}>
              {user?.role || 'user'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '12px 14px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#059669" />
          <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 500 }}>
            Halaman /dashboard ini dilindungi oleh <strong>middleware.ts</strong> NextAuth. Hanya akun terautentikasi yang dapat mengakses.
          </span>
        </div>
      </div>
    </div>
  );
}
