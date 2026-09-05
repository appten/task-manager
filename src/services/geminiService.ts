import { Task, AIAnalysisResult } from '../types/task';

// Gemini API Service for Sub-tasks, Circadian Productivity, and Life Goal Alignment Analysis

export const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey && localKey.trim()) return localKey.trim();
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
};

export const setGeminiApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }
};

const handleGeminiError = async (response: Response): Promise<never> => {
  const errText = await response.text();
  console.error('Gemini API error:', response.status, errText);
  let errMsg = `Status ${response.status}`;
  try {
    const errJson = JSON.parse(errText);
    if (errJson.error?.message) {
      errMsg = errJson.error.message;
    }
  } catch {}

  if (response.status === 403) {
    throw new Error(
      `Akses ditolak (403): ${errMsg}. Periksa apakah API key aktif atau apakah ada pembatasan referrer/domain di Google Cloud Console.`
    );
  }
  throw new Error(`Gagal menghubungi Gemini AI (${response.status}): ${errMsg}`);
};

export const generateSubTasksWithAI = async (
  title: string,
  description?: string,
  existingSubTasks?: string[]
): Promise<string[]> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key belum diatur. Masukkan API key di menu Pengaturan / Goals.');
  }

  if (!title.trim()) {
    throw new Error('Judul tugas tidak boleh kosong');
  }

  const existingNotice =
    existingSubTasks && existingSubTasks.length > 0
      ? `\nSub-tugas yang SUDAH ADA (DILARANG DUPLIKAT/MIRIP DENGAN INI):\n${existingSubTasks
          .map((st) => `- ${st}`)
          .join('\n')}\n`
      : '';

  const prompt = `Kamu adalah asisten pengelola tugas profesional.
Berdasarkan judul tugas dan deskripsi berikut, buatlah 3 sampai 5 sub-tugas yang praktis, ringkas, konkret, dan mudah dikerjakan dalam bahasa Indonesia.

Judul Tugas: "${title}"
${description ? `Deskripsi/Catatan: "${description}"` : ''}
${existingNotice}
Ketentuan:
1. Jangan membuat sub-tugas yang duplikat dengan yang sudah ada di atas.
2. Kembalikan HANYA JSON array string murni tanpa awalan/akhiran markdown, contoh:
["Langkah 1", "Langkah 2", "Langkah 3"]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    }),
  });

  if (!response.ok) {
    return handleGeminiError(response);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Tidak ada respon sub-tugas dari AI');
  }

  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string' && item.trim().length > 0);
    }
    throw new Error('Format respon bukan array');
  } catch (parseError) {
    console.error('Gagal mem-parsing respon Gemini:', rawText, parseError);
    return rawText
      .split('\n')
      .map((s: string) => s.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((s: string) => s.length > 0)
      .slice(0, 5);
  }
};

export interface SubTasksAndEstimateResult {
  subTasks: string[];
  estimatedTime: string;
  goalAlignmentScore?: number; // -100 s/d 100
  goalAlignmentReason?: string;
}

export const generateSubTasksAndEstimateWithAI = async (
  title: string,
  description?: string,
  existingSubTasks?: string[],
  userGoal?: string
): Promise<SubTasksAndEstimateResult> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key belum diatur. Masukkan API key di menu Pengaturan / Goals.');
  }

  if (!title.trim()) {
    throw new Error('Judul tugas tidak boleh kosong');
  }

  const existingNotice =
    existingSubTasks && existingSubTasks.length > 0
      ? `\nSub-tugas yang SUDAH ADA (DILARANG DUPLIKAT/MENGULANG LANGKAH INI):\n${existingSubTasks
          .map((st) => `- ${st}`)
          .join('\n')}\n`
      : '';

  const goalNotice = userGoal
    ? `\nTujuan Besar Hidup Pengguna Tahun Ini: "${userGoal}"\n`
    : '';

  const prompt = `Kamu adalah asisten produktivitas dan perencanaan hidup strategis.
Berdasarkan judul tugas dan data berikut:
Judul Tugas: "${title}"
${description ? `Catatan/Deskripsi: "${description}"` : ''}
${existingNotice}
${goalNotice}

Tugasmu:
1. Buat 2 sampai 4 sub-tugas lanjutan yang konkret, berurutan logis, dan TIDAK DUPLIKAT dengan sub-tugas yang sudah ada di atas.
2. Estimasi durasi waktu penyelesaian total yang realistis (contoh: "30 menit", "45 menit", "1.5 jam", "2 jam").
3. Evaluasi keselarasan tugas terhadap tujuan besar hidup pengguna dengan skor angka antara -100 hingga +100:
   - Positif (+1 hingga +100): Tugas ini mendekatkan pengguna ke tujuan hidupnya (makin relevan makin tinggi).
   - 0: Netral atau rutinitas umum.
   - Negatif (-1 hingga -100): Tugas distraksi, kontraproduktif, atau menjauhkan dari tujuan.
4. Berikan 1 kalimat alasan logis dari skor keselarasan tersebut.

WAJIB mengembalikan HANYA format JSON murni:
{
  "subTasks": ["Langkah baru 1", "Langkah baru 2"],
  "estimatedTime": "45 menit",
  "goalAlignmentScore": 85,
  "goalAlignmentReason": "Alasan singkat keselarasan terhadap tujuan hidup pengguna."
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.5,
      },
    }),
  });

  if (!response.ok) {
    return handleGeminiError(response);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Tidak ada respon dari Gemini AI');
  }

  try {
    const parsed = JSON.parse(rawText);
    let score = Number(parsed.goalAlignmentScore);
    if (isNaN(score)) score = 50;
    // Clamp to -100..100
    score = Math.max(-100, Math.min(100, Math.round(score)));

    return {
      subTasks: Array.isArray(parsed.subTasks) ? parsed.subTasks : [],
      estimatedTime: parsed.estimatedTime || '30 menit',
      goalAlignmentScore: score,
      goalAlignmentReason: parsed.goalAlignmentReason || 'Mendukung produktivitas harian.',
    };
  } catch (err) {
    console.error('Error parsing subtask and estimate:', rawText, err);
    return {
      subTasks: ['Persiapkan materi', 'Eksekusi tugas', 'Verifikasi hasil akhir'],
      estimatedTime: '30 menit',
      goalAlignmentScore: 50,
      goalAlignmentReason: 'Tugas produktif.',
    };
  }
};

export const analyzeTasksWithCircadianAI = async (
  tasks: Task[],
  userGoal?: string
): Promise<AIAnalysisResult> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key belum diatur. Masukkan API key di menu Pengaturan / Goals.');
  }

  if (!tasks || tasks.length === 0) {
    throw new Error('Tidak ada tugas untuk dianalisis.');
  }

  // Filter incomplete tasks (or all tasks if all completed)
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const tasksToAnalyze = activeTasks.length > 0 ? activeTasks : tasks;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeFormatted = `Pukul ${hours}:${minutes} WIB`;

  const tasksDescription = tasksToAnalyze
    .map(
      (t, idx) =>
        `${idx + 1}. [ID: ${t.id}] "${t.title}" (Prioritas: ${t.priority}, Kategori: ${t.category}${
          t.isBreakTask ? ' [JEDA ISTIRAHAT/RECOVERY]' : ''
        }${t.startTime ? `, Waktu Mulai Paling Awal: ${t.startTime} (HANYA BISA DIMULAI SETELAH JAM INI)` : ''}${
          t.endTime ? `, Batas Selesai/Deadline: ${t.endTime} (HARUS SELESAI SEBELUM JAM INI)` : ''
        }${t.dueDate ? `, Tanggal: ${t.dueDate}` : ''}${t.description ? `, Catatan: ${t.description}` : ''}${
          t.subTasks && t.subTasks.length > 0
            ? `, Memiliki ${t.subTasks.length} sub-tugas: [${t.subTasks.map((s) => s.title).join(', ')}]`
            : ''
        })`
    )
    .join('\n');

  const goalPromptSection = userGoal
    ? `\nTujuan Besar Hidup Pengguna Tahun Ini: "${userGoal}"\n`
    : '\nTujuan Besar Hidup Pengguna: Belum dispesifikasi (Gunakan standar efektivitas dan produktivitas hidup optimal).\n';

  const prompt = `Sebagai pakar produktivitas tingkat tinggi, ergonomi kerja, dan ahli chronobiology (ritme sirkadian / jam biologis & manajemen energi manusia):

Waktu saat ini: ${currentTimeFormatted}.
${goalPromptSection}
Daftar Tugas Pengguna:
${tasksDescription}

ATURAN PENTING PENJADWALAN WAKTU:
1. "Waktu Mulai" berarti tugas tersebut HANYA BISA DIMULAI pada atau setelah waktu tersebut (Earliest Start Window). DILARANG merekomendasikan memulai sebelum jam mulai ini.
2. "Batas Selesai" berarti tugas HARUS SELESAI SEBELUM waktu tersebut (Latest Finish Deadline). Pengerjaan harus tuntas sebelum batas akhir ini.
3. KESEIMBANGAN ENERGI & WAKTU LELAH / ISTIRAHAT:
   - Energi manusia memiliki batas kapasitas biologis. Kerja intensif di atas 90 menit tanpa jeda akan menurunkan fokus secara drastis.
   - Perhatikan kebutuhan istirahat wajar: makan siang (12:00-13:00), hidrasi/peregangan berkala, dan jeda sore (15:30-16:30).
   - Pastikan beban kerja harian seimbang: tidak berlebihan (menghindari burnout/stres) dan tidak berkekurangan (tetap produktif menuju tujuan hidup).
   - Jika saat ini adalah jam makan atau waktu lelah, sarankan jeda pemulihan energi terlebih dahulu sebelum masuk ke tugas berat.

Analisis yang harus kamu lakukan:
1. Tugas mana yang paling tepat untuk DIKERJAKAN SAAT INI JUGA dengan mempertimbangkan jam biologis, aturan waktu mulai/selesai, DAN keselarasan tujuan hidup.
2. Estimasi usaha yang diperlukan (pilih salah satu: "Ringan", "Sedang", "Tinggi").
3. Estimasi durasi penyelesaian yang realistis (misal: "20 - 30 menit", "45 menit", "1 - 2 jam").
4. Hubungan dengan jam biologis & status energi tubuh saat ini (misal: fase puncak fokus kortisol pagi, fase pemulihan setelah makan siang, fase performa sore, fase relaksasi malam).
5. Skor keselarasan terhadap tujuan besar hidup pengguna berupa angka integer antara -100 hingga +100.


WAJIB hasilkan output HANYA dalam format JSON murni:
{
  "circadianState": "Nama dan fase jam biologis saat ini beserta waktu",
  "circadianAdvice": "Saran pemanfaatan energi dan fokus biologis tubuh saat ini",
  "topPriorityTaskId": "ID tugas yang paling prioritas untuk dikerjakan saat ini",
  "overallSummary": "Ringkasan strategi produktivitas dalam 1-2 kalimat berbobot",
  "userGoalContext": "${userGoal || ''}",
  "tasksAnalysis": [
    {
      "taskId": "ID tugas yang sesuai",
      "taskTitle": "Judul tugas",
      "urgencyLevel": "Segera" atau "Nanti" atau "Rutin",
      "effortLevel": "Ringan" atau "Sedang" atau "Tinggi",
      "estimatedDuration": "Estimasi durasi (misal: 30 - 45 menit)",
      "biologicalFit": "Kesesuaian dengan jam biologis saat ini",
      "goalAlignmentScore": 85,
      "goalImpact": "Mendekatkan" atau "Netral" atau "Menjauhkan",
      "reason": "Alasan singkat keselarasan tugas terhadap tujuan hidup dan jam biologis"
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    }),
  });

  if (!response.ok) {
    return handleGeminiError(response);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Tidak ada respon analisis dari AI');
  }

  try {
    const parsed = JSON.parse(rawText);
    return {
      ...parsed,
      analyzedAt: now.toISOString(),
      currentTimeFormatted,
      userGoalContext: userGoal || '',
    } as AIAnalysisResult;
  } catch (err) {
    console.error('Gagal parsing analisis JSON:', rawText, err);
    throw new Error('Gagal memproses struktur data analisis AI.');
  }
};
