export interface VersionCategoryGroup {
  category: 'Fitur Baru' | 'Penyempurnaan' | 'Fitur Utama';
  items: string[];
}

export interface VersionRelease {
  version: string;
  releaseDate: string; // Tanggal lengkap, contoh: '9 September 2026'
  isLatest?: boolean;
  tagline: string;
  groupedChanges: VersionCategoryGroup[];
}

export const APP_CURRENT_VERSION = 'v1.3.0';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: 'v1.3.0',
    releaseDate: '9 September 2026',
    isLatest: true,
    tagline: 'Zona Bahaya Reset Total Data & Deteksi Pengguna Lama',
    groupedChanges: [
      {
        category: 'Fitur Baru',
        items: [
          'Zona Bahaya Reset Total Data: Menu Akun kini dilengkapi fitur reset seluruh data aplikasi secara permanen dengan pengamanan ganda (konfirmasi 2 tahap & pengetikan kalimat konfirmasi).',
          'Deteksi Otomatis Pengguna Lama: Notifikasi demo perdana secara cerdas tidak akan pernah dimunculkan pada pengguna lama yang telah memiliki data tersimpan di perangkat.',
        ],
      },
      {
        category: 'Penyempurnaan',
        items: [
          'Pembersihan Data Menyeluruh: Fitur reset membersihkan seluruh tugas, riwayat Today, sasaran hidup, dan cache analisis AI secara instan dan aman.',
          'Dialog Keamanan Berlapis: Modal konfirmasi bahaya dengan tema merah tegas untuk memastikan tidak terjadi penghapusan data secara tidak sengaja.',
        ],
      },
    ],
  },
  {
    version: 'v1.2.0',
    releaseDate: '9 September 2026',
    isLatest: false,
    tagline: 'Pembaruan Asisten AI, Status Bar, Quick Acara & Halaman Sasaran',
    groupedChanges: [
      {
        category: 'Fitur Baru',
        items: [
          'Status Bar Terpadu: bagian atas aplikasi kini menampilkan informasi hari, tanggal, dan jam secara jelas tanpa titik hitam kamera.',
          'Waktu Acara pada Quick Input: pencatatan kegiatan di menu Inbox kini dilengkapi pilihan waktu mulai dan selesai secara opsional yang langsung sinkron ke jadwal.',
          'Halaman Sasaran Hidup (Goals): fitur penentuan sasaran tahunan kini hadir sebagai halaman penuh baru yang rapi dan elegan (/goal).',
          'Halaman Riwayat Selesai Baru: tampilan riwayat tugas tuntas diperbarui menjadi daftar baris datar (flat rows) yang bersih dan minimalis (/history).',
          'Penanda Waktu Update AI: menu Asisten Cerdas kini dilengkapi keterangan waktu terakhir kali analisis diperbarui.',
          'Pencatatan Tanggal Rilis Resmi: tanggal pembaruan ditampilkan lengkap dengan ikon kalender pada setiap riwayat versi.',
          'Panduan Data Demo Pengunjung: popup sambutan otomatis setelah 5 detik untuk pengunjung perdana dengan pilihan mulai bersih (menghapus data tugas & hasil AI dengan 1x konfirmasi) atau melanjutkan demo (pilihan 1, 5, atau 10 menit).',
        ],
      },
      {
        category: 'Penyempurnaan',
        items: [
          'Kartu Ritme Tubuh & Energi: tampilan badge kondisi sirkadian dan saran ritme energi di menu AI ditata ulang agar lebih rapi dan simetris.',
          'Pencegahan Menu Terpotong: deteksi otomatis batas navigasi bawah agar menu opsi (...) selalu tampil utuh dan berbalik ke atas saat diklik pada tugas bagian bawah.',
          'Latar Belakang Menu Solid: warna latar menu aksi dibuat putih pekat 100% tanpa efek tembus pandang pada tugas yang sudah selesai.',
          'Navigasi Akun Lebih Tenang: animasi gerak pada baris versi di menu Akun dihilangkan untuk kenyamanan mata.',
          'Pengelompokan Catatan Rilis: rincian pembaruan tersusun rapi berdasarkan kelompok kategori pembaruan.',
          'Penyempurnaan Bahasa: seluruh istilah teknis diganti dengan bahasa Indonesia sehari-hari yang mudah dipahami.',
        ],
      },
    ],
  },
  {
    version: 'v1.1.0',
    releaseDate: '8 September 2026',
    isLatest: false,
    tagline: 'Peningkatan Tampilan Bersih & Riwayat Harian Today',
    groupedChanges: [
      {
        category: 'Fitur Baru',
        items: [
          'Riwayat Today: visual 5 kotak status harian dan rincian penyelesaian tugas yang dapat dibuka-tutup.',
          'Pembaruan Otomatis: daftar tugas hari baru otomatis dimulai setiap melewati jam 12 malam, dengan tanda jumlah hari pada tugas yang belum selesai.',
          'Navigasi Halaman Langsung: menu yang sedang dibuka tetap bertahan dan tidak berpindah saat halaman disegarkan (refresh).',
        ],
      },
      {
        category: 'Penyempurnaan',
        items: [
          'Tampilan daftar tugas di Inbox dan Today dibuat lebih bersih dan lega tanpa kotak-kotak berlebih yang membingungkan.',
          'Menu opsi tugas (...) diringkas menjadi ikon dan nama singkat yang rapi serta mudah dipilih.',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    releaseDate: '25 Agustus 2026',
    isLatest: false,
    tagline: 'Rilis Perdana TEN Tasks Mobile',
    groupedChanges: [
      {
        category: 'Fitur Utama',
        items: [
          'Pengelolaan tugas harian praktis dengan 3 menu utama: Inbox, Kalender, dan Today (5 tugas fokus harian).',
          'Pencatat waktu (stopwatch) terintegrasi untuk menghitung durasi pengerjaan setiap tugas.',
          'Asisten cerdas untuk membantu menyarankan ritme kerja harian yang sehat dan produktif.',
          'Penyimpanan data mandiri di perangkat dengan opsi pencadangan akun online.',
        ],
      },
    ],
  },
];
