import { Task, AIAnalysisResult, TaskAnalysisItem } from '../types/task';

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
  const minutes = now.getMinutes();
  const nowTotalMinutes = hours * 60 + minutes;
  const currentTimeFormatted = `Pukul ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} WIB`;

  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDate = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${currentYear}-${currentMonth}-${currentDate}`;

  // Helper formatting date to Indonesian short e.g. "08 Sep"
  const formatShortDate = (dateStr: string): string => {
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Helper parsing "HH:mm" to minutes from midnight
  const parseTimeToMinutes = (timeStr?: string): number | null => {
    if (!timeStr || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  };

  // Tentukan fase sirkadian berdasarkan jam saat ini
  let circadianState = '';
  let circadianAdvice = '';
  let timeSuitabilityNote = '';

  if (hours >= 0 && hours < 5) {
    circadianState = `Fase Dini Hari (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Regenerasi Seluler & Istirahat`;
    circadianAdvice = 'Ritme biologis tubuh saat ini berada pada titik suhu terendah dan pemulihan seluler. Sangat disarankan memprioritaskan istirahat atau hanya memproses pengingat/catatan ringan tanpa stres kognitif.';
    timeSuitabilityNote = 'Cocok untuk review ringan atau pengingat esok hari.';
  } else if (hours >= 5 && hours < 9) {
    circadianState = `Fase Pagi Hari (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Kebangkitan Kortisol & Perencanaan`;
    circadianAdvice = 'Kortisol alami mulai meningkat memberi dorongan energi positif. Waktu ideal untuk menata Today, meninjau agenda acara, dan mempersiapkan tugas terpenting.';
    timeSuitabilityNote = 'Optimal untuk persiapan & penetapan target fokus.';
  } else if (hours >= 9 && hours < 12) {
    circadianState = `Fase Puncak Fokus Mental (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Waktu Emas Kognitif`;
    circadianAdvice = 'Kapasitas konsentrasi otak berada pada level tertinggi hari ini. Kerjakan tugas Today dengan prioritas tinggi dan tantangan analitis sekarang juga!';
    timeSuitabilityNote = 'Sangat selaras dengan deep work & fokus maksimal.';
  } else if (hours >= 12 && hours < 14) {
    circadianState = `Fase Siang (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Jeda Sirkadian & Makan Siang`;
    circadianAdvice = 'Energi kognitif mengalami penurunan alami (post-lunch dip). Berikan jeda istirahat 30-45 menit atau selesaikan pengingat santai.';
    timeSuitabilityNote = 'Dianjurkan jeda pemulihan sebelum masuk ke sesi kerja berikutnya.';
  } else if (hours >= 14 && hours < 18) {
    circadianState = `Fase Sore (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Performa Eksekusi & Koordinasi`;
    circadianAdvice = 'Stabilitas mental kembali meningkat dengan koordinasi motorik yang baik. Waktu yang tepat untuk menuntaskan sisa tugas Today dan follow-up.';
    timeSuitabilityNote = 'Sangat baik untuk eksekusi praktis & komunikasi tim.';
  } else if (hours >= 18 && hours < 21) {
    circadianState = `Fase Malam Awal (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Evaluasi & Tinjau Inbox`;
    circadianAdvice = 'Mulai menurunkan intensitas kerja berat. Evaluasi pencapaian tugas hari ini, bersihkan inbox, dan siapkan mental untuk malam yang tenang.';
    timeSuitabilityNote = 'Cocok untuk rekapitulasi tugas & evaluasi.';
  } else {
    circadianState = `Fase Menjelang Tidur (${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}) • Pelepasan Melatonin`;
    circadianAdvice = 'Hormon melatonin mulai dilepaskan untuk mempersiapkan tidur nyenyak. Hindari beban kerja berat, catat ide/pengingat untuk esok hari.';
    timeSuitabilityNote = 'Ideal untuk pengingat esok hari & relaksasi.';
  }

  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const tasksToAnalyze = activeTasks.length > 0 ? activeTasks : tasks;

  // Analisis jendela waktu dan TANGGAL pengerjaan untuk setiap item
  const tasksAnalysis = tasksToAnalyze.map((t) => {
    const taskStartDateStr = t.startDate || t.dueDate || todayDateStr;
    const taskDueDateStr = t.dueDate || t.endDate || taskStartDateStr;

    // Evaluasi relasi tanggal terhadap tanggal hari ini
    const isFutureTask = taskStartDateStr > todayDateStr;
    const isPastOverdueTask = taskDueDateStr < todayDateStr;
    const isTodayTask = !isFutureTask && !isPastOverdueTask;

    // Hitung label konteks tanggal yang ramah manusia
    let dateContextLabel = 'Hari ini';
    if (isFutureTask) {
      const todayD = new Date(Number(todayDateStr.split('-')[0]), Number(todayDateStr.split('-')[1]) - 1, Number(todayDateStr.split('-')[2]));
      const startD = new Date(Number(taskStartDateStr.split('-')[0]), Number(taskStartDateStr.split('-')[1]) - 1, Number(taskStartDateStr.split('-')[2]));
      const diffDays = Math.round((startD.getTime() - todayD.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        dateContextLabel = `Besok (${formatShortDate(taskStartDateStr)})`;
      } else if (diffDays === 2) {
        dateContextLabel = `Lusa (${formatShortDate(taskStartDateStr)})`;
      } else {
        dateContextLabel = `${diffDays} hari lagi (${formatShortDate(taskStartDateStr)})`;
      }
    } else if (isPastOverdueTask) {
      dateContextLabel = `Terlewat (${formatShortDate(taskDueDateStr)})`;
    } else {
      dateContextLabel = `Hari ini (${formatShortDate(todayDateStr)})`;
    }

    const startMin = parseTimeToMinutes(t.startTime);
    const endMin = parseTimeToMinutes(t.endTime || t.dueTime);

    let timeWindowStatus: 'ready_now' | 'locked_until_start' | 'nearing_deadline' | 'flexible' = 'flexible';
    let timeWindowDescription = 'Waktu fleksibel';
    let isLockedNow = false;

    if (isFutureTask) {
      // Tugas di hari mendatang: BELUM BISA DIMULAI HARI INI
      timeWindowStatus = 'locked_until_start';
      isLockedNow = true;
      if (t.startTime) {
        timeWindowDescription = `${dateContextLabel}, mulai ${t.startTime}`;
      } else {
        timeWindowDescription = `${dateContextLabel}`;
      }
    } else if (isPastOverdueTask) {
      // Tugas yang sudah lewat tanggal tenggat
      timeWindowStatus = 'nearing_deadline';
      timeWindowDescription = `Tenggat terlewat sejak ${formatShortDate(taskDueDateStr)}`;
    } else {
      // Tugas untuk HARI INI: Evaluasi jam
      if (startMin !== null) {
        if (nowTotalMinutes < startMin) {
          timeWindowStatus = 'locked_until_start';
          timeWindowDescription = `Hari ini, baru bisa mulai ${t.startTime}`;
          isLockedNow = true;
        } else if (endMin !== null) {
          if (nowTotalMinutes > endMin) {
            timeWindowStatus = 'nearing_deadline';
            timeWindowDescription = `Hari ini, lewat batas (${t.endTime || t.dueTime})`;
          } else if (endMin - nowTotalMinutes <= 120) {
            timeWindowStatus = 'nearing_deadline';
            timeWindowDescription = `Hari ini, mendekati batas (${t.endTime || t.dueTime})`;
          } else {
            timeWindowStatus = 'ready_now';
            timeWindowDescription = `Hari ini, aktif (${t.startTime} - ${t.endTime || t.dueTime})`;
          }
        } else {
          timeWindowStatus = 'ready_now';
          timeWindowDescription = `Hari ini, siap (mulai ${t.startTime})`;
        }
      } else if (endMin !== null) {
        if (nowTotalMinutes > endMin) {
          timeWindowStatus = 'nearing_deadline';
          timeWindowDescription = `Hari ini, lewat batas (${t.endTime || t.dueTime})`;
        } else if (endMin - nowTotalMinutes <= 120) {
          timeWindowStatus = 'nearing_deadline';
          timeWindowDescription = `Hari ini, mendekati deadline (${t.endTime || t.dueTime})`;
        } else {
          timeWindowStatus = 'ready_now';
          timeWindowDescription = `Hari ini, batas ${t.endTime || t.dueTime}`;
        }
      } else {
        timeWindowStatus = 'ready_now';
        timeWindowDescription = `Hari ini, siap kapanpun`;
      }
    }

    const isRecurring = Boolean(t.recurrence && t.recurrence !== 'none');
    const recurrenceLabel = t.recurrence === 'daily' ? 'Harian' : t.recurrence === 'weekdays' ? 'Hari Kerja' : t.recurrence === 'weekly' ? 'Mingguan' : t.recurrence === 'monthly' ? 'Bulanan' : '';

    const urgencyLevel: 'Segera' | 'Rutin' | 'Nanti' =
      isPastOverdueTask
        ? 'Segera'
        : isFutureTask
        ? 'Nanti'
        : timeWindowStatus === 'nearing_deadline'
        ? 'Segera'
        : t.priority === 'high'
        ? 'Segera'
        : isRecurring
        ? 'Rutin'
        : t.isToday
        ? 'Rutin'
        : 'Nanti';

    const effortLevel: 'Ringan' | 'Sedang' | 'Tinggi' =
      t.effortHours && t.effortHours >= 3 ? 'Tinggi' : t.effortHours && t.effortHours >= 1 ? 'Sedang' : 'Ringan';
    const estimatedDuration = t.estimatedTime || (t.effortHours ? `${t.effortHours} jam` : '30 - 45 menit');

    let goalScore = 70;
    if (t.priority === 'high') goalScore += 15;
    if (t.isToday) goalScore += 10;
    if (isRecurring) goalScore += 8;
    if (t.inboxType === 'kegiatan') goalScore += 5;
    if (isFutureTask) goalScore -= 15;
    if (timeWindowStatus === 'locked_until_start') goalScore -= 5;
    goalScore = Math.min(100, Math.max(10, goalScore));

    const typeLabel = t.inboxType === 'kegiatan' ? 'Kegiatan/Acara' : t.inboxType === 'pengingat' ? 'Pengingat' : 'Tugas';

    // Kalimat alasan yang sadar TANGGAL, jam mulai, dan batas selesai
    let reason = '';
    if (isFutureTask) {
      reason = `Item ini dijadwalkan untuk ${dateContextLabel}${t.startTime ? ` pukul ${t.startTime}` : ''}. Belum waktunya dieksekusi hari ini; AI mencatatnya agar Anda tetap fokus pada agenda hari ini.`;
    } else if (isPastOverdueTask) {
      reason = `Tenggat item ini telah terlewat sejak tanggal ${formatShortDate(taskDueDateStr)}. Sangat disarankan untuk segera dituntaskan hari ini.`;
    } else if (timeWindowStatus === 'locked_until_start') {
      reason = `Item hari ini memiliki ketentuan baru bisa dimulai pukul ${t.startTime}. Tunggu hingga jam tersebut tiba agar fokus tidak terpecah.`;
    } else if (timeWindowStatus === 'nearing_deadline') {
      reason = `Mendekati batas selesai pukul ${t.endTime || t.dueTime}. Sangat disarankan untuk segera dituntaskan agar tidak terlewat.`;
    } else if (isRecurring) {
      reason = `[Rutinitas ${recurrenceLabel}] Disarankan untuk diselesaikan secara berkala guna menjaga konsistensi kebiasaan harian Anda.`;
    } else if (t.isToday) {
      reason = `Terpilih dalam 5 fokus Today dan sudah berada dalam jendela waktu pengerjaan. Selaras dengan ritme ${circadianState.split('•')[0].trim()}.`;
    } else if (t.priority === 'high') {
      reason = `Prioritas tinggi dalam Inbox dan siap dikerjakan sekarang tanpa hambatan waktu mulai.`;
    } else {
      reason = `Item ${typeLabel} dengan waktu fleksibel yang dapat dikerjakan setelah prioritas Today tuntas.`;
    }

    return {
      taskId: t.id,
      taskTitle: t.title,
      urgencyLevel,
      effortLevel,
      estimatedDuration,
      biologicalFit: isFutureTask
        ? `Dijadwalkan untuk ${dateContextLabel}. Simpan energi untuk tugas hari ini.`
        : isLockedNow
        ? `Terkunci hingga ${t.startTime}. Alokasikan energi untuk tugas lain saat ini.`
        : `${timeSuitabilityNote} Cocok dengan ritme energi saat ini.`,
      goalAlignmentScore: goalScore,
      goalImpact: 'Mendekatkan' as const,
      reason,
      recurrence: t.recurrence,
      dateContextLabel,
      timeWindowStatus,
      timeWindowDescription,
      startTime: t.startTime,
      endTime: t.endTime || t.dueTime,
    };
  });

  // Pilih Top Priority: HANYA dari tugas HARI INI yang SUDAH BISA DIMULAI
  const readyTodayTasks = tasksAnalysis.filter((item) => {
    const orig = tasksToAnalyze.find((t) => t.id === item.taskId);
    const startStr = orig?.startDate || orig?.dueDate || todayDateStr;
    const isFuture = startStr > todayDateStr;
    return !isFuture && item.timeWindowStatus !== 'locked_until_start';
  });

  const poolForTop = readyTodayTasks.length > 0 ? readyTodayTasks : tasksAnalysis;

  // Prioritas sortir: Segera > Today > Skor Goal tertinggi
  const sortedForTop = [...poolForTop].sort((a, b) => {
    const taskA = tasksToAnalyze.find((t) => t.id === a.taskId);
    const taskB = tasksToAnalyze.find((t) => t.id === b.taskId);
    if (a.urgencyLevel === 'Segera' && b.urgencyLevel !== 'Segera') return -1;
    if (a.urgencyLevel !== 'Segera' && b.urgencyLevel === 'Segera') return 1;
    if (taskA?.isToday && !taskB?.isToday) return -1;
    if (!taskA?.isToday && taskB?.isToday) return 1;
    return (b.goalAlignmentScore || 0) - (a.goalAlignmentScore || 0);
  });

  const topPriorityTaskItem = sortedForTop[0];
  const topPriorityTaskId = topPriorityTaskItem?.taskId;

  const todayCount = tasksToAnalyze.filter((t) => t.isToday).length;
  const inboxCount = tasksToAnalyze.filter((t) => !t.isToday).length;
  const lockedCount = tasksAnalysis.filter((t) => t.timeWindowStatus === 'locked_until_start').length;

  let overallSummary = `Terdeteksi ${todayCount} fokus Today dan ${inboxCount} item Inbox aktif. `;
  if (lockedCount > 0) {
    overallSummary += `Terdapat ${lockedCount} item dengan jendela waktu mulai mendatang (belum bisa dimulai sekarang). `;
  }
  overallSummary += `AI merekomendasikan fokus pada "${topPriorityTaskItem?.taskTitle || 'tugas prioritas'}" yang sudah memenuhi jendela waktu pengerjaan dan jam biologis saat ini.`;

  // Urutkan rincian tugas secara terstruktur: Segera > Rutin > Nanti
  const sortedTasksAnalysis = sortTasksAnalysis(tasksAnalysis, tasksToAnalyze, todayDateStr);

  return {
    analyzedAt: now.toISOString(),
    currentTimeFormatted,
    circadianState,
    circadianAdvice,
    topPriorityTaskId,
    overallSummary,
    userGoalContext: userGoal || 'Membangun rutinitas produktif dan seimbang',
    tasksAnalysis: sortedTasksAnalysis,
  };
};

export const sortTasksAnalysis = (
  items: TaskAnalysisItem[],
  tasks: Task[],
  todayDateStr?: string
): TaskAnalysisItem[] => {
  const today = todayDateStr || new Date().toISOString().slice(0, 10);

  const urgencyWeight: Record<string, number> = {
    Segera: 1,
    Rutin: 2,
    Nanti: 3,
  };

  return [...items].sort((a, b) => {
    const weightA = urgencyWeight[a.urgencyLevel] || 2;
    const weightB = urgencyWeight[b.urgencyLevel] || 2;
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    const taskA = tasks.find((t) => t.id === a.taskId);
    const taskB = tasks.find((t) => t.id === b.taskId);

    // Kategori Segera: prioritaskan deadline mepet/terlewat > prioritas tinggi > skor goal
    if (a.urgencyLevel === 'Segera') {
      const aDeadline = a.timeWindowStatus === 'nearing_deadline' ? 1 : 0;
      const bDeadline = b.timeWindowStatus === 'nearing_deadline' ? 1 : 0;
      if (aDeadline !== bDeadline) return bDeadline - aDeadline;

      const aHigh = taskA?.priority === 'high' ? 1 : 0;
      const bHigh = taskB?.priority === 'high' ? 1 : 0;
      if (aHigh !== bHigh) return bHigh - aHigh;

      return (b.goalAlignmentScore || 0) - (a.goalAlignmentScore || 0);
    }

    // Kategori Rutin: prioritaskan yang ada di Today > skor goal
    if (a.urgencyLevel === 'Rutin') {
      const aToday = taskA?.isToday ? 1 : 0;
      const bToday = taskB?.isToday ? 1 : 0;
      if (aToday !== bToday) return bToday - aToday;

      return (b.goalAlignmentScore || 0) - (a.goalAlignmentScore || 0);
    }

    // Kategori Nanti: urutkan tanggal terdekat lebih dulu
    const dateA = taskA?.startDate || taskA?.dueDate || today;
    const dateB = taskB?.startDate || taskB?.dueDate || today;
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return (b.goalAlignmentScore || 0) - (a.goalAlignmentScore || 0);
  });
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
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentDate = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${currentYear}-${currentMonth}-${currentDate}`;

  const tasksDescription = tasksToAnalyze
    .map((t, idx) => {
      const taskDate = t.startDate || t.dueDate || todayDateStr;
      const dateTag =
        taskDate > todayDateStr
          ? `[JADWAL MASA DEPAN: ${taskDate}]`
          : taskDate < todayDateStr
          ? `[TERLEWAT/OVERDUE: ${taskDate}]`
          : `[HARI INI: ${todayDateStr}]`;

      return `${idx + 1}. [ID: ${t.id}] "${t.title}" (Kategori: ${t.inboxType || 'tugas'}, ${dateTag}${
        t.isToday ? ', Di Today: YA' : ', Di Today: TIDAK'
      }, Prioritas: ${t.priority}${
        t.recurrence && t.recurrence !== 'none' ? `, Rutin: ${t.recurrence}` : ''
      }${
        t.startTime ? `, WAKTU BARU BISA DIMULAI: ${t.startTime} (Dilarang dikerjakan sebelum jam ini)` : ''
      }${
        t.endTime || t.dueTime ? `, WAKTU BATAS/DEADLINE: ${t.endTime || t.dueTime}` : ''
      }${t.description ? `, Catatan: ${t.description}` : ''}${
        t.subTasks && t.subTasks.length > 0 ? `, Sub-tugas: [${t.subTasks.map((s) => s.title).join(', ')}]` : ''
      })`;
    })
    .join('\n');

  const goalPromptSection = userGoal
    ? `\nTujuan Besar Hidup Pengguna Tahun Ini: "${userGoal}"\n`
    : '\nTujuan Besar Hidup Pengguna: Produktivitas seimbang, efisien, dan bebas stres.\n';

  const prompt = `Sebagai pakar produktivitas tingkat tinggi, manajemen waktu cerdas, dan chronobiology:

Waktu saat ini: Tanggal ${todayDateStr}, ${currentTimeFormatted}.
${goalPromptSection}
Daftar Tugas Pengguna (mencakup Inbox dan Today):
${tasksDescription}

ATURAN KRUSIAL PENJADWALAN, TANGGAL & WAKTU:
1. "TANGGAL MASA DEPAN": Jika suatu tugas memiliki tanggal di masa mendatang (setelah ${todayDateStr}), tugas tersebut BERSTATUS "locked_until_start" (Dijadwalkan untuk tanggal mendatang), urgensi "Nanti", dan DILARANG KERAS dipilih sebagai topPriorityTaskId hari ini!
2. "WAKTU BARU BISA DIMULAI" (startTime): Untuk tugas HARI INI, jika waktu saat ini (${currentTimeFormatted}) lebih awal dari jam mulai, tugas tersebut BERSTATUS "locked_until_start" dan DILARANG dipilih sebagai topPriorityTaskId!
3. "WAKTU BATAS/DEADLINE" (endTime / dueTime): Jika mendekati batas atau terlewat, berstatus "nearing_deadline" dengan urgensi "Segera".
4. "topPriorityTaskId": HANYA BOLEH dipilih dari tugas HARI INI yang SUDAH BISA DIMULAI pada jam saat ini (${currentTimeFormatted}).

WAJIB hasilkan output HANYA dalam format JSON murni:
{
  "circadianState": "Nama dan fase jam biologis saat ini beserta waktu",
  "circadianAdvice": "Saran pemanfaatan energi dan fokus biologis tubuh saat ini",
  "topPriorityTaskId": "ID tugas yang paling prioritas untuk dikerjakan HARI INI SAAT INI (yang sudah bisa dimulai)",
  "overallSummary": "Ringkasan strategi produktivitas (sebutkan item hari ini vs item masa depan jika ada)",
  "userGoalContext": "${userGoal || ''}",
  "tasksAnalysis": [
    {
      "taskId": "ID tugas persis dari daftar di atas",
      "taskTitle": "Judul tugas",
      "urgencyLevel": "Segera" | "Rutin" | "Nanti",
      "effortLevel": "Ringan" | "Sedang" | "Tinggi",
      "estimatedDuration": "misal 30 menit",
      "biologicalFit": "Kesesuaian jam biologis",
      "goalAlignmentScore": 85,
      "goalImpact": "Mendekatkan",
      "reason": "Alasan rekomendasi yang sadar tanggal dan jam mulai/selesai",
      "dateContextLabel": "misal Hari ini (08 Sep) / Besok (09 Sep) / Terlewat",
      "timeWindowStatus": "ready_now" | "locked_until_start" | "nearing_deadline" | "flexible",
      "timeWindowDescription": "Deskripsi jendela waktu dan tanggalnya",
      "startTime": "HH:mm opsional",
      "endTime": "HH:mm opsional"
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
    const sortedTasksAnalysis = Array.isArray(parsed.tasksAnalysis)
      ? sortTasksAnalysis(parsed.tasksAnalysis, tasksToAnalyze, todayDateStr)
      : [];

    return {
      ...parsed,
      tasksAnalysis: sortedTasksAnalysis,
      analyzedAt: now.toISOString(),
      currentTimeFormatted,
      userGoalContext: userGoal || '',
    } as AIAnalysisResult;
  } catch (err) {
    console.warn('Error during Gemini API call, falling back to smart local analysis:', err);
    return generateLocalCircadianAnalysis(tasks, userGoal);
  }
};
