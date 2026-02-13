import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-office-layout',
  templateUrl: './back-office-layout.component.html',
  styleUrl: './back-office-layout.component.css'
})
export class BackOfficeLayoutComponent {
  constructor(private readonly router: Router) {}

  onLogout(): void {
    // Simple navigation for now – hook into real auth when available
    this.router.navigate(['/login']);
  }
}
