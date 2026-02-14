package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.entity.MedicalHistory;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.repository.MedicalHistoryRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalHistoryService {

    private final MedicalHistoryRepository historyRepository;
    private final MedicalRecordRepository recordRepository;

    public MedicalHistory addToRecord(String recordId, MedicalHistory history) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalStateException("MedicalRecord not found"));
        history.setMedicalRecord(record);
        return historyRepository.save(history);
    }

    public List<MedicalHistory> listByRecord(String recordId) {
        return historyRepository.findByMedicalRecordId(recordId);
    }

    public void delete(String historyId) {
        if (!historyRepository.existsById(historyId)) {
            throw new IllegalStateException("MedicalHistory not found");
        }
        historyRepository.deleteById(historyId);
    }
}
