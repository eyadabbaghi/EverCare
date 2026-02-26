import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../models/appointment';
import { User } from '../../models/user';
import { ConsultationType } from '../../models/consultation-type';
import { AppointmentService } from '../../services/appointments.service';
import { CreateAppointmentRequest } from '../../models/appointment-request';

@Component({
  selector: 'app-appointments-page',
  templateUrl: './appointments-page.component.html',
})
export class AppointmentsPageComponent implements OnInit {
  currentPatient: User = {
    userId: "pat-001",
    name: "Jeanne Moreau",
    email: "jeanne.moreau@email.com",
    role: "PATIENT",
    phone: "06 12 34 56 78",
    profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
    alzheimerStage: "MODERE",
    requiresCaregiver: true
  };

  currentDate: Date = new Date(2026, 1, 1);
  isAddDialogOpen = false;
  selectedAppointment: Appointment | null = null;
  loading = false;
  errorMessage = '';

  // Data
  doctors: User[] = [];
  myCaregivers: User[] = [];
  consultationTypes: ConsultationType[] = [];
  appointments: Appointment[] = [];

  // Filters
  filters = { status: '', doctorId: '' };

  // New appointment form
  newAppointment: any = {
    doctorId: '',
    consultationTypeId: '',
    date: '',
    time: '',
    caregiverId: '',
    caregiverPresence: 'NONE',
    notes: ''
  };

  availableSlots: string[] = [];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  // ========== DATA LOADING ==========

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = '';

    // Load appointments
    this.appointmentService.getAppointmentsByPatient(this.currentPatient.userId).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.errorMessage = 'Failed to load appointments. Please try again.';
        this.loading = false;
      }
    });

    // Load doctors
    this.loadDoctors();
    // Load caregivers
    this.loadCaregivers();
    // Load consultation types
    this.loadConsultationTypes();
  }

  loadDoctors(): void {
    this.doctors = [
      {
        userId: "doc-001",
        name: "Dr. Martin Dubois",
        email: "martin.dubois@clinique.fr",
        role: "DOCTOR",
        phone: "01 23 45 67 89",
        profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
        specialty: "Neurologue",
        acceptsNewPatients: true
      },
      {
        userId: "doc-002",
        name: "Dr. Sophie Bernard",
        email: "sophie.bernard@clinique.fr",
        role: "DOCTOR",
        phone: "01 34 56 78 90",
        profilePicture: "https://randomuser.me/api/portraits/women/5.jpg",
        specialty: "Gériatre",
        acceptsNewPatients: true
      },
      {
        userId: "doc-003",
        name: "Dr. Philippe Petit",
        email: "philippe.petit@clinique.fr",
        role: "DOCTOR",
        phone: "01 45 67 89 01",
        profilePicture: "https://randomuser.me/api/portraits/men/7.jpg",
        specialty: "Psychiatre",
        acceptsNewPatients: false
      }
    ];
  }

  loadCaregivers(): void {
    this.myCaregivers = [
      {
        userId: "care-001",
        name: "Sophie Moreau",
        email: "sophie.moreau@email.com",
        role: "CAREGIVER",
        phone: "06 78 90 12 34",
        profilePicture: "https://randomuser.me/api/portraits/women/10.jpg",
        relationship: "Fille",
        accessLevel: "PRIMARY"
      }
    ];
  }

  loadConsultationTypes(): void {
    this.consultationTypes = [
      {
        typeId: "type-001",
        name: "Suivi standard",
        description: "Consultation de suivi régulier",
        defaultDurationMinutes: 20,
        alzheimerDurationMinutes: 25,
        requiresCaregiver: false,
        environmentPreset: "STANDARD",
        active: true
      },
      {
        typeId: "type-002",
        name: "Bilan cognitif",
        description: "Évaluation de la mémoire",
        defaultDurationMinutes: 40,
        alzheimerDurationMinutes: 50,
        requiresCaregiver: true,
        environmentPreset: "HIGH_CONTRAST",
        active: true
      },
      {
        typeId: "type-003",
        name: "Consultation médicament",
        description: "Suivi des traitements",
        defaultDurationMinutes: 15,
        alzheimerDurationMinutes: 20,
        requiresCaregiver: false,
        environmentPreset: "STANDARD",
        active: true
      },
      {
        typeId: "type-005",
        name: "Télésurveillance",
        description: "Point rapide par visio",
        defaultDurationMinutes: 10,
        alzheimerDurationMinutes: 10,
        requiresCaregiver: false,
        environmentPreset: "STANDARD",
        active: true
      }
    ];
  }

  // ========== GETTERS ==========

  get myAppointments(): Appointment[] {
    return this.appointments.filter(apt => apt.patientId === this.currentPatient.userId);
  }

  get filteredAppointments(): Appointment[] {
    return this.myAppointments.filter(apt => {
      let matches = true;
      if (this.filters.status && apt.status !== this.filters.status) matches = false;
      if (this.filters.doctorId && apt.doctorId !== this.filters.doctorId) matches = false;
      return matches;
    });
  }

  get upcomingAppointments(): Appointment[] {
    const now = new Date();

    return this.appointments
      .filter(apt => {
        // Check status first
        const validStatus = apt.status === 'SCHEDULED' ||
          apt.status === 'CONFIRMED_BY_PATIENT' ||
          apt.status === 'CONFIRMED_BY_CAREGIVER';

        if (!validStatus) return false;

        // Convert startDateTime to Date safely
        const aptDate = apt.startDateTime ? new Date(apt.startDateTime) : null;

        // Compare dates (make sure aptDate is valid and > now)
        return aptDate && aptDate > now;
      })
      .sort((a, b) => {
        // Convert both dates for sorting
        const dateA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
        const dateB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
        return dateA - dateB;
      });
  }

  get pastAppointments(): Appointment[] {
    const now = new Date();
    return this.filteredAppointments
      .filter(apt => {
        const aptDate = apt.startDateTime ? new Date(apt.startDateTime) : null;
        return (aptDate && aptDate < now) || apt.status === 'COMPLETED' || apt.status === 'CANCELLED';
      })
      .sort((a, b) => {
        const dateA = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
        const dateB = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
        return dateB - dateA;
      });
  }

  // ========== EVENT HANDLERS ==========

  onFiltersChanged(filters: { status: string; doctorId: string }): void {
    this.filters = filters;
  }

  onMonthChanged(newDate: Date): void {
    this.currentDate = newDate;
  }

  onDateSelected(date: string): void {
    console.log('Date selected:', date);
    setTimeout(() => {
      const element = document.getElementById('appointments-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onDoctorSelected(doctorId: string): void {
    if (doctorId && this.newAppointment.date) {
      this.loadAvailableSlots(doctorId, this.newAppointment.date);
    }
  }

  // ========== APPOINTMENT ACTIONS ==========

  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
  }

  closeDetailsDialog(): void {
    this.selectedAppointment = null;
  }

  handleAppointmentAction(appointment: Appointment): void {
    if (appointment.status === 'SCHEDULED') {
      this.confirmAppointment(appointment.appointmentId);
    } else if (appointment.videoLink && this.canJoinCall(appointment)) {
      this.joinVideoCall(appointment.videoLink);
    }
  }

  confirmAppointment(appointmentId: string): void {
    this.loading = true;
    this.appointmentService.confirmByPatient(appointmentId).subscribe({
      next: (updatedAppointment) => {
        const index = this.appointments.findIndex(a => a.appointmentId === appointmentId);
        if (index !== -1) {
          this.appointments[index] = updatedAppointment;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error confirming appointment:', error);
        this.errorMessage = 'Failed to confirm appointment. Please try again.';
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  cancelAppointment(appointmentId: string): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      this.loading = true;
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: (updatedAppointment) => {
          const index = this.appointments.findIndex(a => a.appointmentId === appointmentId);
          if (index !== -1) {
            this.appointments[index] = updatedAppointment;
          }
          this.closeDetailsDialog();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error cancelling appointment:', error);
          this.errorMessage = 'Failed to cancel appointment. Please try again.';
          this.loading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  joinVideoCall(videoLink: string | undefined): void {
    if (videoLink) {
      window.open(videoLink, '_blank');
    }
  }

  canJoinCall(appointment: Appointment): boolean {
    try {
      const now = new Date();
      const appointmentTime = appointment.startDateTime ? new Date(appointment.startDateTime) : null;

      if (!appointmentTime) return false;

      const diffMinutes = (appointmentTime.getTime() - now.getTime()) / 60000;

      return (appointment.status === 'CONFIRMED_BY_PATIENT' ||
          appointment.status === 'CONFIRMED_BY_CAREGIVER') &&
        diffMinutes <= 15 && diffMinutes >= -30;
    } catch {
      return false;
    }
  }

  // ========== ADD APPOINTMENT ==========

  openAddDialog(): void {
    this.isAddDialogOpen = true;
    this.resetNewAppointment();
  }

  closeAddDialog(): void {
    this.isAddDialogOpen = false;
    this.resetNewAppointment();
  }

  resetNewAppointment(): void {
    this.newAppointment = {
      doctorId: '',
      consultationTypeId: '',
      date: '',
      time: '',
      caregiverId: '',
      caregiverPresence: 'NONE',
      notes: ''
    };
    this.availableSlots = [];
  }

  loadAvailableSlots(doctorId: string, date: string): void {
    if (!doctorId || !date) {
      this.availableSlots = [];
      return;
    }

    const selectedDate = new Date(date);

    this.loading = true;
    this.appointmentService.getAvailableTimeSlots(doctorId, selectedDate, 20).subscribe({
      next: (slots) => {
        this.availableSlots = slots.map(slot =>
          new Date(slot).toTimeString().substring(0, 5)
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading available slots:', error);
        // Fallback to mock data
        const slotsByDoctor: { [key: string]: string[] } = {
          'doc-001': ['09:00', '09:30', '10:00', '11:00', '14:00', '15:00'],
          'doc-002': ['09:00', '10:00', '11:00', '14:30', '15:30', '16:00'],
          'doc-003': ['09:30', '10:30', '14:00', '15:00', '16:00']
        };
        this.availableSlots = slotsByDoctor[doctorId] || [];
        this.loading = false;
      }
    });
  }

  addAppointment(formData: any): void {
    if (!this.isFormValid()) {
      console.log('Form invalid:', this.newAppointment);
      return;
    }

    const selectedDoctor = this.doctors.find(d => d.userId === formData.doctorId);
    const selectedType = this.consultationTypes.find(t => t.typeId === formData.consultationTypeId);
    const selectedCaregiver = this.myCaregivers.find(c => c.userId === formData.caregiverId);

    if (!selectedDoctor || !selectedType) {
      this.errorMessage = 'Please select a valid doctor and consultation type';
      return;
    }

    const startDateTime = new Date(formData.date + 'T' + formData.time);
    const endDateTime = new Date(startDateTime.getTime() + (selectedType?.alzheimerDurationMinutes || 20) * 60000);

    // Create the payload matching your DTO structure
    const newAppointmentPayload: CreateAppointmentRequest = {
      patientId: this.currentPatient.userId,
      patientName: this.currentPatient.name,
      doctorId: formData.doctorId,
      doctorName: selectedDoctor?.name || '',
      caregiverId: formData.caregiverId || undefined,
      caregiverName: selectedCaregiver?.name,
      consultationTypeId: formData.consultationTypeId,
      consultationTypeName: selectedType?.name || '',
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      status: 'SCHEDULED',
      caregiverPresence: formData.caregiverPresence,
      videoLink: `https://consult.evercare.com/room/${formData.doctorId}-${this.currentPatient.userId}`,
      doctorNotes: formData.notes,
      isRecurring: false
    };

    console.log('Sending payload to backend:', newAppointmentPayload);

    this.loading = true;
    this.appointmentService.createAppointment(newAppointmentPayload).subscribe({
      next: (createdAppointment) => {
        console.log('Appointment created successfully:', createdAppointment);
        this.appointments.push(createdAppointment);
        this.closeAddDialog();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creating appointment:', error);
        if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check if backend is running.';
        } else if (error.status === 404) {
          this.errorMessage = 'API endpoint not found. Please check the URL.';
        } else if (error.status === 500) {
          this.errorMessage = 'Server error. Please try again later.';
        } else {
          this.errorMessage = 'Failed to create appointment. Please try again.';
        }
        this.loading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.newAppointment.doctorId &&
      this.newAppointment.consultationTypeId &&
      this.newAppointment.date &&
      this.newAppointment.time
    );
  }

  // ========== UTILITY METHODS ==========

  getDuration(appointment: Appointment): number {
    try {
      const startDate = appointment.startDateTime ? new Date(appointment.startDateTime) : null;
      const endDate = appointment.endDateTime ? new Date(appointment.endDateTime) : null;

      if (!startDate || !endDate) return 0;

      const diff = endDate.getTime() - startDate.getTime();
      return Math.round(diff / 60000);
    } catch {
      return 0;
    }
  }

  refreshAppointments(): void {
    this.loading = true;
    this.appointmentService.getAppointmentsByPatient(this.currentPatient.userId).subscribe({
      next: (data) => {
        this.appointments = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error refreshing appointments:', error);
        this.loading = false;
      }
    });
  }
}
