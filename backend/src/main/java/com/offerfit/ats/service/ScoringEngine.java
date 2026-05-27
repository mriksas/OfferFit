package com.offerfit.ats.service;

import com.offerfit.ats.dto.AiAnalysisDto;
import com.offerfit.ats.dto.ScoringBreakdownDto;
import com.offerfit.ats.dto.SkillMatchDto;
import com.offerfit.ats.model.MatchLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ScoringEngine {
    
    // Scoring weights
    private static final double SKILLS_WEIGHT = 0.40;
    private static final double EXPERIENCE_WEIGHT = 0.30;
    private static final double EDUCATION_WEIGHT = 0.10;
    private static final double KEYWORDS_WEIGHT = 0.15;
    private static final double CONDITIONS_WEIGHT = 0.05;
    
    public ScoringBreakdownDto calculateScore(AiAnalysisDto aiAnalysis, 
                                               List<String> jobRequirements,
                                               Integer candidateExperienceYears,
                                               List<String> jobKeywords,
                                               String candidateSalaryExpectation) {
        
        log.info("Calculating score based on AI analysis");
        
        // 1. Skills Score (0.40 weight)
        Double skillsScore = calculateSkillsScore(aiAnalysis);
        Integer matchedSkills = (int) aiAnalysis.getMatches().stream()
                .filter(m -> m.getMatchLevel() == MatchLevel.HIGH || m.getMatchLevel() == MatchLevel.MEDIUM)
                .count();
        Integer totalSkills = jobRequirements.size();
        
        // 2. Experience Score (0.30 weight)
        Double experienceScore = calculateExperienceScore(
                aiAnalysis.getExperienceMatch(),
                candidateExperienceYears
        );
        
        // 3. Education Score (0.10 weight)
        Double educationScore = calculateEducationScore(aiAnalysis.getEducationMatch());
        
        // 4. Keywords Score (0.15 weight)
        Double keywordsScore = calculateKeywordsScore(aiAnalysis, jobKeywords);
        
        // 5. Conditions Score (0.05 weight)
        Double conditionsScore = calculateConditionsScore(aiAnalysis);
        
        // Calculate contributions
        Double skillsContribution = skillsScore * SKILLS_WEIGHT;
        Double experienceContribution = experienceScore * EXPERIENCE_WEIGHT;
        Double educationContribution = educationScore * EDUCATION_WEIGHT;
        Double keywordsContribution = keywordsScore * KEYWORDS_WEIGHT;
        Double conditionsContribution = conditionsScore * CONDITIONS_WEIGHT;
        
        // Final Score
        Double finalScore = skillsContribution + experienceContribution + educationContribution + 
                           keywordsContribution + conditionsContribution;
        
        log.info("Scores calculated - Skills: {}, Experience: {}, Education: {}, Keywords: {}, Conditions: {}, Final: {}",
                skillsScore, experienceScore, educationScore, keywordsScore, conditionsScore, finalScore);
        
        return ScoringBreakdownDto.builder()
                .skillsScore(skillsScore)
                .skillsWeight(SKILLS_WEIGHT)
                .skillsContribution(skillsContribution)
                .matchedSkillsCount(matchedSkills)
                .totalRequiredSkills(totalSkills)
                
                .experienceScore(experienceScore)
                .experienceWeight(EXPERIENCE_WEIGHT)
                .experienceContribution(experienceContribution)
                .experienceDescription(buildExperienceDescription(aiAnalysis.getExperienceMatch(), candidateExperienceYears))
                
                .educationScore(educationScore)
                .educationWeight(EDUCATION_WEIGHT)
                .educationContribution(educationContribution)
                .educationDescription(buildEducationDescription(aiAnalysis.getEducationMatch()))
                
                .keywordsScore(keywordsScore)
                .keywordsWeight(KEYWORDS_WEIGHT)
                .keywordsContribution(keywordsContribution)
                .matchedKeywordsCount(countMatchedKeywords(aiAnalysis))
                
                .conditionsScore(conditionsScore)
                .conditionsWeight(CONDITIONS_WEIGHT)
                .conditionsContribution(conditionsContribution)
                .conditionsDescription("Salary and location conditions match")
                
                .details(Map.of(
                        "missingRequirements", aiAnalysis.getMissingRequirements().size(),
                        "partialMatches", aiAnalysis.getPartialMatches().size(),
                        "strengths", aiAnalysis.getStrengths().size(),
                        "weaknesses", aiAnalysis.getWeaknesses().size()
                ))
                
                .build();
    }
    
    /**
     * Skills Score: Based on matched requirements vs total requirements
     * HIGH match = 1.0, MEDIUM = 0.7, LOW = 0.4, NONE = 0.0
     */
    private Double calculateSkillsScore(AiAnalysisDto aiAnalysis) {
        if (aiAnalysis.getMatches().isEmpty()) {
            return 0.0;
        }
        
        double totalScore = aiAnalysis.getMatches().stream()
                .mapToDouble(match -> match.getMatchLevel().getScore())
                .sum();
        
        double averageScore = totalScore / aiAnalysis.getMatches().size();
        
        // Add bonus for partial matches (up to 0.2 bonus)
        double partialBonus = Math.min(0.2, aiAnalysis.getPartialMatches().size() * 0.05);
        
        double finalScore = Math.min(1.0, averageScore + partialBonus);
        
        return Math.round(finalScore * 100.0) / 100.0;
    }
    
    /**
     * Experience Score: Combines AI assessment with years of experience
     * AI match (0-100) + years bonus
     */
    private Double calculateExperienceScore(Integer aiExperienceMatch, Integer experienceYears) {
        double aiScore = (aiExperienceMatch != null ? aiExperienceMatch : 50) / 100.0;
        
        // Years bonus: up to +0.3 for 5+ years
        double yearsBonus = 0.0;
        if (experienceYears != null) {
            if (experienceYears >= 5) yearsBonus = 0.3;
            else if (experienceYears >= 3) yearsBonus = 0.2;
            else if (experienceYears >= 1) yearsBonus = 0.1;
        }
        
        double finalScore = Math.min(1.0, aiScore + yearsBonus);
        return Math.round(finalScore * 100.0) / 100.0;
    }
    
    /**
     * Education Score: Based on AI assessment of education level
     */
    private Double calculateEducationScore(Integer educationMatch) {
        double score = (educationMatch != null ? educationMatch : 50) / 100.0;
        return Math.round(score * 100.0) / 100.0;
    }
    
    /**
     * Keywords Score: How many job keywords are mentioned in candidate profile
     */
    private Double calculateKeywordsScore(AiAnalysisDto aiAnalysis, List<String> jobKeywords) {
        if (jobKeywords == null || jobKeywords.isEmpty()) {
            return 0.5;
        }
        
        // Count how many job keywords appear in matches and candidate skills
        Set<String> allEvidence = new HashSet<>(aiAnalysis.getCandidateSkills());
        aiAnalysis.getMatches().forEach(m -> allEvidence.add(m.getCandidateEvidence()));
        aiAnalysis.getPartialMatches().forEach(m -> allEvidence.add(m.getCandidateEvidence()));
        
        long matchingKeywords = jobKeywords.stream()
                .filter(keyword -> allEvidence.stream()
                        .anyMatch(evidence -> evidence.toLowerCase().contains(keyword.toLowerCase())))
                .count();
        
        double score = (double) matchingKeywords / jobKeywords.size();
        return Math.round(score * 100.0) / 100.0;
    }
    
    /**
     * Conditions Score: Location, salary, employment type match
     * Based on missing requirements that are critical
     */
    private Double calculateConditionsScore(AiAnalysisDto aiAnalysis) {
        // If no critical missing requirements, score is high
        long criticalMissing = aiAnalysis.getMissingRequirements().stream()
                .filter(req -> req.toLowerCase().matches(".*(?:location|salary|type|employment).*"))
                .count();
        
        double score = Math.max(0.2, 1.0 - (criticalMissing * 0.15));
        return Math.round(score * 100.0) / 100.0;
    }
    
    private int countMatchedKeywords(AiAnalysisDto aiAnalysis) {
        return (int) aiAnalysis.getMatches().stream()
                .filter(m -> m.getMatchLevel() == MatchLevel.HIGH)
                .count();
    }
    
    private String buildExperienceDescription(Integer aiMatch, Integer years) {
        if (years == null || years == 0) {
            return "Experience match: " + (aiMatch != null ? aiMatch : 50) + "% (years not specified)";
        }
        return String.format("Experience match: %d%% (%d years of relevant experience)",
                aiMatch != null ? aiMatch : 50, years);
    }
    
    private String buildEducationDescription(Integer educationMatch) {
        if (educationMatch == null) educationMatch = 50;
        if (educationMatch >= 90) return "Education: Excellent match";
        if (educationMatch >= 70) return "Education: Good match";
        if (educationMatch >= 50) return "Education: Acceptable match";
        return "Education: Limited match";
    }
    
    public String getScoreLevel(Double finalScore) {
        if (finalScore >= 0.85) return "EXCELLENT";
        if (finalScore >= 0.70) return "VERY_GOOD";
        if (finalScore >= 0.55) return "GOOD";
        if (finalScore >= 0.40) return "FAIR";
        if (finalScore >= 0.25) return "POOR";
        return "VERY_POOR";
    }
    
    public String getRecommendation(Double finalScore, Integer matchedSkills, Integer totalSkills) {
        String scoreLevel = getScoreLevel(finalScore);
        
        switch (scoreLevel) {
            case "EXCELLENT" ->
                    { return "Highly recommended for interview - Strong match across all criteria"; }
            case "VERY_GOOD" ->
                    { return "Recommended for interview - Solid match for the position"; }
            case "GOOD" ->
                    { return "Consider for interview - Reasonable match, worth exploring"; }
            case "FAIR" ->
                    { return "Not recommended - Some critical gaps in requirements"; }
            case "POOR" ->
                    { return "Not recommended - Limited fit for the position"; }
            default ->
                    { return "Not recommended - Does not meet minimum requirements"; }
        }
    }
}
