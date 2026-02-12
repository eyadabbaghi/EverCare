import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FrontOfficeRoutingModule } from './front-office-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { AboutComponent } from './pages/about/about.component';
import { ContactComponent } from './pages/contact/contact.component';
import { ServicesComponent } from './pages/services/services.component';
import { PricingComponent } from './pages/pricing/pricing.component';
import { FaqComponent } from './pages/faq/faq.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { FeatureCardComponent } from './components/feature-card/feature-card.component';
import { TestimonialComponent } from './components/testimonial/testimonial.component';
import { TeamMemberComponent } from './components/team-member/team-member.component';
import { ContactFormComponent } from './components/contact-form/contact-form.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';
import {ReactiveFormsModule} from "@angular/forms";


@NgModule({
  declarations: [
    HomeComponent,
    AboutComponent,
    ContactComponent,
    ServicesComponent,
    PricingComponent,
    FaqComponent,
    LoginComponent,
    RegisterComponent,
    FeatureCardComponent,
    TestimonialComponent,
    TeamMemberComponent,
    ContactFormComponent,
    NewsletterComponent
  ],
    imports: [
        CommonModule,
        FrontOfficeRoutingModule,
        ReactiveFormsModule
    ]
})
export class FrontOfficeModule { }
