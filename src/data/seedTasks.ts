import { Task } from '../types/task';

// Format date helper: YYYY-MM-DD
export const getFormattedDate = (daysOffset: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Review laporan keuangan bulanan',
    description: 'Periksa spreadsheet anggaran kuartal ketiga dan sinkronkan dengan rekening.',
    dueDate: getFormattedDate(0), // Hari ini
    dueTime: '14:00',
    priority: 'high',
    category: 'Pekerjaan',
    isCompleted: false,
    subTasks: [
      { id: 'sub-1-1', title: 'Unduh mutasi bank periode Agustus', isCompleted: true },
      { id: 'sub-1-2', title: 'Cocokkan bukti nota pengeluaran operasional', isCompleted: false },
      { id: 'sub-1-3', title: 'Kirim rekapan ke manajer keuangan', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Persiapan rilis web task mobile version-01',
    description: 'Cek fitur checklist, dropdown sub-task, dan tampilan kalender.',
    dueDate: getFormattedDate(0), // Hari ini
    dueTime: '17:30',
    priority: 'high',
    category: 'Pekerjaan',
    isCompleted: false,
    subTasks: [
      { id: 'sub-2-1', title: 'Uji responsivitas navigasi tab mobile', isCompleted: true },
      { id: 'sub-2-2', title: 'Verifikasi fungsi tambah task & sub-task dinamis', isCompleted: true },
      { id: 'sub-2-3', title: 'Uji Cloudflare Wrangler local preview', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Belanja mingguan & kebutuhan rumah',
    description: 'Beli sayuran segar, buah-buahan, dan kebutuhan pantry.',
    dueDate: getFormattedDate(1), // Besok
    dueTime: '09:00',
    priority: 'medium',
    category: 'Pribadi',
    isCompleted: false,
    subTasks: [
      { id: 'sub-3-1', title: 'Buah apel & jeruk', isCompleted: false },
      { id: 'sub-3-2', title: 'Susu UHT & telur ayam', isCompleted: false },
      { id: 'sub-3-3', title: 'Bahan masakan sayur sup', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Olahraga lari sore 5km',
    description: 'Jogging santai di taman kota untuk menjaga kebugaran.',
    dueDate: getFormattedDate(2),
    dueTime: '16:30',
    priority: 'low',
    category: 'Kesehatan',
    isCompleted: false,
    subTasks: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Selesaikan modul Next.js & Serverless Cloudflare',
    description: 'Pelajari arsitektur edge functions dan static generation.',
    dueDate: getFormattedDate(-1), // Kemarin
    dueTime: '20:00',
    priority: 'medium',
    category: 'Belajar',
    isCompleted: true,
    subTasks: [
      { id: 'sub-5-1', title: 'Baca dokumentasi Cloudflare Pages', isCompleted: true },
      { id: 'sub-5-2', title: 'Eksperimen routing lokal', isCompleted: true },
    ],
    createdAt: new Date().toISOString(),
  },
];
