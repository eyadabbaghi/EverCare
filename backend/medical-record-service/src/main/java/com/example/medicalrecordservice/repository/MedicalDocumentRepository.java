package com.example.medicalrecordservice.repository;

import com.example.medicalrecordservice.entity.MedicalDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, String> {
    List<MedicalDocument> findByMedicalRecordId(String medicalRecordId);
}
