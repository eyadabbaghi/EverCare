import { Component, Input } from '@angular/core';
import { VitalSign } from '../../interfaces/medical-folder';

@Component({
  selector: 'app-vitals-tab',
  templateUrl: './vitals-tab.component.html'
})
export class VitalsTabComponent {
  @Input() vitalSigns: VitalSign[] = [];

  getVitalIcon(type: string): string {
    const icons: Record<string, string> = {
      'blood-pressure': '💓',
      'heart-rate': '❤️',
      'temperature': '🌡️',
      'weight': '⚖️'
    };
    return icons[type] || '📊';
  }

  getVitalLabel(type: string): string {
    const labels: Record<string, string> = {
      'blood-pressure': 'Blood Pressure',
      'heart-rate': 'Heart Rate',
      'temperature': 'Temperature',
      'weight': 'Weight'
    };
    return labels[type] || 'Vital Sign';
  }
}
