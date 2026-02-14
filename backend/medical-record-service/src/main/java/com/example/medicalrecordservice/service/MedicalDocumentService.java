package com.example.medicalrecordservice.service;

import com.example.medicalrecordservice.entity.MedicalDocument;
import com.example.medicalrecordservice.entity.MedicalRecord;
import com.example.medicalrecordservice.repository.MedicalDocumentRepository;
import com.example.medicalrecordservice.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalDocumentService {

    private final MedicalDocumentRepository documentRepository;
    private final MedicalRecordRepository recordRepository;

    public MedicalDocument addToRecord(String recordId, MedicalDocument doc) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalStateException("MedicalRecord not found"));
        doc.setMedicalRecord(record);
        return documentRepository.save(doc);
    }

    public List<MedicalDocument> listByRecord(String recordId) {
        return documentRepository.findByMedicalRecordId(recordId);
    }

    public void delete(String documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new IllegalStateException("MedicalDocument not found");
        }
        documentRepository.deleteById(documentId);
    }
}
