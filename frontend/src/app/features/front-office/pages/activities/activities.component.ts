import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ActivityService, ActivityWithUserData } from '../../../../core/services/activity.service';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
export class ActivitiesComponent implements OnInit {
  allActivities: ActivityWithUserData[] = [];
  todayActivities: ActivityWithUserData[] = [];
  recommendedActivities: ActivityWithUserData[] = [];
  userId: string | null = null;

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

  constructor(
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private activityService: ActivityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.userId) {
        this.userId = user.userId;
        this.loadActivities();
      }
    });
  }

  loadActivities(): void {
    if (!this.userId) return;
    this.activityService.getActivitiesForUser(this.userId).subscribe({
      next: (data) => {
        this.allActivities = data;
        this.types = [...new Set(data.map(a => a.type))];
        this.difficulties = [...new Set(data.map(a => a.difficulty))];
        this.applyFilters(); // initial filter
      },
      error: (err) => {
        console.error('Failed to load activities', err);
        this.toastr.error('Could not load activities');
      }
    });
  }

  applyFilters(): void {
    // Start with all activities
    let filtered = this.allActivities;

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term)
      );
    }

    // Filter by type
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }

    // Filter by difficulty
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(a => a.difficulty === this.selectedDifficulty);
    }

    // Save filtered list
    this.filteredActivities = filtered;

    // Reset to first page when filters change
    this.currentPage = 1;
    this.totalPages = Math.max(1, Math.ceil(this.filteredActivities.length / this.pageSize));

    // Update displayed items
    this.updatePage();
  }

  // Called when pagination changes (without resetting page)
  private updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredActivities.slice(start, start + this.pageSize);
    this.todayActivities = pageItems.slice(0, 4);
    this.recommendedActivities = pageItems.slice(4, 6);
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

  // Pagination methods
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
}