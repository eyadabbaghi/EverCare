import { Component, OnInit } from '@angular/core';
import { Appointment } from '../../models/appointment';
import { User } from '../../models/user';
import { DoctorStats } from '../../models/doctor-stats';
import { RecentPatient } from '../../models/recent-patient';
import { AppointmentService } from '../../services/appointments.service';
import { AuthService } from '../../../front-office/pages/login/auth.service';

// Interface for the backend appointment structure
interface BackendAppointment {
  appointmentId: string;
  patient: {
    userId: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    profilePicture?: string;
    alzheimerStage?: string;
    dateOfBirth?: string;
    emergencyContact?: string;
  };
  doctor: {
    userId: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    profilePicture?: string;
    specialty?: string;
  };
  caregiver?: {
    userId: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    profilePicture?: string;
    relationship?: string;
  } | null;
  consultationType: {
    typeId: string;
    name: string;
    description?: string;
    defaultDurationMinutes: number;
    alzheimerDurationMinutes: number;
    requiresCaregiver: boolean;
  };
  startDateTime: Date;
  endDateTime: Date;
  status: string;
  caregiverPresence: string;
  videoLink?: string;
  doctorNotes?: string;
  isRecurring: boolean;
}

@Component({
  selector: 'app-doctor-appointments-page',
  templateUrl: 'doctor-appointments-page.component.html',
})
export class DoctorAppointmentsPageComponent implements OnInit {
  // Current doctor (from auth service)
  currentDoctor: User = {
    userId: '',
    name: '',
    email: '',
    role: 'DOCTOR',
    phone: '',
    profilePicture: '',
    specialty: '',
    acceptsNewPatients: true
  };

  // Appointments data
  appointments: Appointment[] = [];
  private rawAppointments: BackendAppointment[] = [];

  selectedAppointment: Appointment | null = null;

  // Stats
  doctorStats: DoctorStats = {
    todayCount: 0,
    upcomingCount: 0,
    totalPatients: 0,
    completionRate: 0
  };

  // Recent patients
  recentPatients: RecentPatient[] = [];

  // Selected patient details
  selectedPatientBirthDate?: Date;
  selectedPatientAge?: number;
  selectedPatientStage?: string;
  selectedPatientEmergency?: string;
  selectedPatientVisits?: number;
  selectedPatientDetails?: User;

  // Loading states
  loading = false;
  loadingStats = false;
  loadingPatients = false;
  errorMessage = '';
  successMessage = '';

  // Date filter
  selectedDate: Date = new Date();

  // Notes editing state
  isEditingNotes = false;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user from auth service
    this.authService.currentUser$.subscribe(user => {
      if (user && user.role === 'DOCTOR') {
        this.currentDoctor = {
          ...this.currentDoctor,
          ...user,
          userId: user.userId || 'doc-001',
          name: user.name || 'Dr. Martin Dubois',
          email: user.email || 'martin.dubois@clinique.fr',
          phone: user.phone || '01 23 45 67 89',
          profilePicture: user.profilePicture || 'https://randomuser.me/api/portraits/men/2.jpg',
          role :"DOCTOR"
        };
        this.loadAllData();
      } else {
        // Fallback to mock data if no user or not a doctor
        this.setMockDoctorData();
        this.loadAllData();
      }
    });
  }

  private setMockDoctorData(): void {
    this.currentDoctor = {
      userId: "doc-001",
      name: "Dr. Martin Dubois",
      email: "martin.dubois@clinique.fr",
      role: "DOCTOR",
      phone: "01 23 45 67 89",
      profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
      specialty: "Neurologist",
      acceptsNewPatients: true
    };
  }

  // ========== HELPER METHODS FOR DATE HANDLING ==========

  private safeParseDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  // ========== DATA LOADING METHODS ==========

  loadAllData(): void {
    this.loadDoctorStats();
    this.loadAppointments();
    this.loadRecentPatients();
  }

  loadDoctorStats(): void {
    this.loadingStats = true;

    // Calculate stats from appointments after they load
    setTimeout(() => {
      this.doctorStats = {
        todayCount: this.todayAppointments.length,
        upcomingCount: this.upcomingAppointments.length,
        totalPatients: this.getUniquePatientsCount(),
        completionRate: this.getCompletionRate()
      };
      this.loadingStats = false;
    }, 500);
  }

  loadAppointments(): void {
    this.loading = true;
    this.appointmentService.getAppointmentsByDoctor(this.currentDoctor.userId).subscribe({
      next: (data: any) => {
        // Store raw data
        this.rawAppointments = data;

        // Transform to your Appointment model
        this.appointments = this.transformAppointments(data);

        this.loading = false;
        this.loadDoctorStats(); // Recalculate stats after appointments load
        this.loadRecentPatients(); // Reload patients with new appointment data
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.errorMessage = 'Failed to load appointments';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);

        // Load mock data for testing
        this.loadMockAppointments();
      }
    });
  }

  private transformAppointments(data: BackendAppointment[]): Appointment[] {
    return data.map(item => ({
      appointmentId: item.appointmentId,
      patientId: item.patient.userId,
      patientName: item.patient.name,
      doctorId: item.doctor.userId,
      doctorName: item.doctor.name,
      caregiverId: item.caregiver?.userId,
      caregiverName: item.caregiver?.name,
      consultationTypeId: item.consultationType.typeId,
      consultationTypeName: item.consultationType.name,
      startDateTime: item.startDateTime,
      endDateTime: item.endDateTime,
      status: item.status as any,
      caregiverPresence: item.caregiverPresence as any,
      videoLink: item.videoLink,
      doctorNotes: item.doctorNotes,
      isRecurring: item.isRecurring,
      createdAt:new Date(),

    }));
  }

  loadRecentPatients(): void {
    this.loadingPatients = true;

    // Get unique patients from raw appointments to access their full data
    const patientMap = new Map();

    this.rawAppointments.forEach(item => {
      if (!patientMap.has(item.patient.userId)) {
        patientMap.set(item.patient.userId, item.patient);
      }
    });

    const recentPatientsList: RecentPatient[] = [];

    // Convert to RecentPatient format
    patientMap.forEach((patient, patientId) => {
      const patientAppointments = this.appointments.filter(apt => apt.patientId === patientId);
      const lastVisit = this.getMostRecentAppointmentDate(patientId);
      const nextAppointment = this.getNextAppointmentDate(patientId);

      recentPatientsList.push({
        alzheimerStage: "MODERE", id: '', lastVisit: new Date(), name: '', nextVisit: new Date(), photo: ''


      });
    });

    // Sort by last visit date (most recent first) and take first 5
    this.recentPatients = recentPatientsList
      .sort((a, b) => (b.lastVisit?.getTime() || 0) - (a.lastVisit?.getTime() || 0))
      .slice(0, 5);

    this.loadingPatients = false;
  }

  // ========== GETTERS FOR FILTERED APPOINTMENTS ==========

  get todayAppointments(): Appointment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.appointments.filter(apt => {
      if (apt.doctorId !== this.currentDoctor.userId) return false;

      const aptDate = this.safeParseDate(apt.startDateTime);
      if (!aptDate) return false;

      return aptDate >= today && aptDate < tomorrow;
    }).sort((a, b) => {
      const dateA = this.safeParseDate(a.startDateTime)?.getTime() || 0;
      const dateB = this.safeParseDate(b.startDateTime)?.getTime() || 0;
      return dateA - dateB;
    });
  }

  get upcomingAppointments(): Appointment[] {
    const now = new Date();

    return this.appointments
      .filter(apt => {
        if (apt.doctorId !== this.currentDoctor.userId) return false;

        const aptDate = this.safeParseDate(apt.startDateTime);
        if (!aptDate) return false;

        // Filter for future appointments with valid status
        const validStatus = ['SCHEDULED', 'CONFIRMED_BY_PATIENT', 'CONFIRMED_BY_CAREGIVER'].includes(apt.status);
        return validStatus && aptDate > now;
      })
      .sort((a, b) => {
        const dateA = this.safeParseDate(a.startDateTime)?.getTime() || 0;
        const dateB = this.safeParseDate(b.startDateTime)?.getTime() || 0;
        return dateA - dateB;
      });
  }

  get pastAppointments(): Appointment[] {
    const now = new Date();

    return this.appointments
      .filter(apt => {
        if (apt.doctorId !== this.currentDoctor.userId) return false;

        const aptDate = this.safeParseDate(apt.startDateTime);
        if (!aptDate) return false;

        return aptDate < now || ['COMPLETED', 'CANCELLED', 'MISSED'].includes(apt.status);
      })
      .sort((a, b) => {
        const dateA = this.safeParseDate(a.startDateTime)?.getTime() || 0;
        const dateB = this.safeParseDate(b.startDateTime)?.getTime() || 0;
        return dateB - dateA; // Descending order (most recent first)
      });
  }

  // ========== APPOINTMENT ACTIONS ==========

  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.loadPatientDetails(appointment.patientId);
  }

  loadPatientDetails(patientId: string): void {
    this.loading = true;

    // Find patient in raw appointments
    const appointmentItem = this.rawAppointments.find(item => item.patient.userId === patientId);

    if (appointmentItem) {
      const patient = appointmentItem.patient;
      this.selectedPatientDetails = patient as User;
      this.selectedPatientBirthDate = patient.dateOfBirth ? new Date(patient.dateOfBirth) : undefined;
      this.selectedPatientAge = patient.dateOfBirth ? this.calculateAge(new Date(patient.dateOfBirth)) : undefined;
      this.selectedPatientStage = patient.alzheimerStage;
      this.selectedPatientEmergency = patient.emergencyContact;
      this.loadPatientVisitCount(patientId);
    } else {
      // Fallback to mock data
      this.selectedPatientBirthDate = new Date('1947-06-15');
      this.selectedPatientAge = this.calculateAge(this.selectedPatientBirthDate);
      this.selectedPatientStage = 'MODERE';
      this.selectedPatientEmergency = '+33 6 12 34 56 78';
      this.loadPatientVisitCount(patientId);
    }
  }

  loadPatientVisitCount(patientId: string): void {
    // Calculate from appointments
    const patientAppointments = this.appointments.filter(
      apt => apt.patientId === patientId && apt.doctorId === this.currentDoctor.userId
    );
    this.selectedPatientVisits = patientAppointments.length;
    this.loading = false;
  }

  closeDetailsDialog(): void {
    this.selectedAppointment = null;
    this.isEditingNotes = false;
    // Clear patient details
    this.selectedPatientBirthDate = undefined;
    this.selectedPatientAge = undefined;
    this.selectedPatientStage = undefined;
    this.selectedPatientEmergency = undefined;
    this.selectedPatientVisits = undefined;
    this.selectedPatientDetails = undefined;
  }

  confirmAppointment(appointmentId: string): void {
    this.loading = true;
    this.appointmentService.confirmByPatient(appointmentId).subscribe({
      next: (updatedAppointment: any) => {
        // Update in raw appointments if needed
        const index = this.rawAppointments.findIndex(a => a.appointmentId === appointmentId);
        if (index !== -1) {
          // You might need to update the raw data structure
        }

        // Refresh appointments
        this.loadAppointments();

        this.successMessage = 'Appointment confirmed successfully';
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        this.errorMessage = 'Failed to confirm appointment';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  cancelAppointment(appointmentId: string): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.loading = true;
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: (updatedAppointment: any) => {
          // Refresh appointments
          this.loadAppointments();

          this.successMessage = 'Appointment cancelled successfully';
          this.closeDetailsDialog();
          this.loading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          this.errorMessage = 'Failed to cancel appointment';
          this.loading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  startConsultation(appointment: Appointment): void {
    if (!this.canStartConsultation(appointment)) {
      this.errorMessage = 'Consultation can only be started within the scheduled time window';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Navigate to consultation room
    if (appointment.videoLink) {
      window.open(appointment.videoLink, '_blank');
    }

    // Update appointment status
    this.updateAppointmentStatus(appointment.appointmentId, 'IN_PROGRESS');
  }

  canStartConsultation(appointment: Appointment): boolean {
    const aptDate = this.safeParseDate(appointment.startDateTime);
    if (!aptDate) return false;

    const now = new Date();
    const diffMinutes = (aptDate.getTime() - now.getTime()) / 60000;

    // Can start 5 minutes before and up to 30 minutes after
    return diffMinutes <= 5 && diffMinutes >= -30;
  }

  completeAppointment(appointmentId: string, notes: string): void {
    this.loading = true;
    // Update appointment with notes and mark as completed
    const updates: Partial<Appointment> = {
      doctorNotes: notes,
      status: 'COMPLETED'
    };

    this.appointmentService.updateAppointment(appointmentId, updates).subscribe({
      next: (updatedAppointment: any) => {
        // Refresh appointments
        this.loadAppointments();

        this.successMessage = 'Appointment completed successfully';
        this.closeDetailsDialog();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error completing appointment:', error);
        this.errorMessage = 'Failed to complete appointment';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  private updateAppointmentStatus(appointmentId: string, status: string): void {
    this.appointmentService.updateAppointment(appointmentId, { status } as any).subscribe({
      next: () => {
        this.loadAppointments(); // Refresh appointments
      },
      error: (error) => console.error('Error updating appointment status:', error)
    });
  }

  joinVideoCall(videoLink: string | undefined): void {
    if (videoLink) {
      window.open(videoLink, '_blank');
    } else {
      this.errorMessage = 'No video link available';
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  // ========== NOTES MANAGEMENT ==========

  enableNotesEditing(): void {
    this.isEditingNotes = true;
    console.log('Enabling notes editing');
  }

  updateNotes(notes: string): void {
    if (!this.selectedAppointment) {
      this.errorMessage = 'No appointment selected';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const appointmentId = this.selectedAppointment.appointmentId;

    this.loading = true;
    this.appointmentService.updateAppointment(appointmentId, { doctorNotes: notes } as any).subscribe({
      next: () => {
        // Update local appointment
        const index = this.appointments.findIndex(a => a.appointmentId === appointmentId);
        if (index !== -1) {
          this.appointments[index].doctorNotes = notes;
        }
        if (this.selectedAppointment?.appointmentId === appointmentId) {
          this.selectedAppointment.doctorNotes = notes;
        }

        this.successMessage = 'Notes updated successfully';
        this.isEditingNotes = false;
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating notes:', error);
        this.errorMessage = 'Failed to update notes';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // ========== PATIENT NAVIGATION ==========

  viewPatientProfile(patientId: string): void {
    console.log('Viewing patient profile:', patientId);
    this.successMessage = 'Navigating to patient profile...';
    setTimeout(() => this.successMessage = '', 3000);
  }

  viewPatientHistory(patientId: string): void {
    console.log('Viewing patient history:', patientId);
    this.successMessage = 'Navigating to patient history...';
    setTimeout(() => this.successMessage = '', 3000);
  }

  // ========== PRESCRIPTION MANAGEMENT ==========

  openPrescription(): void {
    if (!this.selectedAppointment) {
      this.errorMessage = 'No appointment selected';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const patientId = this.selectedAppointment.patientId;
    const appointmentId = this.selectedAppointment.appointmentId;

    console.log('Opening prescription form for patient:', patientId, 'appointment:', appointmentId);

    this.successMessage = 'Prescription form opened';
    setTimeout(() => this.successMessage = '', 3000);
  }

  // ========== DATE FILTERING ==========

  onDateSelected(date: string): void {
    this.selectedDate = new Date(date);
    this.filterAppointmentsByDate(this.selectedDate);
  }

  filterAppointmentsByDate(date: Date): void {
    const dateString = date.toDateString();
    const filtered = this.appointments.filter(apt => {
      const aptDate = this.safeParseDate(apt.startDateTime);
      return aptDate?.toDateString() === dateString;
    });
    console.log('Filtered appointments:', filtered);
  }

  // ========== UTILITY METHODS ==========

  getDuration(appointment: Appointment): number {
    const startDate = this.safeParseDate(appointment.startDateTime);
    const endDate = this.safeParseDate(appointment.endDateTime);

    if (!startDate || !endDate) return 0;

    const diff = endDate.getTime() - startDate.getTime();
    return Math.round(diff / 60000);
  }

  getFormattedTime(dateValue: any): string {
    const date = this.safeParseDate(dateValue);
    if (!date) return '';

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFormattedDate(dateValue: any): string {
    const date = this.safeParseDate(dateValue);
    if (!date) return '';

    return date.toLocaleDateString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  getFullFormattedDate(dateValue: any): string {
    const date = this.safeParseDate(dateValue);
    if (!date) return '';

    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isToday(dateValue: any): boolean {
    const date = this.safeParseDate(dateValue);
    if (!date) return false;

    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isTomorrow(dateValue: any): boolean {
    const date = this.safeParseDate(dateValue);
    if (!date) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private getUniquePatientsCount(): number {
    return new Set(this.appointments.map(apt => apt.patientId)).size;
  }

  private getCompletionRate(): number {
    const completed = this.appointments.filter(apt => apt.status === 'COMPLETED').length;
    const total = this.appointments.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  private getMostRecentAppointmentDate(patientId: string): Date | null {
    const patientAppointments = this.appointments
      .filter(apt => apt.patientId === patientId && apt.startDateTime)
      .sort((a, b) => {
        const dateA = this.safeParseDate(a.startDateTime)?.getTime() || 0;
        const dateB = this.safeParseDate(b.startDateTime)?.getTime() || 0;
        return dateB - dateA;
      });

    return patientAppointments.length > 0
      ? this.safeParseDate(patientAppointments[0].startDateTime)
      : null;
  }

  private getNextAppointmentDate(patientId: string): Date | null {
    const now = new Date();
    const futureAppointments = this.appointments
      .filter(apt => {
        const aptDate = this.safeParseDate(apt.startDateTime);
        return apt.patientId === patientId && aptDate && aptDate > now;
      })
      .sort((a, b) => {
        const dateA = this.safeParseDate(a.startDateTime)?.getTime() || 0;
        const dateB = this.safeParseDate(b.startDateTime)?.getTime() || 0;
        return dateA - dateB;
      });

    return futureAppointments.length > 0
      ? this.safeParseDate(futureAppointments[0].startDateTime)
      : null;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'SCHEDULED': 'bg-[#F3E8FF] text-[#7C3AED]',
      'CONFIRMED_BY_PATIENT': 'bg-[#E6F0FA] text-[#2D1B4E]',
      'CONFIRMED_BY_CAREGIVER': 'bg-[#E6F0FA] text-[#2D1B4E]',
      'IN_PROGRESS': 'bg-[#DBEAFE] text-[#1E40AF]',
      'COMPLETED': 'bg-[#F1F5F9] text-[#6B5B8C]',
      'CANCELLED': 'bg-[#FEF2F2] text-[#C06C84]',
      'RESCHEDULED': 'bg-[#FFF3E0] text-[#F97316]',
      'MISSED': 'bg-[#FEF2F2] text-[#DC2626]'
    };
    return classes[status] || 'bg-[#F1F5F9] text-[#6B5B8C]';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SCHEDULED': 'À confirmer',
      'CONFIRMED_BY_PATIENT': 'Confirmé par patient',
      'CONFIRMED_BY_CAREGIVER': 'Confirmé par aidant',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'RESCHEDULED': 'Reporté',
      'MISSED': 'Manqué'
    };
    return labels[status] || status;
  }

  // ========== REFRESH DATA ==========

  refreshData(): void {
    this.loadAllData();
    this.successMessage = 'Data refreshed successfully';
    setTimeout(() => this.successMessage = '', 3000);
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ========== MOCK DATA METHODS ==========

  private loadMockAppointments(): void {
    const now = new Date();
    const mockData: BackendAppointment[] = [
      {
        appointmentId: "apt-001",
        patient: {
          userId: "pat-001",
          name: "Jeanne Moreau",
          email: "jeanne.moreau@email.com",
          role: "PATIENT",
          phone: "06 12 34 56 78",
          profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
          alzheimerStage: "MODERE",
          dateOfBirth: "1947-06-15",
          emergencyContact: "+33 6 12 34 56 78"
        },
        doctor: {
          userId: "doc-001",
          name: "Dr. Martin Dubois",
          email: "martin.dubois@clinique.fr",
          role: "DOCTOR",
          phone: "01 23 45 67 89",
          profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
          specialty: "Neurologist"
        },
        caregiver: null,
        consultationType: {
          typeId: "type-001",
          name: "Suivi standard",
          defaultDurationMinutes: 20,
          alzheimerDurationMinutes: 25,
          requiresCaregiver: false
        },
        startDateTime: now,
        endDateTime: new Date(now.getTime() + 30 * 60000),
        status: "SCHEDULED",
        caregiverPresence: "NONE",
        videoLink: "https://meet.google.com/abc-defg-hij",
        doctorNotes: "",
        isRecurring: false
      }
    ];

    this.rawAppointments = mockData;
    this.appointments = this.transformAppointments(mockData);
  }
}
