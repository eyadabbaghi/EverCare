package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.entity.MedicalDocument;
import com.example.medicalrecordservice.service.MedicalDocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records/{recordId}/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedicalDocumentController {

    private final MedicalDocumentService documentService;

    @PostMapping
    public ResponseEntity<MedicalDocument> add(@PathVariable String recordId, @RequestBody MedicalDocument doc) {
        return ResponseEntity.ok(documentService.addToRecord(recordId, doc));
    }

    @GetMapping
    public ResponseEntity<List<MedicalDocument>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(documentService.listByRecord(recordId));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(@PathVariable String documentId) {
        documentService.delete(documentId);
        return ResponseEntity.noContent().build();
    }
}
