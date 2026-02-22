export interface Availability {
  availabilityId: string;
  doctorId: string;
  doctorName?: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  validFrom: Date;
  validTo: Date;
  recurrence: RecurrenceType;
  isBlocked: boolean;
  blockReason?: string;
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type RecurrenceType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ONCE';
