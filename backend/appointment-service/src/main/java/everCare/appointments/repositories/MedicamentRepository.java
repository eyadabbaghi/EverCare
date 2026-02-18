package everCare.appointments.repositories;

import everCare.appointments.entities.Medicament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicamentRepository extends JpaRepository<Medicament, String> {

    // Find by name
    List<Medicament> findByNomCommercialContainingIgnoreCase(String nom);

    List<Medicament> findByDenominationCommuneInternationaleContainingIgnoreCase(String dci);

    // Find by code CIP
    Medicament findByCodeCIP(String codeCIP);

    // Find active medicaments
    List<Medicament> findByActifTrue();

    // Find by laboratoire
    List<Medicament> findByLaboratoireContainingIgnoreCase(String laboratoire);

    // Find by forme
    List<Medicament> findByForme(String forme);

    // Search by multiple criteria
    @Query("SELECT m FROM Medicament m WHERE " +
            "LOWER(m.nomCommercial) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(m.denominationCommuneInternationale) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(m.codeCIP) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Medicament> searchMedicaments(@Param("keyword") String keyword);

    // Check if exists
    boolean existsByCodeCIP(String codeCIP);
}