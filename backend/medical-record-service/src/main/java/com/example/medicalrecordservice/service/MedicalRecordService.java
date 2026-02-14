package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;

    public MedicalRecord create(MedicalRecord record) {
        if (record.getPatientId() == null || record.getPatientId().isBlank()) {
            throw new IllegalArgumentException("patientId is required");
        }
        if (medicalRecordRepository.existsByPatientId(record.getPatientId())) {
            throw new IllegalStateException("MedicalRecord already exists for this patientId");
        }
        return medicalRecordRepository.save(record);
    }

    public List<MedicalRecord> findAll() {
        return medicalRecordRepository.findAll();
    }

    public MedicalRecord findById(String id) {
        return medicalRecordRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("MedicalRecord not found"));
    }

    public MedicalRecord findByPatientId(String patientId) {
        return medicalRecordRepository.findByPatientId(patientId)
                .orElseThrow(() -> new IllegalStateException("MedicalRecord not found"));
    }

    public MedicalRecord update(String id, MedicalRecord updated) {
        MedicalRecord existing = findById(id);
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setAlzheimerStage(updated.getAlzheimerStage());
        return medicalRecordRepository.save(existing);
    }

    public void delete(String id) {
        if (!medicalRecordRepository.existsById(id)) {
            throw new IllegalStateException("MedicalRecord not found");
        }
        medicalRecordRepository.deleteById(id);
    }
}
