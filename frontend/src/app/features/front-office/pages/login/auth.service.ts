import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string; // 'PATIENT', 'CAREGIVER', 'DOCTOR', 'ADMIN'
}

export interface AuthResponse {
  token: string;
}

export interface User {
  userId?: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isVerified?: boolean;
  createdAt?: string;
  profilePicture?: string;

  // New profile fields
  dateOfBirth?: string;          // LocalDate as string (ISO format)
  emergencyContact?: string;

  // Doctor fields
  yearsExperience?: number;
  specialization?: string;
  medicalLicense?: string;
  workplaceType?: string;
  workplaceName?: string;

  // Relationship emails (for display)
  caregiverEmails?: string[];
  patientEmails?: string[];
  doctorEmail?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  profilePicture?: string;

  // Doctor fields
  yearsExperience?: number;
  specialization?: string;
  medicalLicense?: string;
  workplaceType?: string;
  workplaceName?: string;

  // For patient/caregiver linking (one email at a time)
  connectedEmail?: string;
  doctorEmail?: string; 
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8096/EverCare/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuth(response))
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => this.handleAuth(response))
    );
  }

  fetchCurrentUser(): Observable<User> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    return this.http.get<User>(`${this.apiUrl}/me`, { headers }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        if (this.isBrowser) {
          localStorage.setItem('current_user', JSON.stringify(user));
        }
      })
    );
  }

  private handleAuth(response: AuthResponse): void {
    this.storeToken(response.token);
    this.fetchCurrentUser().subscribe({
      error: (err) => console.error('Failed to fetch user after auth', err)
    });
  }

  private storeToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadStoredUser(): void {
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  updateProfile(data: UpdateUserRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl.replace('/auth', '')}/users/profile`, data);
  }

  changePassword(data: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.apiUrl.replace('/auth', '')}/users/change-password`, data);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl.replace('/auth', '')}/users/profile`);
  }

  uploadProfilePicture(file: File): Observable<{ profilePicture: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ profilePicture: string }>(`${this.apiUrl.replace('/auth', '')}/users/profile/picture`, formData);
  }

  removeProfilePicture(): Observable<any> {
    return this.http.delete(`${this.apiUrl.replace('/auth', '')}/users/profile/picture`);
  }


  searchUsersByRole(term: string, role: string): Observable<User[]> {
  return this.http.get<User[]>(`${this.apiUrl.replace('/auth', '')}/users/search`, {
    params: { q: term, role }
  });
}
getUserByEmail(email: string): Observable<User> {
  return this.http.get<User>(`${this.apiUrl.replace('/auth', '')}/users/by-email`, {
    params: { email }
  });
}

googleLogin(idToken: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { idToken });
}
}