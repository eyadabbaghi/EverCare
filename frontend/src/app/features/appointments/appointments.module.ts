import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppointmentsRoutingModule } from './appointments-routing.module';
import { AppointmentsPageComponent } from './pages/appointments-page/appointments-page.component';
import {FormsModule} from '@angular/forms';



@NgModule({
  declarations: [
    AppointmentsPageComponent,

  ],
  imports: [
    CommonModule,
    AppointmentsRoutingModule,
    FormsModule
  ]
})
export class AppointmentsModule { }
