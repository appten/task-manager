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

// Helper ISO date beberapa hari lalu
export const getPastIsoDate = (daysAgo: number, hourOffset: number = 9): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hourOffset, 15, 0, 0);
  return d.toISOString();
};

// Hitung selisih hari dari createdAt sampai sekarang
export const getTaskAgeInDays = (createdAt: string): number => {
  try {
    const createdTime = new Date(createdAt).getTime();
    const nowTime = new Date().getTime();
    const diffMs = nowTime - createdTime;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
};

// Format tanggal & jam diterima
export const formatReceivedTime = (createdAt: string): string => {
  try {
    const d = new Date(createdAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleDateString('id-ID', { month: 'short' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  } catch {
    return createdAt;
  }
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Review laporan keuangan bulanan',
    description: 'Periksa spreadsheet anggaran kuartal ketiga dan sinkronkan dengan rekening.',
    inboxType: 'tugas',
    dueDate: getFormattedDate(0), // Hari ini
    dueTime: '14:00',
    priority: 'high',
    category: 'Pekerjaan',
    isCompleted: false,
    isToday: true,
    todayOrder: 1,
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
    inboxType: 'kegiatan',
    dueDate: getFormattedDate(0), // Hari ini
    dueTime: '17:30',
    priority: 'high',
    category: 'Pekerjaan',
    isCompleted: false,
    isToday: true,
    todayOrder: 2,
    subTasks: [
      { id: 'sub-2-1', title: 'Uji responsivitas navigasi tab mobile', isCompleted: true },
      { id: 'sub-2-2', title: 'Verifikasi fungsi tambah task & sub-task dinamis', isCompleted: true },
      { id: 'sub-2-3', title: 'Periksa tampilan di perangkat mobile', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Belanja mingguan & kebutuhan rumah',
    description: 'Beli sayuran segar, buah-buahan, dan kebutuhan pantry.',
    inboxType: 'pengingat',
    dueDate: getFormattedDate(1), // Besok
    dueTime: '09:00',
    priority: 'medium',
    category: 'Pribadi',
    isCompleted: false,
    isToday: true,
    todayOrder: 3,
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
    inboxType: 'kegiatan',
    dueDate: getFormattedDate(2),
    dueTime: '16:30',
    priority: 'low',
    category: 'Kesehatan',
    isCompleted: false,
    subTasks: [],
    createdAt: getPastIsoDate(3, 16),
  },
  {
    id: 'task-5',
    title: 'Selesaikan modul kursus produktivitas digital',
    description: 'Pelajari manajemen waktu dan perencanaan jadwal harian.',
    inboxType: 'tugas',
    dueDate: getFormattedDate(-1), // Kemarin
    dueTime: '20:00',
    priority: 'medium',
    category: 'Belajar',
    isCompleted: true,
    subTasks: [
      { id: 'sub-5-1', title: 'Baca panduan ringkas produktivitas', isCompleted: true },
      { id: 'sub-5-2', title: 'Praktikkan penyusunan jadwal harian', isCompleted: true },
    ],
    createdAt: getPastIsoDate(1),
  },
  {
    id: 'task-6',
    title: 'Follow up proposal sponsorship & kemitraan',
    description: 'Hubungi PIC sponsor lewat email atau WhatsApp terkait kepastian dana pendukung.',
    inboxType: 'pengingat',
    dueDate: getFormattedDate(0),
    dueTime: '11:00',
    priority: 'high',
    category: 'Pekerjaan',
    isCompleted: false,
    subTasks: [
      { id: 'sub-6-1', title: 'Siapkan draf email pengingat', isCompleted: true },
      { id: 'sub-6-2', title: 'Kirim surat resmi tindak lanjut', isCompleted: false },
    ],
    createdAt: getPastIsoDate(8, 10), // Diterima 8 hari lalu (> 1 minggu)
  },
  {
    id: 'task-7',
    title: 'Rapikan arsip kuitansi & dokumen pajak tahun lalu',
    description: 'Pilah nota fisik, scan ke PDF dan simpan di folder Google Drive cloud.',
    inboxType: 'tugas',
    dueDate: getFormattedDate(3),
    dueTime: '15:00',
    priority: 'medium',
    category: 'Pribadi',
    isCompleted: false,
    subTasks: [
      { id: 'sub-7-1', title: 'Kumpulkan semua struk di map', isCompleted: false },
      { id: 'sub-7-2', title: 'Scan dengan aplikasi CamScanner', isCompleted: false },
    ],
    createdAt: getPastIsoDate(16, 14), // Diterima 16 hari lalu (> 2 minggu)
  },
];
