import { Task, ScheduledSession, ScheduleComparisonResult, ScheduleItemDiff } from '../types/task';

// Helper: Convert "HH:mm" to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: Convert minutes from midnight to "HH:mm"
export const minutesToTime = (totalMinutes: number): string => {
  const normalized = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Helper: Extract duration in minutes from task
export const getTaskDurationMinutes = (task: Task): number => {
  if (task.effortHours && task.effortHours > 0) {
    return Math.round(task.effortHours * 60);
  }

  if (task.estimatedTime) {
    const text = task.estimatedTime.toLowerCase();
    const jamMatch = text.match(/([\d.]+)\s*(?:jam|hours?)/);
    const menitMatch = text.match(/([\d.]+)\s*(?:menit|mins?|minutes?)/);

    let mins = 0;
    if (jamMatch) mins += parseFloat(jamMatch[1]) * 60;
    if (menitMatch) mins += parseFloat(menitMatch[1]);
    if (mins > 0) return Math.round(mins);
  }

  // Fallback berdasarkan kategori & prioritas
  if (task.isBreakTask) {
    if (task.breakType === 'lunch' || task.breakType === 'dinner') return 45;
    return 15;
  }

  if (task.priority === 'high') return 120; // 2 jam
  if (task.priority === 'medium') return 60; // 1 jam
  return 45; // 45 menit
};

export interface TimeSlot {
  start: number; // minutes
  end: number; // minutes
}

// Helper untuk format menit ke teks ramah (misal: "2 jam", "45m", "1j 30m")
export const minutesToReadable = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
};

/**
 * Membuat Task Pemulihan Energi / Jeda Istirahat Otomatis
 * Ditambahkan agar ritme sirkadian & energi pengguna tetap optimal tanpa burnout.
 */
export const createSmartBreakTask = (
  dateStr: string,
  type: 'lunch' | 'hydration' | 'afternoon' | 'dinner',
  startTimeStr: string,
  durationMinutes: number = 15
): Task => {
  const startMin = timeToMinutes(startTimeStr);
  const endMin = startMin + durationMinutes;
  const endTimeStr = minutesToTime(endMin);

  let title = '☕ Jeda Istirahat & Hidrasi';
  let description = 'Minum air putih, peregangan ringan, dan istirahatkan mata agar fokus kembali tajam.';

  if (type === 'lunch') {
    title = '🍽️ Istirahat Makan Siang & Reset Energi';
    description = 'Makan siang bergizi, hidrasi tubuh, dan rileks sejenak untuk mengisi bahan bakar otak.';
  } else if (type === 'afternoon') {
    title = '🔋 Jeda Pemulihan Energi Sore';
    description = 'Atasi fase penurunan energi sore (afternoon dip) dengan peregangan dan camilan sehat.';
  } else if (type === 'dinner') {
    title = '🍲 Istirahat Makan Malam';
    description = 'Waktu makan malam santai dan jeda dari beban kerja harian.';
  }

  return {
    id: `break-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title,
    description,
    dueDate: dateStr,
    dueTime: endTimeStr,
    startDate: dateStr,
    startTime: startTimeStr,
    endDate: dateStr,
    endTime: endTimeStr,
    isUserStartTimeFixed: true,
    isUserEndTimeFixed: true,
    effortHours: durationMinutes / 60,
    estimatedTime: `${durationMinutes} menit`,
    priority: 'medium',
    category: 'Istirahat',
    isBreakTask: true,
    breakType: type,
    isCompleted: false,
    isAiScheduled: true,
    schedulingNote: 'Jeda istirahat otomatis dari AI untuk menjaga energi dan fokus optimal.',
    subTasks: [
      { id: `sb-${Date.now()}-1`, title: 'Minum 1 gelas air putih', isCompleted: false },
      { id: `sb-${Date.now()}-2`, title: 'Peregangan leher & pundak', isCompleted: false },
    ],
    createdAt: new Date().toISOString(),
  };
};

/**
 * Menyusun dan mengoptimalkan jadwal tugas harian cerdas bebas bentrok (Anti-Collision Scheduler)
 * 
 * Prinsip Utama Sesuai Aturan:
 * 1. Jadwal Mulai (startTime): Tugas HANYA BISA dimulai pada atau setelah waktu ini (Earliest Start Window).
 * 2. Jadwal Selesai (endTime): Tugas HARUS SELESAI sebelum waktu ini (Latest Finish Deadline).
 * 3. Keseimbangan Energi & Waktu Lelah:
 *    Menyisipkan jeda istirahat (Makan Siang & Hidrasi Berkala) agar pengguna tidak burnout.
 */
export const scheduleDailyTasksSmartly = (
  tasksForDay: Task[],
  workDayStart: number = 7 * 60, // 07:00
  workDayEnd: number = 22 * 60, // 22:00
  autoInjectBreaks: boolean = true
): Task[] => {
  if (!tasksForDay || tasksForDay.length === 0) return [];

  // Deep clone tasks
  let workingTasks: Task[] = tasksForDay.map((t) => ({
    ...t,
    scheduledSessions: t.scheduledSessions ? [...t.scheduledSessions] : undefined,
  }));

  // Cek apakah hari ini sudah memiliki blok istirahat
  const hasLunchBreak = workingTasks.some(
    (t) => t.isBreakTask && (t.breakType === 'lunch' || t.title.toLowerCase().includes('makan siang'))
  );

  const activeWorkTasks = workingTasks.filter((t) => !t.isCompleted && !t.isBreakTask);

  // Jika diaktifkan dan ada tugas kerja, pastikan ada Jeda Makan Siang (12:00 - 12:45)
  if (autoInjectBreaks && !hasLunchBreak && activeWorkTasks.length > 0) {
    const lunchBreakTask = createSmartBreakTask(
      workingTasks[0].dueDate,
      'lunch',
      '12:00',
      45
    );
    lunchBreakTask.scheduledSessions = [
      {
        id: `sess-lunch-fixed`,
        startTime: '12:00',
        endTime: '12:45',
        label: 'Makan Siang (45m)',
        date: workingTasks[0].dueDate,
      },
    ];
    workingTasks.push(lunchBreakTask);
  }

  // 1. Kumpulkan interval terkunci (Locked Intervals)
  // Interval yang punya jam mulai dan jam selesai pasti (termasuk istirahat)
  const lockedIntervals: Array<{
    taskId: string;
    start: number;
    end: number;
    allowConcurrent?: boolean;
    isBreak?: boolean;
  }> = [];

  workingTasks.forEach((task) => {
    // Tugas yang punya waktu mulai dan waktu selesai yang sudah pasti
    const hasStart = Boolean(task.startTime);
    const hasEnd = Boolean(task.endTime);

    if (hasStart && hasEnd && task.startTime && task.endTime) {
      const sMin = timeToMinutes(task.startTime);
      let eMin = timeToMinutes(task.endTime);
      if (eMin <= sMin) eMin = sMin + 45;

      if (!task.allowConcurrent) {
        lockedIntervals.push({
          taskId: task.id,
          start: sMin,
          end: eMin,
          allowConcurrent: false,
          isBreak: task.isBreakTask,
        });
      }

      task.scheduledSessions = [
        {
          id: `sess-${task.id}-fixed`,
          startTime: task.startTime,
          endTime: task.endTime,
          label: task.isBreakTask
            ? `Jeda Rehat (${minutesToReadable(eMin - sMin)})`
            : `Jadwal (${minutesToReadable(eMin - sMin)})`,
          date: task.dueDate,
        },
      ];
      task.isAiScheduled = true;
    }
  });

  lockedIntervals.sort((a, b) => a.start - b.start);

  // Helper mencari slot kosong berikutnya dalam rentang waktu yang diizinkan [earliestAllowed, latestAllowed]
  const findFreeSlotInRange = (
    afterMinute: number,
    minDuration: number,
    earliestAllowed: number,
    latestAllowed: number
  ): TimeSlot | null => {
    let current = Math.max(afterMinute, earliestAllowed);

    while (current + minDuration <= latestAllowed) {
      // Cari apakah current bertabrakan dengan locked intervals
      const collision = lockedIntervals.find(
        (lock) => !lock.allowConcurrent && lock.start < current + minDuration && lock.end > current
      );

      if (collision) {
        current = collision.end;
        continue;
      }

      // Cari batas akhir slot kosong ini sebelum tabrakan berikutnya
      const nextLock = lockedIntervals.find(
        (lock) => !lock.allowConcurrent && lock.start > current && lock.start < latestAllowed
      );
      const slotEnd = nextLock ? Math.min(nextLock.start, latestAllowed) : latestAllowed;

      if (slotEnd - current >= minDuration) {
        return { start: current, end: slotEnd };
      }

      current = slotEnd;
    }

    return null;
  };

  // 2. PROSES TUGAS DENGAN ATURAN JADWAL MULAI (Hanya boleh mulai >= startTime)
  // Tugas yang memiliki startTime, tetapi belum punya endTime
  workingTasks.forEach((task) => {
    if (task.startTime && !task.endTime) {
      const earliestStart = Math.max(workDayStart, timeToMinutes(task.startTime));
      const totalDurationNeeded = getTaskDurationMinutes(task);
      let remainingDuration = totalDurationNeeded;
      let currentSessionStart = earliestStart;
      const sessions: ScheduledSession[] = [];
      let sessionIndex = 1;

      while (remainingDuration > 0 && currentSessionStart < workDayEnd) {
        // Cari tabrakan berikutnya setelah currentSessionStart
        const nextLock = lockedIntervals.find(
          (lock) => lock.taskId !== task.id && !lock.allowConcurrent && lock.start > currentSessionStart
        );

        // Batas maksimal sesi kerja tanpa jeda (maksimal 90 menit sebelum butuh jeda 15m)
        const maxContinuousWork = 90;
        const targetDuration = Math.min(remainingDuration, maxContinuousWork);

        const possibleEnd = nextLock
          ? Math.min(nextLock.start, currentSessionStart + targetDuration)
          : Math.min(workDayEnd, currentSessionStart + targetDuration);

        const sessionDuration = possibleEnd - currentSessionStart;

        if (sessionDuration >= 20) {
          const sEnd = possibleEnd;
          sessions.push({
            id: `sess-${task.id}-${sessionIndex}`,
            startTime: minutesToTime(currentSessionStart),
            endTime: minutesToTime(sEnd),
            label: `Sesi ${sessionIndex} (${minutesToReadable(sessionDuration)})`,
            date: task.dueDate,
          });

          // Daftarkan ke locked interval
          if (!task.allowConcurrent) {
            lockedIntervals.push({
              taskId: task.id,
              start: currentSessionStart,
              end: sEnd,
            });
            lockedIntervals.sort((a, b) => a.start - b.start);
          }

          remainingDuration -= sessionDuration;
          sessionIndex++;

          // Jika masih ada sisa pengerjaan dan baru saja kerja >= 75 menit,
          // beri jeda hidrasi otomatis 15 menit sebelum lanjut
          if (remainingDuration > 0 && sessionDuration >= 75) {
            currentSessionStart = sEnd + 15; // Beri jeda 15 menit
          } else {
            currentSessionStart = sEnd;
          }
        } else {
          // Slot terlalu sempit, lompat ke setelah penghalang
          currentSessionStart = nextLock ? nextLock.end : currentSessionStart + 30;
        }

        if (remainingDuration > 0) {
          const nextSlot = findFreeSlotInRange(currentSessionStart, Math.min(25, remainingDuration), earliestStart, workDayEnd);
          if (nextSlot) {
            currentSessionStart = nextSlot.start;
          } else {
            break;
          }
        }
      }

      task.scheduledSessions = sessions;
      task.isAiScheduled = true;

      if (sessions.length > 0) {
        task.startTime = sessions[0].startTime;
        task.endTime = sessions[sessions.length - 1].endTime;
        if (sessions.length > 1) {
          task.schedulingNote = `AI membagi tugas ini menjadi ${sessions.length} sesi kerja dengan jeda istirahat agar energi tetap terjaga.`;
        } else {
          task.schedulingNote = `AI menjadwalkan mulai jam ${task.startTime} (sesuai waktu mulai terawal) dan selesai jam ${task.endTime}.`;
        }
      }
    }
  });

  // 3. PROSES TUGAS DENGAN ATURAN BATAS SELESAI (Harus selesai <= endTime/dueTime)
  // Tugas yang hanya memiliki endTime tetapi belum punya startTime
  workingTasks.forEach((task) => {
    if (!task.startTime && task.endTime) {
      const latestEnd = Math.min(workDayEnd, timeToMinutes(task.endTime));
      const totalDurationNeeded = getTaskDurationMinutes(task);

      // Hitung mundur mencari slot yang berakhir SEBELUM latestEnd
      let targetStart = Math.max(workDayStart, latestEnd - totalDurationNeeded);

      // Pastikan tidak melanggar locked interval
      const collision = lockedIntervals.find(
        (lock) => lock.taskId !== task.id && !lock.allowConcurrent && lock.start < latestEnd && lock.end > targetStart
      );

      if (collision) {
        // Cari slot kosong sebelum collision yang masih muat
        targetStart = Math.max(workDayStart, collision.start - totalDurationNeeded);
      }

      const allocatedEnd = Math.min(latestEnd, targetStart + totalDurationNeeded);

      task.startTime = minutesToTime(targetStart);
      task.scheduledSessions = [
        {
          id: `sess-${task.id}-deadline`,
          startTime: task.startTime,
          endTime: minutesToTime(allocatedEnd),
          label: `Sesi Deadline (${minutesToReadable(allocatedEnd - targetStart)})`,
          date: task.dueDate,
        },
      ];
      task.isAiScheduled = true;
      task.schedulingNote = `AI mengatur mulai pukul ${task.startTime} agar tugas tuntas sebelum batas akhir pukul ${task.endTime}.`;

      if (!task.allowConcurrent) {
        lockedIntervals.push({
          taskId: task.id,
          start: targetStart,
          end: allocatedEnd,
        });
        lockedIntervals.sort((a, b) => a.start - b.start);
      }
    }
  });

  // 4. PROSES TUGAS BEBAS (Belum memiliki startTime maupun endTime)
  // Tempatkan di slot-slot kosong terbaik dengan rotasi prioritas
  const unallocatedTasks = workingTasks.filter(
    (t) => !t.isBreakTask && (!t.scheduledSessions || t.scheduledSessions.length === 0)
  );

  unallocatedTasks.sort((a, b) => {
    const pOrder = { high: 3, medium: 2, low: 1 };
    return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
  });

  unallocatedTasks.forEach((task) => {
    const durationNeeded = getTaskDurationMinutes(task);
    const freeSlot = findFreeSlotInRange(workDayStart, Math.min(30, durationNeeded), workDayStart, workDayEnd);

    if (freeSlot) {
      const sStart = freeSlot.start;
      const sEnd = Math.min(freeSlot.end, sStart + durationNeeded);

      task.startTime = minutesToTime(sStart);
      task.endTime = minutesToTime(sEnd);
      task.scheduledSessions = [
        {
          id: `sess-${task.id}-auto`,
          startTime: task.startTime,
          endTime: task.endTime,
          label: `Alokasi AI (${minutesToReadable(sEnd - sStart)})`,
          date: task.dueDate,
        },
      ];
      task.isAiScheduled = true;
      task.schedulingNote = `AI mengalokasikan slot optimal ${task.startTime} - ${task.endTime} tanpa menabrak jam istirahat.`;

      if (!task.allowConcurrent) {
        lockedIntervals.push({
          taskId: task.id,
          start: sStart,
          end: sEnd,
        });
        lockedIntervals.sort((a, b) => a.start - b.start);
      }
    }
  });

  // Urutkan seluruh tugas harian berdasarkan jam mulai pengerjaan
  workingTasks.sort((a, b) => {
    const aStart = a.startTime ? timeToMinutes(a.startTime) : 9999;
    const bStart = b.startTime ? timeToMinutes(b.startTime) : 9999;
    return aStart - bStart;
  });

  return workingTasks;
};

/**
 * Membandingkan jadwal asli (sebelum) dengan jadwal rekomendasi AI (sesudah)
 * dan mengidentifikasi pergeseran jam, pemisahan sesi, serta penambahan waktu istirahat.
 */
export const compareSchedules = (
  originalTasks: Task[],
  aiTasks: Task[]
): ScheduleComparisonResult => {
  const diffs: ScheduleItemDiff[] = [];
  let rescheduledCount = 0;
  let breaksAddedCount = 0;
  let splitCount = 0;
  let unchangedCount = 0;

  const origMap = new Map<string, Task>();
  originalTasks.forEach((t) => origMap.set(t.id, t));

  aiTasks.forEach((aiTask) => {
    const orig = origMap.get(aiTask.id);

    if (aiTask.isBreakTask && !orig) {
      breaksAddedCount++;
      diffs.push({
        taskId: aiTask.id,
        taskTitle: aiTask.title,
        isBreakTask: true,
        breakType: aiTask.breakType,
        changeType: 'added_break',
        beforeTime: 'Belum ada jeda istirahat',
        afterTime: `${aiTask.startTime || aiTask.dueTime || '12:00'} - ${aiTask.endTime || '12:45'}`,
        reason:
          aiTask.description ||
          'Jeda pemulihan energi disisipkan oleh AI agar stamina dan fokus tetap optimal.',
        priority: aiTask.priority,
        category: aiTask.category,
      });
      return;
    }

    if (!orig) {
      diffs.push({
        taskId: aiTask.id,
        taskTitle: aiTask.title,
        changeType: 'rescheduled',
        beforeTime: 'Belum diatur jam',
        afterTime: `${aiTask.startTime || '-'} - ${aiTask.endTime || '-'}`,
        afterSessions: aiTask.scheduledSessions,
        reason: aiTask.schedulingNote || 'Dijadwalkan oleh AI',
        priority: aiTask.priority,
        category: aiTask.category,
      });
      return;
    }

    const beforeTimeDisplay = orig.startTime
      ? orig.endTime
        ? `${orig.startTime} - ${orig.endTime}`
        : `Mulai ${orig.startTime}`
      : orig.dueTime
      ? `Tenggat ${orig.dueTime}`
      : 'Belum ada jam pengerjaan';

    const beforeWindowDisplay =
      orig.startTime || orig.endTime
        ? `${orig.startTime ? `Mulai ≥ ${orig.startTime}` : ''}${
            orig.startTime && orig.endTime ? ' | ' : ''
          }${orig.endTime ? `Selesai ≤ ${orig.endTime}` : ''}`
        : undefined;

    const afterTimeDisplay =
      aiTask.scheduledSessions && aiTask.scheduledSessions.length > 0
        ? aiTask.scheduledSessions.map((s) => `${s.startTime} - ${s.endTime}`).join(', ')
        : aiTask.startTime && aiTask.endTime
        ? `${aiTask.startTime} - ${aiTask.endTime}`
        : aiTask.dueTime || 'Fleksibel';

    const isSplit = (aiTask.scheduledSessions?.length || 0) > 1;
    if (isSplit) {
      splitCount++;
    }

    const hasTimeChanged =
      orig.startTime !== aiTask.startTime ||
      orig.endTime !== aiTask.endTime ||
      isSplit;

    if (hasTimeChanged) {
      rescheduledCount++;
      diffs.push({
        taskId: aiTask.id,
        taskTitle: aiTask.title,
        isBreakTask: aiTask.isBreakTask,
        changeType: isSplit ? 'split' : 'rescheduled',
        beforeTime: beforeTimeDisplay,
        beforeWindow: beforeWindowDisplay,
        afterTime: afterTimeDisplay,
        afterSessions: aiTask.scheduledSessions,
        reason:
          aiTask.schedulingNote ||
          (isSplit
            ? `Dibagi menjadi ${aiTask.scheduledSessions?.length} sesi agar tidak bentrok dengan kegiatan lain.`
            : `Disesuaikan ke slot ${afterTimeDisplay} dengan tetap mematuhi batas jam mulai/selesai.`),
        priority: aiTask.priority,
        category: aiTask.category,
      });
    } else {
      unchangedCount++;
      diffs.push({
        taskId: aiTask.id,
        taskTitle: aiTask.title,
        isBreakTask: aiTask.isBreakTask,
        changeType: 'unchanged',
        beforeTime: beforeTimeDisplay,
        beforeWindow: beforeWindowDisplay,
        afterTime: afterTimeDisplay,
        afterSessions: aiTask.scheduledSessions,
        reason: 'Jadwal jam pengerjaan asli sudah optimal dan tidak bentrok.',
        priority: aiTask.priority,
        category: aiTask.category,
      });
    }
  });

  const dateStr = aiTasks[0]?.dueDate || originalTasks[0]?.dueDate || '';

  return {
    dateStr,
    originalTasks,
    aiTasks,
    diffs,
    summary: {
      totalTasks: aiTasks.length,
      rescheduledCount,
      breaksAddedCount,
      splitCount,
      unchangedCount,
      energyProtectionNote:
        breaksAddedCount > 0
          ? `${breaksAddedCount} jeda istirahat disisipkan untuk menjaga energi tetap optimal.`
          : 'Ritme kerja seimbang tanpa kelelahan berlebih.',
    },
  };
};
