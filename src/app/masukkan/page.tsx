'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MessageSquare,
  Bug,
  Lightbulb,
  HeartHandshake,
  Trash2,
  Search,
  Calendar,
  User,
  Mail,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { feedbackService, FeedbackItem } from '@/services/feedbackService';

export default function MasukkanPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeedbacks = () => {
    setFeedbacks(feedbackService.getFeedbacks());
  };

  useEffect(() => {
    loadFeedbacks();

    const handleStorageChange = () => {
      loadFeedbacks();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDeleteOne = (id: string) => {
    if (window.confirm('Hapus item masukan ini?')) {
      feedbackService.deleteFeedback(id);
      loadFeedbacks();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Hapus seluruh masukan yang tersimpan?')) {
      feedbackService.clearAllFeedbacks();
      loadFeedbacks();
    }
  };

  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCat;
    const matchQuery =
      item.message.toLowerCase().includes(q) ||
      (item.senderName && item.senderName.toLowerCase().includes(q)) ||
      (item.senderEmail && item.senderEmail.toLowerCase().includes(q));
    return matchCat && matchQuery;
  });

  const countBug = feedbacks.filter((f) => f.category === 'Laporan Bug').length;
  const countSaran = feedbacks.filter((f) => f.category === 'Saran Fitur').length;
  const countKritik = feedbacks.filter((f) => f.category === 'Kritik & Masukan').length;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getCategoryBadgeClass = (category: FeedbackItem['category']) => {
    switch (category) {
      case 'Laporan Bug':
        return 'cat-bug';
      case 'Saran Fitur':
        return 'cat-feature';
      case 'Kritik & Masukan':
        return 'cat-critique';
      default:
        return 'cat-general';
    }
  };

  const getCategoryIcon = (category: FeedbackItem['category']) => {
    switch (category) {
      case 'Laporan Bug':
        return <Bug size={12} />;
      case 'Saran Fitur':
        return <Lightbulb size={12} />;
      case 'Kritik & Masukan':
        return <MessageSquare size={12} />;
      default:
        return <HeartHandshake size={12} />;
    }
  };

  return (
    <div className="mobile-viewport-wrapper dev-feedback-wrapper">
      <div className="dev-feedback-container">
        {/* Header Nav */}
        <header className="page-subnav-header dev-header">
          <Link href="/account" className="btn-subnav-back" title="Kembali ke Akun">
            <ArrowLeft size={18} />
            <span>Akun</span>
          </Link>
          <div className="subnav-title-group">
            <h2 className="subnav-page-title">Masukan Pengguna</h2>
            <span className="subnav-badge-caption">Akses Dev (/masukkan)</span>
          </div>
          <button
            type="button"
            className="btn-refresh-feedbacks"
            onClick={loadFeedbacks}
            title="Muat ulang masukan"
          >
            <RefreshCw size={15} />
          </button>
        </header>

        {/* Content Area */}
        <div className="dev-feedback-content">
          {/* Intro Card */}
          <div className="dev-hero-card">
            <div className="dev-hero-top">
              <ShieldCheck size={18} className="text-primary" />
              <span className="dev-secret-pill">Halaman Pengembang</span>
            </div>
            <h3 className="dev-hero-title">Dashboard Masukan & Laporan Masuk</h3>
            <p className="dev-hero-desc">
              Data masukan yang dikirimkan pengguna dari menu Akun tersimpan otomatis ke Cloudflare KV & penyimpanan lokal.
            </p>

            {/* Quick Metrics */}
            <div className="dev-metrics-row">
              <div className="dev-metric-box">
                <span className="metric-val">{feedbacks.length}</span>
                <span className="metric-lbl">Total Masukan</span>
              </div>
              <div className="dev-metric-box">
                <span className="metric-val text-red">{countBug}</span>
                <span className="metric-lbl">Laporan Bug</span>
              </div>
              <div className="dev-metric-box">
                <span className="metric-val text-blue">{countSaran}</span>
                <span className="metric-lbl">Saran Fitur</span>
              </div>
              <div className="dev-metric-box">
                <span className="metric-val text-amber">{countKritik}</span>
                <span className="metric-lbl">Kritik</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="dev-controls-card">
            <div className="dev-search-input-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Cari dalam pesan atau nama pengirim..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dev-search-input"
              />
            </div>

            <div className="dev-category-chips">
              <button
                type="button"
                className={`dev-filter-chip ${filterCategory === 'all' ? 'active' : ''}`}
                onClick={() => setFilterCategory('all')}
              >
                Semua ({feedbacks.length})
              </button>
              <button
                type="button"
                className={`dev-filter-chip ${filterCategory === 'Saran Fitur' ? 'active' : ''}`}
                onClick={() => setFilterCategory('Saran Fitur')}
              >
                Saran ({countSaran})
              </button>
              <button
                type="button"
                className={`dev-filter-chip ${filterCategory === 'Laporan Bug' ? 'active' : ''}`}
                onClick={() => setFilterCategory('Laporan Bug')}
              >
                Bug ({countBug})
              </button>
              <button
                type="button"
                className={`dev-filter-chip ${filterCategory === 'Kritik & Masukan' ? 'active' : ''}`}
                onClick={() => setFilterCategory('Kritik & Masukan')}
              >
                Kritik ({countKritik})
              </button>
            </div>
          </div>

          {/* List of Feedback Cards */}
          <div className="dev-feedbacks-list">
            <div className="dev-list-header-row">
              <span className="dev-list-count">
                Menampilkan <strong>{filteredFeedbacks.length}</strong> masukan
              </span>
              {feedbacks.length > 0 && (
                <button
                  type="button"
                  className="btn-clear-all-feedbacks"
                  onClick={handleClearAll}
                >
                  <Trash2 size={12} />
                  <span>Hapus Semua</span>
                </button>
              )}
            </div>

            {filteredFeedbacks.length === 0 ? (
              <div className="dev-empty-box">
                <div className="empty-icon-circle">
                  <MessageSquare size={24} />
                </div>
                <h4 className="empty-title">Belum Ada Masukan</h4>
                <p className="empty-desc">
                  {searchQuery || filterCategory !== 'all'
                    ? 'Tidak ada masukan yang sesuai dengan pencarian atau filter yang dipilih.'
                    : 'Masukan yang dikirim oleh pengguna melalui menu Akun akan otomatis muncul di halaman ini.'}
                </p>
              </div>
            ) : (
              filteredFeedbacks.map((item) => (
                <div key={item.id} className="dev-feedback-card">
                  <div className="card-top-bar">
                    <span className={`dev-category-badge ${getCategoryBadgeClass(item.category)}`}>
                      {getCategoryIcon(item.category)}
                      <span>{item.category}</span>
                    </span>

                    <div className="card-time-actions">
                      <span className="card-timestamp">
                        <Calendar size={11} />
                        {formatDate(item.createdAt)}
                      </span>
                      <button
                        type="button"
                        className="btn-delete-single-feedback"
                        onClick={() => handleDeleteOne(item.id)}
                        title="Hapus masukan ini"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Sender info */}
                  {(item.senderName || item.senderEmail) && (
                    <div className="card-sender-info">
                      {item.senderName && (
                        <span className="sender-tag">
                          <User size={11} /> {item.senderName}
                        </span>
                      )}
                      {item.senderEmail && (
                        <span className="sender-tag">
                          <Mail size={11} /> {item.senderEmail}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message body */}
                  <div className="card-message-body">
                    <p className="message-text">{item.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
