package com.offerfit.ats.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingRequestDto {
    
    @NotBlank(message = "Job title is required")
    private String jobTitle;
    
    @NotEmpty(message = "Job requirements cannot be empty")
    private List<String> jobRequirements;
    
    private String jobDescription;
    
    private List<String> jobKeywords;
    
    @NotBlank(message = "Candidate name is required")
    private String candidateName;
    
    @NotEmpty(message = "Candidate skills cannot be empty")
    private List<String> candidateSkills;
    
    private String candidateExperience;
    
    private Integer candidateExperienceYears;
    
    private String candidateEducation;
    
    private List<String> candidateCertifications;
    
    private List<String> candidateKeywords;
    
    private String candidateSalaryExpectation;
    
    private List<String> candidatePreferredLocations;
}
