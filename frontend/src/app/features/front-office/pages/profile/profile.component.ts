import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AuthService, User, UpdateUserRequest, ChangePasswordRequest } from '../login/auth.service';

// Custom validator for date of birth (must be in the past)
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const date = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date >= today) {
    return { futureDate: true };
  }
  return null;
}

// Custom validator for phone number (allow digits, spaces, +, -, parentheses)
function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const phoneRegex = /^[0-9+\-() ]+$/;
  if (control.value && !phoneRegex.test(control.value)) {
    return { invalidPhone: true };
  }
  return null;
}

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
export class ProfileComponent implements OnInit, OnDestroy {
  activeTab: 'personal' | 'health' | 'settings' = 'personal';
  isEditing = false;
  isChangingPassword = false;
  isLoading = false;

  user: User | null = null;
  private userSub!: Subscription;

  // Profile picture
  showPictureMenu = false;
  selectedFile: File | null = null;

  // Password change form
  passwordData = {
    currentPassword: '',
    newPassword: ''
  };

  // Reactive form for personal info
  personalForm!: FormGroup;

  // Country codes with flags (simplified)
  countries = [
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+39', flag: '🇮🇹', name: 'Italy' },
    { code: '+34', flag: '🇪🇸', name: 'Spain' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+55', flag: '🇧🇷', name: 'Brazil' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+7', flag: '🇷🇺', name: 'Russia' },
    { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  ];

  // Selected country codes (default to USA)
  phoneCountryCode = '+1';
  emergencyCountryCode = '+1';

  profileData: ProfileData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    emergencyContact: '',
    bloodType: '',
    allergies: '',
  };

  constructor(
    private readonly toastr: ToastrService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.createForm();
  }

  private createForm(): void {
    this.personalForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator]],
      address: [''],
      dateOfBirth: ['', [Validators.required, pastDateValidator]],
      emergencyContact: ['', [Validators.required, phoneValidator]],
    });
  }

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe((user: User | null) => {
      this.user = user;
      if (user) {
        this.profileData = {
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          address: this.profileData.address, // not stored yet
          dateOfBirth: this.profileData.dateOfBirth, // not stored yet
          emergencyContact: this.profileData.emergencyContact, // not stored yet
          bloodType: this.profileData.bloodType,
          allergies: this.profileData.allergies,
        };
        this.personalForm.patchValue({
          name: user.name,
          email: user.email,
          phone: user.phone || '',
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }

  setTab(tab: 'personal' | 'health' | 'settings'): void {
    this.activeTab = tab;
    if (tab !== 'settings') {
      this.isChangingPassword = false;
    }
  }

  toggleEdit(): void {
    if (this.isEditing) {
      this.handleSaveProfile();
    } else {
      this.isEditing = true;
    }
  }

  handleSaveProfile(): void {
    if (!this.user) return;

    if (this.personalForm.invalid) {
      this.personalForm.markAllAsTouched();
      this.toastr.warning('Please fix the errors in the form', 'Validation Error');
      return;
    }

    const formValue = this.personalForm.value;
    const updateData: UpdateUserRequest = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone, // we send the full number including country code
    };

    this.isLoading = true;
    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.toastr.success('Profile updated successfully!', 'Success');
        this.isEditing = false;
        this.isLoading = false;

        if (this.user) {
          this.user.name = response.user.name;
          this.user.email = response.user.email;
          this.user.phone = response.user.phone;
        }

        if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      },
      error: (err) => {
        console.error('Update failed', err);
        const errorMsg = err.error?.message || 'Failed to update profile';
        this.toastr.error(errorMsg, 'Error');
        this.isLoading = false;
      }
    });
  }

  toggleChangePassword(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.passwordData = { currentPassword: '', newPassword: '' };
  }

  handleChangePassword(): void {
    if (!this.passwordData.currentPassword || !this.passwordData.newPassword) {
      this.toastr.warning('Please fill all fields', 'Warning');
      return;
    }

    this.isLoading = true;
    const request: ChangePasswordRequest = {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    };

    this.authService.changePassword(request).subscribe({
      next: () => {
        this.toastr.success('Password changed successfully', 'Success');
        this.isChangingPassword = false;
        this.isLoading = false;
        this.passwordData = { currentPassword: '', newPassword: '' };
      },
      error: (err) => {
        console.error('Password change failed', err);
        const errorMsg = err.error?.message || 'Failed to change password';
        this.toastr.error(errorMsg, 'Error');
        this.isLoading = false;
      }
    });
  }

  // Profile picture methods
  togglePictureMenu(): void {
    this.showPictureMenu = !this.showPictureMenu;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('profile-picture-input') as HTMLInputElement;
    fileInput.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadPicture();
    }
  }

  uploadPicture(): void {
    if (!this.selectedFile) return;
    this.isLoading = true;
    this.authService.uploadProfilePicture(this.selectedFile).subscribe({
      next: (response) => {
        this.toastr.success('Profile picture updated', 'Success');
        if (this.user) {
          this.user.profilePicture = response.profilePicture;
        }
        this.authService.fetchCurrentUser().subscribe();
        this.isLoading = false;
        this.showPictureMenu = false;
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.toastr.error('Failed to upload picture', 'Error');
        this.isLoading = false;
      }
    });
  }

  removePicture(): void {
    this.isLoading = true;
    this.authService.removeProfilePicture().subscribe({
      next: () => {
        this.toastr.success('Profile picture removed', 'Success');
        if (this.user) {
          this.user.profilePicture = undefined;
        }
        this.authService.fetchCurrentUser().subscribe();
        this.isLoading = false;
        this.showPictureMenu = false;
      },
      error: (err) => {
        console.error('Remove failed', err);
        this.toastr.error('Failed to remove picture', 'Error');
        this.isLoading = false;
      }
    });
  }

  confirmDeleteAccount(): void {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      this.deleteAccount();
    }
  }

  private deleteAccount(): void {
    this.isLoading = true;
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.toastr.success('Account deleted', 'Goodbye');
        this.authService.logout();
      },
      error: (err) => {
        console.error('Delete failed', err);
        const errorMsg = err.error?.message || 'Failed to delete account';
        this.toastr.error(errorMsg, 'Error');
        this.isLoading = false;
      }
    });
  }

  getInitials(name: string | undefined): string {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  // Helper to check if a form control is invalid and touched
  isInvalid(controlName: string): boolean {
    const control = this.personalForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }
}