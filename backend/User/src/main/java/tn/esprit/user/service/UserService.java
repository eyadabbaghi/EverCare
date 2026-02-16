package tn.esprit.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.user.dto.*;
import tn.esprit.user.entity.User;
import tn.esprit.user.entity.UserRole;
import tn.esprit.user.repository.UserRepository;
import tn.esprit.user.security.JwtUtil;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Validate password strength
        if (!isStrongPassword(request.getPassword())) {
            throw new RuntimeException("Password must be at least 8 characters long, contain an uppercase letter, a digit, and a special character (!@#$%^&*)");
        }

        // Create user (only basic info)
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .isVerified(true) // For simplicity, auto-verify
                .build();

        userRepository.save(user);

        // Generate token
        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token);
    }

    private boolean isStrongPassword(String password) {
        return password.length() >= 8 &&
                password.matches(".*[A-Z].*") &&
                password.matches(".*[0-9].*") &&
                password.matches(".*[!@#$%^&*()].*");
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateUser(String email, UpdateUserRequest request) {
        User user = findByEmail(email);

        // Update common fields
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null && !request.getEmail().equals(email)) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getEmergencyContact() != null) {
            user.setEmergencyContact(request.getEmergencyContact());
        }
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }

        // Doctor-specific fields
        if (user.getRole() == UserRole.DOCTOR) {
            if (request.getYearsExperience() != null) {
                user.setYearsExperience(request.getYearsExperience());
            }
            if (request.getSpecialization() != null) {
                user.setSpecialization(request.getSpecialization());
            }
            if (request.getMedicalLicense() != null) {
                user.setMedicalLicense(request.getMedicalLicense());
            }
            if (request.getWorkplaceType() != null) {
                user.setWorkplaceType(request.getWorkplaceType());
            }
            if (request.getWorkplaceName() != null) {
                user.setWorkplaceName(request.getWorkplaceName());
            }
        }

        // Handle patient-caregiver relationship (toggle)
        if (request.getConnectedEmail() != null && !request.getConnectedEmail().isEmpty()) {
            User connectedUser = findByEmail(request.getConnectedEmail());

            if (user.getRole() == UserRole.PATIENT) {
                if (connectedUser.getRole() != UserRole.CAREGIVER) {
                    throw new RuntimeException("Connected email must belong to a caregiver");
                }
                if (user.getCaregivers().contains(connectedUser)) {
                    // Remove relationship
                    user.getCaregivers().remove(connectedUser);
                    connectedUser.getPatients().remove(user);
                } else {
                    // Add relationship
                    user.getCaregivers().add(connectedUser);
                    connectedUser.getPatients().add(user);
                }
                userRepository.save(connectedUser);
            } else if (user.getRole() == UserRole.CAREGIVER) {
                if (connectedUser.getRole() != UserRole.PATIENT) {
                    throw new RuntimeException("Connected email must belong to a patient");
                }
                if (user.getPatients().contains(connectedUser)) {
                    // Remove
                    user.getPatients().remove(connectedUser);
                    connectedUser.getCaregivers().remove(user);
                } else {
                    // Add
                    user.getPatients().add(connectedUser);
                    connectedUser.getCaregivers().add(user);
                }
                userRepository.save(connectedUser);
            } else {
                throw new RuntimeException("Only patients and caregivers can have connections");
            }
        }

        // Handle doctor assignment for patients (toggle)
        if (user.getRole() == UserRole.PATIENT) {
            if (request.getDoctorEmail() != null) {
                if (request.getDoctorEmail().isEmpty()) {
                    // Explicit removal with empty string
                    user.setDoctorEmail(null);
                } else {
                    User doctor = findByEmail(request.getDoctorEmail());
                    if (doctor.getRole() != UserRole.DOCTOR) {
                        throw new RuntimeException("Doctor email must belong to a doctor");
                    }
                    // If it's the same as current, remove; otherwise set
                    if (request.getDoctorEmail().equals(user.getDoctorEmail())) {
                        user.setDoctorEmail(null);
                    } else {
                        user.setDoctorEmail(doctor.getEmail());
                    }
                }
            }
        }

        return userRepository.save(user);
    }
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findByEmail(email);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        if (!isStrongPassword(request.getNewPassword())) {
            throw new RuntimeException("New password must be at least 8 characters long, contain an uppercase letter, a digit, and a special character (!@#$%^&*)");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String email) {
        User user = findByEmail(email);
        // Remove all relationships before deleting
        if (user.getRole() == UserRole.PATIENT) {
            for (User caregiver : user.getCaregivers()) {
                caregiver.getPatients().remove(user);
            }
            user.getCaregivers().clear();
        } else if (user.getRole() == UserRole.CAREGIVER) {
            for (User patient : user.getPatients()) {
                patient.getCaregivers().remove(user);
            }
            user.getPatients().clear();
        }
        userRepository.delete(user);
    }

    // Admin methods
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public User updateUserByAdmin(String userId, UpdateUserByAdminRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Similar cleanup as deleteUser
        if (user.getRole() == UserRole.PATIENT) {
            for (User caregiver : user.getCaregivers()) {
                caregiver.getPatients().remove(user);
            }
            user.getCaregivers().clear();
        } else if (user.getRole() == UserRole.CAREGIVER) {
            for (User patient : user.getPatients()) {
                patient.getCaregivers().remove(user);
            }
            user.getPatients().clear();
        }
        userRepository.delete(user);
    }

    public List<User> searchUsersByRole(String query, UserRole role) {
        return userRepository.searchByRoleAndQuery(query, role);
    }

    @Transactional
    public User findOrCreateGoogleUser(String email, String name, String pictureUrl) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // random password
                    .role(UserRole.PATIENT) // default role; you may later let them choose
                    .isVerified(true)
                    .profilePicture(pictureUrl)
                    .build();
            return userRepository.save(user);
        });
    }
}