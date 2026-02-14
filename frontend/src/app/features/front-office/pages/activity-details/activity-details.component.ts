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
}