package everCare.appointments.controllers;

import everCare.appointments.entities.Prescription;
import everCare.appointments.services.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    // ========== CREATE ==========

    @PostMapping
    public ResponseEntity<Prescription> createPrescription(@RequestBody Prescription prescription) {
        Prescription createdPrescription = prescriptionService.createPrescription(prescription);
        return new ResponseEntity<>(createdPrescription, HttpStatus.CREATED);
    }

    @PostMapping("/from-consultation")
    public ResponseEntity<Prescription> createPrescriptionFromConsultation(
            @RequestParam String patientId,
            @RequestParam String doctorId,
            @RequestParam String appointmentId,
            @RequestParam String medicamentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam String posologie) {

        Prescription prescription = prescriptionService.createPrescriptionFromConsultation(
                patientId, doctorId, appointmentId, medicamentId, dateDebut, dateFin, posologie);

        return new ResponseEntity<>(prescription, HttpStatus.CREATED);
    }

    // ========== READ ALL ==========

    @GetMapping
    public ResponseEntity<List<Prescription>> getAllPrescriptions() {
        return ResponseEntity.ok(prescriptionService.getAllPrescriptions());
    }

    // ========== READ BY ID ==========

    @GetMapping("/{id}")
    public ResponseEntity<Prescription> getPrescriptionById(@PathVariable String id) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionById(id));
    }

    // ========== READ BY PATIENT ==========

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByPatient(patientId));
    }

    // ========== READ ACTIVE BY PATIENT ==========

    @GetMapping("/patient/{patientId}/active")
    public ResponseEntity<List<Prescription>> getActivePrescriptionsByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(prescriptionService.getActivePrescriptionsByPatient(patientId));
    }

    // ========== READ BY DOCTOR ==========

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByDoctor(@PathVariable String doctorId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDoctor(doctorId));
    }

    // ========== READ BY MEDICAMENT ==========

    @GetMapping("/medicament/{medicamentId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByMedicament(@PathVariable String medicamentId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByMedicament(medicamentId));
    }

    // ========== READ BY STATUS ==========

    @GetMapping("/status/{statut}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByStatus(@PathVariable String statut) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByStatus(statut));
    }

    // ========== READ BY DATE RANGE ==========

    @GetMapping("/date-range")
    public ResponseEntity<List<Prescription>> getPrescriptionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByDateRange(start, end));
    }

    // ========== READ EXPIRING ==========

    @GetMapping("/expiring")
    public ResponseEntity<List<Prescription>> getExpiringPrescriptions(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(prescriptionService.getExpiringPrescriptions(days));
    }

    // ========== READ BY APPOINTMENT ==========

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<Prescription>> getPrescriptionsByAppointment(@PathVariable String appointmentId) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionsByAppointment(appointmentId));
    }

    // ========== UPDATE ==========

    @PutMapping("/{id}")
    public ResponseEntity<Prescription> updatePrescription(@PathVariable String id, @RequestBody Prescription prescription) {
        return ResponseEntity.ok(prescriptionService.updatePrescription(id, prescription));
    }

    // ========== TERMINATE ==========

    @PatchMapping("/{id}/terminate")
    public ResponseEntity<Prescription> terminatePrescription(@PathVariable String id) {
        return ResponseEntity.ok(prescriptionService.terminatePrescription(id));
    }

    // ========== RENEW ==========

    @PatchMapping("/{id}/renew")
    public ResponseEntity<Prescription> renewPrescription(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDateFin) {
        return ResponseEntity.ok(prescriptionService.renewPrescription(id, newDateFin));
    }

    // ========== UPDATE POSOLOGIE ==========

    @PatchMapping("/{id}/posologie")
    public ResponseEntity<Prescription> updatePosologie(@PathVariable String id, @RequestParam String posologie) {
        return ResponseEntity.ok(prescriptionService.updatePosologie(id, posologie));
    }

    // ========== UPDATE RESUME ==========

    @PatchMapping("/{id}/resume")
    public ResponseEntity<Prescription> updateResumeSimple(@PathVariable String id, @RequestParam String resume) {
        return ResponseEntity.ok(prescriptionService.updateResumeSimple(id, resume));
    }

    // ========== ADD NOTES ==========

    @PatchMapping("/{id}/notes")
    public ResponseEntity<Prescription> addNotes(@PathVariable String id, @RequestParam String notes) {
        return ResponseEntity.ok(prescriptionService.addNotes(id, notes));
    }

    // ========== GENERATE PDF ==========

    @PostMapping("/{id}/generate-pdf")
    public ResponseEntity<Prescription> generatePdf(@PathVariable String id) {
        return ResponseEntity.ok(prescriptionService.generatePdf(id));
    }

    // ========== DELETE ==========

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrescription(@PathVariable String id) {
        prescriptionService.deletePrescription(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/patient/{patientId}")
    public ResponseEntity<Void> deletePrescriptionsByPatient(@PathVariable String patientId) {
        prescriptionService.deletePrescriptionsByPatient(patientId);
        return ResponseEntity.noContent().build();
    }

    // ========== TODAY PRESCRIPTIONS ==========

    @GetMapping("/patient/{patientId}/today")
    public ResponseEntity<List<Prescription>> getTodayPrescriptions(@PathVariable String patientId) {
        return ResponseEntity.ok(prescriptionService.getTodayPrescriptions(patientId));
    }

    // ========== COUNT BY MEDICAMENT ==========

    @GetMapping("/count/medicament/{medicamentId}")
    public ResponseEntity<Long> countByMedicament(@PathVariable String medicamentId) {
        return ResponseEntity.ok(prescriptionService.countByMedicament(medicamentId));
    }
}