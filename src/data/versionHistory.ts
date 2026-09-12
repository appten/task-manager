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

export const APP_CURRENT_VERSION = 'v1.5.0';

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: 'v1.5.0',
    releaseDate: '12 September 2026',
    isLatest: true,
    tagline: 'Pelacak Sesi Multi-Perangkat, Mode Cloud/Offline, PWA & Tata Letak Menu Akun Ringkas',
    groupedChanges: [
      {
        category: 'Fitur Baru',
        items: [
          'Pelacak Sesi Multi-Perangkat (Multi-Device Active Tracker): Menampilkan seluruh perangkat yang sedang login ke akun SSO TEN (PC, Laptop, HP, Tablet) lengkap dengan status aktif dan kemampuan mencabut sesi perangkat tak dikenal dari jarak jauh.',
          'Pilihan Mode Penyimpanan Fleksibel: Pengguna dapat memilih mode "Prioritas Cloud" (sinkron otomatis langsung ke server) atau "Hibrida" (tersimpan di lokal dan dicadangkan ke cloud).',
          'Peralihan Otomatis ke Mode Offline: Sistem otomatis mendeteksi status internet dan mengaktifkan mode offline lokal saat koneksi terputus tanpa mengganggu aktivitas pencatatan.',
          'Progressive Web App (PWA): Dukungan penuh instalasi mandiri di layar utama ponsel dan desktop dengan service worker caching statis, logo modern resolusi tinggi, dan tombol pasang satu klik.',
        ],
      },
      {
        category: 'Penyempurnaan',
        items: [
          'Tata Letak Menu Akun Ringkas & Teratur: Pengaturan lanjutan dikelompokkan ke dalam daftar menu navigasi yang rapi dan terstruktur, menjaga akses cepat untuk sinkronisasi dan profil tanpa scroll berlebihan.',
          'Pengaman Data & Rekonsiliasi Dua Arah: Melindungi catatan tugas dari penimpaan sepihak saat login multi-akun dan menyediakan opsi pembersihan tuntas saat logout.',
        ],
      },
    ],
  },
  {
    version: 'v1.4.0',
    releaseDate: '9 September 2026',
    isLatest: false,
    tagline: 'Sistem Akun Cloud Penuh, Pemulihan Sandi Mandiri & Sinkronisasi Multi-Device',
    groupedChanges: [
      {
        category: 'Fitur Baru',
        items: [
          'Sistem Akun Cloud Terintegrasi: Pengguna kini dapat mendaftar dan masuk akun untuk menyimpan seluruh tugas dan sasaran secara terpusat di cloud, memungkinkan akses dan sinkronisasi lintas perangkat (HP & Laptop).',
          'Pemulihan Lupa Kata Sandi Mandiri (Self-Service Recovery): Fitur lupa kata sandi 2 tahap menggunakan PIN Keamanan 4-6 angka yang disetel saat pendaftaran, memudahkan reset sandi tanpa perlu email konfirmasi pihak ketiga.',
          'Pengaturan Profil & Ganti Kata Sandi: Pengguna yang telah masuk dapat memperbarui nama tampilan, mengubah kata sandi lama, serta menyetel ulang PIN pemulihan kapan saja melalui dialog pengaturan akun.',
          'Dialog Keluar Fleksibel: Opsi konfirmasi saat keluar akun (logout) dengan pilihan tetap menyimpan tugas di perangkat untuk mode tamu atau membersihkan data lokal.',
          'Edukasi Visual Mode Tamu vs Cloud: Banner informatif yang menjelaskan keunggulan menghubungkan akun cloud tanpa menghilangkan kebebasan menggunakan aplikasi secara offline.',
        ],
      },
      {
        category: 'Penyempurnaan',
        items: [
          'Sinkronisasi Otomatis Lebih Sigap: Auto-sync debounced dioptimalkan menjadi 1.5 detik setelah ada perubahan tugas atau sasaran.',
          'Tombol Intip Kata Sandi (Eye Toggle): Input kata sandi pada formulir pendaftaran dan masuk kini dilengkapi ikon buka-tutup mata untuk kenyamanan pengetikan.',
          'Penyatuan Data Otomatis (Smart Merge): Opsi menggabungkan tugas yang sudah ada di perangkat saat mendaftar atau masuk agar tidak ada data yang tercecer.',
        ],
      },
    ],
  },
  {
    version: 'v1.3.0',
    releaseDate: '9 September 2026',
    isLatest: false,
    tagline: 'Fitur Kirim Masukan, Desain Modal Reset Elegan & Pengamanan Data',
    groupedChanges: [
      {
        category: 'Fitur Baru',
        items: [
          'Formulir Kirim Masukan (Feedback): Pengguna kini dapat langsung menyampaikan saran fitur, laporan bug, atau kritik melalui menu Akun dengan pilihan kategori yang intuitif.',
          'Zona Bahaya Reset Total Data: Menu Akun dilengkapi perlindungan reset seluruh data aplikasi secara permanen dengan pengamanan ganda (konfirmasi 2 tahap & pengetikan kalimat konfirmasi).',
          'Deteksi Otomatis Pengguna Lama: Notifikasi demo perdana secara cerdas tidak akan pernah dimunculkan pada pengguna lama yang telah memiliki data tersimpan di perangkat.',
        ],
      },
      {
        category: 'Penyempurnaan',
        items: [
          'Desain Ulang Dialog Reset Data: Tampilan modal konfirmasi reset data diperbarui sepenuhnya dengan tema modern, pop-up terpusat, tata letak proporsional, dan penegasan visual yang jelas.',
          'Pembersihan Data Menyeluruh: Fitur reset membersihkan seluruh tugas, riwayat Today, sasaran hidup, dan cache analisis AI secara instan dan aman.',
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
