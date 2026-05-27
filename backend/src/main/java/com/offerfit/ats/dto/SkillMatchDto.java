package com.offerfit.ats.dto;

import com.offerfit.ats.model.MatchLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillMatchDto {
    
    private String requirement;
    
    private String candidateEvidence;
    
    private MatchLevel matchLevel;
    
    private String reason;
    
    private Double confidence;
}
