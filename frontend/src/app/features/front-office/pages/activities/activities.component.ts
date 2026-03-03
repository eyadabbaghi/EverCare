import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { ActivityService, Activity, ActivityWithUserData } from '../../../../core/services/activity.service';
import { AuthService, User } from '../login/auth.service';
import { UserService, Patient } from '../../../../core/services/user.service';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
export class ActivitiesComponent implements OnInit {
  // Role-specific data
  userRole: string = '';
  user: User | null = null;
  userId: string | null = null;
  patients: Patient[] = [];
  recommending = new Set<string>();
  doctorActivities: Activity[] = []; // all activities for doctors

  // Doctor dropdown state
  patientDropdownOpen: string | null = null; // activity ID for which dropdown is open
  selectedPatient: { [key: string]: Patient } = {}; // selected patient per activity

  // Shared activity data
  allActivities: ActivityWithUserData[] = [];
  todayActivities: ActivityWithUserData[] = [];
  recommendedActivities: ActivityWithUserData[] = [];

  // Filter properties
  searchTerm: string = '';
  selectedType: string = 'all';
  selectedDifficulty: string = 'all';

  // Available filter options
  types: string[] = [];
  difficulties: string[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 6;
  totalPages: number = 1;

  // Internal filtered list
  private filteredActivities: ActivityWithUserData[] = [];

  // Translation and summarization
  translations: { [key: string]: { name: string; description: string; instructions: string[]; benefits: string[]; precautions: string[] } } = {};
  showOriginal: { [key: string]: boolean } = {};
  summaries: { [key: string]: string } = {};
  summaryLoading: { [key: string]: boolean } = {};
  translating: { [key: string]: boolean } = {};

  // Language dropdown
  languages = [
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' }
  ];
  selectedLang: { [key: string]: string } = {};
  currentTranslationLang: { [key: string]: string } = {};

  constructor(
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private activityService: ActivityService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.userId) {
        this.user = user;
        this.userId = user.userId;
        this.userRole = user.role;

        if (this.userRole === 'DOCTOR') {
          this.loadDoctorPatients();
          this.loadDoctorActivities();
        } else {
          this.loadActivities();
        }
      }
    });
  }

  loadDoctorPatients(): void {
    if (!this.user?.patientEmails?.length) {
      this.patients = [];
      return;
    }
    forkJoin(this.user.patientEmails.map(email => this.userService.getUserByEmail(email)))
      .subscribe(patients => this.patients = patients);
  }

  loadDoctorActivities(): void {
    this.activityService.getAllActivities().subscribe(acts => {
      this.doctorActivities = acts;
    });
  }

  loadActivities(): void {
    if (!this.userId) return;
    this.activityService.getActivitiesForUser(this.userId).subscribe(data => {
      this.allActivities = data;
      this.recommendedActivities = data.filter(a => a.recommendedByDoctor);
      this.types = [...new Set(data.map(a => a.type))];
      this.difficulties = [...new Set(data.map(a => a.difficulty))];
      this.applyFilters();
    });
  }

  // Doctor dropdown methods
  togglePatientDropdown(activityId: string): void {
    this.patientDropdownOpen = this.patientDropdownOpen === activityId ? null : activityId;
  }

  selectPatient(activityId: string, patient: Patient): void {
    this.selectedPatient[activityId] = patient;
    this.patientDropdownOpen = null;
  }

  recommend(activity: Activity, patientId: string): void {
    if (!this.user?.userId || !patientId) return;
    if (this.recommending.has(activity.id)) return;

    this.recommending.add(activity.id);
    this.activityService.recommendActivity(this.user.userId, patientId, activity.id).subscribe({
      next: () => {
        this.toastr.success('Activity recommended');
        this.recommending.delete(activity.id);
      },
      error: () => {
        this.toastr.error('Recommendation failed');
        this.recommending.delete(activity.id);
      }
    });
  }

  applyFilters(): void {
    let filtered = this.allActivities;
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term)
      );
    }
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(a => a.difficulty === this.selectedDifficulty);
    }
    this.filteredActivities = filtered;
    this.currentPage = 1;
    this.totalPages = Math.max(1, Math.ceil(this.filteredActivities.length / this.pageSize));
    this.updatePage();
  }

  private updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredActivities.slice(start, start + this.pageSize);
    this.todayActivities = pageItems.filter(a => !a.recommendedByDoctor).slice(0, 4);
    this.recommendedActivities = pageItems.filter(a => a.recommendedByDoctor);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = 'all';
    this.selectedDifficulty = 'all';
    this.applyFilters();
  }

  getCompletionRate(): number {
    const total = this.todayActivities.length;
    const completed = this.todayActivities.filter(a => a.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  getCompletedTodayCount(): number {
    return this.todayActivities.filter(a => a.completed).length;
  }

  completeActivity(activity: ActivityWithUserData, event?: Event): void {
    if (event) event.stopPropagation();
    if (activity.completed || !this.userId) return;
    this.activityService.markCompleted(this.userId, activity.id).subscribe({
      next: () => {
        activity.completed = true;
        activity.completedAt = new Date().toISOString();
        this.toastr.success('Activity marked as completed');
      },
      error: (err) => {
        console.error('Complete failed', err);
        this.toastr.error('Failed to mark complete');
      }
    });
  }

  viewDetails(activity: ActivityWithUserData): void {
    this.router.navigate(['/activities', activity.id]);
  }

  // Pagination
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePage();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePage();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePage();
    }
  }

  getImageUrl(relativePath: string): string {
    if (!relativePath) return '/assets/logo.png';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.activityService.apiUrl}${relativePath}`;
  }

  // Translation methods
  translateActivity(activity: ActivityWithUserData, lang: string): void {
    if (this.translating[activity.id]) return;

    if (this.translations[activity.id] && this.currentTranslationLang[activity.id] === lang) {
      this.showOriginal[activity.id] = !this.showOriginal[activity.id];
      return;
    }

    this.translating[activity.id] = true;
    this.activityService.translateActivity(activity.id, lang).subscribe({
      next: (translated) => {
        this.translations[activity.id] = {
          name: translated.name,
          description: translated.description,
          instructions: translated.instructions,
          benefits: translated.benefits,
          precautions: translated.precautions
        };
        this.currentTranslationLang[activity.id] = lang;
        this.showOriginal[activity.id] = false;
        this.translating[activity.id] = false;
        this.toastr.success(`Activity translated to ${this.getLanguageName(lang)}`);
      },
      error: (err) => {
        console.error('Translation failed', err);
        this.toastr.error('Translation failed');
        this.translating[activity.id] = false;
      }
    });
  }

  toggleOriginal(activityId: string): void {
    this.showOriginal[activityId] = !this.showOriginal[activityId];
  }

  getLanguageName(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? lang.name : code;
  }

  // Summarization method
  summarizeActivity(activity: ActivityWithUserData): void {
    if (this.summaryLoading[activity.id]) return;
    this.summaryLoading[activity.id] = true;
    this.activityService.summarizeActivity(activity.id).subscribe({
      next: (summary) => {
        this.summaries[activity.id] = summary;
        this.summaryLoading[activity.id] = false;
        this.toastr.info(summary, 'Summary', { timeOut: 10000 });
      },
      error: (err) => {
        console.error('Summarization failed', err);
        this.toastr.error('Summarization failed');
        this.summaryLoading[activity.id] = false;
      }
    });
  }
}