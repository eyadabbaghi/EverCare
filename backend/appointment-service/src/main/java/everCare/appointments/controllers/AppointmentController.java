package everCare.appointments.controllers;

import everCare.appointments.entities.Appointment;
import everCare.appointments.services.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // ========== CREATE ==========

    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
    }

    // ========== READ ALL ==========

    @GetMapping
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(appointments);
    }

    // ========== READ BY ID ==========

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable String id) {
        Appointment appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(appointment);
    }

    // ========== READ BY PATIENT ==========

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByPatient(@PathVariable String patientId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByPatient(patientId);
        return ResponseEntity.ok(appointments);
    }

    // ========== READ BY DOCTOR ==========

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctor(@PathVariable String doctorId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctor(doctorId);
        return ResponseEntity.ok(appointments);
    }

    // ========== READ BY CAREGIVER ==========

    @GetMapping("/caregiver/{caregiverId}")
    public ResponseEntity<List<Appointment>> getAppointmentsByCaregiver(@PathVariable String caregiverId) {
        List<Appointment> appointments = appointmentService.getAppointmentsByCaregiver(caregiverId);
        return ResponseEntity.ok(appointments);
    }

    // ========== READ BY STATUS ==========

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Appointment>> getAppointmentsByStatus(@PathVariable String status) {
        List<Appointment> appointments = appointmentService.getAppointmentsByStatus(status);
        return ResponseEntity.ok(appointments);
    }

    // ========== READ BY DATE RANGE ==========

    @GetMapping("/date-range")
    public ResponseEntity<List<Appointment>> getAppointmentsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDateRange(start, end);
        return ResponseEntity.ok(appointments);
    }

    // ========== READ BY DOCTOR AND DATE RANGE ==========

    @GetMapping("/doctor/{doctorId}/date-range")
    public ResponseEntity<List<Appointment>> getAppointmentsByDoctorAndDateRange(
            @PathVariable String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        List<Appointment> appointments = appointmentService.getAppointmentsByDoctorAndDateRange(doctorId, start, end);
        return ResponseEntity.ok(appointments);
    }

    // ========== READ FUTURE APPOINTMENTS BY PATIENT ==========

    @GetMapping("/patient/{patientId}/future")
    public ResponseEntity<List<Appointment>> getFutureAppointmentsByPatient(@PathVariable String patientId) {
        List<Appointment> appointments = appointmentService.getFutureAppointmentsByPatient(patientId);
        return ResponseEntity.ok(appointments);
    }

    // ========== CHECK DOCTOR AVAILABILITY ==========

    @GetMapping("/check-availability")
    public ResponseEntity<Boolean> checkDoctorAvailability(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateTime) {
        boolean isAvailable = appointmentService.isDoctorAvailable(doctorId, dateTime);
        return ResponseEntity.ok(isAvailable);
    }

    // ========== UPDATE ==========

    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(
            @PathVariable String id,
            @RequestBody Appointment appointment) {
        Appointment updatedAppointment = appointmentService.updateAppointment(id, appointment);
        return ResponseEntity.ok(updatedAppointment);
    }

    // ========== CONFIRM BY PATIENT ==========

    @PatchMapping("/{id}/confirm-patient")
    public ResponseEntity<Appointment> confirmByPatient(@PathVariable String id) {
        Appointment confirmedAppointment = appointmentService.confirmByPatient(id);
        return ResponseEntity.ok(confirmedAppointment);
    }

    // ========== CONFIRM BY CAREGIVER ==========

    @PatchMapping("/{id}/confirm-caregiver")
    public ResponseEntity<Appointment> confirmByCaregiver(@PathVariable String id) {
        Appointment confirmedAppointment = appointmentService.confirmByCaregiver(id);
        return ResponseEntity.ok(confirmedAppointment);
    }

    // ========== CANCEL APPOINTMENT ==========

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Appointment> cancelAppointment(@PathVariable String id) {
        Appointment cancelledAppointment = appointmentService.cancelAppointment(id);
        return ResponseEntity.ok(cancelledAppointment);
    }

    // ========== RESCHEDULE APPOINTMENT ==========

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<Appointment> rescheduleAppointment(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newDateTime) {
        Appointment rescheduledAppointment = appointmentService.rescheduleAppointment(id, newDateTime);
        return ResponseEntity.ok(rescheduledAppointment);
    }

    // ========== UPDATE DOCTOR NOTES ==========

    @PatchMapping("/{id}/notes")
    public ResponseEntity<Appointment> updateDoctorNotes(
            @PathVariable String id,
            @RequestParam String notes) {
        Appointment updatedAppointment = appointmentService.updateDoctorNotes(id, notes);
        return ResponseEntity.ok(updatedAppointment);
    }

    // ========== UPDATE SIMPLE SUMMARY ==========

    @PatchMapping("/{id}/summary")
    public ResponseEntity<Appointment> updateSimpleSummary(
            @PathVariable String id,
            @RequestParam String summary) {
        Appointment updatedAppointment = appointmentService.updateSimpleSummary(id, summary);
        return ResponseEntity.ok(updatedAppointment);
    }

    // ========== DELETE ==========

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable String id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    // ========== DELETE BY PATIENT ==========

    @DeleteMapping("/patient/{patientId}")
    public ResponseEntity<Void> deleteAppointmentsByPatient(@PathVariable String patientId) {
        appointmentService.deleteAppointmentsByPatient(patientId);
        return ResponseEntity.noContent().build();
    }

    // ========== COUNT BY DOCTOR AND DATE ==========

    @GetMapping("/count")
    public ResponseEntity<Long> countAppointmentsByDoctorAndDate(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date) {
        long count = appointmentService.countAppointmentsByDoctorAndDate(doctorId, date);
        return ResponseEntity.ok(count);
    }

    // ========== TRIGGER REMINDERS ==========

    @PostMapping("/send-reminders")
    public ResponseEntity<String> sendReminders() {
        appointmentService.sendReminders();
        return ResponseEntity.ok("Reminders sent successfully");
    }
}