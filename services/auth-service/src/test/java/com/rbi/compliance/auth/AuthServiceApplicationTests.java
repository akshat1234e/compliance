package com.rbi.compliance.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rbi.compliance.auth.controller.AuthController;
import com.rbi.compliance.auth.dto.LoginRequest;
import com.rbi.compliance.auth.dto.RegisterRequest;
import com.rbi.compliance.auth.entity.User;
import com.rbi.compliance.auth.repository.UserRepository;
import com.rbi.compliance.auth.service.AuthService;
import com.rbi.compliance.auth.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceApplicationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        // Clean up database
        userRepository.deleteAll();

        // Create test user
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setRole("USER");
        testUser.setEnabled(true);
        testUser.setCreatedAt(LocalDateTime.now());

        // Create test requests
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newuser");
        registerRequest.setEmail("newuser@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");

        loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");
    }

    @Test
    void contextLoads() {
        assertNotNull(authService);
        assertNotNull(userRepository);
        assertNotNull(passwordEncoder);
        assertNotNull(jwtService);
    }

    @Test
    void testUserRegistration_Success() {
        // When
        var result = authService.register(registerRequest);

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getToken());
        
        // Verify user is saved in database
        Optional<User> savedUser = userRepository.findByUsername("newuser");
        assertTrue(savedUser.isPresent());
        assertEquals("newuser@example.com", savedUser.get().getEmail());
        assertTrue(passwordEncoder.matches("password123", savedUser.get().getPassword()));
    }

    @Test
    void testUserRegistration_DuplicateUsername() {
        // Given
        userRepository.save(testUser);
        registerRequest.setUsername("testuser"); // Same as existing user

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            authService.register(registerRequest);
        });
    }

    @Test
    void testUserRegistration_DuplicateEmail() {
        // Given
        userRepository.save(testUser);
        registerRequest.setEmail("test@example.com"); // Same as existing user

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            authService.register(registerRequest);
        });
    }

    @Test
    void testUserLogin_Success() {
        // Given
        userRepository.save(testUser);

        // When
        var result = authService.login(loginRequest);

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getToken());
        assertEquals("testuser", result.getUsername());
        assertEquals("USER", result.getRole());
    }

    @Test
    void testUserLogin_InvalidCredentials() {
        // Given
        userRepository.save(testUser);
        loginRequest.setPassword("wrongpassword");

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authService.login(loginRequest);
        });
    }

    @Test
    void testUserLogin_UserNotFound() {
        // Given
        loginRequest.setUsername("nonexistentuser");

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });
    }

    @Test
    void testUserLogin_DisabledUser() {
        // Given
        testUser.setEnabled(false);
        userRepository.save(testUser);

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });
    }

    @Test
    void testJwtTokenGeneration() {
        // Given
        userRepository.save(testUser);

        // When
        String token = jwtService.generateToken(testUser.getUsername(), testUser.getRole());

        // Then
        assertNotNull(token);
        assertTrue(token.length() > 0);
        
        // Verify token can be validated
        assertTrue(jwtService.validateToken(token));
        assertEquals("testuser", jwtService.extractUsername(token));
        assertEquals("USER", jwtService.extractRole(token));
    }

    @Test
    void testJwtTokenExpiration() {
        // Given
        String token = jwtService.generateToken("testuser", "USER");

        // When
        boolean isValid = jwtService.validateToken(token);
        boolean isExpired = jwtService.isTokenExpired(token);

        // Then
        assertTrue(isValid);
        assertFalse(isExpired);
    }

    @Test
    void testPasswordEncoding() {
        // Given
        String plainPassword = "password123";

        // When
        String encodedPassword = passwordEncoder.encode(plainPassword);

        // Then
        assertNotNull(encodedPassword);
        assertNotEquals(plainPassword, encodedPassword);
        assertTrue(passwordEncoder.matches(plainPassword, encodedPassword));
        assertFalse(passwordEncoder.matches("wrongpassword", encodedPassword));
    }

    @Test
    void testUserRepository_FindByUsername() {
        // Given
        userRepository.save(testUser);

        // When
        Optional<User> found = userRepository.findByUsername("testuser");

        // Then
        assertTrue(found.isPresent());
        assertEquals("test@example.com", found.get().getEmail());
    }

    @Test
    void testUserRepository_FindByEmail() {
        // Given
        userRepository.save(testUser);

        // When
        Optional<User> found = userRepository.findByEmail("test@example.com");

        // Then
        assertTrue(found.isPresent());
        assertEquals("testuser", found.get().getUsername());
    }

    @Test
    void testUserRepository_ExistsByUsername() {
        // Given
        userRepository.save(testUser);

        // When & Then
        assertTrue(userRepository.existsByUsername("testuser"));
        assertFalse(userRepository.existsByUsername("nonexistent"));
    }

    @Test
    void testUserRepository_ExistsByEmail() {
        // Given
        userRepository.save(testUser);

        // When & Then
        assertTrue(userRepository.existsByEmail("test@example.com"));
        assertFalse(userRepository.existsByEmail("nonexistent@example.com"));
    }

    @Test
    void testUserEntity_Validation() {
        // Given
        User user = new User();

        // When & Then
        assertThrows(Exception.class, () -> {
            userRepository.save(user); // Should fail validation
        });
    }

    @Test
    void testUserEntity_TimestampGeneration() {
        // Given
        User user = new User();
        user.setUsername("timestamptest");
        user.setEmail("timestamp@example.com");
        user.setPassword("password");
        user.setRole("USER");
        user.setEnabled(true);

        // When
        User saved = userRepository.save(user);

        // Then
        assertNotNull(saved.getCreatedAt());
        assertNotNull(saved.getUpdatedAt());
    }

    @Test
    void testAuthService_GetUserProfile() {
        // Given
        userRepository.save(testUser);

        // When
        var profile = authService.getUserProfile("testuser");

        // Then
        assertNotNull(profile);
        assertEquals("testuser", profile.getUsername());
        assertEquals("test@example.com", profile.getEmail());
        assertEquals("USER", profile.getRole());
        assertNull(profile.getPassword()); // Password should not be exposed
    }

    @Test
    void testAuthService_UpdateUserProfile() {
        // Given
        userRepository.save(testUser);
        var updateRequest = new UpdateProfileRequest();
        updateRequest.setEmail("updated@example.com");

        // When
        var result = authService.updateUserProfile("testuser", updateRequest);

        // Then
        assertTrue(result.isSuccess());
        
        // Verify update in database
        Optional<User> updated = userRepository.findByUsername("testuser");
        assertTrue(updated.isPresent());
        assertEquals("updated@example.com", updated.get().getEmail());
    }

    @Test
    void testAuthService_ChangePassword() {
        // Given
        userRepository.save(testUser);
        var changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("password123");
        changePasswordRequest.setNewPassword("newpassword123");

        // When
        var result = authService.changePassword("testuser", changePasswordRequest);

        // Then
        assertTrue(result.isSuccess());
        
        // Verify password change
        Optional<User> updated = userRepository.findByUsername("testuser");
        assertTrue(updated.isPresent());
        assertTrue(passwordEncoder.matches("newpassword123", updated.get().getPassword()));
        assertFalse(passwordEncoder.matches("password123", updated.get().getPassword()));
    }

    @Test
    void testAuthService_ChangePassword_WrongCurrentPassword() {
        // Given
        userRepository.save(testUser);
        var changePasswordRequest = new ChangePasswordRequest();
        changePasswordRequest.setCurrentPassword("wrongpassword");
        changePasswordRequest.setNewPassword("newpassword123");

        // When & Then
        assertThrows(BadCredentialsException.class, () -> {
            authService.changePassword("testuser", changePasswordRequest);
        });
    }

    @Test
    void testAuthService_RefreshToken() {
        // Given
        userRepository.save(testUser);
        String originalToken = jwtService.generateToken("testuser", "USER");

        // When
        var result = authService.refreshToken(originalToken);

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getToken());
        assertNotEquals(originalToken, result.getToken());
    }

    @Test
    void testAuthService_LogoutUser() {
        // Given
        userRepository.save(testUser);
        String token = jwtService.generateToken("testuser", "USER");

        // When
        var result = authService.logout(token);

        // Then
        assertTrue(result.isSuccess());
        
        // Token should be invalidated (blacklisted)
        assertFalse(jwtService.validateToken(token));
    }

    // Helper classes for testing
    static class UpdateProfileRequest {
        private String email;
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
        
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
