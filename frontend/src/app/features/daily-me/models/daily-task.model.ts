export interface DailyTask {
  id?: number;
  patientId: string;
  title: string;
  taskType: string;
  scheduledTime: string;
  taskDate?: string;     // ✅ add this
  notes?: string;
  completed?: boolean;
}