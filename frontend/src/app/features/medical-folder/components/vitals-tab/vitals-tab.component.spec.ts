import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VitalsTabComponent } from './vitals-tab.component';

describe('VitalsTabComponent', () => {
  let component: VitalsTabComponent;
  let fixture: ComponentFixture<VitalsTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VitalsTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VitalsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
