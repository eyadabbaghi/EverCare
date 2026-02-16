import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalRecordListComponent } from './medical-record-list.component';

describe('MedicalRecordListComponent', () => {
  let component: MedicalRecordListComponent;
  let fixture: ComponentFixture<MedicalRecordListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicalRecordListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalRecordListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
