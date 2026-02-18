package everCare.appointments.services;

import everCare.appointments.entities.Medicament;
import java.util.List;

public interface MedicamentService {

    // ========== CREATE ==========
    Medicament createMedicament(Medicament medicament);

    // ========== READ ==========
    List<Medicament> getAllMedicaments();
    Medicament getMedicamentById(String id);
    Medicament getMedicamentByCodeCIP(String codeCIP);
    List<Medicament> searchMedicaments(String keyword);
    List<Medicament> getActiveMedicaments();
    List<Medicament> getMedicamentsByLaboratoire(String laboratoire);
    List<Medicament> getMedicamentsByForme(String forme);

    // ========== UPDATE ==========
    Medicament updateMedicament(String id, Medicament medicamentDetails);
    Medicament activateMedicament(String id);
    Medicament deactivateMedicament(String id);
    Medicament updatePhoto(String id, String photoUrl);
    Medicament updateNotice(String id, String notice);

    // ========== DELETE ==========
    void deleteMedicament(String id);
    void deleteAllMedicaments();

    // ========== BUSINESS LOGIC ==========
    boolean existsByCodeCIP(String codeCIP);
    long countMedicaments();
}