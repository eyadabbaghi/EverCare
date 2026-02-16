import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalRecordCardComponent } from './medical-record-card.component';

describe('MedicalRecordCardComponent', () => {
  let component: MedicalRecordCardComponent;
  let fixture: ComponentFixture<MedicalRecordCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicalRecordCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicalRecordCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
