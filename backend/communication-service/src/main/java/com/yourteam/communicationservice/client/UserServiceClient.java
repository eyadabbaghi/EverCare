package com.yourteam.communicationservice.client;



import com.yourteam.communicationservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// "EverCare" correspond au spring.application.name du microservice User
// contextId permet d'éviter les conflits de noms de beans
@FeignClient(name = "EverCare", contextId = "userServiceClient")
public interface UserServiceClient {

    // On utilise le chemin exact défini dans le UserController du service User
    // Note: /EverCare est le context-path, /users est le RequestMapping
    @GetMapping("/EverCare/users/{userId}")
    UserDto getUserById(@PathVariable("userId") String userId);
}