package tn.esprit.dailymeservice.Dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class DailyTaskDTO {
    private Long id;

    @NotBlank
    private String patientId;

    @NotBlank
    @Size(min = 3, max = 255)
    private String title;

    @NotBlank
    @Pattern(regexp = "MEDICATION|MEAL|EXERCISE|APPOINTMENT|SOCIAL|OTHER")
    private String taskType;

    @NotBlank
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$")
    private String scheduledTime;   // <-- STRING "HH:mm"

    private String notes;
    private boolean completed;
}
