import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartConfiguration } from 'chart.js';

import { DailyTask } from '../models/daily-task.model';
import { DailyTaskService } from '../services/daily-task.service';
import { AuthService } from '../../front-office/pages/login/auth.service';

// ✅ adjust these two paths to YOUR project if needed
import { DailyMeService } from '../../daily-me/services/daily-me.service';
import { DailyEntry } from '../../daily-me/models/daily-entry.model';

type TabMode = 'ACTIVE' | 'HISTORY';
type MoodKey = 'Happy' | 'Neutral' | 'Sad' | 'Anxious' | 'Angry' | 'Tired' | 'Excited' | 'Calm';

@Component({
  selector: 'app-daily-task-list',
  templateUrl: './daily-task-list.component.html',
  styleUrls: ['./daily-task-list.component.css']
})
export class DailyTaskListComponent implements OnInit, OnDestroy, OnChanges {

  // ✅ Doctor view passes a patientId here => read-only mode
  @Input() patientIdInput: string = '';

  tasks: DailyTask[] = [];          // active
  historyTasks: DailyTask[] = [];   // history

  private sub = new Subscription();
  activeTab: TabMode = 'ACTIVE';

  // ✅ CRUD modal (patient only)
  isModalOpen = false;
  isEditing = false;
  currentTask: DailyTask = this.emptyTask();

  private patientId: string = '';

  // ✅ Read-only mode (doctor/caregiver)
  isReadOnly = false;
  private roleLower: string = 'patient';

  // ✅ Search + filter + sort
  searchTerm: string = '';
  filterType: string = 'ALL';
  filterStatus: string = 'ALL';
  sortMode: string = 'TIME';

  // =====================================================
  // ✅ DOCTOR DASHBOARD (charts + risk + clinical notes)
  // =====================================================

  // Doughnut: type distribution
  typeChartData: ChartConfiguration<'doughnut'>['data'] | null = null;
  typeChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  // Line: weekly completion trend
  trendChartData: ChartConfiguration<'line'>['data'] | null = null;
  trendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
    plugins: { legend: { display: false } }
  };

  // Risk UI
  riskLevelText: string = '—';
  riskHintText: string = '';
  riskLevelClass: string = 'risk-mid';

  // Trend UI
  trendText: string = 'Stable';
  trendHint: string = '';

  // AI Recommendations (rule-based)
  aiRecommendations: string[] = [];

  // =====================================================
  // ✅ PATIENT “Métier avancé” (Top 3)
  // =====================================================

  // 1) Adherence score (0–100) + explainability
  patientAdherenceScore: number = 0;
  patientAdherenceLabel: string = '—';
  patientAdherenceClass: string = 'score-mid';
  patientWhy: string[] = [];

  // 2) Best time to succeed
  bestTimeSlotText: string = '—';
  worstTimeSlotText: string = '—';
  bestTimeHint: string = '';

  // ✅ MUST MATCH YOUR HTML NAMES (you had errors because of mismatches)
  bestTimeChartData: ChartConfiguration<'bar'>['data'] | null = null;
  bestTimeChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
    plugins: { legend: { display: false } }
  };

  // 3) Mood ↔ task completion correlation table + chart
  // ✅ IMPORTANT: HTML uses r.completion (NOT completionRate)
  moodCorrelationRows: { mood: MoodKey; completion: number; days: number }[] = [];
  moodCorrelationHint: string = 'Add at least 2 mood check-ins to unlock correlations.';

  moodCorrChartData: ChartConfiguration<'bar'>['data'] | null = null;
  moodCorrChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } },
    plugins: { legend: { display: false } }
  };

  private moodEntries: DailyEntry[] = [];

  constructor(
    private taskService: DailyTaskService,
    private auth: AuthService,
    private dailyMeService: DailyMeService
  ) {}

  ngOnInit(): void {
    // ✅ Doctor mode => patientIdInput provided => READ ONLY
    if (this.patientIdInput && this.patientIdInput.trim() !== '') {
      this.patientId = this.patientIdInput.trim();
      this.isReadOnly = true;
      this.activeTab = 'ACTIVE';
      this.loadActive();
      this.loadHistory();
      return;
    }

    // ✅ Patient mode => use logged userId
    this.sub.add(
      this.auth.currentUser$.subscribe((u: any) => {
        this.roleLower = String(u?.role || '').toLowerCase();
        this.isReadOnly = this.roleLower !== 'patient';

        this.patientId = String(u?.userId || '');
        if (this.patientId && this.patientId.trim() !== '') {
          this.loadActive();
          this.loadHistory();

          // Patient insights need mood entries
          if (!this.isReadOnly) {
            this.loadMoodEntriesForPatient(this.patientId);
          }
        } else {
          this.tasks = [];
          this.historyTasks = [];
          this.moodEntries = [];
          this.rebuildDoctorDashboard();
          this.rebuildPatientInsights();
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    // ✅ Doctor switches patient while component alive
    if (changes['patientIdInput']) {
      const newId = String(this.patientIdInput || '').trim();
      if (newId !== '' && newId !== this.patientId) {
        this.patientId = newId;
        this.isReadOnly = true;
        this.activeTab = 'ACTIVE';
        this.loadActive();
        this.loadHistory();
      }
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // =====================================================
  // ✅ Load tasks
  // =====================================================
  loadActive(): void {
    if (!this.patientId) {
      this.tasks = [];
      this.rebuildDoctorDashboard();
      this.rebuildPatientInsights();
      return;
    }

    this.sub.add(
      this.taskService.getTasksByPatient(this.patientId).subscribe({
        next: (data) => {
          this.tasks = data || [];
          this.rebuildDoctorDashboard();
          this.rebuildPatientInsights();
        },
        error: (err) => {
          console.error('Load ACTIVE tasks failed:', err);
          this.tasks = [];
          this.rebuildDoctorDashboard();
          this.rebuildPatientInsights();
        }
      })
    );
  }

  loadHistory(): void {
    if (!this.patientId) {
      this.historyTasks = [];
      this.rebuildDoctorDashboard();
      this.rebuildPatientInsights();
      return;
    }

    this.sub.add(
      this.taskService.getHistoryByPatient(this.patientId).subscribe({
        next: (data) => {
          this.historyTasks = data || [];
          this.rebuildDoctorDashboard();
          this.rebuildPatientInsights();
        },
        error: (err) => {
          console.error('Load HISTORY tasks failed:', err);
          this.historyTasks = [];
          this.rebuildDoctorDashboard();
          this.rebuildPatientInsights();
        }
      })
    );
  }

  private loadMoodEntriesForPatient(patientId: string): void {
    // Expected: getEntriesByPatient(patientId) => Observable<DailyEntry[]>
    this.sub.add(
      this.dailyMeService.getEntriesByPatient(patientId).subscribe({
        next: (list: DailyEntry[]) => {
          this.moodEntries = list || [];
          this.rebuildPatientInsights();
        },
        error: (err: any) => {
          console.warn('Mood entries load failed (patient insights partial):', err);
          this.moodEntries = [];
          this.rebuildPatientInsights();
        }
      })
    );
  }

  setTab(tab: TabMode): void {
    this.activeTab = tab;
    if (tab === 'ACTIVE') this.loadActive();
    else this.loadHistory();
  }

  // =====================================================
  // ✅ KPIs (shared)
  // =====================================================
  get completedCount(): number {
    let c = 0;
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].completed) c++;
    }
    return c;
  }

  get totalCount(): number {
    return this.tasks.length;
  }

  get progressPercent(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  // =====================================================
  // ✅ Doctor KPIs (used by doctor HTML)
  // =====================================================
  get analysisTotalActive(): number {
    return this.tasks.length;
  }

  get analysisCompletedActive(): number {
    let c = 0;
    for (let i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].completed) c++;
    }
    return c;
  }

  get analysisCompletionRate(): number {
    if (this.analysisTotalActive === 0) return 0;
    return Math.round((this.analysisCompletedActive / this.analysisTotalActive) * 100);
  }

  get analysisMissedCount(): number {
    // history = archived (24h+) : MISSED => completed=false
    let missed = 0;
    for (let i = 0; i < this.historyTasks.length; i++) {
      if (!this.historyTasks[i].completed) missed++;
    }
    return missed;
  }

  get analysisMostCommonType(): string {
    const counts: { [key: string]: number } = {};
    const all: DailyTask[] = [...(this.tasks || []), ...(this.historyTasks || [])];

    for (let i = 0; i < all.length; i++) {
      const type = String(all[i].taskType || 'OTHER');
      counts[type] = (counts[type] || 0) + 1;
    }

    const keys = Object.keys(counts);
    if (keys.length === 0) return '—';

    let bestType = '—';
    let bestCount = 0;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (counts[k] > bestCount) {
        bestCount = counts[k];
        bestType = k;
      }
    }
    return bestType;
  }

  // =====================================================
  // ✅ Doctor dashboard builders
  // =====================================================
  private rebuildDoctorDashboard(): void {
    if (!this.isReadOnly) return;

    this.buildTypeChart();
    this.buildTrendChart();
    this.buildRisk();
    this.buildAIRecommendations();
  }

  private buildTypeChart(): void {
    const counts: { [key: string]: number } = {};
    const all = [...(this.tasks || []), ...(this.historyTasks || [])];

    for (let i = 0; i < all.length; i++) {
      const type = String(all[i].taskType || 'OTHER');
      counts[type] = (counts[type] || 0) + 1;
    }

    const labels = Object.keys(counts);
    if (labels.length === 0) {
      this.typeChartData = null;
      return;
    }

    const values = labels.map(k => counts[k]);

    this.typeChartData = {
      labels,
      datasets: [{ data: values }]
    };
  }

  private buildTrendChart(): void {
    const all: any[] = [...(this.tasks as any[]), ...(this.historyTasks as any[])];

    const labels: string[] = [];
    const points: number[] = [];

    const dateKey = this.detectDateKey(all);

    if (!dateKey) {
      // fallback: approximate using last 7 history items
      const last = (this.historyTasks || []).slice(-7);

      for (let i = 0; i < 7; i++) {
        labels.push(`D${i + 1}`);
        const item = last[i];
        if (!item) points.push(0);
        else points.push(item.completed ? 100 : 0);
      }

      if (this.analysisCompletionRate >= 70) {
        this.trendText = 'Improving';
        this.trendHint = 'Approx trend (no task date field).';
      } else if (this.analysisCompletionRate < 40) {
        this.trendText = 'Declining';
        this.trendHint = 'Approx trend (no task date field).';
      } else {
        this.trendText = 'Stable';
        this.trendHint = 'Approx trend (no task date field).';
      }

      this.trendChartData = {
        labels,
        datasets: [{ data: points, label: 'Completion %' }]
      };
      return;
    }

    // Real last 7 days completion %
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotal: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dailyDone: number[] = [0, 0, 0, 0, 0, 0, 0];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    }

    for (let i = 0; i < all.length; i++) {
      const t: any = all[i];
      const raw = t[dateKey];
      if (!raw) continue;

      const dt = new Date(raw);
      if (isNaN(dt.getTime())) continue;
      dt.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0 || diffDays > 6) continue;

      const idx = 6 - diffDays;
      dailyTotal[idx] += 1;
      if (t.completed) dailyDone[idx] += 1;
    }

    for (let i = 0; i < 7; i++) {
      if (dailyTotal[i] === 0) points.push(0);
      else points.push(Math.round((dailyDone[i] / dailyTotal[i]) * 100));
    }

    // trend text from 1st half vs last half
    const firstAvg = (points[0] + points[1] + points[2]) / 3;
    const lastAvg = (points[4] + points[5] + points[6]) / 3;
    const diff = lastAvg - firstAvg;

    if (diff > 8) {
      this.trendText = 'Improving';
      this.trendHint = 'Completion is increasing.';
    } else if (diff < -8) {
      this.trendText = 'Declining';
      this.trendHint = 'Completion is decreasing.';
    } else {
      this.trendText = 'Stable';
      this.trendHint = 'No strong change detected.';
    }

    this.trendChartData = {
      labels,
      datasets: [{ data: points, label: 'Completion %' }]
    };
  }

  private detectDateKey(all: any[]): string {
    const candidates = ['taskDate', 'createdAt', 'date', 'day', 'scheduledDate', 'updatedAt'];
    for (let c = 0; c < candidates.length; c++) {
      const key = candidates[c];
      for (let i = 0; i < all.length; i++) {
        if (all[i] && all[i][key]) return key;
      }
    }
    return '';
  }

  private buildRisk(): void {
    const rate = this.analysisCompletionRate;

    if (rate < 40) {
      this.riskLevelText = 'HIGH';
      this.riskHintText = 'Low adherence — consider intervention.';
      this.riskLevelClass = 'risk-high';
    } else if (rate < 70) {
      this.riskLevelText = 'MEDIUM';
      this.riskHintText = 'Moderate adherence — monitor closely.';
      this.riskLevelClass = 'risk-mid';
    } else {
      this.riskLevelText = 'LOW';
      this.riskHintText = 'Good adherence — reinforce consistency.';
      this.riskLevelClass = 'risk-low';
    }
  }

  private buildAIRecommendations(): void {
    const recs: string[] = [];

    if (this.analysisCompletionRate < 40) {
      recs.push('Completion rate is below 40%: consider simplifying tasks and adding reminders.');
      recs.push('Recommend a short check-in to identify barriers (fatigue, mood, routine, side effects).');
    } else if (this.analysisCompletionRate < 70) {
      recs.push('Completion is moderate: encourage routine-building and adjust task times if needed.');
    } else {
      recs.push('Completion is strong: reinforce habits and keep tasks stable.');
    }

    if (this.analysisMissedCount >= 3) {
      recs.push('Multiple missed tasks in history: review feasibility and timing with the patient.');
    }

    const common = this.analysisMostCommonType;
    if (common && common !== '—') {
      recs.push(`Most frequent task type is ${common}: focus coaching on this category.`);
    }

    recs.push('Suggested plan: start with 1–2 “easy win” tasks daily, then progressively add tasks.');

    this.aiRecommendations = recs;
  }

  // =====================================================
  // ✅ PATIENT “Métier avancé” builders (Top 3)
  // =====================================================
  private rebuildPatientInsights(): void {
    // only patient view (not doctor)
    if (this.isReadOnly) return;

    this.buildPatientAdherenceScore();
    this.buildBestTimeToSucceed();
    this.buildMoodTaskCorrelation();
  }

  // 1) Score 0–100 with explainability
  private buildPatientAdherenceScore(): void {
    const activeTotal = this.tasks.length;
    const activeDone = this.completedCount;
    const activeRate = activeTotal ? (activeDone / activeTotal) : 0; // 0..1

    // missed streak from history: last N missed in a row
    const streak = this.computeMissedStreak(this.historyTasks);

    // critical weight: medication + appointment more important
    const criticalPenalty = this.computeCriticalPenalty(this.tasks);

    // time consistency: how concentrated the scheduled times are
    const timeConsistency = this.computeTimeConsistency(this.tasks); // 0..1 (1 good)

    // weighted scoring
    let score =
      100 * (0.55 * activeRate + 0.20 * timeConsistency + 0.25 * (1 - criticalPenalty));

    // streak penalty (max -15)
    score = score - Math.min(15, streak * 5);

    score = Math.max(0, Math.min(100, Math.round(score)));

    this.patientAdherenceScore = score;

    if (score >= 80) {
      this.patientAdherenceLabel = 'Excellent';
      this.patientAdherenceClass = 'score-good';
    } else if (score >= 55) {
      this.patientAdherenceLabel = 'Good';
      this.patientAdherenceClass = 'score-mid';
    } else {
      this.patientAdherenceLabel = 'Needs Support';
      this.patientAdherenceClass = 'score-bad';
    }

    const why: string[] = [];
    why.push(`Active completion: ${Math.round(activeRate * 100)}% (${activeDone}/${activeTotal || 0}).`);

    if (streak >= 2) why.push(`Missed streak detected: ${streak} day(s) in a row.`);
    if (criticalPenalty > 0.25) why.push('Important tasks (Medication/Appointment) are often missed.');
    if (timeConsistency < 0.45) why.push('Your task times are scattered — routine could help.');
    if (why.length < 3) why.push('Keep going — consistency is the key.');

    this.patientWhy = why;
  }

  private computeMissedStreak(history: DailyTask[]): number {
    const last = (history || []).slice(-7).reverse(); // most recent first
    let streak = 0;
    for (let i = 0; i < last.length; i++) {
      if (last[i] && last[i].completed === false) streak++;
      else break;
    }
    return streak;
  }

  private computeCriticalPenalty(list: DailyTask[]): number {
    // penalty 0..1 based on missed critical tasks
    let criticalTotal = 0;
    let criticalMissed = 0;

    for (let i = 0; i < (list || []).length; i++) {
      const t = list[i];
      const type = String(t.taskType || 'OTHER');
      const isCritical = (type === 'MEDICATION' || type === 'APPOINTMENT');
      if (!isCritical) continue;

      criticalTotal++;
      if (!t.completed) criticalMissed++;
    }

    if (criticalTotal === 0) return 0;
    return criticalMissed / criticalTotal;
  }

  private computeTimeConsistency(list: DailyTask[]): number {
    const buckets: { [key: string]: number } = {};
    let total = 0;

    for (let i = 0; i < (list || []).length; i++) {
      const t = list[i];
      const hh = this.hourOf(t.scheduledTime);
      if (hh < 0) continue;

      const bucket = this.timeBucket(hh); // e.g. "08:00-10:00"
      buckets[bucket] = (buckets[bucket] || 0) + 1;
      total++;
    }

    if (total === 0) return 0.5;

    const keys = Object.keys(buckets);
    let best = 0;
    for (let i = 0; i < keys.length; i++) {
      best = Math.max(best, buckets[keys[i]]);
    }

    return best / total; // 0..1
  }

  // 2) Best time to succeed (time buckets completion rate)
  private buildBestTimeToSucceed(): void {
    const bucketTotal: { [key: string]: number } = {};
    const bucketDone: { [key: string]: number } = {};

    for (let i = 0; i < (this.tasks || []).length; i++) {
      const t = this.tasks[i];
      const hh = this.hourOf(t.scheduledTime);
      if (hh < 0) continue;

      const b = this.timeBucket(hh);
      bucketTotal[b] = (bucketTotal[b] || 0) + 1;
      if (t.completed) bucketDone[b] = (bucketDone[b] || 0) + 1;
    }

    const buckets = Object.keys(bucketTotal);
    if (buckets.length === 0) {
      this.bestTimeSlotText = '—';
      this.worstTimeSlotText = '—';
      this.bestTimeHint = 'No time data yet.';
      this.bestTimeChartData = null;
      return;
    }

    let bestB = buckets[0];
    let bestRate = -1;
    let worstB = buckets[0];
    let worstRate = 999;

    const labels: string[] = [];
    const values: number[] = [];

    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      const tot = bucketTotal[b] || 0;
      const done = bucketDone[b] || 0;
      const rate = tot ? Math.round((done / tot) * 100) : 0;

      labels.push(b);
      values.push(rate);

      if (rate > bestRate) { bestRate = rate; bestB = b; }
      if (rate < worstRate) { worstRate = rate; worstB = b; }
    }

    this.bestTimeSlotText = `${bestB} (${bestRate}%)`;
    this.worstTimeSlotText = `${worstB} (${worstRate}%)`;

    this.bestTimeHint =
      bestRate >= 70
        ? 'Try scheduling important tasks in your best window.'
        : 'Completion is low across windows — start with 1 easy task/day.';

    // ✅ MUST MATCH HTML variable name
    this.bestTimeChartData = {
      labels,
      datasets: [{ data: values, label: 'Completion %' }]
    };
  }

  private hourOf(time: string): number {
    const t = this.normalizeTime(time);
    const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!m) return -1;
    return parseInt(m[1], 10);
  }

  private timeBucket(hh: number): string {
    // 2-hour buckets
    const start = hh - (hh % 2);
    const end = start + 2;
    const s = start.toString().padStart(2, '0');
    const e = end.toString().padStart(2, '0');
    return `${s}:00-${e}:00`;
  }

  // 3) Mood ↔ Task correlation by date (last 14 days)
  private buildMoodTaskCorrelation(): void {
    const allTasks: any[] = [...(this.tasks as any[]), ...(this.historyTasks as any[])];
    const dateKey = this.detectDateKey(allTasks);

    if (!dateKey || !this.moodEntries || this.moodEntries.length < 2) {
      this.moodCorrelationRows = [];
      this.moodCorrChartData = null;
      this.moodCorrelationHint =
        !dateKey
          ? 'No task date field detected (add createdAt/taskDate/scheduledDate).'
          : 'Add at least 2 mood check-ins to unlock correlations.';
      return;
    }

    // ✅ Try to map mood entries to day. ADJUST FIELD NAMES to your DailyEntry model if needed:
    // - date: entryDate | createdAt | date
    // - mood: dailyEmotion | mood | emotion
    const moodByDay = new Map<string, MoodKey>();
    for (let i = 0; i < this.moodEntries.length; i++) {
      const e: any = this.moodEntries[i];

      const rawDate = e.entryDate || e.createdAt || e.date;
      const rawMood = e.dailyEmotion || e.mood || e.emotion;

      const day = rawDate ? String(rawDate).slice(0, 10) : '';
      const mood = rawMood ? (String(rawMood) as MoodKey) : null;

      if (day && mood) moodByDay.set(day, mood);
    }

    const totalByMood: { [key: string]: number } = {};
    const doneByMood: { [key: string]: number } = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 13);

    for (let i = 0; i < allTasks.length; i++) {
      const t: any = allTasks[i];
      const raw = t[dateKey];
      if (!raw) continue;

      const dt = new Date(raw);
      if (isNaN(dt.getTime())) continue;
      dt.setHours(0, 0, 0, 0);
      if (dt < cutoff || dt > today) continue;

      const dayKey = dt.toISOString().slice(0, 10);
      const mood = moodByDay.get(dayKey);
      if (!mood) continue;

      totalByMood[mood] = (totalByMood[mood] || 0) + 1;
      if (t.completed) doneByMood[mood] = (doneByMood[mood] || 0) + 1;
    }

    const moods = Object.keys(totalByMood) as MoodKey[];
    if (moods.length === 0) {
      this.moodCorrelationRows = [];
      this.moodCorrChartData = null;
      this.moodCorrelationHint = 'No overlapping days between tasks and mood check-ins (last 14 days).';
      return;
    }

    // ✅ IMPORTANT: build rows with "completion" (to match HTML r.completion)
    const rows = moods.map((m: MoodKey) => {
      const tot = totalByMood[m] || 0;
      const done = doneByMood[m] || 0;
      const rate = tot ? Math.round((done / tot) * 100) : 0;
      return { mood: m, completion: rate, days: tot };
    }).sort((a, b) => b.completion - a.completion);

    this.moodCorrelationRows = rows;

    this.moodCorrChartData = {
      labels: rows.map(r => r.mood),
      datasets: [{ data: rows.map(r => r.completion), label: 'Completion %' }]
    };

    const best = rows[0];
    const worst = rows[rows.length - 1];

    if (best && worst && best.mood !== worst.mood) {
      this.moodCorrelationHint =
        `You perform best on ${best.mood} days (${best.completion}%). ` +
        `Hardest is ${worst.mood} (${worst.completion}%).`;
    } else {
      this.moodCorrelationHint = 'Correlation computed from your last 14 days.';
    }
  }

  // =====================================================
  // ✅ Lists + Filters + Sort (patient + doctor)
  // =====================================================
  private get currentList(): DailyTask[] {
    return this.activeTab === 'ACTIVE' ? this.tasks : this.historyTasks;
  }

  get displayedTasks(): DailyTask[] {
    let list: DailyTask[] = this.currentList.slice();

    // search
    const q = this.normalizeKey(this.searchTerm);
    if (q) {
      list = list.filter((t: DailyTask) => {
        const inTitle = this.normalizeKey(t.title).includes(q);
        const inNotes = this.normalizeKey(t.notes || '').includes(q);
        return inTitle || inNotes;
      });
    }

    // filter type
    if (this.filterType !== 'ALL') {
      list = list.filter((t: DailyTask) => t.taskType === this.filterType);
    }

    // filter status
    if (this.filterStatus === 'DONE') {
      list = list.filter((t: DailyTask) => !!t.completed);
    } else if (this.filterStatus === 'TODO') {
      list = list.filter((t: DailyTask) => !t.completed);
    }

    // sort
    if (this.sortMode === 'TIME') {
      list.sort((a: DailyTask, b: DailyTask) =>
        this.normalizeTime(a.scheduledTime).localeCompare(this.normalizeTime(b.scheduledTime))
      );
    } else if (this.sortMode === 'TITLE') {
      list.sort((a: DailyTask, b: DailyTask) =>
        this.normalizeKey(a.title).localeCompare(this.normalizeKey(b.title))
      );
    } else if (this.sortMode === 'TYPE') {
      list.sort((a: DailyTask, b: DailyTask) =>
        (a.taskType || '').localeCompare(b.taskType || '')
      );
    }

    return list;
  }

  // =====================================================
  // ✅ Patient CRUD actions (doctor read-only blocked)
  // =====================================================
  openAdd(): void {
    if (this.isReadOnly) return;
    this.isEditing = false;
    this.currentTask = this.emptyTask();
    this.isModalOpen = true;
  }

  openEdit(task: DailyTask): void {
    if (this.isReadOnly) return;
    this.isEditing = true;
    this.currentTask = { ...task };
    this.currentTask.scheduledTime = this.normalizeTime(this.currentTask.scheduledTime);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  save(): void {
    if (this.isReadOnly) return;

    if (!this.patientId) {
      alert('CRITICAL ERROR: No Patient ID found.');
      return;
    }

    if (!this.currentTask.title || this.currentTask.title.trim() === '') {
      alert('Please enter a title.');
      return;
    }

    const payload: DailyTask = {
      ...this.currentTask,
      patientId: this.patientId,
      scheduledTime: this.normalizeTime(this.currentTask.scheduledTime),
      completed: !!this.currentTask.completed
    };

    if (this.isDuplicate(payload)) {
      alert('This task already exists (same title + type + time).');
      return;
    }

    if (this.isEditing && payload.id) {
      this.sub.add(
        this.taskService.updateTask(payload).subscribe({
          next: () => {
            this.closeModal();
            this.loadActive();
            this.loadHistory();
          },
          error: (err) => {
            console.error('Update failed:', err);
            alert(
              `Update failed (${err.status}) : ` +
              (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))
            );
          }
        })
      );
    } else {
      this.sub.add(
        this.taskService.addTask(payload).subscribe({
          next: () => {
            this.closeModal();
            this.loadActive();
            this.loadHistory();
          },
          error: (err) => {
            console.error('Add failed:', err);
            alert(
              `Add failed (${err.status}) : ` +
              (typeof err.error === 'string' ? err.error : JSON.stringify(err.error))
            );
          }
        })
      );
    }
  }

  remove(task: DailyTask): void {
    if (this.isReadOnly) return;
    if (task.id == null) return;

    const id = Number(task.id);

    if (this.activeTab === 'ACTIVE') {
      this.tasks = this.tasks.filter((t: DailyTask) => Number(t.id) !== id);
    } else {
      this.historyTasks = this.historyTasks.filter((t: DailyTask) => Number(t.id) !== id);
    }

    this.sub.add(
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.loadActive();
          this.loadHistory();
        },
        error: (err) => {
          console.error('Delete request error:', err);
          this.loadActive();
          this.loadHistory();
          alert('Delete request had an issue, refreshing the list...');
        }
      })
    );
  }

  toggle(task: DailyTask): void {
    // doctor read-only + history read-only
    if (this.isReadOnly) return;
    if (this.activeTab !== 'ACTIVE') return;
    if (!task.id) return;

    const newValue = !task.completed;
    task.completed = newValue;

    this.sub.add(
      this.taskService.setCompleted(Number(task.id), newValue).subscribe({
        next: () => {
          this.loadActive();
          this.loadHistory();
        },
        error: (err) => {
          console.error('Toggle failed', err);
          task.completed = !newValue;
        }
      })
    );
  }

  trackByTaskId(index: number, task: DailyTask) {
    return task.id;
  }

  // =====================================================
  // ✅ Helpers
  // =====================================================
  private normalizeTime(time: string): string {
    if (!time) return '08:00';
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return time;

    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const modifier = (match[3] || '').toUpperCase();

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return '08:00';
  }

  private normalizeKey(s: string): string {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private isDuplicate(payload: DailyTask): boolean {
    // duplicates only compared against ACTIVE tasks
    const list = this.tasks;

    const titleKey = this.normalizeKey(payload.title);
    const timeKey = this.normalizeTime(payload.scheduledTime);
    const typeKey = (payload.taskType || 'OTHER').toString();

    for (let i = 0; i < list.length; i++) {
      const t = list[i];

      if (payload.id && t.id && Number(t.id) === Number(payload.id)) continue;

      const tTitleKey = this.normalizeKey(t.title);
      const tTimeKey = this.normalizeTime(t.scheduledTime);
      const tTypeKey = (t.taskType || 'OTHER').toString();

      if (
        t.patientId === payload.patientId &&
        tTitleKey === titleKey &&
        tTypeKey === typeKey &&
        tTimeKey === timeKey
      ) {
        return true;
      }
    }
    return false;
  }

  private emptyTask(): DailyTask {
    return {
      patientId: '',
      title: '',
      taskType: 'OTHER',
      scheduledTime: '08:00',
      notes: '',
      completed: false
    };
  }
}