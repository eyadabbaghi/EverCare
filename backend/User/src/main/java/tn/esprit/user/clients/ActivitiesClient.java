package tn.esprit.user.clients;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.esprit.user.dto.ActivityDTO; // make sure this DTO exists

import java.util.List;

@FeignClient(name = "activities-service")
public interface ActivitiesClient {
    @GetMapping("/EverCare/activities/user/{userId}")
    List<ActivityDTO> getActivitiesForUser(@PathVariable("userId") String userId);
}