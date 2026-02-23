package com.example.medicalrecordservice.repository;

import com.example.medicalrecordservice.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, String> {
    Optional<MedicalRecord> findByPatientId(String patientId);
    boolean existsByPatientId(String patientId);
}
