package everCare.appointments.services.impl;

import everCare.appointments.entities.Prescription;
import everCare.appointments.entities.User;
import everCare.appointments.entities.Medicament;
import everCare.appointments.entities.Appointment;
import everCare.appointments.exceptions.ResourceNotFoundException;
import everCare.appointments.repositories.PrescriptionRepository;
import everCare.appointments.repositories.UserRepository;
import everCare.appointments.repositories.MedicamentRepository;
import everCare.appointments.repositories.AppointmentRepository;
import everCare.appointments.services.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;
    private final MedicamentRepository medicamentRepository;
    private final AppointmentRepository appointmentRepository;

    // ========== CREATE ==========

    @Override
    public Prescription createPrescription(Prescription prescription) {
        // Generate ID if not present
        if (prescription.getPrescriptionId() == null) {
            prescription.setPrescriptionId(UUID.randomUUID().toString());
        }

        // Set creation timestamp
        prescription.setCreatedAt(LocalDateTime.now());

        // Set default status
        if (prescription.getStatut() == null) {
            prescription.setStatut("ACTIVE");
        }

        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription createPrescriptionFromConsultation(String patientId, String doctorId,
                                                           String appointmentId, String medicamentId,
                                                           LocalDate dateDebut, LocalDate dateFin,
                                                           String posologie) {

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        Medicament medicament = medicamentRepository.findById(medicamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicament not found with id: " + medicamentId));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found with id: " + appointmentId));

        Prescription prescription = Prescription.builder()
                .prescriptionId(UUID.randomUUID().toString())
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .medicament(medicament)
                .datePrescription(LocalDate.now())
                .dateDebut(dateDebut)
                .dateFin(dateFin)
                .posologie(posologie)
                .statut("ACTIVE")
                .renouvelable(false)
                .createdAt(LocalDateTime.now())
                .build();

        return prescriptionRepository.save(prescription);
    }

    // ========== READ ==========

    @Override
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    @Override
    public Prescription getPrescriptionById(String id) {
        return prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
    }

    @Override
    public List<Prescription> getPrescriptionsByPatient(String patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        return prescriptionRepository.findByPatient(patient);
    }

    @Override
    public List<Prescription> getPrescriptionsByDoctor(String doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
        return prescriptionRepository.findByDoctor(doctor);
    }

    @Override
    public List<Prescription> getPrescriptionsByMedicament(String medicamentId) {
        Medicament medicament = medicamentRepository.findById(medicamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicament not found with id: " + medicamentId));
        return prescriptionRepository.findByMedicament(medicament);
    }

    @Override
    public List<Prescription> getActivePrescriptionsByPatient(String patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        return prescriptionRepository.findActiveByPatient(patient);
    }

    @Override
    public List<Prescription> getPrescriptionsByStatus(String statut) {
        return prescriptionRepository.findByStatut(statut);
    }

    @Override
    public List<Prescription> getPrescriptionsByDateRange(LocalDate start, LocalDate end) {
        return prescriptionRepository.findByDatePrescriptionBetween(start, end);
    }

    @Override
    public List<Prescription> getExpiringPrescriptions(int days) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        return prescriptionRepository.findExpiringBetween(today, endDate);
    }

    @Override
    public List<Prescription> getPrescriptionsByAppointment(String appointmentId) {
        return prescriptionRepository.findByAppointment_AppointmentId(appointmentId);
    }

    // ========== UPDATE ==========

    @Override
    public Prescription updatePrescription(String id, Prescription prescriptionDetails) {
        Prescription existingPrescription = getPrescriptionById(id);

        if (prescriptionDetails.getMedicament() != null) {
            existingPrescription.setMedicament(prescriptionDetails.getMedicament());
        }

        if (prescriptionDetails.getDateDebut() != null) {
            existingPrescription.setDateDebut(prescriptionDetails.getDateDebut());
        }

        if (prescriptionDetails.getDateFin() != null) {
            existingPrescription.setDateFin(prescriptionDetails.getDateFin());
        }

        if (prescriptionDetails.getPosologie() != null) {
            existingPrescription.setPosologie(prescriptionDetails.getPosologie());
        }

        if (prescriptionDetails.getInstructions() != null) {
            existingPrescription.setInstructions(prescriptionDetails.getInstructions());
        }

        if (prescriptionDetails.getStatut() != null) {
            existingPrescription.setStatut(prescriptionDetails.getStatut());
        }

        existingPrescription.setRenouvelable(prescriptionDetails.isRenouvelable());

        if (prescriptionDetails.getPriseMatin() != null) {
            existingPrescription.setPriseMatin(prescriptionDetails.getPriseMatin());
        }

        if (prescriptionDetails.getPriseMidi() != null) {
            existingPrescription.setPriseMidi(prescriptionDetails.getPriseMidi());
        }

        if (prescriptionDetails.getPriseSoir() != null) {
            existingPrescription.setPriseSoir(prescriptionDetails.getPriseSoir());
        }

        existingPrescription.setUpdatedAt(LocalDateTime.now());

        return prescriptionRepository.save(existingPrescription);
    }

    @Override
    public Prescription terminatePrescription(String id) {
        Prescription prescription = getPrescriptionById(id);
        prescription.setStatut("TERMINEE");
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription renewPrescription(String id, LocalDate newDateFin) {
        Prescription prescription = getPrescriptionById(id);

        if (!prescription.isRenouvelable()) {
            throw new RuntimeException("This prescription is not renewable");
        }

        Prescription newPrescription = Prescription.builder()
                .prescriptionId(UUID.randomUUID().toString())
                .patient(prescription.getPatient())
                .doctor(prescription.getDoctor())
                .medicament(prescription.getMedicament())
                .datePrescription(LocalDate.now())
                .dateDebut(prescription.getDateFin().plusDays(1))
                .dateFin(newDateFin)
                .posologie(prescription.getPosologie())
                .instructions(prescription.getInstructions())
                .statut("ACTIVE")
                .renouvelable(prescription.isRenouvelable())
                .nombreRenouvellements(prescription.getNombreRenouvellements() - 1)
                .priseMatin(prescription.getPriseMatin())
                .priseMidi(prescription.getPriseMidi())
                .priseSoir(prescription.getPriseSoir())
                .createdAt(LocalDateTime.now())
                .build();

        // Mark old prescription as renewed
        prescription.setStatut("RENOUVELEE");
        prescriptionRepository.save(prescription);

        return prescriptionRepository.save(newPrescription);
    }

    @Override
    public Prescription updatePosologie(String id, String posologie) {
        Prescription prescription = getPrescriptionById(id);
        prescription.setPosologie(posologie);
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription updateResumeSimple(String id, String resume) {
        Prescription prescription = getPrescriptionById(id);
        prescription.setResumeSimple(resume);
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription addNotes(String id, String notes) {
        Prescription prescription = getPrescriptionById(id);
        prescription.setNotesMedecin(notes);
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    @Override
    public Prescription generatePdf(String id) {
        Prescription prescription = getPrescriptionById(id);
        // Logic to generate PDF
        String pdfUrl = "/pdfs/prescription_" + id + ".pdf";
        prescription.setPdfUrl(pdfUrl);
        prescription.setUpdatedAt(LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }

    // ========== DELETE ==========

    @Override
    public void deletePrescription(String id) {
        Prescription prescription = getPrescriptionById(id);
        prescriptionRepository.delete(prescription);
    }

    @Override
    public void deletePrescriptionsByPatient(String patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
        List<Prescription> prescriptions = prescriptionRepository.findByPatient(patient);
        prescriptionRepository.deleteAll(prescriptions);
    }

    // ========== BUSINESS LOGIC ==========

    @Override
    public boolean isPrescriptionActive(String id) {
        Prescription prescription = getPrescriptionById(id);
        return "ACTIVE".equals(prescription.getStatut());
    }

    @Override
    public List<Prescription> getTodayPrescriptions(String patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        return prescriptionRepository.findActiveByPatient(patient).stream()
                .filter(p -> p.getDateDebut().isBefore(LocalDate.now().plusDays(1)) &&
                        (p.getDateFin() == null || p.getDateFin().isAfter(LocalDate.now())))
                .toList();
    }

    @Override
    public long countByMedicament(String medicamentId) {
        Medicament medicament = medicamentRepository.findById(medicamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicament not found with id: " + medicamentId));
        return prescriptionRepository.countByMedicament(medicament);
    }
}