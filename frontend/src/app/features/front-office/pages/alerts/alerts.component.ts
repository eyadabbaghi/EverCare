import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService, User } from '../../../../features/front-office/pages/login/auth.service';
import { AlertsService } from '../../../../core/services/alerts.service';
import { UserService, Patient } from '../../../../core/services/user.service';
import { AddIncidentDialogComponent } from '../../../../add-incident-dialog/add-incident-dialog.component';
import { AddAlertDialogComponent } from '../../../../add-alert-dialog/add-alert-dialog.component';
import { Incident, Alert, Severity, IncidentType, AlertStatus } from '../../../../core/model/alerts.models';
// At the top with other imports
import { IncidentDetailsDialogComponent } from './incident-details-dialog.component';

// Extended UI models (include extra fields for display)
interface IncidentUI extends Incident {
  patientName: string;
  patientAvatar?: string;
  patientAge?: number;
  detectedBy: string;
  comments: any[];
  aiSuggestion?: string;
  medicalNotes?: string;
  vitalSigns?: any;
  medicationAdherence?: number;
  patientEmail?: string;   // add this

}

interface AlertUI extends Alert {
  senderName?: string;
  senderAvatar?: string;
  targetName?: string;
  label?: string;   // <-- add this
}

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css'],
})
export class AlertsComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userRole: 'doctor' | 'caregiver' | 'patient' | 'admin' = 'caregiver';
  patientCache: Map<string, { name: string; avatar?: string; email?: string }> = new Map();
  // For caregivers: set of patient IDs they are allowed to see
  allowedPatientIds: Set<string> | null = null;
// For doctors: list of patients they are connected to
doctorPatients: Patient[] = [];
selectedDoctorPatient: Patient | null = null;

  get isDoctor(): boolean {
    return this.userRole === 'doctor';
  }
  get isPatient(): boolean {
    return this.userRole === 'patient';
  }
  get isCaregiver(): boolean {
    return this.userRole === 'caregiver' || this.userRole === 'admin';
  }

  // Filters
  searchQuery = '';
  filterSeverity: Severity | 'all' = 'all';
  filterType: IncidentType | 'all' = 'all';
  filterStatus: AlertStatus | 'all' = 'all';
  selectedPatientFilter = 'all';

  // Pagination
  readonly INCIDENTS_PER_PAGE = 5;
  readonly ALERTS_PER_PAGE = 4;
  incidentPage = 1;
  alertsPage = 1;

  // Data from backend
  incidents: IncidentUI[] = [];
  alerts: AlertUI[] = [];

  // Selection
  selectedIncident: IncidentUI | null = null;
  selectedAlert: AlertUI | null = null;

  currentTime = new Date();
  private timerId?: any;
  private readonly isBrowser: boolean;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private readonly toastr: ToastrService,
    private authService: AuthService,
    private alertsService: AlertsService,
    private userService: UserService,
    private dialog: MatDialog
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.timerId = setInterval(() => {
        this.currentTime = new Date();
      }, 60000);
    }
    

    this.subscriptions.push(
      this.authService.currentUser$.subscribe((user: User | null) => {
        this.currentUser = user;
        if (user) {
          this.userRole = user.role.toLowerCase() as any;

          if (this.isDoctor) {
  this.loadDoctorPatients();
}
          // For caregivers, load allowed patients first
          if (this.isCaregiver) {
            this.getConnectedPatients().subscribe(patients => {
              this.allowedPatientIds = new Set(patients.map(p => p.userId));
              this.loadData();
            });
          } else {
            this.loadData();
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.subscriptions.forEach(s => s.unsubscribe());
  }

 loadData(): void {
  if (!this.currentUser) return;

  this.alertsService.getIncidents().subscribe({
    next: (incidents: Incident[]) => {
      console.log('Incidents from backend:', incidents);

      // Role‑based filtering
      if (this.isPatient) {
        incidents = incidents.filter(
          i => i.reportedByUserId === this.currentUser!.userId ||
                i.patientId === this.currentUser!.userId
        );
      } else if (this.isCaregiver && this.allowedPatientIds) {
        incidents = incidents.filter(
          i => this.allowedPatientIds!.has(i.patientId)
        );
      }

      this.incidents = incidents.map(i => this.enrichIncident(i));
      console.log('Mapped incidents:', this.incidents);

      // Load patient details for all unique patient IDs in the filtered incidents
      const patientIds = [...new Set(incidents.map(i => i.patientId))];
      this.loadPatientDetails(patientIds);

      this.loadAlerts();
    },
    error: (err) => {
      console.error('Failed to load incidents', err);
      this.toastr.error('Could not load incidents');
    }
  });
}

  loadAlerts(): void {
    this.alertsService.getAlerts().subscribe({
      next: (alerts: Alert[]) => {
        console.log('Alerts loaded:', alerts);
        this.alerts = alerts.map(alert => this.enrichAlert(alert));
      },
      error: (err) => {
        console.error('Failed to load alerts', err);
        this.toastr.warning('Alerts could not be loaded');
      }
    });
  }

  loadPatientDetails(patientIds: string[]): void {
  patientIds.forEach(id => {
    if (!this.patientCache.has(id)) {
      this.userService.getUserById(id).subscribe({
        next: (patient) => {
          this.patientCache.set(id, { 
            name: patient.name, 
            avatar: patient.profilePicture,
            email: patient.email      // add this
          });
          this.incidents = this.incidents.map(i =>
            i.patientId === id ? this.enrichIncident(i) : i
          );
        },
        error: (err) => console.error('Failed to load patient', err)
      });
    }
  });
}
  private enrichIncident(incident: Incident): IncidentUI {
  let patientName = 'Unknown patient';
  let patientAvatar = undefined;
  let patientEmail = undefined;   // add

  if (this.isPatient) {
    patientName = this.currentUser?.name ?? 'Me';
    patientAvatar = this.currentUser?.profilePicture;
    patientEmail = this.currentUser?.email;   // add
  } else {
    const cached = this.patientCache.get(incident.patientId);
    if (cached) {
      patientName = cached.name;
      patientAvatar = cached.avatar;
      patientEmail = cached.email;   // need to store email in cache
    } else {
      patientName = `Patient (${incident.patientId.substring(0, 6)})`;
    }
  }

  return {
    ...incident,
    patientName,
    patientAvatar,
    patientEmail,
    detectedBy: incident.reportedByUserId,
    comments: [],
    aiSuggestion: incident.aiSuggestion,
  };
}

  private enrichAlert(alert: Alert): AlertUI {
    return {
      ...alert,
    };
  }

  // Fetch the list of patients connected to the current user (for caregivers/doctors)
  private getConnectedPatients(): Observable<Patient[]> {
    if (!this.currentUser) return of([]);

    let emailList: string[] = [];
    if (this.currentUser.role === 'CAREGIVER' || this.currentUser.role === 'DOCTOR') {
      emailList = this.currentUser.patientEmails || [];
    } else if (this.currentUser.role === 'PATIENT') {
      return of([]);
    }

    if (emailList.length === 0) return of([]);

    // Fetch each patient by email and map to Patient objects
    const requests = emailList.map(email =>
      this.userService.getUserByEmail(email).pipe(
        catchError(() => of(null))
      )
    );
    return forkJoin(requests).pipe(
      map(users => users.filter(u => u !== null) as Patient[])
    );
  }

  // ---------- Dialog openers ----------
  openCreateIncidentDialog(): void {
    if (this.isPatient && this.currentUser) {
      const dialogRef = this.dialog.open(AddIncidentDialogComponent, {
        width: '800px',
        maxWidth: '95vw',
        data: {}
      });
      this.handleIncidentDialogResult(dialogRef);
    } else if (this.isCaregiver) {
      this.getConnectedPatients().subscribe((patients: Patient[]) => {
        const dialogRef = this.dialog.open(AddIncidentDialogComponent, {
          width: '800px',
          maxWidth: '95vw',
          data: { allowedPatients: patients }
        });
        this.handleIncidentDialogResult(dialogRef);
      });
    }
  }

  private handleIncidentDialogResult(dialogRef: any) {
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.alertsService.createIncident(result).subscribe({
          next: () => {
            this.toastr.success('Incident created');
            this.loadData();
          },
          error: (err) => this.toastr.error('Failed to create incident')
        });
      }
    });
  }

  openEditIncidentDialog(incident: IncidentUI): void {
    // For editing, load all patients (or restrict to connected ones if desired)
    this.userService.getPatients().subscribe((patients: Patient[]) => {
      const dialogRef = this.dialog.open(AddIncidentDialogComponent, {
        width: '800px',
        maxWidth: '95vw',
        data: { incident, allowedPatients: patients }
      });
      dialogRef.afterClosed().subscribe((result: any) => {
        if (result) {
          this.alertsService.updateIncident(incident.incidentId, result).subscribe({
            next: (updated: Incident) => {
              const index = this.incidents.findIndex(i => i.incidentId === updated.incidentId);
              if (index !== -1) {
                this.incidents[index] = this.enrichIncident(updated);
              }
              this.toastr.success('Incident updated');
            },
            error: (err) => this.toastr.error('Failed to update incident')
          });
        }
      });
    });
  }

 openCreateAlertDialog(incident: IncidentUI): void {
  const dialogRef = this.dialog.open(AddAlertDialogComponent, {
    width: '600px',
    maxWidth: '95vw',
    data: { incident } // pass the whole incident
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    if (result) {
      this.alertsService.createAlert(result).subscribe({
        next: (newAlert: Alert) => {
          this.alerts = [this.enrichAlert(newAlert), ...this.alerts];
          this.toastr.success('Alert created');
        },
        error: (err) => this.toastr.error('Failed to create alert')
      });
    }
  });
}

 openEditAlertDialog(incident: IncidentUI, alert: AlertUI): void {
  const dialogRef = this.dialog.open(AddAlertDialogComponent, {
    width: '600px',
    maxWidth: '95vw',
    data: { incident, alert }
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    if (result) {
      this.alertsService.updateAlert(alert.alertId, result).subscribe({
        next: (updated: Alert) => {
          const idx = this.alerts.findIndex(a => a.alertId === updated.alertId);
          if (idx !== -1) {
            this.alerts[idx] = this.enrichAlert(updated);
          }
          this.toastr.success('Alert updated');
        },
        error: (err) => this.toastr.error('Failed to update alert')
      });
    }
  });
}

  deleteIncident(incident: IncidentUI): void {
    if (confirm('Delete this incident and all related alerts?')) {
      this.alertsService.deleteIncident(incident.incidentId).subscribe({
        next: () => {
          this.incidents = this.incidents.filter(i => i.incidentId !== incident.incidentId);
          this.alerts = this.alerts.filter(a => a.incidentId !== incident.incidentId);
          if (this.selectedIncident?.incidentId === incident.incidentId) {
            this.selectedIncident = null;
            this.selectedAlert = null;
          }
          this.toastr.success('Incident deleted');
        },
        error: (err) => this.toastr.error('Failed to delete incident')
      });
    }
  }

  deleteAlert(alert: AlertUI): void {
    if (confirm('Delete this alert?')) {
      this.alertsService.deleteAlert(alert.alertId).subscribe({
        next: () => {
          this.alerts = this.alerts.filter(a => a.alertId !== alert.alertId);
          if (this.selectedAlert?.alertId === alert.alertId) {
            this.selectedAlert = null;
          }
          this.toastr.success('Alert deleted');
        },
        error: (err) => this.toastr.error('Failed to delete alert')
      });
    }
  }

  acknowledgeAlert(alert: AlertUI): void {
    this.alertsService.acknowledgeAlert(alert.alertId).subscribe({
      next: (updated: Alert) => {
        const idx = this.alerts.findIndex(a => a.alertId === updated.alertId);
        if (idx !== -1) this.alerts[idx] = this.enrichAlert(updated);
        this.toastr.success('Alert acknowledged');
      },
      error: (err) => this.toastr.error('Failed to acknowledge alert')
    });
  }

  resolveAlert(alert: AlertUI): void {
    this.alertsService.resolveAlert(alert.alertId).subscribe({
      next: (updated: Alert) => {
        const idx = this.alerts.findIndex(a => a.alertId === updated.alertId);
        if (idx !== -1) this.alerts[idx] = this.enrichAlert(updated);
        this.toastr.success('Alert resolved');
      },
      error: (err) => this.toastr.error('Failed to resolve alert')
    });
  }

  // ---------- Filtering and pagination ----------
  get stats() {
    const alertsForStats = this.isDoctor
      ? this.alerts.filter(a => a.targetId === this.currentUser?.userId)
      : this.alerts;

    return {
      total: alertsForStats.length,
      active: alertsForStats.filter(a => a.status === 'SENT').length,
      acknowledged: alertsForStats.filter(a => a.status === 'ACKNOWLEDGED').length,
      resolved: alertsForStats.filter(a => a.status === 'RESOLVED').length,
      critical: alertsForStats.filter(a => {
        const inc = this.incidents.find(i => i.incidentId === a.incidentId);
        return inc?.severity === 'CRITICAL' && a.status === 'SENT';
      }).length,
    };
  }

  get filteredIncidents(): IncidentUI[] {
    let filtered = this.incidents ?? [];

    // Doctor restriction (already done in loadData? Actually loadData doesn't filter for doctors.
    // But we have the `targetIncidentIds` logic here, which is correct.)
    if (this.isDoctor && this.currentUser?.userId) {
      const targetIncidentIds = new Set(
        (this.alerts ?? [])
          .filter(a => a?.targetId === this.currentUser!.userId)
          .map(a => a?.incidentId)
      );
      filtered = filtered.filter(inc =>
        inc?.incidentId && targetIncidentIds.has(inc.incidentId)
      );
    }

    const search = (this.searchQuery ?? '').toLowerCase();

    return filtered.filter(incident => {
      const title = (incident?.title ?? '').toLowerCase();
      const patientName = (incident?.patientName ?? '').toLowerCase();
      const severity = incident?.severity ?? null;
      const type = incident?.type ?? null;
      const patientId = incident?.patientId ?? null;

      const matchesSearch =
        title.includes(search) ||
        patientName.includes(search);

      const matchesSeverity =
        this.filterSeverity === 'all' ||
        severity === this.filterSeverity;

      const matchesType =
        this.filterType === 'all' ||
        type === this.filterType;

      const matchesPatient =
        this.selectedPatientFilter === 'all' ||
        patientId === this.selectedPatientFilter;

      return matchesSearch && matchesSeverity && matchesType && matchesPatient;
    });
  }

  get totalIncidentPages(): number {
    return Math.max(1, Math.ceil(this.filteredIncidents.length / this.INCIDENTS_PER_PAGE));
  }

  get paginatedIncidents(): IncidentUI[] {
    const start = (this.incidentPage - 1) * this.INCIDENTS_PER_PAGE;
    return this.filteredIncidents.slice(start, start + this.INCIDENTS_PER_PAGE);
  }

  get alertsForSelectedIncident(): AlertUI[] {
    if (!this.selectedIncident) return [];
    return this.alerts.filter(a => a.incidentId === this.selectedIncident!.incidentId);
  }

  get totalAlertPages(): number {
    return Math.max(1, Math.ceil(this.alertsForSelectedIncident.length / this.ALERTS_PER_PAGE));
  }

  get paginatedAlerts(): AlertUI[] {
    const start = (this.alertsPage - 1) * this.ALERTS_PER_PAGE;
    return this.alertsForSelectedIncident.slice(start, start + this.ALERTS_PER_PAGE);
  }

  getFirstAlert(incidentId: string): AlertUI | undefined {
    return this.alerts.find(a => a.incidentId === incidentId);
  }

  selectIncident(incident: IncidentUI): void {
    this.selectedIncident = incident;
    this.selectedAlert = this.getFirstAlert(incident.incidentId) || null;
    this.alertsPage = 1;
  }

  previousIncidentPage(): void {
    if (this.incidentPage > 1) this.incidentPage--;
  }

  nextIncidentPage(): void {
    if (this.incidentPage < this.totalIncidentPages) this.incidentPage++;
  }

  previousAlertsPage(): void {
    if (this.alertsPage > 1) this.alertsPage--;
  }

  nextAlertsPage(): void {
    if (this.alertsPage < this.totalAlertPages) this.alertsPage++;
  }

  // ---------- Helpers for UI ----------
  getSeverityBadgeClasses(severity: Severity): string {
    switch (severity) {
      case 'CRITICAL': return 'bg-[#C06C84] text-white';
      case 'HIGH': return 'bg-[#B39DDB] text-white';
      case 'MEDIUM': return 'bg-[#DCCEF9] text-[#7C3AED]';
      case 'LOW': return 'bg-[#A8E6CF] text-[#22c55e]';
    }
  }

  getStatusBadgeClasses(status: AlertStatus): string {
    switch (status) {
      case 'SENT': return 'bg-[#C06C84] text-white';
      case 'ACKNOWLEDGED': return 'bg-[#F59E0B] text-white';
      case 'RESOLVED': return 'bg-[#22c55e] text-white';
    }
  }

  getElapsedMinutes(date: Date): string {
    const diff = this.currentTime.getTime() - new Date(date).getTime();
    const minutes = Math.floor(Math.abs(diff) / 60000);
    const hours = Math.floor(minutes / 60);
    if (diff > 0) {
      if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
      return `in ${minutes}m`;
    }
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  }

  getInitials(name?: string): string {
    if (!name) return '';
    return name.split(' ').filter(p => p.length > 0).map(p => p[0]).join('');
  }

  getSeverityIcon(severity: Severity): string {
    switch (severity) {
      case 'LOW': return '🙂';
      case 'MEDIUM': return '😐';
      case 'HIGH': return '⚠️';
      case 'CRITICAL': return '🚨';
      default: return '';
    }
  }

  // Pagination helpers
  get currentPage(): number {
    return this.incidentPage;
  }

  get totalPages(): number {
    return this.totalIncidentPages;
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.incidentPage = page;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.incidentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.incidentPage++;
    }
  }

  // Load doctor's patients from patientEmails
loadDoctorPatients(): void {
  console.log('loadDoctorPatients called, currentUser:', this.currentUser);
  if (!this.currentUser || !this.currentUser.patientEmails) {
    console.log('No patientEmails in currentUser');
    return;
  }
  console.log('patientEmails:', this.currentUser.patientEmails);
  const emailList = this.currentUser.patientEmails;
  const requests = emailList.map(email =>
    this.userService.getUserByEmail(email).pipe(catchError(() => of(null)))
  );
  forkJoin(requests).pipe(map(users => users.filter(u => u !== null) as Patient[]))
    .subscribe(patients => {
      console.log('Loaded doctorPatients:', patients);
      this.doctorPatients = patients;
      if (patients.length) this.selectDoctorPatient(patients[0]);
    });
}

selectDoctorPatient(patient: Patient): void {
  this.selectedDoctorPatient = patient;
  // Filter incidents by this patient
}
get incidentsForSelectedPatient(): IncidentUI[] {
  return this.incidents.filter(i => i.patientId === this.selectedDoctorPatient?.userId);
}

getIncidentCountForPatient(patientId: string): number {
  return this.incidents.filter(i => i.patientId === patientId).length;
}

openIncidentDetailsDialog(incident: IncidentUI): void {
  this.dialog.open(IncidentDetailsDialogComponent, {
    width: '500px',
    data: { incident }
  });
}
}