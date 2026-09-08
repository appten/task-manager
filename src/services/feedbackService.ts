export interface FeedbackItem {
  id: string;
  category: 'Saran Fitur' | 'Laporan Bug' | 'Kritik & Masukan' | 'Lainnya';
  senderName?: string;
  senderEmail?: string;
  message: string;
  createdAt: string; // ISO string
}

const FEEDBACK_STORAGE_KEY = 'ten_my_id_feedbacks_v01';
const MOCK_KV_STORAGE_KEY = 'ten_mock_cloudflare_kv';

export const feedbackService = {
  getFeedbacks(): FeedbackItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      // Fallback cek di mock KV
      const kvRaw = localStorage.getItem(MOCK_KV_STORAGE_KEY);
      if (kvRaw) {
        const kv = JSON.parse(kvRaw);
        if (Array.isArray(kv.feedbacks)) return kv.feedbacks;
      }
      return [];
    } catch {
      return [];
    }
  },

  submitFeedback(item: Omit<FeedbackItem, 'id' | 'createdAt'>): FeedbackItem {
    const currentList = this.getFeedbacks();
    const newFeedback: FeedbackItem = {
      ...item,
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newFeedback, ...currentList];

    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));

      // Simpan juga ke struktur mock Cloudflare KV agar sinkron dengan KV backend
      const rawKv = localStorage.getItem(MOCK_KV_STORAGE_KEY);
      const kvData = rawKv ? JSON.parse(rawKv) : {};
      kvData.feedbacks = updated;
      localStorage.setItem(MOCK_KV_STORAGE_KEY, JSON.stringify(kvData));

      // Dispatch event storage agar halaman /masukkan langsung auto-update jika terbuka
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Gagal menyimpan feedback:', e);
    }

    return newFeedback;
  },

  deleteFeedback(id: string): void {
    const updated = this.getFeedbacks().filter((f) => f.id !== id);
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
      const rawKv = localStorage.getItem(MOCK_KV_STORAGE_KEY);
      if (rawKv) {
        const kvData = JSON.parse(rawKv);
        kvData.feedbacks = updated;
        localStorage.setItem(MOCK_KV_STORAGE_KEY, JSON.stringify(kvData));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Gagal menghapus feedback:', e);
    }
  },

  clearAllFeedbacks(): void {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify([]));
      const rawKv = localStorage.getItem(MOCK_KV_STORAGE_KEY);
      if (rawKv) {
        const kvData = JSON.parse(rawKv);
        kvData.feedbacks = [];
        localStorage.setItem(MOCK_KV_STORAGE_KEY, JSON.stringify(kvData));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Gagal mengosongkan feedback:', e);
    }
  },
};
