// models/appointment.model.ts
export interface Appointment {
  id: string;
  title: string;
  doctor: string;
  date: string;
  time: string;
  type: 'in-person' | 'video';
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

export type AppointmentType = 'in-person' | 'video';
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';
