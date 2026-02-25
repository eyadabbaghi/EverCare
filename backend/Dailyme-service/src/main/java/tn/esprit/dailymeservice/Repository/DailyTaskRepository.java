package tn.esprit.dailymeservice.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import tn.esprit.dailymeservice.Model.DailyTask;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DailyTaskRepository extends JpaRepository<DailyTask, Long> {

    List<DailyTask> findByPatientId(String patientId);

    // ✅ Active tasks (not archived)
    List<DailyTask> findByPatientIdAndArchivedFalse(String patientId);

    // ✅ History tasks (archived)
    List<DailyTask> findByPatientIdAndArchivedTrueOrderByArchivedAtDesc(String patientId);

    // ✅ tasks older than 24h and not archived yet
    @Query("SELECT t FROM DailyTask t WHERE t.archived = false AND t.createdAt < :limit")
    List<DailyTask> findExpiredNotArchived(@Param("limit") LocalDateTime limit);
}