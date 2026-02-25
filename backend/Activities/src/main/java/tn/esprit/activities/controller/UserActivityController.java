package tn.esprit.activities.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.activities.dto.ActivityDTO;
import tn.esprit.activities.dto.ActivityWithUserDataDTO;
import tn.esprit.activities.dto.UserActivityDTO;
import tn.esprit.activities.service.ActivityService;

import java.util.List;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class UserActivityController {

    private final ActivityService activityService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ActivityWithUserDataDTO>> getActivitiesForUser(@PathVariable String userId) {
        return ResponseEntity.ok(activityService.getActivitiesForUser(userId));
    }

    @GetMapping("/user/{userId}/activity/{activityId}")
    public ResponseEntity<ActivityWithUserDataDTO> getActivityForUser(
            @PathVariable String userId, @PathVariable String activityId) {
        return ResponseEntity.ok(activityService.getActivityForUser(userId, activityId));
    }

    @PostMapping("/user/{userId}/activity/{activityId}/complete")
    public ResponseEntity<UserActivityDTO> markCompleted(
            @PathVariable String userId, @PathVariable String activityId) {
        return ResponseEntity.ok(activityService.markCompleted(userId, activityId));
    }

    @PostMapping("/user/{userId}/activity/{activityId}/favorite")
    public ResponseEntity<UserActivityDTO> toggleFavorite(
            @PathVariable String userId, @PathVariable String activityId) {
        return ResponseEntity.ok(activityService.toggleFavorite(userId, activityId));
    }

    @PostMapping("/user/{userId}/activity/{activityId}/rate")
    public ResponseEntity<ActivityDTO> rateActivity(
            @PathVariable String userId, @PathVariable String activityId, @RequestParam int rating) {
        return ResponseEntity.ok(activityService.rateActivity(userId, activityId, rating));
    }
}