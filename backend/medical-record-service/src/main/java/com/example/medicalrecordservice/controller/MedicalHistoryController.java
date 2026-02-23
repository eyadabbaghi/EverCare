package com.example.medicalrecordservice.controller;

import com.example.medicalrecordservice.entity.MedicalHistory;
import com.example.medicalrecordservice.service.MedicalHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medical-records/{recordId}/histories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedicalHistoryController {

    private final MedicalHistoryService historyService;

    @PostMapping
    public ResponseEntity<MedicalHistory> add(@PathVariable String recordId, @RequestBody MedicalHistory history) {
        return ResponseEntity.ok(historyService.addToRecord(recordId, history));
    }

    @GetMapping
    public ResponseEntity<List<MedicalHistory>> list(@PathVariable String recordId) {
        return ResponseEntity.ok(historyService.listByRecord(recordId));
    }

    @DeleteMapping("/{historyId}")
    public ResponseEntity<Void> delete(@PathVariable String historyId) {
        historyService.delete(historyId);
        return ResponseEntity.noContent().build();
    }
}
