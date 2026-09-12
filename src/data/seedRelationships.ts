import { LifeRelationship } from '../types/task';

export const DEFAULT_RELATIONSHIPS: LifeRelationship[] = [
  {
    id: 'rel-pasangan',
    roleName: 'Pasangan Hidup',
    personName: 'Pasangan',
    iconType: 'heart',
    color: '#e11d48',
    description: 'Menjaga kehangatan, komunikasi & waktu berkualitas berdua',
    suggestedTasks: [
      'Ajak ngobrol santai 15 menit tanpa gadget',
      'Bawakan makanan kesukaannya sepulang beraktivitas',
      'Ucapkan terima kasih & apresiasi hal kecil hari ini',
      'Rencanakan jalan berdua di akhir pekan',
    ],
  },
  {
    id: 'rel-orang-tua',
    roleName: 'Orang Tua & Keluarga',
    personName: 'Keluarga',
    iconType: 'home',
    color: '#d97706',
    description: 'Perhatian, kabar silaturahmi & baktimu pada keluarga',
    suggestedTasks: [
      'Telepon tanya kabar Ayah / Ibu hari ini',
      'Makan bersama keluarga di meja makan',
      'Bantu selesaikan satu kebutuhan rumah tangga',
      'Kirimkan cemilan atau pesan hangat',
    ],
  },
  {
    id: 'rel-sahabat',
    roleName: 'Sahabat & Teman',
    personName: 'Sahabat',
    iconType: 'smile',
    color: '#2563eb',
    description: 'Koneksi tulus, saling sapa & jaga tali persahabatan',
    suggestedTasks: [
      'Sapa kabar sahabat lama via chat / telepon santai',
      'Ajak ngopi atau makan siang bersama',
      'Beri selamat atau dukungan atas kegiatannya',
      'Dengarkan ceritanya dengan penuh perhatian',
    ],
  },
  {
    id: 'rel-rekan-kerja',
    roleName: 'Rekan Tim & Kerja',
    personName: 'Rekan Tim',
    iconType: 'briefcase',
    color: '#7c3aed',
    description: 'Apresiasi, sinergi & dukungan nyata bagi rekan kerja',
    suggestedTasks: [
      'Beri apresiasi tulus atas kerja keras rekan kerja',
      'Tanyakan kendala proyek dan tawarkan bantuan',
      'Diskusi santai di sela istirahat siang',
      'Bagikan tips atau referensi yang mempermudah kerjanya',
    ],
  },
];
