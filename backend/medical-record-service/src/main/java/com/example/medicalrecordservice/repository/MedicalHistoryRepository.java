package com.example.medicalrecordservice.repository;

import com.example.medicalrecordservice.entity.MedicalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicalHistoryRepository extends JpaRepository<MedicalHistory, String> {
    List<MedicalHistory> findByMedicalRecordId(String medicalRecordId);
}
