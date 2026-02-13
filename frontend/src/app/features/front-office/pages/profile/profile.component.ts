import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  emergencyContact: string;
  bloodType: string;
  allergies: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  activeTab: 'personal' | 'health' | 'settings' = 'personal';
  isEditing = false;

  // Temporary mock user – can be replaced by a real auth service later
  user = {
    name: 'EverCare User',
    email: 'user@example.com',
    role: 'caregiver',
    avatar: '',
  };

  profileData: ProfileData = {
    name: this.user.name,
    email: this.user.email,
    phone: '+1 (555) 123-4567',
    address: '123 Care Street, Medical City, MC 12345',
    dateOfBirth: '1950-05-15',
    emergencyContact: 'Jane Doe - +1 (555) 987-6543',
    bloodType: 'A+',
    allergies: 'Penicillin, Shellfish',
  };

  constructor(private readonly toastr: ToastrService) {}

  setTab(tab: 'personal' | 'health' | 'settings'): void {
    this.activeTab = tab;
  }

  toggleEdit(): void {
    if (this.isEditing) {
      this.handleSaveProfile();
    } else {
      this.isEditing = true;
    }
  }

  handleSaveProfile(): void {
    this.isEditing = false;
    this.toastr.success('Profile updated successfully!', 'Profile');
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}

