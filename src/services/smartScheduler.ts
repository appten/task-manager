import { Task, ScheduledSession } from '../types/task';

// Helper: Convert "HH:mm" to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: Convert minutes from midnight to "HH:mm"
export const minutesToTime = (totalMinutes: number): string => {
  const normalized = Math.max(0, Math.min(1439, totalMinutes));
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

  // Fallback based on priority
  if (task.priority === 'high') return 120; // 2 jam
  if (task.priority === 'medium') return 60; // 1 jam
  return 45; // 45 menit
};

export interface TimeSlot {
  start: number; // minutes
  end: number; // minutes
}

/**
 * Membagi dan menyusun slot waktu tugas harian cerdas bebas bentrok (Anti-Collision Scheduler)
 * Menjaga jadwal yang ditentukan user (tetap/fixed) dan mengalokasikan sesi terpisah (split sessions)
 * jika tugas panjang terpotong oleh tugas lain.
 */
export const scheduleDailyTasksSmartly = (
  tasksForDay: Task[],
  workDayStart: number = 7 * 60, // 07:00
  workDayEnd: number = 21 * 60 // 21:00
): Task[] => {
  if (!tasksForDay || tasksForDay.length === 0) return [];

  // Deep clone tasks to avoid mutating state directly
  const updatedTasks: Task[] = tasksForDay.map((t) => ({
    ...t,
    scheduledSessions: t.scheduledSessions ? [...t.scheduledSessions] : undefined,
  }));

  // 1. Identifikasi slot terkunci dari user yang tidak boleh diubah (User-Fixed Constraints)
  // Tugas yang memiliki startTime & endTime pasti yang ditentukan user
  const lockedIntervals: Array<{ taskId: string; start: number; end: number; allowConcurrent?: boolean }> = [];

  updatedTasks.forEach((task) => {
    const hasFixedStart = Boolean(task.startTime && (task.isUserStartTimeFixed || !task.isAiScheduled));
    const hasFixedEnd = Boolean(task.endTime && (task.isUserEndTimeFixed || !task.isAiScheduled));

    if (hasFixedStart && hasFixedEnd && task.startTime && task.endTime) {
      const sMin = timeToMinutes(task.startTime);
      let eMin = timeToMinutes(task.endTime);
      if (eMin <= sMin) eMin = sMin + 60; // Minimal 1 jam jika end <= start

      if (!task.allowConcurrent) {
        lockedIntervals.push({
          taskId: task.id,
          start: sMin,
          end: eMin,
          allowConcurrent: false,
        });
      }

      task.scheduledSessions = [
        {
          id: `sess-${task.id}-fixed`,
          startTime: task.startTime,
          endTime: task.endTime,
          label: `Jadwal Tetap (${minutesToReadable(eMin - sMin)})`,
          date: task.dueDate,
        },
      ];
    }
  });

  // Urutkan locked intervals berdasarkan start
  lockedIntervals.sort((a, b) => a.start - b.start);

  // Helper untuk mencari apakah suatu rentang waktu bertabrakan dengan locked intervals
  const getCollision = (start: number, end: number, excludeTaskId?: string) => {
    return lockedIntervals.find(
      (lock) => lock.taskId !== excludeTaskId && !lock.allowConcurrent && Math.max(start, lock.start) < Math.min(end, lock.end)
    );
  };

  // Helper untuk mencari slot kosong berikutnya yang tersedia setelah menit tertentu
  const findNextFreeSlot = (afterMinute: number, minDurationNeeded: number): TimeSlot | null => {
    let current = Math.max(workDayStart, afterMinute);

    while (current + 15 <= workDayEnd) {
      const collision = lockedIntervals.find(
        (lock) => !lock.allowConcurrent && lock.start <= current && lock.end > current
      );

      if (collision) {
        current = collision.end;
        continue;
      }

      // Cari batas akhir slot kosong ini sebelum tabrakan berikutnya
      const nextLocked = lockedIntervals.find(
        (lock) => !lock.allowConcurrent && lock.start > current
      );
      const slotEnd = nextLocked ? Math.min(nextLocked.start, workDayEnd) : workDayEnd;
      const available = slotEnd - current;

      if (available >= 20) {
        // Slot setidaknya 20 menit
        return { start: current, end: slotEnd };
      }

      current = slotEnd;
    }

    return null;
  };

  // 2. Proses tugas yang HANYA memiliki jam mulai (seperti contoh spesifik user:
  // "mulai jam 7 pagi, butuh 5 jam, tapi ada tugas jam 9 pagi")
  updatedTasks.forEach((task) => {
    const hasFixedStart = Boolean(task.startTime);
    const hasFixedEnd = Boolean(task.endTime && (task.isUserEndTimeFixed || !task.isAiScheduled));

    // Tugas yang punya start time tapi belum punya end time fixed
    if (hasFixedStart && !hasFixedEnd && task.startTime) {
      const startMin = timeToMinutes(task.startTime);
      const totalDurationNeeded = getTaskDurationMinutes(task);
      let remainingDuration = totalDurationNeeded;
      let currentSessionStart = startMin;
      const sessions: ScheduledSession[] = [];

      let sessionIndex = 1;

      while (remainingDuration > 0 && currentSessionStart < workDayEnd) {
        // Cek apakah ada tugas lain yang menghalangi dari currentSessionStart
        const nextLock = lockedIntervals.find(
          (lock) => lock.taskId !== task.id && !lock.allowConcurrent && lock.start > currentSessionStart
        );

        const possibleEnd = nextLock
          ? Math.min(nextLock.start, currentSessionStart + remainingDuration)
          : Math.min(workDayEnd, currentSessionStart + remainingDuration);

        const sessionDuration = possibleEnd - currentSessionStart;

        if (sessionDuration >= 20) {
          // Buat sesi
          const sEnd = possibleEnd;
          sessions.push({
            id: `sess-${task.id}-${sessionIndex}`,
            startTime: minutesToTime(currentSessionStart),
            endTime: minutesToTime(sEnd),
            label: `Sesi ${sessionIndex} (${minutesToReadable(sessionDuration)})`,
            date: task.dueDate,
          });

          // Daftarkan sesi ini ke locked intervals agar tugas berikutnya tidak menabrak
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
        }

        if (remainingDuration > 0) {
          // Cari slot bebas berikutnya setelah rintangan
          const afterTime = nextLock ? nextLock.end : currentSessionStart + sessionDuration;
          const nextSlot = findNextFreeSlot(afterTime, Math.min(30, remainingDuration));
          if (nextSlot) {
            currentSessionStart = nextSlot.start;
          } else {
            // Hari sudah penuh
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
          task.schedulingNote = `AI membagi tugas ini menjadi ${sessions.length} sesi untuk menyesuaikan jadwal tugas lain tanpa bentrok.`;
        } else {
          task.schedulingNote = `AI menjadwalkan estimasi selesai pada ${task.endTime}.`;
        }
      }
    }
  });

  // 3. Proses tugas yang HANYA memiliki jam selesai (dueTime/endTime saja)
  updatedTasks.forEach((task) => {
    const hasFixedStart = Boolean(task.startTime);
    const hasFixedEnd = Boolean(task.endTime);

    if (!hasFixedStart && hasFixedEnd && task.endTime) {
      const endMin = timeToMinutes(task.endTime);
      const totalDurationNeeded = getTaskDurationMinutes(task);

      // Hitung mundur mencari slot sebelum endMin
      let targetStart = Math.max(workDayStart, endMin - totalDurationNeeded);

      // Pastikan tidak tabrakan
      const collision = getCollision(targetStart, endMin, task.id);
      if (collision) {
        // Jika tabrakan sebelum end, geser ke slot kosong terdekat sebelum end
        targetStart = Math.max(workDayStart, collision.start - totalDurationNeeded);
      }

      const allocatedEnd = Math.min(endMin, targetStart + totalDurationNeeded);

      task.startTime = minutesToTime(targetStart);
      task.scheduledSessions = [
        {
          id: `sess-${task.id}-backward`,
          startTime: task.startTime,
          endTime: task.endTime,
          label: `Sesi Persiapan (${minutesToReadable(allocatedEnd - targetStart)})`,
          date: task.dueDate,
        },
      ];
      task.isAiScheduled = true;
      task.schedulingNote = `AI menghitung mundur mulai jam ${task.startTime} agar selesai tepat waktu.`;

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

  // 4. Proses tugas yang BELUM memiliki jam sama sekali (unallocated)
  // Urutkan berdasarkan prioritas (high > medium > low)
  const unassignedTasks = updatedTasks.filter(
    (t) => (!t.startTime && !t.endTime) || (!t.scheduledSessions || t.scheduledSessions.length === 0)
  );

  unassignedTasks.sort((a, b) => {
    const pOrder = { high: 3, medium: 2, low: 1 };
    return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
  });

  unassignedTasks.forEach((task) => {
    const durationNeeded = getTaskDurationMinutes(task);
    const freeSlot = findNextFreeSlot(workDayStart, Math.min(30, durationNeeded));

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
      task.schedulingNote = `AI menempatkan tugas di slot kosong ${task.startTime} - ${task.endTime} sesuai prioritas.`;

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

  return updatedTasks;
};

// Helper untuk format menit ke teks (misal: "2 jam", "30 menit", "1 jam 15 menit")
export const minutesToReadable = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h} jam`;
};
