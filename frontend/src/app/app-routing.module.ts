import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from './features/front-office/pages/login/login.component';
import {RegisterComponent} from './features/front-office/pages/register/register.component';
import {AppointmentsPageComponent} from './features/appointments/pages/appointments-page/appointments-page.component';

const routes: Routes = [
  {path: 'login', component:LoginComponent },
  {path: 'appointments', component:AppointmentsPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
