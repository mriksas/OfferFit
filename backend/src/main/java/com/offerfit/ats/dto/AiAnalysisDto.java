package com.offerfit.ats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisDto {
    
    private List<String> requirements;
    
    private List<String> candidateSkills;
    
    private List<SkillMatchDto> matches;
    
    private List<String> missingRequirements;
    
    private List<PartialMatchDto> partialMatches;
    
    private String summary;
    
    private Integer experienceMatch;
    
    private Integer educationMatch;
    
    private List<String> strengths;
    
    private List<String> weaknesses;

}
