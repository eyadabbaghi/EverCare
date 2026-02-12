// login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // États
  isLoading = false;
  activeTab: 'login' | 'register' = 'login';

  // Forms
  loginForm!: FormGroup;
  registerForm!: FormGroup;

  // Select options
  userRoles = [
    { value: 'patient', label: 'Patient' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'admin', label: 'Administrator' }
  ];

  constructor(
    private fb: FormBuilder,

    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  private initForms(): void {
    // Login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Register form
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required]
    });
  }

  // Handlers
  onTabChange(tab: 'login' | 'register'): void {
    this.activeTab = tab;
  }

  async handleLogin(): Promise<void> {

  }

  async handleGoogleLogin(): Promise<void> {
  }

  async handleRegister(): Promise<void> {

  }

  // Getters pour les formulaires
  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }
}
