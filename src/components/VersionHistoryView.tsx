'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Tag,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VERSION_HISTORY } from '../data/versionHistory';

interface VersionHistoryViewProps {
  onBack: () => void;
}

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({ onBack }) => {
  // Versi terbaru terbuka secara default saat pertama kali dikunjungi
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    VERSION_HISTORY.forEach((rel) => {
      initial[rel.version] = Boolean(rel.isLatest);
    });
    return initial;
  });

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  return (
    <div className="version-history-view-container">
      {/* Header bar with Back button */}
      <div className="version-history-header">
        <button
          type="button"
          className="version-back-btn"
          onClick={onBack}
          aria-label="Kembali ke menu akun"
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <div className="version-header-titles">
          <h2 className="version-main-title">Riwayat Versi</h2>
          <span className="version-main-subtitle">Catatan pembaruan resmi aplikasi TEN Tasks</span>
        </div>
      </div>

      {/* Intro info banner */}
      <div className="version-info-banner">
        <Sparkles size={16} className="text-primary flex-shrink-0" />
        <p className="version-banner-text">
          Klik kartu versi untuk memperluas atau mempersempit rincian pembaruan aplikasi.
        </p>
      </div>

      {/* Timeline List of Versions (Newest at the top) */}
      <div className="version-timeline-list">
        {VERSION_HISTORY.map((rel) => {
          const isExpanded = Boolean(expandedVersions[rel.version]);
          return (
            <div
              key={rel.version}
              className={`version-card ${rel.isLatest ? 'is-latest' : ''} ${
                isExpanded ? 'expanded' : 'collapsed'
              }`}
            >
              {/* Header of version card (Clickable Toggle) */}
              <button
                type="button"
                className="version-card-toggle-btn"
                onClick={() => toggleVersion(rel.version)}
                aria-expanded={isExpanded}
                title={isExpanded ? 'Persempit detail pembaruan' : 'Perluas detail pembaruan'}
              >
                <div className="version-card-header">
                  <div className="version-tag-wrapper">
                    <Tag size={15} className="text-primary" />
                    <span className="version-number">{rel.version}</span>
                    {rel.isLatest && (
                      <span className="version-badge-latest">Versi Terbaru</span>
                    )}
                  </div>

                  <div className="version-header-right">
                    <div className="version-date-wrapper">
                      <Calendar size={12} className="text-muted" />
                      <span className="version-release-date">{rel.releaseDate}</span>
                    </div>
                    <span className="version-chevron-indicator">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                </div>

                {/* Tagline / Summary */}
                <div className="version-tagline">{rel.tagline}</div>
              </button>

              {/* Change log grouped by category (Accordion Details) */}
              {isExpanded && (
                <div className="version-changes-grouped">
                  {rel.groupedChanges.map((group, gIdx) => (
                    <div key={gIdx} className="version-group-section">
                      <div className="version-group-header">
                        <span
                          className={`version-change-pill pill-${group.category
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`}
                        >
                          {group.category}
                        </span>
                      </div>
                      <ul className="version-group-bullets">
                        {group.items.map((itemText, iIdx) => (
                          <li key={iIdx} className="version-bullet-item">
                            {itemText}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="version-footer-note">
        <ShieldCheck size={14} className="text-muted" />
        <span>TEN Tasks Mobile • Dirancang untuk kemudahan dan kenyamanan Anda</span>
      </div>
    </div>
  );
};
