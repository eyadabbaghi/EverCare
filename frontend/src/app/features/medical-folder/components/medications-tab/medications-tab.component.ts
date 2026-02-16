import { Component, Input } from '@angular/core';
import { Medication } from '../../interfaces/medical-folder';

@Component({
  selector: 'app-medications-tab',
  templateUrl: './medications-tab.component.html'
})
export class MedicationsTabComponent {
  @Input() activeMedications: Medication[] = [];
  @Input() inactiveMedications: Medication[] = [];
}
