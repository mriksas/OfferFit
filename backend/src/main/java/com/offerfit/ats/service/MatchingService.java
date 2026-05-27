package com.offerfit.ats.service;

import com.offerfit.ats.client.AiClient;
import com.offerfit.ats.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchingService {
    
    private final AiClient aiClient;
    private final ScoringEngine scoringEngine;
    
    public MatchingResponseDto analyzeAndScore(MatchingRequestDto request) {
        long startTime = System.currentTimeMillis();
        
        try {
            log.info("Starting matching analysis for: {} vs {}", 
                    request.getCandidateName(), request.getJobTitle());
            
            // Step 1: Get AI semantic analysis
            AiAnalysisDto aiAnalysis = aiClient.analyzeMatching(request);
            
            // Step 2: Calculate deterministic score
            ScoringBreakdownDto scoringBreakdown = scoringEngine.calculateScore(
                    aiAnalysis,
                    request.getJobRequirements(),
                    request.getCandidateExperienceYears(),
                    request.getJobKeywords(),
                    request.getCandidateSalaryExpectation()
            );
            
            // Step 3: Get final score
            Double finalScore = calculateFinalScore(scoringBreakdown);
            
            // Step 4: Get score level and recommendation
            String scoreLevel = scoringEngine.getScoreLevel(finalScore);
            String recommendation = scoringEngine.getRecommendation(
                    finalScore,
                    scoringBreakdown.getMatchedSkillsCount(),
                    scoringBreakdown.getTotalRequiredSkills()
            );
            
            long processingTime = System.currentTimeMillis() - startTime;
            
            MatchingResponseDto response = MatchingResponseDto.builder()
                    .candidateName(request.getCandidateName())
                    .jobTitle(request.getJobTitle())
                    .finalScore(Math.round(finalScore * 100.0) / 100.0)
                    .scoreLevel(scoreLevel)
                    .aiAnalysis(aiAnalysis)
                    .scoringBreakdown(scoringBreakdown)
                    .recommendation(recommendation)
                    .analyzedAt(LocalDateTime.now())
                    .processingTimeMs(processingTime)
                    .build();
            
            log.info("Analysis completed successfully in {}ms with score: {}", 
                    processingTime, finalScore);
            
            return response;
            
        } catch (Exception e) {
            log.error("Error during matching analysis", e);
            throw new RuntimeException("Failed to analyze matching: " + e.getMessage(), e);
        }
    }
    
    private Double calculateFinalScore(ScoringBreakdownDto breakdown) {
        return breakdown.getSkillsContribution()
                + breakdown.getExperienceContribution()
                + breakdown.getEducationContribution()
                + breakdown.getKeywordsContribution()
                + breakdown.getConditionsContribution();
    }
}
