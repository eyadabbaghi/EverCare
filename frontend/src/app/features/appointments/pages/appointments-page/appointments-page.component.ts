import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../models/appointment';
import { User } from '../../models/user';
import { ConsultationType } from '../../models/consultation-type';


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

  // Data
  doctors: User[] = [ /* ... */ ];
  myCaregivers: User[] = [ /* ... */ ];
  consultationTypes: ConsultationType[] = [ /* ... */ ];
  appointments: Appointment[] = [ /* ... */ ];

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

  ngOnInit(): void {
    // Initialization logic
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
    return this.filteredAppointments
      .filter(apt =>
        (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED_BY_PATIENT') &&
        apt.startDateTime > now
      )
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  }

  get pastAppointments(): Appointment[] {
    const now = new Date();
    return this.filteredAppointments
      .filter(apt => apt.startDateTime < now || apt.status === 'COMPLETED' || apt.status === 'CANCELLED')
      .sort((a, b) => b.startDateTime.getTime() - a.startDateTime.getTime());
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
    // Could scroll to appointments on that date
  }

  onDoctorSelected(doctorId: string): void {
    this.loadAvailableSlots(doctorId, this.newAppointment.date);
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
    } else {
      this.joinVideoCall(appointment.videoLink);
    }
  }

  confirmAppointment(appointmentId: string): void {
    const appointment = this.appointments.find(a => a.appointmentId === appointmentId);
    if (appointment) {
      appointment.status = 'CONFIRMED_BY_PATIENT';
      appointment.confirmationDatePatient = new Date();
      appointment.updatedAt = new Date();
    }
  }

  cancelAppointment(appointmentId: string): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      const appointment = this.appointments.find(a => a.appointmentId === appointmentId);
      if (appointment) {
        appointment.status = 'CANCELLED';
        appointment.updatedAt = new Date();
        this.closeDetailsDialog();
      }
    }
  }

  joinVideoCall(videoLink: string|undefined): void {
    window.open(videoLink, '_blank');
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

    // Mock available slots
    const slotsByDoctor: { [key: string]: string[] } = {
      'doc-001': ['09:00', '09:30', '10:00', '11:00', '14:00', '15:00'],
      'doc-002': ['09:00', '10:00', '11:00', '14:30', '15:30', '16:00'],
      'doc-003': ['09:30', '10:30', '14:00', '15:00', '16:00']
    };

    this.availableSlots = slotsByDoctor[doctorId] || [];
  }

  addAppointment(formData: any): void {
    const selectedDoctor = this.doctors.find(d => d.userId === formData.doctorId);
    const selectedType = this.consultationTypes.find(t => t.typeId === formData.consultationTypeId);
    const selectedCaregiver = this.myCaregivers.find(c => c.userId === formData.caregiverId);

    const startDateTime = new Date(formData.date + 'T' + formData.time);
    const endDateTime = new Date(startDateTime.getTime() + (selectedType?.alzheimerDurationMinutes || 20) * 60000);

    const newAppt: Appointment = {
      appointmentId: 'apt-' + Math.random().toString(36).substr(2, 9),
      patientId: this.currentPatient.userId,
      patientName: this.currentPatient.name,
      patientPhoto: this.currentPatient.profilePicture,
      doctorId: formData.doctorId,
      doctorName: selectedDoctor?.name || '',
      doctorPhoto: selectedDoctor?.profilePicture,
      caregiverId: formData.caregiverId || undefined,
      caregiverName: selectedCaregiver?.name,
      consultationTypeId: formData.consultationTypeId,
      consultationTypeName: selectedType?.name || '',
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      status: 'SCHEDULED',
      caregiverPresence: formData.caregiverPresence,
      videoLink: `https://consult.evercare.com/room/${formData.doctorId}-${this.currentPatient.userId}`,
      isRecurring: false,
      doctorNotes: formData.notes,
      createdAt: new Date()
    };

    this.appointments.push(newAppt);
    this.closeAddDialog();
  }
}
