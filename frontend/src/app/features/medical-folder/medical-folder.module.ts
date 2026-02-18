import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalFolderRoutingModule } from './medical-folder-routing.module';
import { MedicalFolderPageComponent } from './pages/medical-folder-page/medical-folder-page.component';
import {FormsModule} from "@angular/forms";
import { DocumentsTabComponent } from './components/documents-tab/documents-tab.component';
import { MedicationsTabComponent } from './components/medications-tab/medications-tab.component';
import { VitalsTabComponent } from './components/vitals-tab/vitals-tab.component';


@NgModule({
  declarations: [
    MedicalFolderPageComponent,
    DocumentsTabComponent,
    MedicationsTabComponent,
    VitalsTabComponent,
  ],
    imports: [
        MedicalFolderRoutingModule,
        FormsModule,
      CommonModule,
    ]
})
export class MedicalFolderModule { }
