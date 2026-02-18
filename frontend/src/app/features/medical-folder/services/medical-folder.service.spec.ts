import { TestBed } from '@angular/core/testing';

import { MedicalFolderService } from './medical-folder.service';

describe('MedicalFolderService', () => {
  let service: MedicalFolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalFolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
