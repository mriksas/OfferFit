package com.offerfit.ats.controller;

import com.offerfit.ats.dto.MatchingRequestDto;
import com.offerfit.ats.dto.MatchingResponseDto;
import com.offerfit.ats.service.MatchingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/matching")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class MatchingController {
    
    private final MatchingService matchingService;
    
    @PostMapping("/analyze")
    public ResponseEntity<MatchingResponseDto> analyzeMatching(
            @Valid @RequestBody MatchingRequestDto request) {
        
        log.info("Received matching analysis request for: {} vs {}", 
                request.getCandidateName(), request.getJobTitle());
        
        try {
            MatchingResponseDto response = matchingService.analyzeAndScore(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing matching request", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .build();
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("ATS Backend is running");
    }
}
