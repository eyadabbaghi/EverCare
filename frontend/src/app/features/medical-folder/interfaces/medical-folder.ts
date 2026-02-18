// src/app/features/medical-folder/interfaces/medical-folder.interface.ts

export interface MedicalDocument {
  id: string;
  name: string;
  type: 'lab-result' | 'prescription' | 'report' | 'scan' | 'other';
  date: string;
  size: string;
  doctor?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  active: boolean;
}

export interface VitalSign {
  id: string;
  type: 'blood-pressure' | 'heart-rate' | 'temperature' | 'weight';
  value: string;
  date: string;
  time: string;
}
