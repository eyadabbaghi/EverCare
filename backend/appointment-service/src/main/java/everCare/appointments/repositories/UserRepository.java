package everCare.appointments.repositories;

import everCare.appointments.entities.User;
import everCare.appointments.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // ========== FIND BY BASIC FIELDS ==========

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    List<User> findByNameContainingIgnoreCase(String name);

    // ========== FIND BY ROLE ==========

    List<User> findByRole(UserRole role);

    List<User> findByRoleAndActiveTrue(UserRole role);

    // ========== FIND PATIENTS ==========

    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT'")
    List<User> findAllPatients();

    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT' AND u.alzheimerStage = :stage")
    List<User> findPatientsByAlzheimerStage(@Param("stage") String stage);

    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT' AND u.requiresCaregiver = true")
    List<User> findPatientsNeedingCaregiver();

    // ========== FIND DOCTORS ==========

    @Query("SELECT u FROM User u WHERE u.role = 'DOCTOR'")
    List<User> findAllDoctors();

    @Query("SELECT u FROM User u WHERE u.role = 'DOCTOR' AND u.specialty = :specialty")
    List<User> findDoctorsBySpecialty(@Param("specialty") String specialty);



    // ========== FIND CAREGIVERS ==========

    @Query("SELECT u FROM User u WHERE u.role = 'CAREGIVER'")
    List<User> findAllCaregivers();





    // ========== AUTHENTICATION ==========

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.password = :password")
    Optional<User> login(@Param("email") String email, @Param("password") String password);

    Optional<User> findByEmailAndPassword(String email, String password);

    // ========== VERIFICATION ==========

    List<User> findByIsVerifiedFalse();

    List<User> findByIsVerifiedTrue();

    // ========== ACTIVE/INACTIVE ==========

    List<User> findByActiveTrue();

    List<User> findByActiveFalse();

    // ========== RECENTLY CREATED ==========

    @Query("SELECT u FROM User u WHERE u.createdAt >= :since ORDER BY u.createdAt DESC")
    List<User> findRecentlyCreated(@Param("since") LocalDateTime since);

    // ========== SEARCH ==========

    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(@Param("keyword") String keyword);

    // ========== COUNT BY ROLE ==========

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") UserRole role);

    @Query("SELECT u.role, COUNT(u) FROM User u GROUP BY u.role")
    List<Object[]> countUsersByRole();

    // ========== BIRTHDAY ==========

    @Query("SELECT u FROM User u WHERE FUNCTION('MONTH', u.dateOfBirth) = :month AND FUNCTION('DAY', u.dateOfBirth) = :day")
    List<User> findUsersByBirthday(@Param("month") int month, @Param("day") int day);

    // ========== EMERGENCY CONTACT ==========

    List<User> findByEmergencyContactIsNotNull();

    // ========== CUSTOM QUERIES FOR ALZHEIMER PATIENTS ==========

    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT' AND u.alzheimerStage IS NOT NULL")
    List<User> findAllAlzheimerPatients();

    @Query("SELECT u FROM User u WHERE u.role = 'PATIENT' AND u.alzheimerStage = :stage AND u.requiresCaregiver = true")
    List<User> findAlzheimerPatientsByStageAndCaregiverRequired(@Param("stage") String stage);

    // ========== EXISTS CHECKS ==========

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

}