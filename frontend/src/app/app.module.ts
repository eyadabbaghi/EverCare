import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { BackOfficeLayoutComponent } from './layouts/back-office-layout/back-office-layout.component';
import { SidebarComponent } from './layouts/back-office-layout/sidebar/sidebar.component';
import { NavbarComponent } from './layouts/back-office-layout/navbar/navbar.component';
import { FooterComponent } from './layouts/back-office-layout/footer/footer.component';
import { FrontOfficeLayoutComponent } from './layouts/front-office-layout/front-office-layout.component';
import { HeaderComponent } from './layouts/front-office-layout/header/header.component';
import { HeroComponent } from './layouts/front-office-layout/hero/hero.component';
import { LayoutsModule } from './layouts/layouts.module';
import { BackOfficeModule } from './features/back-office/back-office.module';
import { FrontOfficeModule } from './features/front-office/front-office.module';
import { AppointmentsModule } from './features/appointments/appointments.module';
import { LucideAngularModule, Heart, Mail, Lock, User, Chrome } from 'lucide-angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';

// Import the interceptor
import { AuthInterceptor } from './features/front-office/pages/login/auth.interceptor';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {CommonModule} from '@angular/common'; // adjust path if needed

@NgModule({

  declarations: [
    AppComponent,
    BackOfficeLayoutComponent,
    SidebarComponent,
    NavbarComponent,
    FooterComponent,
    FrontOfficeLayoutComponent,
    HeaderComponent,
    HeroComponent,
    AppComponent,
    BackOfficeLayoutComponent,
    SidebarComponent,
    NavbarComponent,
    FooterComponent,
    FrontOfficeLayoutComponent,
    HeaderComponent,
    HeroComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    LayoutsModule,
    BackOfficeModule,
    FrontOfficeModule,
    AppointmentsModule,
    LucideAngularModule.pick({ Heart, Mail, Lock, User }),
    BrowserAnimationsModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true
    }),
    ReactiveFormsModule,
    RouterModule,
    CommonModule,

  ],
  providers: [
    provideClientHydration(),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // Add this line
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
