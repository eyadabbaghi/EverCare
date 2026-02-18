package everCare.appointments.repositories;

import everCare.appointments.entities.Prescription;
import everCare.appointments.entities.User;
import everCare.appointments.entities.Medicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, String> {

    // Find by patient
    List<Prescription> findByPatient(User patient);

    // Find by doctor
    List<Prescription> findByDoctor(User doctor);

    // Find by medicament
    List<Prescription> findByMedicament(Medicament medicament);

    // Find by status
    List<Prescription> findByStatut(String statut);

    // Find active prescriptions for a patient
    @Query("SELECT p FROM Prescription p WHERE p.patient = :patient AND p.statut = 'ACTIVE'")
    List<Prescription> findActiveByPatient(@Param("patient") User patient);

    // Find by date range
    List<Prescription> findByDatePrescriptionBetween(LocalDate start, LocalDate end);

    // Find prescriptions expiring soon
    @Query("SELECT p FROM Prescription p WHERE p.dateFin BETWEEN :start AND :end AND p.statut = 'ACTIVE'")
    List<Prescription> findExpiringBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // Find by patient and medicament
    List<Prescription> findByPatientAndMedicament(User patient, Medicament medicament);

    // Find by appointment
    List<Prescription> findByAppointment_AppointmentId(String appointmentId);

    // Count by medicament
    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.medicament = :medicament")
    long countByMedicament(@Param("medicament") Medicament medicament);

    // Find renewals
    @Query("SELECT p FROM Prescription p WHERE p.renouvelable = true AND p.nombreRenouvellements > 0")
    List<Prescription> findRenewable();
}