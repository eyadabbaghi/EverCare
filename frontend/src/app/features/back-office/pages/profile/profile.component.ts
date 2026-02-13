import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

interface AdminProfileData {
  name: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  timezone: string;
  language: string;
  notificationsEmail: boolean;
  notificationsSystem: boolean;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  activeTab: 'personal' | 'settings' = 'personal';
  isEditing = false;

  adminUser = {
    name: 'EverCare Admin',
    email: 'admin@evercare.com',
    role: 'Platform administrator',
    avatar: '',
  };

  profileData: AdminProfileData = {
    name: this.adminUser.name,
    email: this.adminUser.email,
    phone: '+1 (555) 000-0000',
    role: 'Super admin',
    organization: 'EverCare',
    timezone: 'UTC',
    language: 'English',
    notificationsEmail: true,
    notificationsSystem: true,
  };

  constructor(private readonly toastr: ToastrService) {}

  setTab(tab: 'personal' | 'settings'): void {
    this.activeTab = tab;
  }

  toggleEdit(): void {
    if (this.isEditing) {
      this.saveProfile();
    } else {
      this.isEditing = true;
    }
  }

  saveProfile(): void {
    this.isEditing = false;
    this.toastr.success('Admin profile updated successfully', 'Profile');
  }

  getInitials(name: string | undefined): string {
    if (!name) {
      return 'AD';
    }
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

}
