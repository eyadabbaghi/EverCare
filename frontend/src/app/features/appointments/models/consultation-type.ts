export interface ConsultationType {
  typeId: string;
  name: string;              // SUI-20, COG-40, MED-15, etc.
  description: string;
  defaultDurationMinutes: number;
  alzheimerDurationMinutes: number;
  requiresCaregiver: boolean;
  environmentPreset: EnvironmentPreset;
  active: boolean;
}

export type EnvironmentPreset =
  | 'STANDARD'
  | 'CALM'
  | 'HIGH_CONTRAST'
  | 'DARK'
  | 'LIGHT';
