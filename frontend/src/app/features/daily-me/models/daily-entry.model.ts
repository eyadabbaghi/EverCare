export interface DailyEntry {
  id?: number;
  patientId: string;      // ✅ UUID string
  entryDate: string;      // "YYYY-MM-DD"
  dailyEmotion: string;   // "Happy" | "Neutral" | "Sad" ...
  notes: string;
}

