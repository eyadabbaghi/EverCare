package tn.esprit.user.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.user.dto.ActivityDTO;
import tn.esprit.user.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final UserService userService;

    @GetMapping("/activities/{userId}")
    public ResponseEntity<List<ActivityDTO>> getUserActivities(@PathVariable String userId) {
        List<ActivityDTO> activities = userService.getUserActivities(userId);
        return ResponseEntity.ok(activities);
    }
}