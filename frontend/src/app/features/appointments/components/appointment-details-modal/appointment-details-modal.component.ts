import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../../models/appointment';

@Component({
  selector: 'app-appointment-details-modal',

  templateUrl:"appointment-details-modal.component.html"
})
export class AppointmentDetailsModalComponent {
  @Input() appointment: Appointment | null = null;
  @Input() patientBirthDate?: Date;
  @Input() patientAge?: number;
  @Input() patientAlzheimerStage?: string;
  @Input() emergencyContact?: string;
  @Input() previousVisits?: number;

  @Output() onClose = new EventEmitter<void>();
  @Output() onStart = new EventEmitter<Appointment>();
  @Output() onPrescribe = new EventEmitter<void>();
  @Output() onEditNotes = new EventEmitter<void>();
  @Output() onNotesChange = new EventEmitter<string>();

  getDuration(): number {
    if (!this.appointment) return 0;
    const diff = this.appointment.endDateTime.getTime() - this.appointment.startDateTime.getTime();
    return Math.round(diff / 60000);
  }

  get showStartButton(): boolean {
    return !!(this.appointment &&
      (this.appointment.status === 'SCHEDULED' ||
        this.appointment.status === 'CONFIRMED_BY_PATIENT'));
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'SCHEDULED': 'bg-[#F3E8FF] text-[#7C3AED]',
      'CONFIRMED_BY_PATIENT': 'bg-[#E6F0FA] text-[#2D1B4E]',
      'CONFIRMED_BY_CAREGIVER': 'bg-[#E6F0FA] text-[#2D1B4E]',
      'COMPLETED': 'bg-[#F1F5F9] text-[#6B5B8C]',
      'CANCELLED': 'bg-[#FEF2F2] text-[#C06C84]'
    };
    return classes[status] || 'bg-[#F1F5F9] text-[#6B5B8C]';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SCHEDULED': 'Scheduled',
      'CONFIRMED_BY_PATIENT': 'Confirmed',
      'CONFIRMED_BY_CAREGIVER': 'Confirmed',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled'
    };
    return labels[status] || status;
  }
}
