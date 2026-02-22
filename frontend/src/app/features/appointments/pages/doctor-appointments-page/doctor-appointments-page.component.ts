import { Component, OnInit } from '@angular/core';
import { Appointment } from '../../models/appointment';
import { User } from '../../models/user';
import { DoctorStats } from '../../models/doctor-stats';
import { RecentPatient } from '../../models/recent-patient';


@Component({
  selector: 'app-doctor-appointments-page',

  templateUrl: 'doctor-appointments-page.component.html',
})
export class DoctorAppointmentsPageComponent implements OnInit {
  // Current doctor (from auth service)
  currentDoctor: User = {
    userId: "doc-001",
    name: "Dr. Martin Dubois",
    email: "martin.dubois@clinique.fr",
    role: "DOCTOR",
    phone: "01 23 45 67 89",
    profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
    specialty: "Neurologist",
    acceptsNewPatients: true
  };

  // Appointments data
  appointments: Appointment[] = []; // Would come from service
  selectedAppointment: Appointment | null = null;

  // Stats
  doctorStats: DoctorStats = {
    todayCount: 4,
    upcomingCount: 12,
    totalPatients: 48,
    completionRate: 92
  };

  // Recent patients
  recentPatients: RecentPatient[] = [];

  // Selected patient details
  selectedPatientBirthDate?: Date;
  selectedPatientAge?: number;
  selectedPatientStage?: string;
  selectedPatientEmergency?: string;
  selectedPatientVisits?: number;

  ngOnInit(): void {
    this.loadAppointments();
    this.loadRecentPatients();
  }

  // Getters for filtered appointments
  get todayAppointments(): Appointment[] {
    const today = new Date().toDateString();
    return this.appointments.filter(apt =>
      apt.startDateTime.toDateString() === today &&
      apt.doctorId === this.currentDoctor.userId
    );
  }

  get upcomingAppointments(): Appointment[] {
    const now = new Date();
    return this.appointments
      .filter(apt =>
        apt.startDateTime > now &&
        apt.doctorId === this.currentDoctor.userId &&
        apt.startDateTime.toDateString() !== now.toDateString()
      )
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());
  }

  // Data loading methods
  private loadAppointments(): void {
    // This would call a service
    this.appointments = []; // Mock data would be loaded here
  }

  private loadRecentPatients(): void {
    // This would call a service
    this.recentPatients = []; // Mock data would be loaded here
  }

  // Event handlers
  viewAppointmentDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
    this.loadPatientDetails(appointment.patientId);
  }

  private loadPatientDetails(patientId: string): void {
    // This would call a service to load patient details
    this.selectedPatientBirthDate = new Date('1947-06-15');
    this.selectedPatientAge = 78;
    this.selectedPatientStage = 'MODERE';
    this.selectedPatientEmergency = '+33 6 12 34 56 78';
    this.selectedPatientVisits = 12;
  }

  closeDetailsDialog(): void {
    this.selectedAppointment = null;
  }

  startConsultation(appointment: Appointment): void {
    console.log('Starting consultation:', appointment.appointmentId);
    // Navigate to consultation room
  }

  joinVideoCall(videoLink: string): void {
    window.open(videoLink, '_blank');
  }

  viewPatientProfile(patientId: string): void {
    console.log('Viewing patient profile:', patientId);
    // Navigate to patient profile
  }

  viewPatientHistory(patientId: string): void {
    console.log('Viewing patient history:', patientId);
    // Navigate to patient history
  }

  onDateSelected(date: string): void {
    console.log('Date selected:', date);
    // Filter appointments by date
  }

  openPrescription(): void {
    console.log('Opening prescription form');
    // Open prescription modal
  }

  enableNotesEditing(): void {
    console.log('Enabling notes editing');
    // Enable inline editing
  }

  updateNotes(notes: string): void {
    console.log('Updating notes:', notes);
    if (this.selectedAppointment) {
      this.selectedAppointment.doctorNotes = notes;
      // Call service to update
    }
  }
}
