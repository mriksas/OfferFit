package com.offerfit.ats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResponseDto {
    
    private String candidateName;
    
    private String jobTitle;
    
    private Double finalScore;
    
    private String scoreLevel;
    
    private AiAnalysisDto aiAnalysis;
    
    private ScoringBreakdownDto scoringBreakdown;
    
    private String recommendation;
    
    private LocalDateTime analyzedAt;
    
    private Long processingTimeMs;
}
