package tn.esprit.user.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.user.dto.*;
import tn.esprit.user.entity.User;
import tn.esprit.user.entity.UserRole;
import tn.esprit.user.security.JwtUtil;
import tn.esprit.user.service.UserService;

import java.security.Principal;
import java.util.Map;

import tn.esprit.user.security.GoogleTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For frontend during development
public class AuthController {

    private final UserService userService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final JwtUtil jwtUtil;                // <-- field added

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }

    private UserDto mapToDto(User user) {
        UserDto dto = new UserDto();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setPhone(user.getPhone());
        dto.setVerified(user.isVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setEmergencyContact(user.getEmergencyContact());
        dto.setProfilePicture(user.getProfilePicture());

        // Doctor fields
        dto.setYearsExperience(user.getYearsExperience());
        dto.setSpecialization(user.getSpecialization());
        dto.setMedicalLicense(user.getMedicalLicense());
        dto.setWorkplaceType(user.getWorkplaceType());
        dto.setWorkplaceName(user.getWorkplaceName());
        dto.setDoctorEmail(user.getDoctorEmail());
        // Relationships
        if (user.getRole() == UserRole.PATIENT) {
            dto.setCaregiverEmails(user.getCaregivers().stream()
                    .map(User::getEmail).collect(java.util.stream.Collectors.toSet()));
        } else if (user.getRole() == UserRole.CAREGIVER) {
            dto.setPatientEmails(user.getPatients().stream()
                    .map(User::getEmail).collect(java.util.stream.Collectors.toSet()));
        }

        return dto;
    }
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Principal principal) {
        System.out.println("=== /me controller ===");
        System.out.println("Principal: " + principal);
        System.out.println("Principal name: " + (principal != null ? principal.getName() : "null"));

        String email = principal.getName();
        System.out.println("Email from principal: " + email);

        User user = userService.findByEmail(email);
        System.out.println("User found: " + user.getEmail());

        UserDto dto = mapToDto(user);
        System.out.println("DTO created: " + dto);

        ResponseEntity<UserDto> response = ResponseEntity.ok(dto);
        System.out.println("Returning response: " + response);
        return response;
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String idToken = request.get("idToken");
        try {
            GoogleIdToken.Payload payload = googleTokenVerifier.verifyToken(idToken);
            if (payload == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Google token");
            }
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            User user = userService.findOrCreateGoogleUser(email, name, pictureUrl);
            String jwt = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity.ok(new AuthResponse(jwt));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Google login failed");
        }
    }
}