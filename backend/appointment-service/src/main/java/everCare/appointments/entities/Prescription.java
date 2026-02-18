package everCare.appointments.entities;

import everCare.appointments.entities.User;
import everCare.appointments.entities.Appointment;
import everCare.appointments.entities.Medicament;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "prescriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @Column(name = "prescription_id")
    private String prescriptionId;

    @PrePersist
    public void generateId() {
        if (this.prescriptionId == null) {
            this.prescriptionId = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
    }

    // ========== LIENS VERS AUTRES ENTITÉS ==========

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;                     // Patient concerné

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;                       // Médecin prescripteur

    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;            // Consultation associée

    // ========== RELATION AVEC MEDICAMENT ==========

    @ManyToOne
    @JoinColumn(name = "medicament_id", nullable = false)
    private Medicament medicament;              // Médicament prescrit

    // ========== DATES ==========

    @Column(nullable = false)
    private LocalDate datePrescription;         // Date de prescription

    private LocalDate dateDebut;                 // Date de début du traitement

    private LocalDate dateFin;                    // Date de fin prévisionnelle

    // ========== POSOLOGIE ==========

    private String posologie;                    // "1 comprimé matin et soir"

    private String instructions;                  // "À prendre au cours du repas"

    // ========== STATUT ==========

    private String statut;                        // ACTIVE, TERMINEE, INTERROMPUE

    private boolean renouvelable;                  // Prescription renouvelable ?

    private int nombreRenouvellements;              // Nombre de renouvellements autorisés

    // ========== POUR PATIENTS ALZHEIMER ==========

    private String priseMatin;                    // "Donépézil 10mg"
    private String priseMidi;                      // "Mémantine 10mg"
    private String priseSoir;                       // "Mémantine 10mg"

    @Column(length = 500)
    private String resumeSimple;                    // Résumé pour patient (ex: "💊 bleu = matin")

    private String pdfUrl;                           // Lien vers PDF généré

    // ========== SUIVI ==========

    private String notesMedecin;                     // Notes privées

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}