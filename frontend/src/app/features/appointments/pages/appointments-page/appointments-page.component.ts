// appointments.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {Appointment} from '../../models/appointment';

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments-page.component.html',
})
export class AppointmentsPageComponent implements OnInit {
  currentDate: Date = new Date(2026, 1, 1); // February 2026
  isAddDialogOpen = false;

  appointments: Appointment[] = [
    {
      id: '1',
      title: 'General Checkup',
      doctor: 'Dr. Sarah Wilson',
      date: '2026-02-05',
      time: '10:00 AM',
      type: 'in-person',
      location: 'EverCare Medical Center, Room 203',
      status: 'upcoming',
      notes: 'Bring recent blood test results'
    },
    {
      id: '2',
      title: 'Neurology Consultation',
      doctor: 'Dr. Michael Chen',
      date: '2026-02-12',
      time: '2:30 PM',
      type: 'video',
      location: 'Video Call',
      status: 'upcoming',
      notes: 'Review memory assessment results'
    },
    {
      id: '3',
      title: 'Physical Therapy',
      doctor: 'Therapist Emma Davis',
      date: '2026-02-08',
      time: '11:00 AM',
      type: 'in-person',
      location: 'Rehabilitation Center, Building B',
      status: 'upcoming'
    },
    {
      id: '4',
      title: 'Medication Review',
      doctor: 'Dr. Sarah Wilson',
      date: '2026-01-28',
      time: '9:00 AM',
      type: 'in-person',
      location: 'EverCare Medical Center, Room 203',
      status: 'completed'
    }
  ];

  newAppointment: Omit<Appointment, 'id' | 'status'> = {
    title: '',
    doctor: '',
    date: '',
    time: '',
    type: 'in-person',
    location: '',
    notes: ''
  };

  daysInMonth: number = 0;
  startingDayOfWeek: number = 0;
  monthName: string = '';

  ngOnInit(): void {
    this.updateCalendar();
  }

  updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    this.daysInMonth = lastDay.getDate();
    this.startingDayOfWeek = firstDay.getDay();
    this.monthName = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1);
    this.updateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1);
    this.updateCalendar();
  }

  getAppointmentsForDate(date: string): Appointment[] {
    return this.appointments.filter(apt => apt.date === date && apt.status === 'upcoming');
  }

  get upcomingAppointments(): Appointment[] {
    return this.appointments
      .filter(apt => apt.status === 'upcoming')
      .sort((a, b) =>
        new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
      );
  }

  addAppointment(): void {
    const appointment: Appointment = {
      id: Date.now().toString(),
      ...this.newAppointment,
      status: 'upcoming'
    };

    this.appointments = [...this.appointments, appointment];

    // Ici vous appelleriez votre service de toast
    // this.toastService.success('Appointment scheduled successfully!');

    this.isAddDialogOpen = false;
    this.resetNewAppointment();
  }

  resetNewAppointment(): void {
    this.newAppointment = {
      title: '',
      doctor: '',
      date: '',
      time: '',
      type: 'in-person',
      location: '',
      notes: ''
    };
  }

  isFormValid(): boolean {
    return !!(this.newAppointment.title &&
      this.newAppointment.doctor &&
      this.newAppointment.date &&
      this.newAppointment.time);
  }

  isToday(dateStr: string): boolean {
    const today = '2026-02-01'; // Pour l'exemple
    return dateStr === today;
  }
}
