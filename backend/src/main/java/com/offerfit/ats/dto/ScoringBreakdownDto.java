package com.offerfit.ats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringBreakdownDto {
    
    private Double skillsScore;
    private Double skillsWeight;
    private Double skillsContribution;
    private Integer matchedSkillsCount;
    private Integer totalRequiredSkills;
    
    private Double experienceScore;
    private Double experienceWeight;
    private Double experienceContribution;
    private String experienceDescription;
    
    private Double educationScore;
    private Double educationWeight;
    private Double educationContribution;
    private String educationDescription;
    
    private Double keywordsScore;
    private Double keywordsWeight;
    private Double keywordsContribution;
    private Integer matchedKeywordsCount;
    
    private Double conditionsScore;
    private Double conditionsWeight;
    private Double conditionsContribution;
    private String conditionsDescription;
    
    private Map<String, Object> details;
}
