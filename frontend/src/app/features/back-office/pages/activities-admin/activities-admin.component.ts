import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ActivityService, Activity, ActivityDetails, ActivityWithDetails, CreateActivityRequest, UpdateActivityRequest, CreateActivityDetailsRequest, UpdateActivityDetailsRequest } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-activities-admin',
  templateUrl: './activities-admin.component.html',
  styleUrls: ['./activities-admin.component.css'],
})
export class ActivitiesAdminComponent implements OnInit {
  activities: Activity[] = [];
  activitiesWithDetails: ActivityWithDetails[] = [];
  selectedActivity: ActivityWithDetails | null = null;
  selectedDetails: ActivityDetails | null = null;

  formMode: 'create' | 'edit' = 'create';
  activityForm: Activity = this.createEmptyActivity();
  detailsForm: Partial<ActivityDetails> = this.createEmptyDetails();

  currentPage = 1;
  pageSize = 4;

  activityTypes = ['Relaxation', 'Cognitive', 'Physical', 'Social', 'Creative'];
  difficultyLevels: ('Easy' | 'Moderate' | 'Challenging')[] = ['Easy', 'Moderate', 'Challenging'];
  stages: ('Early' | 'Moderate' | 'Advanced')[] = ['Early', 'Moderate', 'Advanced'];

  private clickTimeout: any; // to handle double-click

  constructor(
    private readonly router: Router,
    private activityService: ActivityService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.activityService.getAllActivities().subscribe({
      next: (data) => {
        this.activities = data;
        this.loadAllDetails();
      },
      error: (err) => {
        console.error('Failed to load activities', err);
        this.toastr.error('Could not load activities');
      }
    });
  }

  loadAllDetails(): void {
    const requests = this.activities.map(activity =>
      this.activityService.getDetailsByActivityId(activity.id).toPromise()
        .then(details => ({ activity, details: details || [] }))
        .catch(() => ({ activity, details: [] }))
    );

    Promise.all(requests).then(results => {
      this.activitiesWithDetails = results.map(result => {
        const activity = result.activity;
        const details = result.details.length > 0 ? result.details[0] : null;
        return {
          ...activity,
          instructions: details?.instructions || [],
          difficulty: details?.difficulty || 'Easy',
          recommendedStage: details?.recommendedStage || [],
          frequency: details?.frequency || '',
          supervision: details?.supervision || '',
          benefits: details?.benefits || [],
          precautions: details?.precautions || [],
        };
      });
      if (this.activitiesWithDetails.length > 0) {
        this.selectActivity(this.activitiesWithDetails[0]);
      }
    }).catch(err => {
      console.error('Failed to load details', err);
      this.toastr.error('Could not load activity details');
    });
  }

  get pagedActivities(): ActivityWithDetails[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.activitiesWithDetails.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.activitiesWithDetails.length / this.pageSize) || 1);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  createEmptyActivity(): Activity {
    return {
      id: '',
      name: '',
      type: 'Relaxation',
      duration: 10,
      scheduledTime: '',
      description: '',
      imageUrl: '',
      rating: 0,
      totalRatings: 0,
      doctorSuggested: false,
    };
  }

  createEmptyDetails(): Partial<ActivityDetails> {
    return {
      instructions: [''],
      difficulty: 'Easy',
      recommendedStage: [],
      frequency: '',
      supervision: '',
      benefits: [''],
      precautions: [],
    };
  }

  // Public select method – used by template (with delay)
  selectActivity(activity: ActivityWithDetails): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    this.clickTimeout = setTimeout(() => {
      this._selectActivity(activity);
      this.clickTimeout = null;
    }, 200);
  }

  // Internal immediate selection
  private _selectActivity(activity: ActivityWithDetails): void {
    this.selectedActivity = activity;
    this.formMode = 'edit';
    this.activityForm = { ...activity };
    this.selectedDetails = {
      id: activity.id,
      activityId: activity.id,
      instructions: activity.instructions,
      difficulty: activity.difficulty,
      recommendedStage: activity.recommendedStage,
      frequency: activity.frequency,
      supervision: activity.supervision,
      benefits: activity.benefits,
      precautions: activity.precautions,
    };
    this.detailsForm = { ...this.selectedDetails };
  }

  goToDetails(activity: ActivityWithDetails): void {
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    this.router.navigate(['/admin/activities', activity.id], {
      state: { activity },
    });
  }

  startCreate(): void {
    this.formMode = 'create';
    this.activityForm = this.createEmptyActivity();
    this.detailsForm = this.createEmptyDetails();
    this.selectedActivity = null;
    this.selectedDetails = null;
  }

  addInstruction(): void {
    const instructions = this.detailsForm.instructions || [];
    this.detailsForm.instructions = [...instructions, ''];
  }

  removeInstruction(index: number): void {
    const instructions = this.detailsForm.instructions || [];
    this.detailsForm.instructions = instructions.filter((_, i) => i !== index);
  }

  addBenefit(): void {
    const benefits = this.detailsForm.benefits || [];
    this.detailsForm.benefits = [...benefits, ''];
  }

  removeBenefit(index: number): void {
    const benefits = this.detailsForm.benefits || [];
    this.detailsForm.benefits = benefits.filter((_, i) => i !== index);
  }

  addPrecaution(): void {
    const precautions = this.detailsForm.precautions || [];
    this.detailsForm.precautions = [...precautions, ''];
  }

  removePrecaution(index: number): void {
    const precautions = this.detailsForm.precautions || [];
    this.detailsForm.precautions = precautions.filter((_, i) => i !== index);
  }

  toggleStage(stage: 'Early' | 'Moderate' | 'Advanced'): void {
    const stages = this.detailsForm.recommendedStage || [];
    if (stages.includes(stage)) {
      this.detailsForm.recommendedStage = stages.filter(s => s !== stage);
    } else {
      this.detailsForm.recommendedStage = [...stages, stage];
    }
  }

  saveActivity(): void {
    const cleanedActivity: CreateActivityRequest | UpdateActivityRequest = {
      name: this.activityForm.name,
      type: this.activityForm.type,
      duration: this.activityForm.duration,
      scheduledTime: this.activityForm.scheduledTime || undefined,
      description: this.activityForm.description,
      imageUrl: this.activityForm.imageUrl,
      doctorSuggested: this.activityForm.doctorSuggested,
      location: this.activityForm.location,
      startTime: this.activityForm.startTime,
      monitoredBy: this.activityForm.monitoredBy,
    };

    if (this.formMode === 'create') {
      this.activityService.createActivity(cleanedActivity as CreateActivityRequest).subscribe({
        next: (newActivity) => {
          const detailsRequest: CreateActivityDetailsRequest = {
            activityId: newActivity.id,
            instructions: (this.detailsForm.instructions || []).filter(s => s.trim().length > 0),
            difficulty: this.detailsForm.difficulty as 'Easy' | 'Moderate' | 'Challenging',
            recommendedStage: this.detailsForm.recommendedStage || [],
            frequency: this.detailsForm.frequency || '',
            supervision: this.detailsForm.supervision || '',
            benefits: (this.detailsForm.benefits || []).filter(s => s.trim().length > 0),
            precautions: (this.detailsForm.precautions || []).filter(s => s.trim().length > 0),
          };
          this.activityService.createDetails(detailsRequest).subscribe({
            next: (newDetails) => {
              const combined: ActivityWithDetails = {
                ...newActivity,
                instructions: newDetails.instructions,
                difficulty: newDetails.difficulty,
                recommendedStage: newDetails.recommendedStage,
                frequency: newDetails.frequency,
                supervision: newDetails.supervision,
                benefits: newDetails.benefits,
                precautions: newDetails.precautions,
              };
              this.activitiesWithDetails = [...this.activitiesWithDetails, combined];
              this.selectActivity(combined);
              this.toastr.success('Activity created');
            },
            error: (err) => {
              console.error('Details creation failed', err);
              this.toastr.error('Activity created but details failed');
            }
          });
        },
        error: (err) => {
          console.error('Create failed', err);
          this.toastr.error('Creation failed');
        }
      });
    } else {
      if (!this.selectedActivity) return;
      this.activityService.updateActivity(this.selectedActivity.id, cleanedActivity).subscribe({
        next: (updatedActivity) => {
          const detailsRequest: UpdateActivityDetailsRequest = {
            instructions: (this.detailsForm.instructions || []).filter(s => s.trim().length > 0),
            difficulty: this.detailsForm.difficulty,
            recommendedStage: this.detailsForm.recommendedStage,
            frequency: this.detailsForm.frequency,
            supervision: this.detailsForm.supervision,
            benefits: (this.detailsForm.benefits || []).filter(s => s.trim().length > 0),
            precautions: (this.detailsForm.precautions || []).filter(s => s.trim().length > 0),
          };
          if (this.selectedDetails?.id) {
            this.activityService.updateDetails(this.selectedDetails.id, detailsRequest).subscribe({
              next: (updatedDetails) => {
                this.updateLocal(updatedActivity, updatedDetails);
                this.toastr.success('Activity updated');
              },
              error: (err) => {
                console.error('Details update failed', err);
                this.updateLocal(updatedActivity, null);
                this.toastr.warning('Activity updated but details failed');
              }
            });
          } else {
            const createReq: CreateActivityDetailsRequest = {
              activityId: updatedActivity.id,
              ...detailsRequest as any,
            };
            this.activityService.createDetails(createReq).subscribe({
              next: (newDetails) => {
                this.updateLocal(updatedActivity, newDetails);
                this.toastr.success('Activity updated and details created');
              },
              error: (err) => {
                console.error('Details creation failed', err);
                this.updateLocal(updatedActivity, null);
                this.toastr.warning('Activity updated but details creation failed');
              }
            });
          }
        },
        error: (err) => {
          console.error('Update failed', err);
          this.toastr.error('Update failed');
        }
      });
    }
  }

  private updateLocal(updatedActivity: Activity, updatedDetails: ActivityDetails | null): void {
    const index = this.activitiesWithDetails.findIndex(a => a.id === updatedActivity.id);
    if (index !== -1) {
      const existing = this.activitiesWithDetails[index];
      const combined: ActivityWithDetails = {
        ...updatedActivity,
        instructions: updatedDetails?.instructions || existing.instructions,
        difficulty: updatedDetails?.difficulty || existing.difficulty,
        recommendedStage: updatedDetails?.recommendedStage || existing.recommendedStage,
        frequency: updatedDetails?.frequency || existing.frequency,
        supervision: updatedDetails?.supervision || existing.supervision,
        benefits: updatedDetails?.benefits || existing.benefits,
        precautions: updatedDetails?.precautions || existing.precautions,
      };
      this.activitiesWithDetails[index] = combined;
      this.selectedActivity = combined;
      this.activityForm = { ...updatedActivity };
      this.selectedDetails = updatedDetails || { ...combined } as any;
      this.detailsForm = { ...this.selectedDetails };
    }
  }

  deleteCurrentActivity(): void {
    if (!this.selectedActivity) return;
    this.deleteActivity(this.selectedActivity);
  }

  deleteActivity(activity: ActivityWithDetails): void {
    if (!confirm(`Delete "${activity.name}"?`)) return;
    this.activityService.deleteActivity(activity.id).subscribe({
      next: () => {
        this.activitiesWithDetails = this.activitiesWithDetails.filter(a => a.id !== activity.id);
        if (this.selectedActivity?.id === activity.id) {
          this.selectedActivity = this.activitiesWithDetails[0] || null;
          if (this.selectedActivity) {
            this.selectActivity(this.selectedActivity);
          } else {
            this.startCreate();
          }
        }
        this.toastr.success('Activity deleted');
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.toastr.error('Delete failed');
      }
    });
  }

  trackByIndex(index: number, item: any): number {
  return index;
}
updateInstruction(index: number, value: string): void {
  if (this.detailsForm.instructions) {
    this.detailsForm.instructions[index] = value;
  }
}

updateBenefit(index: number, value: string): void {
  if (this.detailsForm.benefits) {
    this.detailsForm.benefits[index] = value;
  }
}

updatePrecaution(index: number, value: string): void {
  if (this.detailsForm.precautions) {
    this.detailsForm.precautions[index] = value;
  }
}
}