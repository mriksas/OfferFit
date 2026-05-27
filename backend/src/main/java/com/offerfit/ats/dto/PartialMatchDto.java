package com.offerfit.ats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartialMatchDto {
    
    private String requirement;
    
    private String candidateEvidence;
    
    private String reason;
    
    private Double relevanceScore;
}
