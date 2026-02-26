import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../models/appointment';
import { CreateAppointmentRequest } from '../models/appointment-request';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private apiUrl = 'http://localhost:8085/EverCare/appointments';

  constructor(private http: HttpClient) { }

  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  getAppointmentsByPatient(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getAppointmentsByDoctor(doctorId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  createAppointment(appointmentData: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointmentData);
  }

  updateAppointment(id: string, updates: Partial<Appointment>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, updates);
  }

  deleteAppointment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  confirmByPatient(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/confirm-patient`, {});
  }

  confirmByCaregiver(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/confirm-caregiver`, {});
  }

  cancelAppointment(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getAvailableTimeSlots(doctorId: string, date: Date, duration: number): Observable<Date[]> {
    return this.http.get<Date[]>(`${this.apiUrl}/available-slots`, {
      params: {
        doctorId,
        date: date.toISOString(),
        duration: duration.toString()
      }
    });


  }
  // Add to AppointmentService
  getAppointmentsByDoctorAndDate(doctorId: string, date: Date): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/doctor/${doctorId}/date`, {
      params: { date: date.toISOString() }
    });
  }

  confirmByDoctor(id: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/confirm-doctor`, {});
  }

  getPatientAppointmentCount(patientId: string, doctorId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`, {
      params: { patientId, doctorId }
    });
  }

  updateDoctorNotes(id: string, notes: string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/notes`, { notes });
  }

}
