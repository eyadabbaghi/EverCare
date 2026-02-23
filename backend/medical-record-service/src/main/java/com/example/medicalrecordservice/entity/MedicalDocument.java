package com.example.medicalrecordservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String fileName;
    private String fileType; // pdf, png, jpg
    private String filePath; // Sprint 1: local path (later cloud)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_record_id", nullable = false)
    private MedicalRecord medicalRecord;
}
