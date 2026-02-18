import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MedicalDocument } from '../../interfaces/medical-folder';

@Component({
  selector: 'app-documents-tab',
  templateUrl: './documents-tab.component.html'
})
export class DocumentsTabComponent {
  @Input() documents: MedicalDocument[] = [];
  @Input() searchQuery: string = '';
  @Output() searchChange = new EventEmitter<string>();
  @Output() downloadDocument = new EventEmitter<MedicalDocument>();

  getDocumentIcon(type: string): string {
    const icons: Record<string, string> = {
      'lab-result': '🧪',
      'prescription': '💊',
      'report': '📋',
      'scan': '🔬',
      'other': '📄'
    };
    return icons[type] || '📄';
  }

  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'lab-result': 'Lab Result',
      'prescription': 'Prescription',
      'report': 'Medical Report',
      'scan': 'Scan/Imaging',
      'other': 'Document'
    };
    return labels[type] || 'Document';
  }

  onSearchChange(value: string) {
    this.searchChange.emit(value);
  }

  onDownload(doc: MedicalDocument) {
    this.downloadDocument.emit(doc);
  }
}
