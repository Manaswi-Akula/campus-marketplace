
package com.Campus.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5174")
public class AuthController {

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, String>> signup(
            @RequestBody SignupRequest request) {

        if (request.fullName == null || request.fullName.isBlank()
                || request.email == null || request.email.isBlank()
                || request.password == null || request.password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message",
                    "Enter your name and email, and use a password of at least 8 characters."
            ));
        }

        String email = request.email.trim().toLowerCase();

        if (studentRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "message", "This email is already registered."
            ));
        }

        Student student = new Student(
                request.fullName.trim(),
                email,
                passwordEncoder.encode(request.password)
        );

        studentRepository.save(student);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Account created successfully!"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(
            @RequestBody LoginRequest request) {

        if (request.email == null || request.password == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Email and password are required."
            ));
        }

        String email = request.email.trim().toLowerCase();

        Student student = studentRepository.findByEmail(email).orElse(null);

        if (student == null || !passwordEncoder.matches(
                request.password, student.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "message", "Invalid email or password."
            ));
        }

        return ResponseEntity.ok().body(Map.of(
                "message", "Login successful! Welcome, " + student.getFullName() + "!",
                "fullName", student.getFullName(),
                "email", student.getEmail()
        ));
    }

    public static class LoginRequest {
        public String email;
        public String password;
    }

    public static class SignupRequest {
        public String fullName;
        public String email;
        public String password;
    }
}

