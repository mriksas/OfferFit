package com.offerfit.ats.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.offerfit.ats.config.AiConfigProperties;
import com.offerfit.ats.dto.AiAnalysisDto;
import com.offerfit.ats.dto.MatchingRequestDto;
import com.offerfit.ats.dto.PartialMatchDto;
import com.offerfit.ats.dto.SkillMatchDto;
import com.offerfit.ats.model.MatchLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiClient {
    
    private final WebClient webClient;
    private final AiConfigProperties aiConfig;
    private final ObjectMapper objectMapper;
    
    public AiAnalysisDto analyzeMatching(MatchingRequestDto request) {
        try {
            log.info("Calling AI for semantic analysis: {} -> {}", 
                    request.getCandidateName(), request.getJobTitle());
            
            String prompt = buildAnalysisPrompt(request);
            log.info("AI analysis prompt built; sending request to AI provider");
            String aiResponse = callAiApi(prompt);
            
            AiAnalysisDto analysis = parseAiResponse(aiResponse, request);
            log.info("AI analysis completed successfully");
            
            return analysis;
        } catch (Exception e) {
            log.error("Error during AI analysis", e);
            return buildFallbackAnalysis(request);
        }
    }
    
    private String buildAnalysisPrompt(MatchingRequestDto request) {
        return String.format("""
                Analyze the match between a candidate and a job position.
                Return structured JSON with EXACTLY this format (no markdown, no code blocks, pure JSON):
                
                {
                  "requirements": ["req1", "req2"],
                  "candidateSkills": ["skill1", "skill2"],
                  "matches": [
                    {
                      "requirement": "string",
                      "candidateEvidence": "string",
                      "matchLevel": "HIGH|MEDIUM|LOW|NONE",
                      "reason": "string",
                      "confidence": 0.95
                    }
                  ],
                  "missingRequirements": ["missing1"],
                  "partialMatches": [
                    {
                      "requirement": "string",
                      "candidateEvidence": "string",
                      "reason": "string",
                      "relevanceScore": 0.6
                    }
                  ],
                  "experienceMatch": 85,
                  "educationMatch": 90,
                  "strengths": ["strength1"],
                  "weaknesses": ["weakness1"],
                  "summary": "Brief summary"
                }
                
                Job Title: %s
                Job Requirements: %s
                Job Description: %s
                Job Keywords: %s
                
                Candidate Name: %s
                Candidate Skills: %s
                Candidate Experience: %s
                Candidate Experience Years: %d
                Candidate Education: %s
                Candidate Certifications: %s
                Candidate Keywords: %s
                
                Rules:
                1. HIGH = exact or strong semantic match
                2. MEDIUM = related skill or partial match
                3. LOW = tangentially related
                4. NONE = not mentioned or contradictory
                5. Match levels based on semantic similarity, not just keyword matching
                6. Consider synonyms and related technologies
                7. Be fair but strict in assessment
                """,
                request.getJobTitle(),
                String.join(", ", request.getJobRequirements()),
                request.getJobDescription() != null ? request.getJobDescription() : "N/A",
                request.getJobKeywords() != null ? String.join(", ", request.getJobKeywords()) : "N/A",
                request.getCandidateName(),
                String.join(", ", request.getCandidateSkills()),
                request.getCandidateExperience() != null ? request.getCandidateExperience() : "N/A",
                request.getCandidateExperienceYears() != null ? request.getCandidateExperienceYears() : 0,
                request.getCandidateEducation() != null ? request.getCandidateEducation() : "N/A",
                request.getCandidateCertifications() != null ? String.join(", ", request.getCandidateCertifications()) : "N/A",
                request.getCandidateKeywords() != null ? String.join(", ", request.getCandidateKeywords()) : "N/A"
        );
    }
    
    private String callAiApi(String prompt) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiConfig.getModel());
        requestBody.put("temperature", aiConfig.getTemperature());
        requestBody.put("max_tokens", aiConfig.getMaxTokens());
        requestBody.put("messages", List.of(
                Map.of("role", "user", "content", prompt)
        ));
        
        boolean configKeyLoaded = aiConfig.getApiKey() != null && !aiConfig.getApiKey().isBlank();
        boolean envKeyLoaded = System.getenv("AI_API_KEY") != null && !System.getenv("AI_API_KEY").isBlank();
        boolean envConfigKeyLoaded = System.getenv("AI_CONFIG_API_KEY") != null && !System.getenv("AI_CONFIG_API_KEY").isBlank();
        log.info("Sending request to AI API: {} (config key loaded={}, env AI_API_KEY={}, env AI_CONFIG_API_KEY={})",
                aiConfig.getApiUrl(), configKeyLoaded, envKeyLoaded, envConfigKeyLoaded);
        
        String response = webClient.post()
                .uri(aiConfig.getApiUrl())
                .header("Authorization", "Bearer " + aiConfig.getApiKey())
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(aiConfig.getRequestTimeoutSeconds()))
                .block();
        
        if (response == null) {
            log.warn("AI API returned null response");
            throw new IllegalStateException("AI API returned null response");
        }
        log.info("Received response from AI API");
        return extractContent(response);
    }
    
    private String extractContent(String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        JsonNode content = root.path("choices")
                .get(0)
                .path("message")
                .path("content");
        
        String text = content.asText();
        
        // Remove markdown code blocks if present
        if (text.contains("```json")) {
            text = text.replace("```json", "").replace("```", "");
        } else if (text.contains("```")) {
            text = text.replaceAll("```[\\s\\S]*?```", "");
        }
        
        return text.trim();
    }
    
    private AiAnalysisDto parseAiResponse(String jsonResponse, MatchingRequestDto request) {
        try {
            JsonNode node = objectMapper.readTree(jsonResponse);
            
            List<SkillMatchDto> matches = parseMatches(node.path("matches"));
            List<PartialMatchDto> partialMatches = parsePartialMatches(node.path("partialMatches"));
            List<String> missingRequirements = parseStringList(node.path("missingRequirements"));
            List<String> strengths = parseStringList(node.path("strengths"));
            List<String> weaknesses = parseStringList(node.path("weaknesses"));
            
            return AiAnalysisDto.builder()
                    .requirements(parseStringList(node.path("requirements")))
                    .candidateSkills(parseStringList(node.path("candidateSkills")))
                    .matches(matches)
                    .missingRequirements(missingRequirements)
                    .partialMatches(partialMatches)
                    .experienceMatch(node.path("experienceMatch").asInt(0))
                    .educationMatch(node.path("educationMatch").asInt(0))
                    .strengths(strengths)
                    .weaknesses(weaknesses)
                    .summary(node.path("summary").asText("Analysis completed"))
                    .build();
        } catch (Exception e) {
            log.error("Error parsing AI response: {}", jsonResponse, e);
            return buildFallbackAnalysis(request);
        }
    }
    
    private List<SkillMatchDto> parseMatches(JsonNode matchesNode) {
        List<SkillMatchDto> matches = new ArrayList<>();
        if (matchesNode.isArray()) {
            matchesNode.forEach(match -> {
                try {
                    matches.add(SkillMatchDto.builder()
                            .requirement(match.path("requirement").asText())
                            .candidateEvidence(match.path("candidateEvidence").asText())
                            .matchLevel(MatchLevel.valueOf(match.path("matchLevel").asText("NONE")))
                            .reason(match.path("reason").asText())
                            .confidence(match.path("confidence").asDouble(0.8))
                            .build());
                } catch (Exception e) {
                    log.warn("Error parsing match: {}", match, e);
                }
            });
        }
        return matches;
    }
    
    private List<PartialMatchDto> parsePartialMatches(JsonNode partialNode) {
        List<PartialMatchDto> partials = new ArrayList<>();
        if (partialNode.isArray()) {
            partialNode.forEach(partial -> {
                try {
                    partials.add(PartialMatchDto.builder()
                            .requirement(partial.path("requirement").asText())
                            .candidateEvidence(partial.path("candidateEvidence").asText())
                            .reason(partial.path("reason").asText())
                            .relevanceScore(partial.path("relevanceScore").asDouble(0.5))
                            .build());
                } catch (Exception e) {
                    log.warn("Error parsing partial match: {}", partial, e);
                }
            });
        }
        return partials;
    }
    
    private List<String> parseStringList(JsonNode node) {
        if (!node.isArray()) {
            return new ArrayList<>();
        }
        return StreamSupport.stream(node.spliterator(), false)
                .map(JsonNode::asText)
                .collect(Collectors.toList());
    }
    
    private AiAnalysisDto buildFallbackAnalysis(MatchingRequestDto request) {
        log.info("Building fallback analysis due to AI error");
        return AiAnalysisDto.builder()
                .requirements(request.getJobRequirements())
                .candidateSkills(request.getCandidateSkills())
                .matches(new ArrayList<>())
                .missingRequirements(request.getJobRequirements())
                .partialMatches(new ArrayList<>())
                .experienceMatch(50)
                .educationMatch(50)
                .strengths(List.of("Fallback mode"))
                .weaknesses(List.of("AI analysis unavailable"))
                .summary("AI service unavailable, using fallback analysis")
                .build();
    }
}
