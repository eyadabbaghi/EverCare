import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ActivityService, Activity, ActivityDetails, UpdateActivityRequest, UpdateActivityDetailsRequest } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-activity-details-admin',
  templateUrl: './activity-details-admin.component.html',
  styleUrls: ['./activity-details-admin.component.css'],
})
export class ActivityDetailsAdminComponent implements OnInit {
  activity: Activity | null = null;
  details: ActivityDetails | null = null;
  isEditing = false;
  Math = Math;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private activityService: ActivityService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/activities']);
      return;
    }

    this.loadActivity(id);
  }

  loadActivity(id: string): void {
    this.activityService.getActivityById(id).subscribe({
      next: (activity) => {
        this.activity = activity;
        this.loadDetails(id);
      },
      error: (err) => {
        console.error('Failed to load activity', err);
        this.toastr.error('Activity not found');
        this.router.navigate(['/admin/activities']);
      }
    });
  }

  loadDetails(activityId: string): void {
    this.activityService.getDetailsByActivityId(activityId).subscribe({
      next: (details) => {
        this.details = details.length > 0 ? details[0] : null;
        this.isEditing = false;
      },
      error: (err) => console.error('Failed to load details', err)
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  addInstruction(): void {
    if (!this.details) return;
    this.details.instructions = [...this.details.instructions, ''];
  }

  removeInstruction(index: number): void {
    if (!this.details) return;
    this.details.instructions = this.details.instructions.filter((_, i) => i !== index);
  }

  addBenefit(): void {
    if (!this.details) return;
    this.details.benefits = [...this.details.benefits, ''];
  }

  removeBenefit(index: number): void {
    if (!this.details) return;
    this.details.benefits = this.details.benefits.filter((_, i) => i !== index);
  }

  addPrecaution(): void {
    if (!this.details) return;
    const current = this.details.precautions || [];
    this.details.precautions = [...current, ''];
  }

  removePrecaution(index: number): void {
    if (!this.details || !this.details.precautions) return;
    this.details.precautions = this.details.precautions.filter((_, i) => i !== index);
  }

  save(): void {
    if (!this.activity) return;

    const activityUpdate: UpdateActivityRequest = {
      name: this.activity.name,
      type: this.activity.type,
      duration: this.activity.duration,
      scheduledTime: this.activity.scheduledTime,
      description: this.activity.description,
      imageUrl: this.activity.imageUrl,
      doctorSuggested: this.activity.doctorSuggested,
      location: this.activity.location,
      startTime: this.activity.startTime,
      monitoredBy: this.activity.monitoredBy,
    };

    // Update activity first
    this.activityService.updateActivity(this.activity.id, activityUpdate).subscribe({
      next: (updatedActivity) => {
        this.activity = updatedActivity;

        // Then update details if they exist
        if (this.details) {
          const detailsUpdate: UpdateActivityDetailsRequest = {
            instructions: this.details.instructions.filter(s => s.trim().length > 0),
            difficulty: this.details.difficulty,
            recommendedStage: this.details.recommendedStage,
            frequency: this.details.frequency,
            supervision: this.details.supervision,
            benefits: this.details.benefits.filter(s => s.trim().length > 0),
            precautions: this.details.precautions?.filter(s => s.trim().length > 0),
          };
          this.activityService.updateDetails(this.details.id, detailsUpdate).subscribe({
            next: (updatedDetails) => {
              this.details = updatedDetails;
              this.isEditing = false;
              this.toastr.success('Activity updated');
            },
            error: (err) => {
              console.error('Details update failed', err);
              this.toastr.warning('Activity updated but details failed');
              this.isEditing = false;
            }
          });
        } else {
          // No details, maybe create? For simplicity, just finish
          this.isEditing = false;
          this.toastr.success('Activity updated');
        }
      },
      error: (err) => {
        console.error('Update failed', err);
        this.toastr.error('Update failed');
      }
    });
  }

  deleteAndBack(): void {
    if (!this.activity) return;
    if (!confirm('Delete this activity?')) return;
    this.activityService.deleteActivity(this.activity.id).subscribe({
      next: () => {
        this.toastr.success('Activity deleted');
        this.router.navigate(['/admin/activities']);
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.toastr.error('Delete failed');
      }
    });
  }

  backToList(): void {
    this.router.navigate(['/admin/activities']);
  }

  trackByIndex(index: number, item: any): number {
  return index;
}

updateInstruction(index: number, value: string): void {
  if (this.details && this.details.instructions) {
    this.details.instructions[index] = value;
  }
}

updateBenefit(index: number, value: string): void {
  if (this.details && this.details.benefits) {
    this.details.benefits[index] = value;
  }
}

updatePrecaution(index: number, value: string): void {
  if (this.details && this.details.precautions) {
    this.details.precautions[index] = value;
  }
}
}