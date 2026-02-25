import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Observable, Subscription, of } from 'rxjs';
import { DailyMeService } from '../services/daily-me.service';
import { DailyEntry } from '../models/daily-entry.model';
import { AuthService } from '../../front-office/pages/login/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import * as faceapi from 'face-api.js';

type SimplePatient = { userId: string; name: string; email: string };
type MoodKey = 'Happy' | 'Neutral' | 'Sad' | 'Anxious' | 'Angry' | 'Tired' | 'Excited' | 'Calm';

interface MoodUI {
  key: MoodKey;
  label: string;
  emoji: string;
  badgeText: string;
  message: string;
  bgClass: string;
}

@Component({
  selector: 'app-daily-me-list',
  templateUrl: './daily-me-list.component.html',
  styleUrls: ['./daily-me-list.component.css']
})
export class DailyMeListComponent implements OnInit, OnDestroy {

  // ================= FACE EMOTION (NEW) =================
  @ViewChild('emotionVideo') emotionVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('emotionOverlay') emotionOverlayRef!: ElementRef<HTMLCanvasElement>;

  emotionRunning = false;
  detectedLabel: string | null = null;
  detectedConfidence: number | null = null;
  detectedMoodKey: MoodKey | null = null;

  private emotionStream: MediaStream | null = null;
  private rafId: number | null = null;
  private lastTs = 0;
  private modelsLoaded = false;

  // smoothing to avoid flicker
  private ema: Record<string, number> = {
    neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0
  };
  private alpha = 0.35;
  // ======================================================

  user: any = null;
  entries$: Observable<DailyEntry[]> = of([]);

  isEditing = false;
  private sub = new Subscription();

  private myUserId: string = '';
  selectedPatientId: string = '';
  patients: SimplePatient[] = [];

  activeTab: 'mood' | 'tasks' | 'journal' = 'mood';

  selectedMood: MoodUI | null = null;
  showMoodToast = false;

  // ✅ Welcome popup (once per day + only if no mood today)
  showWelcomePopup = false;
  welcomeName = '';
  private todayKey = '';
  private checkedTodayOnce = false;

  // ===== Weekly Analysis UI state =====
  weeklyAverage: string = '0.0';
  weeklyTrendText: string = 'Stable';
  weeklyTrendHint: string = 'No clear change yet.';
  weeklyMostCommonLabel: string = '—';
  weeklyMostCommonEmoji: string = '🙂';
  weeklyDistribution: { key: MoodKey; label: string; emoji: string; count: number }[] = [];

  // ===== Chart (BAR) =====
  chartData: ChartConfiguration<'bar'>['data'] | null = null;
  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { min: 0, max: 5, ticks: { stepSize: 1 } } }
  };

  moods: MoodUI[] = [
    { key: 'Happy', label: 'Happy', emoji: '😊', badgeText: 'Feeling Happy', message: "I'm so glad you're feeling happy today! 💖", bgClass: 'bg-[#DCFCE7]' },
    { key: 'Excited', label: 'Excited', emoji: '🤩', badgeText: 'Feeling Excited', message: "Love that energy! Use it for one small win today. ✨", bgClass: 'bg-[#DCFCE7]' },
    { key: 'Calm', label: 'Calm', emoji: '😌', badgeText: 'Feeling Calm', message: "That calm feeling is precious. Keep it going. 🍃", bgClass: 'bg-[#DBEAFE]' },
    { key: 'Neutral', label: 'Okay', emoji: '😐', badgeText: 'Feeling Okay', message: "It's okay to feel neutral. Small steps still count. 🌿", bgClass: 'bg-[#F3E8FF]' },
    { key: 'Anxious', label: 'Anxious', emoji: '😰', badgeText: 'Feeling Anxious', message: "Take deep breaths — you're stronger than you know. 🫶", bgClass: 'bg-[#FEF3C7]' },
    { key: 'Sad', label: 'Sad', emoji: '😔', badgeText: 'Feeling Sad', message: "Be gentle with yourself today. 🤍", bgClass: 'bg-[#FEE2E2]' },
    { key: 'Angry', label: 'Angry', emoji: '😠', badgeText: 'Feeling Angry', message: "Anger is valid. Pause + slow breathing. 🧘", bgClass: 'bg-[#FFE4E6]' },
    { key: 'Tired', label: 'Tired', emoji: '🥱', badgeText: 'Feeling Tired', message: "Rest is productive. Even a small break helps. 💤", bgClass: 'bg-[#E0E7FF]' }
  ];

  currentEntry: DailyEntry = {
    patientId: '',
    entryDate: new Date().toISOString().split('T')[0],
    dailyEmotion: '',
    notes: ''
  };

  // ✅ HISTORY SEARCH/FILTER
  searchText: string = '';
  selectedMoodFilter: string = '';
  selectedDateFilter: string = '';
  entriesList: DailyEntry[] = [];
  filteredEntries: DailyEntry[] = [];
  private entriesSub: Subscription | null = null;

  constructor(
    private dailyService: DailyMeService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.authService.currentUser$.subscribe((u: any) => {
        this.user = u;
        this.myUserId = u?.userId || '';

        const role = (u?.role || '').toLowerCase();

        // ===== PATIENT =====
        if (role === 'patient') {
          this.entries$ = this.dailyService.entries$;

          this.welcomeName =
            u?.name ||
            u?.fullName ||
            u?.username ||
            (u?.email ? String(u.email).split('@')[0] : 'there');

          this.checkedTodayOnce = false;

          if (this.myUserId) {
            this.currentEntry.patientId = this.myUserId;
            this.dailyService.init(this.myUserId);
          }

          this.bindEntriesStream(this.entries$);

          this.sub.add(
            this.entries$.subscribe((list: DailyEntry[]) => {
              const safeList = list || [];
              this.buildWeeklySeries(safeList);
              this.tryOpenWelcomePopup(safeList);
            })
          );

          return;
        }

        // ===== DOCTOR/CAREGIVER =====
        this.dailyService.destroy();
        this.entries$ = of([]);
        this.selectedPatientId = '';
        this.chartData = null;

        this.entriesList = [];
        this.filteredEntries = [];
        this.resetFilters();

        this.loadPatients();
      })
    );
  }

  ngOnDestroy(): void {
    this.stopEmotionDetection(); // ✅ stop camera if running
    this.sub.unsubscribe();
    this.dailyService.destroy();
    if (this.entriesSub) {
      this.entriesSub.unsubscribe();
      this.entriesSub = null;
    }
  }

  setTab(tab: 'mood' | 'tasks' | 'journal'): void {
    this.activeTab = tab;

    // ✅ stop camera when leaving mood tab
    if (tab !== 'mood') {
      this.stopEmotionDetection();
    }
  }

  // ================= FACE EMOTION METHODS (NEW) =================
  async startEmotionDetection(): Promise<void> {
    if (this.emotionRunning) return;

    const role = (this.user?.role || '').toLowerCase();
    if (role !== 'patient') return;

    this.emotionRunning = true;

    try {
      await this.loadFaceModelsOnce();
      await this.startCamera();

      const video = this.emotionVideoRef.nativeElement;
      const canvas = this.emotionOverlayRef.nativeElement;

      // sync canvas size
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      this.loop();
    } catch (e) {
      console.error('Emotion start failed', e);
      alert('Camera / models failed. Check permissions and /assets/models.');
      this.stopEmotionDetection();
    }
  }

  stopEmotionDetection(): void {
    this.emotionRunning = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.emotionStream) {
      const tracks = this.emotionStream.getTracks();
      for (let i = 0; i < tracks.length; i++) tracks[i].stop();
      this.emotionStream = null;
    }

    this.detectedLabel = null;
    this.detectedConfidence = null;
    this.detectedMoodKey = null;

    Object.keys(this.ema).forEach(k => (this.ema[k] = 0));

    const canvas = this.emotionOverlayRef?.nativeElement;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  useDetectedMood(): void {
    if (!this.detectedMoodKey) return;
    this.selectMood(this.detectedMoodKey); // ✅ reuse existing logic (wheel + toast)
  }

  private async loadFaceModelsOnce(): Promise<void> {
    if (this.modelsLoaded) return;

    const url = '/assets/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(url);
    await faceapi.nets.faceExpressionNet.loadFromUri(url);

    this.modelsLoaded = true;
  }

  private async startCamera(): Promise<void> {
    const video = this.emotionVideoRef.nativeElement;

    const constraints: MediaStreamConstraints = {
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    };

    this.emotionStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = this.emotionStream;
    await video.play();
  }

  private loop(): void {
    if (!this.emotionRunning) return;

    this.rafId = requestAnimationFrame(() => this.loop());

    // ✅ limit processing to reduce CPU
    const now = performance.now();
    const processEveryMs = 120; // ~8 fps processing
    if (now - this.lastTs < processEveryMs) return;
    this.lastTs = now;

    this.processFrame().catch(() => {});
  }

  private async processFrame(): Promise<void> {
    const video = this.emotionVideoRef.nativeElement;
    const canvas = this.emotionOverlayRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const det = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
      .withFaceExpressions();

    if (!det) {
      this.detectedLabel = null;
      this.detectedConfidence = null;
      this.detectedMoodKey = null;
      return;
    }

    const resized = faceapi.resizeResults(det, { width: canvas.width, height: canvas.height });
    faceapi.draw.drawDetections(canvas, resized as any);

    const expr = det.expressions as any;
    const keys = ['neutral','happy','sad','angry','fearful','disgusted','surprised'];

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const v = Number(expr[k] ?? 0);
      this.ema[k] = this.alpha * v + (1 - this.alpha) * this.ema[k];
    }

    let bestKey = 'neutral';
    let bestVal = -1;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (this.ema[k] > bestVal) {
        bestVal = this.ema[k];
        bestKey = k;
      }
    }

    this.detectedConfidence = bestVal;
    this.detectedLabel = bestKey;
    this.detectedMoodKey = this.mapFaceToMoodKey(bestKey);
  }

  private mapFaceToMoodKey(faceKey: string): MoodKey {
    const k = (faceKey || '').toLowerCase();
    if (k === 'happy') return 'Happy';
    if (k === 'sad') return 'Sad';
    if (k === 'angry') return 'Angry';
    if (k === 'fearful' || k === 'surprised') return 'Anxious';
    return 'Neutral';
  }
  // ============================================================

  // ✅ WELCOME POPUP
  private todayYYYYMMDD(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private buildWelcomeKey(userId: string): string {
    return `dailyme_welcome_${userId}_${this.todayYYYYMMDD()}`;
  }

  private hasMoodToday(list: DailyEntry[]): boolean {
    const today = this.todayYYYYMMDD();
    return (list || []).some(e => (e.entryDate || '') === today);
  }

  private tryOpenWelcomePopup(entries: DailyEntry[]): void {
    if (this.checkedTodayOnce) return;
    const role = (this.user?.role || '').toLowerCase();
    if (role !== 'patient') return;
    if (!this.myUserId) return;

    this.todayKey = this.buildWelcomeKey(this.myUserId);

    if (localStorage.getItem(this.todayKey)) {
      this.checkedTodayOnce = true;
      return;
    }

    if (!this.hasMoodToday(entries)) {
      this.showWelcomePopup = true;
    }

    this.checkedTodayOnce = true;
  }

  dismissWelcomePopup(): void {
    if (this.todayKey) localStorage.setItem(this.todayKey, '1');
    this.showWelcomePopup = false;
  }

  goToMoodCheckIn(): void {
    this.dismissWelcomePopup();
    this.setTab('mood');
    setTimeout(() => {
      const el = document.getElementById('mood-checkin');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  // ✅ MOOD
  selectMood(mood: MoodKey): void {
    this.currentEntry.dailyEmotion = mood;
    this.selectedMood = this.moods.find(m => m.key === mood) || null;

    this.showMoodToast = true;
    window.setTimeout(() => (this.showMoodToast = false), 2000);
  }

  saveEntry(): void {
    const role = (this.user?.role || '').toLowerCase();
    if (role !== 'patient') { alert('Only patients can add mood entries.'); return; }
    if (!this.currentEntry.dailyEmotion) { alert('Please select a mood first!'); return; }
    if (!this.myUserId) { alert('User not loaded. Please re-login.'); return; }

    this.currentEntry.patientId = this.myUserId;

    if (this.isEditing) {
      this.dailyService.updateEntry(this.currentEntry).subscribe({
        next: () => this.resetForm(),
        error: (err: any) => console.error('Update failed', err),
      });
    } else {
      this.dailyService.addEntry(this.currentEntry).subscribe({
        next: () => this.resetForm(),
        error: (err: any) => console.error('Add failed', err),
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentEntry = {
      patientId: this.myUserId,
      entryDate: new Date().toISOString().split('T')[0],
      dailyEmotion: '',
      notes: ''
    };
    this.selectedMood = null;
  }

  editEntry(entry: DailyEntry): void {
    this.currentEntry = { ...entry };
    this.isEditing = true;
    this.selectedMood = this.moods.find(m => m.key === (entry.dailyEmotion as MoodKey)) || null;
  }

  trackByEntryId(index: number, e: DailyEntry): number {
    return Number(e.id);
  }

  onDelete(id: number): void {
    const role = (this.user?.role || '').toLowerCase();
    if (role !== 'patient' || !this.myUserId) return;

    if (confirm('Delete this entry?')) {
      this.dailyService.deleteEntry(id, this.myUserId).subscribe({
        next: () => {},
        error: (err: any) => {
          console.error('Delete failed', err);
          alert('Delete failed, please try again.');
        }
      });
    }
  }

  // ✅ FIXED PATIENTS LOADING (Bearer + normalize)
  loadPatients(): void {
    const url = 'http://localhost:8096/EverCare/users/patients';

    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt') ||
      '';

    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    this.http.get<any>(url, { headers }).subscribe({
      next: (res: any) => {
        console.log('RAW PATIENTS:', res);

        const list: any[] =
          Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
          Array.isArray(res?.patients) ? res.patients :
          [];

        this.patients = list.map((p: any) => {
          const id = String(p.userId || p.id || p.patientId || p._id || '');
          const name =
            (p.name && String(p.name).trim()) ||
            `${p.firstName || ''} ${p.lastName || ''}`.trim() ||
            (p.username ? String(p.username) : '') ||
            (p.email ? String(p.email).split('@')[0] : 'Patient');

          const email = String(p.email || '');
          return { userId: id, name, email };
        }).filter((p: any) => p.userId !== '');

        console.log('NORMALIZED PATIENTS:', this.patients);
      },
      error: (err: any) => {
        console.error('FAILED loading patients:', err.status, err.error);
        this.patients = [];
      }
    });
  }

  // ✅ Doctor selects patient here
  onSelectPatient(): void {
    const id = String(this.selectedPatientId || '').trim();

    if (!id) {
      this.entries$ = of([]);
      this.entriesList = [];
      this.filteredEntries = [];
      this.chartData = null;
      this.resetFilters();
      if (this.entriesSub) { this.entriesSub.unsubscribe(); this.entriesSub = null; }
      return;
    }

    this.entries$ = this.dailyService.getEntriesByPatient(id);
    this.bindEntriesStream(this.entries$);

    this.sub.add(
      this.entries$.subscribe((list: DailyEntry[]) => {
        const safeList = list || [];
        this.buildWeeklySeries(safeList);
      })
    );
  }

  getEmotionIcon(emotion: string): string {
    const found = this.moods.find(m => m.key === (emotion as MoodKey));
    return found ? found.emoji : '🙂';
  }

  // ✅ FILTERS
  applyFilters(): void {
    const text = (this.searchText || '').trim().toLowerCase();
    const mood = (this.selectedMoodFilter || '').trim();
    const date = (this.selectedDateFilter || '').trim();

    this.filteredEntries = (this.entriesList || []).filter((entry: DailyEntry) => {
      const notes = (entry.notes || '').toLowerCase();
      const emotion = (entry.dailyEmotion || '').toLowerCase();

      const matchesText = !text || notes.includes(text) || emotion.includes(text);
      const matchesMood = !mood || (entry.dailyEmotion || '') === mood;
      const matchesDate = !date || (entry.entryDate || '') === date;

      return matchesText && matchesMood && matchesDate;
    });
  }

  resetFilters(): void {
    this.searchText = '';
    this.selectedMoodFilter = '';
    this.selectedDateFilter = '';
    this.filteredEntries = [...(this.entriesList || [])];
  }

  private bindEntriesStream(obs: Observable<DailyEntry[]>): void {
    if (this.entriesSub) {
      this.entriesSub.unsubscribe();
      this.entriesSub = null;
    }

    this.searchText = '';
    this.selectedMoodFilter = '';
    this.selectedDateFilter = '';

    this.entriesSub = obs.subscribe((list: DailyEntry[]) => {
      this.entriesList = list || [];
      this.filteredEntries = [...this.entriesList];
      this.applyFilters();
    });
  }

  // ✅ Weekly analysis
  private mapEmotionToScore(emotion: string): number {
    switch ((emotion || '').toLowerCase()) {
      case 'happy': return 5;
      case 'excited': return 5;
      case 'calm': return 4;
      case 'neutral': return 3;
      case 'tired': return 2;
      case 'sad': return 1;
      case 'anxious': return 2;
      case 'angry': return 2;
      default: return 0;
    }
  }

  private buildWeeklySeries(entries: DailyEntry[]): void {
    const today = new Date();
    const days: Date[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const mapByDate = new Map<string, DailyEntry>();
    (entries || []).forEach((e: DailyEntry) => {
      const d = new Date(e.entryDate);
      d.setHours(0, 0, 0, 0);
      mapByDate.set(d.toISOString().slice(0, 10), e);
    });

    const dataPoints: number[] = [];
    const scoresOnly: number[] = [];
    const moodCounts = new Map<string, number>();

    for (let i = 0; i < days.length; i++) {
      const key = days[i].toISOString().slice(0, 10);
      const entry = mapByDate.get(key);

      if (!entry) {
        dataPoints.push(0);
        continue;
      }

      const score = this.mapEmotionToScore(entry.dailyEmotion);
      dataPoints.push(score);
      scoresOnly.push(score);

      const m = (entry.dailyEmotion || '') as MoodKey;
      moodCounts.set(m, (moodCounts.get(m) || 0) + 1);
    }

    this.chartData = {
      labels: days.map(d => d.toLocaleDateString(undefined, { weekday: 'short' })),
      datasets: [{ data: dataPoints, label: 'Daily Mood Score' }]
    };

    const avg = scoresOnly.length ? (scoresOnly.reduce((a, b) => a + b, 0) / scoresOnly.length) : 0;
    this.weeklyAverage = avg.toFixed(1);

    const firstHalf = dataPoints.slice(0, 3);
    const secondHalf = dataPoints.slice(4, 7);

    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = avg2 - avg1;

    if (diff > 0.4) {
      this.weeklyTrendText = 'Improving';
      this.weeklyTrendHint = 'Mood has been getting better ✨';
    } else if (diff < -0.4) {
      this.weeklyTrendText = 'Declining';
      this.weeklyTrendHint = 'This week was harder 🤍';
    } else {
      this.weeklyTrendText = 'Stable';
      this.weeklyTrendHint = 'Mood has been steady 🌿';
    }

    let bestMood: MoodKey | null = null;
    let bestCount = 0;

    moodCounts.forEach((count: number, mood: string) => {
      if (count > bestCount) {
        bestCount = count;
        bestMood = mood as MoodKey;
      }
    });

    const found = this.moods.find(m => m.key === bestMood);
    this.weeklyMostCommonLabel = found ? found.label : '—';
    this.weeklyMostCommonEmoji = found ? found.emoji : '🙂';

    const dist = this.moods.map(m => ({
      key: m.key,
      label: m.label,
      emoji: m.emoji,
      count: moodCounts.get(m.key) || 0
    }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

    this.weeklyDistribution = dist;
  }
}