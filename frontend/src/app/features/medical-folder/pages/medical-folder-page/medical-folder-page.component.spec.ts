import { Component } from '@angular/core';
import { MedicalDocument, Medication, VitalSign } from '../../interfaces/medical-folder';

@Component({
  selector: 'app-medical-folder-page',
  templateUrl: './medical-folder-page.component.html',
  styleUrls: ['./medical-folder-page.component.scss']
})
export class MedicalFolderPageComponent {
  activeTab: 'documents' | 'medications' | 'vitals' = 'documents';
  searchQuery: string = '';

  // Données à partager avec les composants enfants
  documents: MedicalDocument[] = [ /* vos données */ ];
  medications: Medication[] = [ /* vos données */ ];
  vitalSigns: VitalSign[] = [ /* vos données */ ];

  get activeMedications() {
    return this.medications.filter(med => med.active);
  }

  get inactiveMedications() {
    return this.medications.filter(med => !med.active);
  }

  get filteredDocuments() {
    if (!this.searchQuery) return this.documents;
    const query = this.searchQuery.toLowerCase();
    return this.documents.filter(doc =>
      doc.name.toLowerCase().includes(query) ||
      doc.doctor?.toLowerCase().includes(query)
    );
  }

  onTabChange(tab: 'documents' | 'medications' | 'vitals') {
    this.activeTab = tab;
  }

  onUploadClick() {
    console.log('Upload document clicked');
  }

  onDownloadDocument(doc: MedicalDocument) {
    console.log('Downloading:', doc.name);
  }
}
