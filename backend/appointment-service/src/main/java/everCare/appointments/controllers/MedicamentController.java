package everCare.appointments.controllers;

import everCare.appointments.entities.Medicament;
import everCare.appointments.services.MedicamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/medicaments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedicamentController {

    private final MedicamentService medicamentService;

    // ========== CREATE ==========

    @PostMapping
    public ResponseEntity<Medicament> createMedicament(@RequestBody Medicament medicament) {
        Medicament createdMedicament = medicamentService.createMedicament(medicament);
        return new ResponseEntity<>(createdMedicament, HttpStatus.CREATED);
    }

    // ========== READ ALL ==========

    @GetMapping
    public ResponseEntity<List<Medicament>> getAllMedicaments() {
        return ResponseEntity.ok(medicamentService.getAllMedicaments());
    }

    // ========== READ BY ID ==========

    @GetMapping("/{id}")
    public ResponseEntity<Medicament> getMedicamentById(@PathVariable String id) {
        return ResponseEntity.ok(medicamentService.getMedicamentById(id));
    }

    // ========== READ BY CODE CIP ==========

    @GetMapping("/code/{codeCIP}")
    public ResponseEntity<Medicament> getMedicamentByCodeCIP(@PathVariable String codeCIP) {
        return ResponseEntity.ok(medicamentService.getMedicamentByCodeCIP(codeCIP));
    }

    // ========== SEARCH ==========

    @GetMapping("/search")
    public ResponseEntity<List<Medicament>> searchMedicaments(@RequestParam String keyword) {
        return ResponseEntity.ok(medicamentService.searchMedicaments(keyword));
    }

    // ========== READ ACTIVE ==========

    @GetMapping("/active")
    public ResponseEntity<List<Medicament>> getActiveMedicaments() {
        return ResponseEntity.ok(medicamentService.getActiveMedicaments());
    }

    // ========== READ BY LABORATOIRE ==========

    @GetMapping("/laboratoire/{laboratoire}")
    public ResponseEntity<List<Medicament>> getMedicamentsByLaboratoire(@PathVariable String laboratoire) {
        return ResponseEntity.ok(medicamentService.getMedicamentsByLaboratoire(laboratoire));
    }

    // ========== READ BY FORME ==========

    @GetMapping("/forme/{forme}")
    public ResponseEntity<List<Medicament>> getMedicamentsByForme(@PathVariable String forme) {
        return ResponseEntity.ok(medicamentService.getMedicamentsByForme(forme));
    }

    // ========== UPDATE ==========

    @PutMapping("/{id}")
    public ResponseEntity<Medicament> updateMedicament(@PathVariable String id, @RequestBody Medicament medicament) {
        return ResponseEntity.ok(medicamentService.updateMedicament(id, medicament));
    }

    // ========== ACTIVATE ==========

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Medicament> activateMedicament(@PathVariable String id) {
        return ResponseEntity.ok(medicamentService.activateMedicament(id));
    }

    // ========== DEACTIVATE ==========

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Medicament> deactivateMedicament(@PathVariable String id) {
        return ResponseEntity.ok(medicamentService.deactivateMedicament(id));
    }

    // ========== UPDATE PHOTO ==========

    @PatchMapping("/{id}/photo")
    public ResponseEntity<Medicament> updatePhoto(@PathVariable String id, @RequestParam String photoUrl) {
        return ResponseEntity.ok(medicamentService.updatePhoto(id, photoUrl));
    }

    // ========== UPDATE NOTICE ==========

    @PatchMapping("/{id}/notice")
    public ResponseEntity<Medicament> updateNotice(@PathVariable String id, @RequestParam String notice) {
        return ResponseEntity.ok(medicamentService.updateNotice(id, notice));
    }

    // ========== DELETE ==========

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicament(@PathVariable String id) {
        medicamentService.deleteMedicament(id);
        return ResponseEntity.noContent().build();
    }

    // ========== DELETE ALL ==========

    @DeleteMapping("/all")
    public ResponseEntity<Void> deleteAllMedicaments() {
        medicamentService.deleteAllMedicaments();
        return ResponseEntity.noContent().build();
    }

    // ========== COUNT ==========

    @GetMapping("/count")
    public ResponseEntity<Long> countMedicaments() {
        return ResponseEntity.ok(medicamentService.countMedicaments());
    }
}