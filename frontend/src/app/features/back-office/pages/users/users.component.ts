import { Component } from '@angular/core';

type UserRole = 'Patient' | 'Doctor' | 'Caregiver' | 'Admin';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent {
  roles: UserRole[] = ['Patient', 'Doctor', 'Caregiver', 'Admin'];

  users: AdminUser[] = [
    {
      id: 'U-001',
      name: 'John Anderson',
      email: 'john.anderson@example.com',
      role: 'Patient',
      status: 'active',
    },
    {
      id: 'U-002',
      name: 'Dr. Sarah Wilson',
      email: 'sarah.wilson@example.com',
      role: 'Doctor',
      status: 'active',
    },
    {
      id: 'U-003',
      name: 'Mary Johnson',
      email: 'mary.johnson@example.com',
      role: 'Caregiver',
      status: 'active',
    },
    {
      id: 'U-004',
      name: 'EverCare Admin',
      email: 'admin@evercare.com',
      role: 'Admin',
      status: 'active',
    },
  ];

  editingUser: AdminUser | null = null;
  isCreating = false;

  newUser: AdminUser = this.createEmptyUser();

  get pagedUsers(): AdminUser[] {
    return this.users;
  }

  startCreate(): void {
    this.isCreating = true;
    this.editingUser = null;
    this.newUser = this.createEmptyUser();
  }

  startEdit(user: AdminUser): void {
    this.isCreating = false;
    this.editingUser = { ...user };
    this.newUser = { ...user };
  }

  cancelForm(): void {
    this.isCreating = false;
    this.editingUser = null;
    this.newUser = this.createEmptyUser();
  }

  saveUser(): void {
    const cleaned: AdminUser = {
      ...this.newUser,
      id: this.isCreating || !this.newUser.id ? this.generateId() : this.newUser.id,
      email: this.newUser.email.trim(),
      name: this.newUser.name.trim(),
    };

    if (this.isCreating || !this.users.find((u) => u.id === cleaned.id)) {
      this.users = [...this.users, cleaned];
    } else {
      this.users = this.users.map((u) => (u.id === cleaned.id ? cleaned : u));
    }

    this.cancelForm();
  }

  deleteUser(user: AdminUser): void {
    this.users = this.users.filter((u) => u.id !== user.id);
    if (this.editingUser?.id === user.id) {
      this.cancelForm();
    }
  }

  toggleStatus(user: AdminUser): void {
    user.status = user.status === 'active' ? 'disabled' : 'active';
  }

  getInitials(name: string | undefined): string {
    if (!name) {
      return '?';
    }
    return name
      .split(' ')
      .filter((part) => part.length > 0)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  private createEmptyUser(): AdminUser {
    return {
      id: '',
      name: '',
      email: '',
      role: 'Patient',
      status: 'active',
    };
  }

  private generateId(): string {
    const numeric = this.users
      .map((u) => Number(u.id.replace('U-', '')))
      .filter((n) => !Number.isNaN(n));
    const next = numeric.length ? Math.max(...numeric) + 1 : 1;
    return `U-${next.toString().padStart(3, '0')}`;
  }
}

