import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Appointment, AppointmentStatus, CaregiverPresence } from '../../models/appointment';

@Component({
  selector: 'app-appointment-card',

  templateUrl: './appointment-card.component.html',
})
export class AppointmentCardComponent {
  @Input() appointment!: Appointment;
  @Input() showActionButton: boolean = true;
  @Output() onClick = new EventEmitter<Appointment>();
  @Output() onAction = new EventEmitter<Appointment>();

  getCardClass(): string {
    if (this.appointment.status === 'COMPLETED') {
      return 'bg-[#F9FAFB] border-[#E5E7EB] opacity-70';
    }
    return 'bg-white border-[#C4B5FD] hover:shadow-md';
  }

  getStatusClass(status: AppointmentStatus): string {
    const classes = {
      'SCHEDULED': 'bg-[#F3E8FF] text-[#7C3AED]',
      'CONFIRMED_BY_PATIENT': 'bg-[#E6F0FA] text-[#2D1B4E]',
      'CONFIRMED_BY_CAREGIVER': 'bg-[#E6F0FA] text-[#2D1B4E]',
      'COMPLETED': 'bg-[#F1F5F9] text-[#6B5B8C]',
      'CANCELLED': 'bg-[#FEF2F2] text-[#C06C84]',
      'RESCHEDULED': 'bg-[#FFF3E0] text-[#F97316]',
      'MISSED': 'bg-[#FEF2F2] text-[#DC2626]'
    };
    return classes[status] || 'bg-[#F1F5F9] text-[#6B5B8C]';
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels = {
      'SCHEDULED': 'À confirmer',
      'CONFIRMED_BY_PATIENT': 'Confirmé',
      'CONFIRMED_BY_CAREGIVER': 'Confirmé',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé',
      'RESCHEDULED': 'Reporté',
      'MISSED': 'Manqué'
    };
    return labels[status] || status;
  }

  getCaregiverClass(presence?: CaregiverPresence): string {
    return presence === 'PHYSICAL' ? 'bg-[#F3E8FF] text-[#7C3AED]' : 'bg-[#E6F0FA] text-[#2D1B4E]';
  }

  getCaregiverIconClass(presence?: CaregiverPresence): string {
    return presence === 'PHYSICAL' ? 'text-[#7C3AED]' : 'text-[#2D1B4E]';
  }

  getCaregiverLabel(appointment: Appointment): string {
    const presence = appointment.caregiverPresence;
    if (presence === 'PHYSICAL') return `${appointment.caregiverName} présent`;
    if (presence === 'REMOTE') return `${appointment.caregiverName} en visio`;
    return appointment.caregiverName || '';
  }

  canJoinCall(): boolean {
    if (this.appointment.status !== 'CONFIRMED_BY_PATIENT' &&
      this.appointment.status !== 'CONFIRMED_BY_CAREGIVER') {
      return false;
    }

    const now = new Date();
    const appointmentTime = this.appointment.startDateTime;
    const diffMinutes = (appointmentTime.getTime() - now.getTime()) / 60000;

    return diffMinutes <= 15 && diffMinutes >= -30;
  }

  getActionButtonClass(): string {
    if (this.appointment.status === 'SCHEDULED') {
      return 'bg-[#7C3AED] hover:bg-[#6D28D9]';
    }
    if (this.canJoinCall()) {
      return 'bg-green-600 hover:bg-green-700';
    }
    return '';
  }
}
