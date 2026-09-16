import { ProjectItem } from '../types/project';
import { getFormattedDate } from './seedTasks';

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_quarter_sample_1',
    title: 'Merilis Portofolio Web & Produk Digital V1',
    objective: 'Membangun kehadiran profesional online dan meluncurkan produk digital pertama dalam 1 kuartal',
    description: 'Fokus personal untuk menyelesaikan produk MVP mandiri dan portofolio interaktif dalam kurun waktu 3 bulan.',
    category: 'Karier',
    quarterLabel: 'Kuartal 1 (3 Bulan)',
    startDate: getFormattedDate(-15),
    endDate: getFormattedDate(75),
    milestones: [
      {
        id: 'ms_1_1',
        title: 'Riset ide & validasi rancangan fitur utama produk',
        dueDate: getFormattedDate(-5),
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: 'ms_1_2',
        title: 'Selesaikan purwarupa UI/UX dan arsitektur kode frontend',
        dueDate: getFormattedDate(15),
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: 'ms_1_3',
        title: 'Integrasi backend, pengujian fungsionalitas, & optimalisasi performa',
        dueDate: getFormattedDate(40),
        isCompleted: false,
      },
      {
        id: 'ms_1_4',
        title: 'Peluncuran resmi (launching) & dokumentasi publik portofolio',
        dueDate: getFormattedDate(75),
        isCompleted: false,
      },
    ],
    isCompleted: false,
    color: '#3b82f6',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'proj_quarter_sample_2',
    title: 'Transformasi Kebugaran 90 Hari (Sprint 5K & Berat Ideal)',
    objective: 'Meningkatkan daya tahan tubuh, konsistensi lari 5 km non-stop, dan mencapai berat badan ideal',
    description: 'Program target kebugaran pribadi bertahap 3 bulan dengan evaluasi tiap akhir bulan.',
    category: 'Kesehatan',
    quarterLabel: 'Target 90 Hari',
    startDate: getFormattedDate(-10),
    endDate: getFormattedDate(80),
    milestones: [
      {
        id: 'ms_2_1',
        title: 'Konsistensi jalan cepat & jogging 2 km 3x seminggu (Bulan 1)',
        dueDate: getFormattedDate(20),
        isCompleted: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: 'ms_2_2',
        title: 'Tingkatkan jarak lari ke 3.5 km dan disiplin pola nutrisi (Bulan 2)',
        dueDate: getFormattedDate(50),
        isCompleted: false,
      },
      {
        id: 'ms_2_3',
        title: 'Uji coba lari 5 km tuntas tanpa jeda dan cek kesehatan berkala (Bulan 3)',
        dueDate: getFormattedDate(80),
        isCompleted: false,
      },
    ],
    isCompleted: false,
    color: '#10b981',
    createdAt: new Date().toISOString(),
  },
];
