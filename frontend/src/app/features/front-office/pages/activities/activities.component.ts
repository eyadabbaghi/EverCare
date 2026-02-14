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
  activities: ActivityWithUserData[] = [];
  todayActivities: ActivityWithUserData[] = [];
  recommendedActivities: ActivityWithUserData[] = [];
  userId: string | null = null;

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
        this.activities = data;
        // You can adjust slicing logic as needed
        this.todayActivities = data.slice(0, 4);
        this.recommendedActivities = data.slice(4, 6);
      },
      error: (err) => {
        console.error('Failed to load activities', err);
        this.toastr.error('Could not load activities');
      }
    });
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
}