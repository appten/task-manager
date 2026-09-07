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
    throw new Error('Gemini API key belum diatur. Pastikan environment variable NEXT_PUBLIC_GEMINI_API_KEY sudah diset di Cloudflare.');
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
    throw new Error('Gemini API key belum diatur. Pastikan environment variable NEXT_PUBLIC_GEMINI_API_KEY sudah diset di Cloudflare.');
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

export const generateLocalCircadianAnalysis = (
  tasks: Task[],
  userGoal?: string
): AIAnalysisResult => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeFormatted = `Pukul ${String(hours).padStart(2, '0')}:${minutes} WIB`;

  // Tentukan fase sirkadian berdasarkan jam saat ini
  let circadianState = '';
  let circadianAdvice = '';
  let timeSuitabilityNote = '';

  if (hours >= 0 && hours < 5) {
    circadianState = `Fase Dini Hari (${String(hours).padStart(2, '0')}:${minutes}) • Regenerasi Seluler & Istirahat`;
    circadianAdvice = 'Ritme biologis tubuh saat ini berada pada titik suhu terendah dan pemulihan seluler. Sangat disarankan memprioritaskan istirahat atau hanya memproses pengingat/catatan ringan tanpa stres kognitif.';
    timeSuitabilityNote = 'Cocok untuk review ringan atau pengingat esok hari.';
  } else if (hours >= 5 && hours < 9) {
    circadianState = `Fase Pagi Hari (${String(hours).padStart(2, '0')}:${minutes}) • Kebangkitan Kortisol & Perencanaan`;
    circadianAdvice = 'Kortisol alami mulai meningkat memberi dorongan energi positif. Waktu ideal untuk menata Today, meninjau agenda acara, dan mempersiapkan tugas terpenting.';
    timeSuitabilityNote = 'Optimal untuk persiapan & penetapan target fokus.';
  } else if (hours >= 9 && hours < 12) {
    circadianState = `Fase Puncak Fokus Mental (${String(hours).padStart(2, '0')}:${minutes}) • Waktu Emas Kognitif`;
    circadianAdvice = 'Kapasitas konsentrasi otak berada pada level tertinggi hari ini. Kerjakan tugas Today dengan prioritas tinggi dan tantangan analitis sekarang juga!';
    timeSuitabilityNote = 'Sangat selaras dengan deep work & fokus maksimal.';
  } else if (hours >= 12 && hours < 14) {
    circadianState = `Fase Siang (${String(hours).padStart(2, '0')}:${minutes}) • Jeda Sirkadian & Makan Siang`;
    circadianAdvice = 'Energi kognitif mengalami penurunan alami (post-lunch dip). Berikan jeda istirahat 30-45 menit atau selesaikan pengingat santai.';
    timeSuitabilityNote = 'Dianjurkan jeda pemulihan sebelum masuk ke sesi kerja berikutnya.';
  } else if (hours >= 14 && hours < 18) {
    circadianState = `Fase Sore (${String(hours).padStart(2, '0')}:${minutes}) • Performa Eksekusi & Koordinasi`;
    circadianAdvice = 'Stabilitas mental kembali meningkat dengan koordinasi motorik yang baik. Waktu yang tepat untuk menuntaskan sisa tugas Today dan follow-up.';
    timeSuitabilityNote = 'Sangat baik untuk eksekusi praktis & komunikasi tim.';
  } else if (hours >= 18 && hours < 21) {
    circadianState = `Fase Malam Awal (${String(hours).padStart(2, '0')}:${minutes}) • Evaluasi & Tinjau Inbox`;
    circadianAdvice = 'Mulai menurunkan intensitas kerja berat. Evaluasi pencapaian tugas hari ini, bersihkan inbox, dan siapkan mental untuk malam yang tenang.';
    timeSuitabilityNote = 'Cocok untuk rekapitulasi tugas & evaluasi.';
  } else {
    circadianState = `Fase Menjelang Tidur (${String(hours).padStart(2, '0')}:${minutes}) • Pelepasan Melatonin`;
    circadianAdvice = 'Hormon melatonin mulai dilepaskan untuk mempersiapkan tidur nyenyak. Hindari beban kerja berat, catat ide/pengingat untuk esok hari.';
    timeSuitabilityNote = 'Ideal untuk pengingat esok hari & relaksasi.';
  }

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const tasksToAnalyze = activeTasks.length > 0 ? activeTasks : tasks;

  // Urutkan tugas: Today priority high > Today others > Inbox high > Inbox others
  const sortedTasks = [...tasksToAnalyze].sort((a, b) => {
    if (a.isToday && !b.isToday) return -1;
    if (!a.isToday && b.isToday) return 1;
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return 0;
  });

  const topPriorityTask = sortedTasks[0];
  const todayCount = tasksToAnalyze.filter((t) => t.isToday).length;
  const inboxCount = tasksToAnalyze.filter((t) => !t.isToday).length;

  const tasksAnalysis = tasksToAnalyze.map((t) => {
    const isUrgent = t.priority === 'high' || t.isToday;
    const urgencyLevel: 'Segera' | 'Rutin' | 'Nanti' = t.priority === 'high' ? 'Segera' : t.isToday ? 'Rutin' : 'Nanti';
    const effortLevel: 'Ringan' | 'Sedang' | 'Tinggi' =
      t.effortHours && t.effortHours >= 3 ? 'Tinggi' : t.effortHours && t.effortHours >= 1 ? 'Sedang' : 'Ringan';
    const estimatedDuration = t.estimatedTime || (t.effortHours ? `${t.effortHours} jam` : '30 - 45 menit');

    let goalScore = 70;
    if (t.priority === 'high') goalScore += 15;
    if (t.isToday) goalScore += 10;
    if (t.inboxType === 'kegiatan') goalScore += 5;
    goalScore = Math.min(100, goalScore);

    const typeLabel = t.inboxType === 'kegiatan' ? 'Kegiatan/Acara' : t.inboxType === 'pengingat' ? 'Pengingat' : 'Tugas';
    const reason = t.isToday
      ? `Terpilih dalam 5 fokus Today. Sangat direkomendasikan untuk dieksekusi sejalan dengan ritme ${circadianState.split('•')[0].trim()}.`
      : t.priority === 'high'
      ? `Prioritas tinggi dalam Inbox. Selesaikan segera agar tidak membebani kapasitas kognitif Anda.`
      : `Item ${typeLabel} yang dapat dijadwalkan secara fleksibel setelah tugas utama Today tuntas.`;

    return {
      taskId: t.id,
      taskTitle: t.title,
      urgencyLevel,
      effortLevel,
      estimatedDuration,
      biologicalFit: `${timeSuitabilityNote} Cocok dengan ritme energi saat ini.`,
      goalAlignmentScore: goalScore,
      goalImpact: 'Mendekatkan' as const,
      reason,
    };
  });

  const overallSummary = `Terdeteksi ${todayCount} fokus Today dan ${inboxCount} item Inbox aktif. Strategi terbaik saat ini adalah menuntaskan "${topPriorityTask?.title || 'tugas utama'}" terlebih dahulu untuk menjaga momentum produktivitas Anda.`;

  return {
    analyzedAt: now.toISOString(),
    currentTimeFormatted,
    circadianState,
    circadianAdvice,
    topPriorityTaskId: topPriorityTask?.id,
    overallSummary,
    userGoalContext: userGoal || 'Membangun rutinitas produktif dan seimbang',
    tasksAnalysis,
  };
};

export const analyzeTasksWithCircadianAI = async (
  tasks: Task[],
  userGoal?: string
): Promise<AIAnalysisResult> => {
  if (!tasks || tasks.length === 0) {
    throw new Error('Tidak ada tugas untuk dianalisis.');
  }

  const apiKey = getGeminiApiKey();

  // Jika belum ada API key, gunakan local smart circadian analysis yang akurat & instan
  if (!apiKey) {
    return generateLocalCircadianAnalysis(tasks, userGoal);
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
        `${idx + 1}. [ID: ${t.id}] "${t.title}" (Kategori Inbox: ${t.inboxType || 'tugas'}, Di Today: ${t.isToday ? 'YA' : 'TIDAK'}, Prioritas: ${t.priority}, Kategori: ${t.category}${
          t.isBreakTask ? ' [JEDA ISTIRAHAT/RECOVERY]' : ''
        }${t.startTime ? `, Waktu Mulai Paling Awal: ${t.startTime}` : ''}${
          t.endTime ? `, Batas Selesai/Deadline: ${t.endTime}` : ''
        }${t.dueDate ? `, Tanggal: ${t.dueDate}` : ''}${t.description ? `, Catatan: ${t.description}` : ''}${
          t.subTasks && t.subTasks.length > 0
            ? `, Sub-tugas: [${t.subTasks.map((s) => s.title).join(', ')}]`
            : ''
        })`
    )
    .join('\n');

  const goalPromptSection = userGoal
    ? `\nTujuan Besar Hidup Pengguna Tahun Ini: "${userGoal}"\n`
    : '\nTujuan Besar Hidup Pengguna: Produktivitas seimbang, efisien, dan bebas stres.\n';

  const prompt = `Sebagai pakar produktivitas tingkat tinggi, manajemen waktu, dan chronobiology (ritme jam biologis manusia):

Waktu saat ini: ${currentTimeFormatted}.
${goalPromptSection}
Daftar Tugas Pengguna (mencakup Inbox dan Today):
${tasksDescription}

Analisis yang harus kamu lakukan:
1. Rekomendasikan tugas/acara/pengingat mana yang paling tepat untuk DIKERJAKAN SAAT INI JUGA menyesuaikan dengan jam saat ini (${currentTimeFormatted}) dan fokus Today.
2. Estimasi usaha yang diperlukan ("Ringan", "Sedang", "Tinggi").
3. Estimasi durasi penyelesaian yang realistis.
4. Hubungan dengan jam biologis tubuh saat ini.
5. Skor keselarasan terhadap tujuan hidup pengguna (-100 hingga +100).

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
      "urgencyLevel": "Segera" | "Rutin" | "Nanti",
      "effortLevel": "Ringan" | "Sedang" | "Tinggi",
      "estimatedDuration": "30 - 45 menit",
      "biologicalFit": "Penjelasan kesesuaian dengan ritme saat ini",
      "goalAlignmentScore": 85,
      "goalImpact": "Mendekatkan" | "Netral" | "Menjauhkan",
      "reason": "Alasan singkat rekomendasi"
    }
  ]
}`;

  try {
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
      console.warn('Gemini API returned non-ok status, falling back to smart local analysis.');
      return generateLocalCircadianAnalysis(tasks, userGoal);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return generateLocalCircadianAnalysis(tasks, userGoal);
    }

    const parsed = JSON.parse(rawText);
    return {
      ...parsed,
      analyzedAt: now.toISOString(),
      currentTimeFormatted,
      userGoalContext: userGoal || '',
    } as AIAnalysisResult;
  } catch (err) {
    console.warn('Error during Gemini API call, falling back to smart local analysis:', err);
    return generateLocalCircadianAnalysis(tasks, userGoal);
  }
};
