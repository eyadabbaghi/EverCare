import {AppointmentStatus, CaregiverPresence, RecurrencePattern} from './appointment';

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  caregiverId?: string;
  consultationTypeId: string;
  startDateTime: Date;
  caregiverPresence?: CaregiverPresence;
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  doctorNotes?: string;
}

export interface UpdateAppointmentRequest {
  startDateTime?: Date;
  status?: AppointmentStatus;
  caregiverPresence?: CaregiverPresence;
  doctorNotes?: string;
  simpleSummary?: string;
  caregiverId?: string;
  consultationTypeId?: string;
}

export interface ConfirmAppointmentRequest {
  confirmationDate: Date;
}
