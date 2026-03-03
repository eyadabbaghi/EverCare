import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ActivityService, ActivityWithUserData } from '../../../../core/services/activity.service';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.css'],
})
export class ActivityDetailsComponent implements OnInit {
  activity: ActivityWithUserData | null = null;
  userRating = 0;
  userId: string | null = null;
  Math = Math;

  // Translation and summarization
  languages = [
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' }
  ];
  selectedLang: string = 'fr';
  translatedActivity: any = null;
  showOriginal: boolean = true;
  translating: boolean = false;
  currentTranslationLang: string = '';
  
  summary: string = '';
  summaryLoading: boolean = false;
  showSummaryModal: boolean = false;  // New property

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const activityId = this.route.snapshot.paramMap.get('id');
    if (!activityId) {
      this.router.navigate(['/activities']);
      return;
    }

    this.authService.currentUser$.subscribe(user => {
      if (user && user.userId) {
        this.userId = user.userId;
        this.loadActivity(activityId);
      }
    });
  }

  loadActivity(activityId: string): void {
    if (!this.userId) return;
    this.activityService.getActivityForUser(this.userId, activityId).subscribe({
      next: (data) => {
        this.activity = data;
        this.userRating = data.userRating || 0;
      },
      error: (err) => {
        console.error('Failed to load activity', err);
        this.toastr.error('Activity not found');
        this.router.navigate(['/activities']);
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/activities']);
  }

  rate(rating: number): void {
    if (!this.activity || !this.userId) return;
    this.activityService.rateActivity(this.userId, this.activity.id, rating).subscribe({
      next: (updated) => {
        this.activity!.rating = updated.rating;
        this.activity!.totalRatings = updated.totalRatings;
        this.userRating = rating;
        this.toastr.success(`You rated this activity ${rating} star${rating !== 1 ? 's' : ''}`);
      },
      error: (err) => {
        console.error('Rate failed', err);
        this.toastr.error('Failed to submit rating');
      }
    });
  }

  getImageUrl(relativePath: string): string {
    if (!relativePath) return '/assets/logo.png';
    if (relativePath.startsWith('http')) return relativePath;
    return `${this.activityService.apiUrl}${relativePath}`;
  }

  // --- Translation methods ---
  translate(lang: string = this.selectedLang): void {
    if (!this.activity || this.translating) return;

    // If already have translation for this language, just toggle
    if (this.translatedActivity && this.currentTranslationLang === lang) {
      this.showOriginal = !this.showOriginal;
      return;
    }

    this.translating = true;
    this.activityService.translateActivity(this.activity.id, lang).subscribe({
      next: (translated) => {
        this.translatedActivity = translated;
        this.currentTranslationLang = lang;
        this.showOriginal = false;
        this.translating = false;
        this.toastr.success(`Activity translated to ${this.getLanguageName(lang)}`);
      },
      error: (err) => {
        console.error('Translation failed', err);
        this.toastr.error('Translation failed');
        this.translating = false;
      }
    });
  }

  getLanguageName(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang ? lang.name : code;
  }

  // --- Summarization method ---
  summarize(): void {
    if (!this.activity || this.summaryLoading) return;
    this.summaryLoading = true;
    this.activityService.summarizeActivity(this.activity.id).subscribe({
      next: (summary) => {
        this.summary = summary;
        this.summaryLoading = false;
        this.showSummaryModal = true;   // Open modal
      },
      error: (err) => {
        console.error('Summarization failed', err);
        this.toastr.error('Summarization failed');
        this.summaryLoading = false;
      }
    });
  }

  closeSummaryModal(): void {
    this.showSummaryModal = false;
  }
}