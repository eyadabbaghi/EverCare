export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  profilePicture?: string;
  // Patient fields
  alzheimerStage?: AlzheimerStage;
  requiresCaregiver?: boolean;
  // Doctor fields
  specialty?: string;
  acceptsNewPatients?: boolean;
  // Caregiver fields
  relationship?: string;
  accessLevel?: CaregiverAccessLevel;
}

export type UserRole = 'PATIENT' | 'DOCTOR' | 'CAREGIVER' | 'ADMIN';

export type AlzheimerStage = 'LEGER' | 'MODERE' | 'AVANCE';

export type CaregiverAccessLevel = 'PRIMARY' | 'SECONDARY' | 'READ_ONLY';
