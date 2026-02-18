package everCare.appointments.entities;

import everCare.appointments.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @Column(name = "user_id")
    private String userId;

    @PrePersist
    public void generateId() {
        if (this.userId == null) {
            this.userId = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
    }

    // ========== INFORMATIONS DE BASE ==========

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private UserRole role;  // PATIENT, DOCTOR, CAREGIVER, ADMIN

    private String phone;

    private boolean isVerified;

    private LocalDateTime createdAt;

    // ========== INFORMATIONS PERSONNELLES ==========

    private LocalDate dateOfBirth;

    private String emergencyContact;  // Contact d'urgence

    private String profilePicture;    // URL photo

    // ========== POUR PATIENTS ALZHEIMER ==========

    private String alzheimerStage;    // LEGER, MODERE, AVANCE (simple string)

    private boolean requiresCaregiver; // True si aidant requis

    // ========== POUR MÉDECINS ==========

    private String specialty;          // Spécialité


    // ========== POUR AIDANTS ==========

    private String relationship;        // Lien avec patient (fille, fils...)


    // ========== STATUT ==========

    private boolean active;

}