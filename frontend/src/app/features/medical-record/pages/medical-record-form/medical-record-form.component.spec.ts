import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalRecordFormComponent } from './medical-record-form.component';

describe('MedicalRecordFormComponent', () => {
  let component: MedicalRecordFormComponent;
  let fixture: ComponentFixture<MedicalRecordFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicalRecordFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalRecordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
