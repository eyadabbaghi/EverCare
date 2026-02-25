package tn.esprit.dailymeservice.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.dailymeservice.Dto.DailyTaskDTO;
import tn.esprit.dailymeservice.Model.DailyTask;
import tn.esprit.dailymeservice.Repository.DailyTaskRepository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyTaskService {

    private final DailyTaskRepository dailyTaskRepository;

    private static final DateTimeFormatter F24 = DateTimeFormatter.ofPattern("HH:mm");

    private LocalTime parseTime(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        if (s.matches("^\\d{2}:\\d{2}:\\d{2}$")) s = s.substring(0, 5);
        return LocalTime.parse(s, F24);
    }

    // ✅ Auto-archive tasks older than 24 hours
    @Transactional
    public void archiveExpiredTasks() {
        LocalDateTime limit = LocalDateTime.now().minusHours(24);
        List<DailyTask> expired = dailyTaskRepository.findExpiredNotArchived(limit);

        if (expired.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        for (DailyTask t : expired) {
            t.setArchived(true);
            t.setArchivedAt(now);
        }

        dailyTaskRepository.saveAll(expired);
    }

    @Transactional
    public DailyTaskDTO createTask(DailyTaskDTO dto) {
        DailyTask task = mapToEntity(dto);
        DailyTask saved = dailyTaskRepository.save(task);
        return mapToDTO(saved);
    }

    // ✅ This endpoint now returns ONLY ACTIVE tasks
    public List<DailyTaskDTO> getTasksByPatientId(String patientId) {
        archiveExpiredTasks();
        return dailyTaskRepository.findByPatientIdAndArchivedFalse(patientId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // ✅ New: history tasks
    public List<DailyTaskDTO> getHistoryByPatientId(String patientId) {
        archiveExpiredTasks();
        return dailyTaskRepository.findByPatientIdAndArchivedTrueOrderByArchivedAtDesc(patientId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DailyTaskDTO updateTask(Long id, DailyTaskDTO dto) {
        DailyTask task = dailyTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(dto.getTitle());
        task.setTaskType(dto.getTaskType());
        task.setScheduledTime(parseTime(dto.getScheduledTime()));
        task.setNotes(dto.getNotes());

        DailyTask saved = dailyTaskRepository.save(task);
        return mapToDTO(saved);
    }

    @Transactional
    public DailyTaskDTO setCompleted(Long id, boolean completed) {
        DailyTask task = dailyTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setCompleted(completed);

        DailyTask saved = dailyTaskRepository.save(task);
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteTask(Long id) {
        dailyTaskRepository.deleteById(id);
    }

    private DailyTask mapToEntity(DailyTaskDTO dto) {
        DailyTask task = new DailyTask();
        task.setPatientId(dto.getPatientId());
        task.setTitle(dto.getTitle());
        task.setTaskType(dto.getTaskType());
        task.setScheduledTime(parseTime(dto.getScheduledTime()));
        task.setCompleted(dto.isCompleted());
        task.setNotes(dto.getNotes());

        // ✅ archived default safety
        task.setArchived(false);
        task.setArchivedAt(null);

        return task;
    }

    private DailyTaskDTO mapToDTO(DailyTask entity) {
        DailyTaskDTO dto = new DailyTaskDTO();
        dto.setId(entity.getId());
        dto.setPatientId(entity.getPatientId());
        dto.setTitle(entity.getTitle());
        dto.setTaskType(entity.getTaskType());
        dto.setScheduledTime(entity.getScheduledTime() == null ? null : entity.getScheduledTime().format(F24));
        dto.setCompleted(entity.isCompleted());
        dto.setNotes(entity.getNotes());
        return dto;
    }
}