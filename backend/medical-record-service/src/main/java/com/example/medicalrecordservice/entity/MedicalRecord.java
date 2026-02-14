package com.example.medicalrecordservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * Reference to the patient (User microservice).
     * We keep it as a simple String to avoid tight coupling between microservices.
     */
    @Column(nullable = false, unique = true)
    private String patientId;

    private String bloodGroup;      // e.g. A+, O-
    private String alzheimerStage;  // e.g. MILD, MODERATE, SEVERE

    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MedicalHistory> histories = new ArrayList<>();

    @OneToMany(mappedBy = "medicalRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MedicalDocument> documents = new ArrayList<>();
}
