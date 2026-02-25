import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DailyTask } from '../models/daily-task.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DailyTaskService {
  private baseUrl = 'http://localhost:8098/dailyme/api/daily-tasks';

  constructor(private http: HttpClient) {}

  // ✅ ACTIVE tasks
  getTasksByPatient(patientId: string): Observable<DailyTask[]> {
    return this.http.get<DailyTask[]>(
      `${this.baseUrl}/patient/${patientId}`,
      {
        headers: { 'Cache-Control': 'no-cache' },
        params: { _: Date.now().toString() } // anti-cache
      }
    );
  }

  // ✅ HISTORY tasks
  getHistoryByPatient(patientId: string): Observable<DailyTask[]> {
    return this.http.get<DailyTask[]>(
      `${this.baseUrl}/patient/${patientId}/history`,
      {
        headers: { 'Cache-Control': 'no-cache' },
        params: { _: Date.now().toString() } // anti-cache
      }
    );
  }

  addTask(task: DailyTask): Observable<DailyTask> {
    const payload = this.fixPayload(task);
    console.log('SERVICE PAYLOAD JSON:', JSON.stringify(payload, null, 2));
    return this.http.post<DailyTask>(this.baseUrl, payload);
  }

  updateTask(task: DailyTask): Observable<DailyTask> {
    const payload = this.fixPayload(task);
    return this.http.put<DailyTask>(`${this.baseUrl}/${task.id}`, payload);
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      responseType: 'text'
    });
  }

  setCompleted(id: number, completed: boolean): Observable<DailyTask> {
    return this.http.patch<DailyTask>(`${this.baseUrl}/${id}/completed`, { completed });
  }

  // ---- helpers ----
  private fixPayload(task: DailyTask): DailyTask {
    return {
      ...task,
      scheduledTime: this.toHHmm(task.scheduledTime),
      taskType: (task.taskType || 'OTHER').toUpperCase() as any,
      title: (task.title || '').trim(),
      notes: task.notes || '',
      patientId: String(task.patientId || ''),
      completed: !!task.completed
    };
  }

  private toHHmm(time: string): string {
    if (!time) return '08:00';
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return time;

    const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = m[2];
      const mod = m[3].toUpperCase();
      if (mod === 'PM' && h < 12) h += 12;
      if (mod === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${min}`;
    }
    return '08:00';
  }
}