package com.Campus.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class HelloController {

    @GetMapping("/")
    public String home() {
        return "Campus Marketplace Backend is running!";
    }

    @GetMapping("/api/test")
    public String test() {
        return "Frontend connected to backend successfully!";
    }
}
