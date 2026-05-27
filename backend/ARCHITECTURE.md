# Architecture Documentation

## System Design

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ User inputs: Job & Candidate data                       │    │
│  │ Displays: Match score, breakdown, recommendation        │    │
│  └──────────────────────────┬────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                 HTTP/JSON    │
              application/json │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SPRING BOOT BACKEND                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         MatchingController (REST Endpoint)             │    │
│  │  POST /api/v1/matching/analyze                         │    │
│  │  Validates input, returns MatchingResponseDto          │    │
│  └────────────────────┬─────────────────────────────────┘    │
│                       │                                        │
│  ┌────────────────────────────────────────────────────────┐    │
│  │       MatchingService (Orchestration Layer)            │    │
│  │  • Coordinates AI analysis and scoring                 │    │
│  │  • Handles error scenarios                             │    │
│  │  • Measures performance metrics                        │    │
│  └────────┬──────────────────┬──────────────────┬─────────┘    │
│           │                  │                  │               │
│      ┌────┴────┐        ┌────┴────┐     ┌──────┴──────┐       │
│      │          │        │         │     │             │       │
│  ┌───┴──────┐  │   ┌─────┴──────┐ │  ┌──┴──────────┐ │       │
│  │ AiClient │  │   │ScoringEngine│ │  │ObjectMapper│ │       │
│  └──────────┘  │   └─────────────┘ │  └─────────────┘ │       │
│                │                    │                  │       │
│  LAYER: External Integration      │ LAYER: Business Logic     │
│         & AI Communication           │ LAYER: Data Processing   │
│                                      │                         │
└─────────────────────────────────────────────────────────────────┘
        │                               │
        │                               │
        │ HTTP Request                  │ Internal Processing
        ↓                               │
┌──────────────────────┐                │
│   AI API Provider    │                │ (No external calls needed)
│ (DeepSeek/OpenAI)    │                │
└──────────────────────┘                │
```

## Component Architecture

### 1. **Controller Layer** (`MatchingController`)

**Responsibility:** HTTP endpoint handling

```
Request Validation
    ↓
Route to Service
    ↓
Format Response
    ↓
HTTP Status Code
```

Key features:
- Input validation (Spring `@Valid`)
- CORS support for frontend
- Error handling
- Structured responses

### 2. **Service Layer** (`MatchingService`)

**Responsibility:** Business logic orchestration

```
Step 1: Call AI Client
         ↓ (returns AiAnalysisDto)
Step 2: Call Scoring Engine
         ↓ (returns ScoringBreakdownDto)
Step 3: Format Response
         ↓ (returns MatchingResponseDto)
```

Key features:
- Coordinates workflow
- Performance measurement
- Error handling & fallback
- Transaction-like semantics

### 3. **AI Client** (`AiClient`)

**Responsibility:** External AI API integration

```
┌─────────────────────────────────────┐
│ buildAnalysisPrompt()               │
│ - Formats candidate & job data      │
│ - Creates structured prompt         │
│ - Instructs AI on output format     │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│ callAiApi()                         │
│ - Sends HTTP request to AI API      │
│ - Handles timeout (30s default)     │
│ - Parses JSON response              │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│ parseAiResponse()                   │
│ - Converts JSON to DTOs             │
│ - Validates response structure      │
│ - Handles parsing errors            │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│ buildFallbackAnalysis()             │
│ - Graceful degradation              │
│ - Returns basic analysis on error   │
└─────────────────────────────────────┘
```

**Prompt Strategy:**
- Instructs AI to return pure JSON (no markdown)
- Specifies exact output format
- Provides semantic matching rules
- Requests confidence levels

**Response Format Enforcement:**
```json
{
  "requirements": [...],
  "candidateSkills": [...],
  "matches": [
    {
      "requirement": "string",
      "candidateEvidence": "string",
      "matchLevel": "HIGH|MEDIUM|LOW|NONE",
      "reason": "string",
      "confidence": 0.0-1.0
    }
  ],
  "experienceMatch": 0-100,
  "educationMatch": 0-100,
  "strengths": [...],
  "weaknesses": [...],
  "summary": "string"
}
```

### 4. **Scoring Engine** (`ScoringEngine`)

**Responsibility:** Deterministic score calculation

```
INPUTS: AiAnalysisDto, job requirements, candidate experience
   ↓
[calculateSkillsScore]
   ↓ (0.40 weight)
   ├─ Count matches by level (HIGH=1.0, MEDIUM=0.7, LOW=0.4, NONE=0.0)
   ├─ Average match level
   ├─ Add bonus for partial matches
   ├─ Normalize to [0, 1]
   └─ skillsScore: 0.0-1.0

[calculateExperienceScore]
   ↓ (0.30 weight)
   ├─ Use AI assessment (0-100) → (0-1.0)
   ├─ Add bonus based on years (1yr=+0.1, 3yr=+0.2, 5yr=+0.3)
   ├─ Normalize to [0, 1]
   └─ experienceScore: 0.0-1.0

[calculateEducationScore]
   ↓ (0.10 weight)
   ├─ Use AI assessment (0-100) → (0-1.0)
   └─ educationScore: 0.0-1.0

[calculateKeywordsScore]
   ↓ (0.15 weight)
   ├─ Count job keywords in candidate evidence
   ├─ Divide by total keywords
   └─ keywordsScore: 0.0-1.0

[calculateConditionsScore]
   ↓ (0.05 weight)
   ├─ Check for critical missing requirements
   ├─ Penalize location/salary mismatches
   └─ conditionsScore: 0.0-1.0
   
   ↓
COMBINE: finalScore = 
  skillsScore × 0.40 +
  experienceScore × 0.30 +
  educationScore × 0.10 +
  keywordsScore × 0.15 +
  conditionsScore × 0.05
   ↓
OUTPUT: ScoringBreakdownDto (with full breakdown)
```

**Deterministic Formula:**

```python
def calculate_final_score(ai_analysis, job_req, cand_exp_years, job_kw):
    # 1. Skills Scoring
    match_scores = [m.match_level.score for m in ai_analysis.matches]
    avg_match = sum(match_scores) / len(match_scores) if match_scores else 0
    partial_bonus = min(0.2, len(ai_analysis.partial_matches) * 0.05)
    skills_score = min(1.0, avg_match + partial_bonus)
    
    # 2. Experience Scoring
    ai_exp_score = ai_analysis.experience_match / 100
    years_bonus = 0
    if cand_exp_years >= 5: years_bonus = 0.3
    elif cand_exp_years >= 3: years_bonus = 0.2
    elif cand_exp_years >= 1: years_bonus = 0.1
    experience_score = min(1.0, ai_exp_score + years_bonus)
    
    # 3. Education Scoring
    education_score = ai_analysis.education_match / 100
    
    # 4. Keywords Scoring
    matched_kw = count_matched_keywords(ai_analysis, job_kw)
    keywords_score = matched_kw / len(job_kw) if job_kw else 0.5
    
    # 5. Conditions Scoring
    critical_missing = count_critical_missing(ai_analysis)
    conditions_score = max(0.2, 1.0 - (critical_missing * 0.15))
    
    # Final combination
    final_score = (
        skills_score * 0.40 +
        experience_score * 0.30 +
        education_score * 0.10 +
        keywords_score * 0.15 +
        conditions_score * 0.05
    )
    
    return final_score, score_breakdown
```

### 5. **Data Flow** 

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND REQUEST                                            │
│ MatchingRequestDto {                                        │
│   jobTitle, jobRequirements, jobDescription,               │
│   jobKeywords, candidateName, candidateSkills,             │
│   candidateExperience, candidateExperienceYears,           │
│   candidateEducation, candidateCertifications              │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ MATCHING CONTROLLER                                         │
│ - Validates request                                         │
│ - Calls MatchingService                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ MATCHING SERVICE                                            │
│ - Calls AiClient.analyzeMatching()                          │
│ - Calls ScoringEngine.calculateScore()                      │
│ - Builds final response                                     │
└─────────────────────────────────────────────────────────────┘
          ↙                                          ↘
┌──────────────────────┐              ┌──────────────────────┐
│ AI CLIENT            │              │ SCORING ENGINE       │
│ buildAnalysisPrompt()│              │ calculateScore()     │
│ callAiApi()          │              │ getScoreLevel()      │
│ parseAiResponse()    │              │ getRecommendation()  │
└──────────────────────┘              └──────────────────────┘
          ↓                                        ↓
      ┌─────────────────────────────────────────────┐
      │ AiAnalysisDto                               │
      │ ├─ matches[]                                │
      │ ├─ missingRequirements[]                    │
      │ ├─ partialMatches[]                         │
      │ ├─ experienceMatch: 0-100                   │
      │ ├─ educationMatch: 0-100                    │
      │ ├─ strengths[]                              │
      │ └─ weaknesses[]                             │
      └─────────────────────────────────────────────┘
                          ↓
      ┌─────────────────────────────────────────────┐
      │ ScoringBreakdownDto                         │
      │ ├─ skillsScore, skillsWeight, skillsContrib │
      │ ├─ experienceScore, experienceWeight, ...   │
      │ ├─ educationScore, educationWeight, ...     │
      │ ├─ keywordsScore, keywordsWeight, ...       │
      │ ├─ conditionsScore, conditionsWeight, ...   │
      │ └─ details{}                                │
      └─────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ MATCHING RESPONSE DTO                                       │
│ {                                                           │
│   "finalScore": 0.88,                                       │
│   "scoreLevel": "VERY_GOOD",                                │
│   "recommendation": "Recommended for interview...",         │
│   "aiAnalysis": {...},                                      │
│   "scoringBreakdown": {...},                                │
│   "processingTimeMs": 2450,                                 │
│   "analyzedAt": "2026-05-22T14:35:22.123"                   │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND RESPONSE                                           │
│ (Displayed in UI)                                           │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
TRY to call AI API
  ↓
  ├─ SUCCESS → Parse JSON → AiAnalysisDto ✓
  │
  └─ TIMEOUT/ERROR → 
        ↓
        buildFallbackAnalysis()
        └─ Returns basic analysis with "AI unavailable" flag
```

Fallback behavior:
- Uses basic keyword matching
- Conservative score (50% for unknown factors)
- Marks analysis as fallback
- Still provides scoring breakdown

## Security Considerations

1. **Input Validation**
   - Required field validation
   - Length constraints
   - Null checks

2. **API Key Management**
   - Read from environment variable: `AI_API_KEY`
   - Never logged or exposed
   - Should be rotated periodically

3. **CORS Configuration**
   - Configured for `*` (development)
   - Should be restricted in production
   - Edit in `MatchingController.java`

4. **Error Responses**
   - Don't expose internal errors to frontend
   - Return 400/500 with generic messages
   - Log detailed errors on backend

## Performance Characteristics

### Time Complexity
- Request validation: O(n) where n = total input size
- AI analysis: O(1) from backend perspective (depends on AI API)
- Scoring: O(m) where m = number of matches/requirements
- **Total: Dominated by AI API call (~2-5 seconds)**

### Space Complexity
- Request: O(r + s) = requirements + skills
- Response: O(r × m) = requirements × matches depth
- **Typical request: 50-100 KB**
- **Typical response: 100-200 KB**

### Scalability
- Single instance: ~100-200 concurrent requests (with 2-5s latency each)
- Can add thread pool management if needed
- Consider async processing for batch operations
- No database = minimal resource overhead

## Configuration Management

### Environment Variables
```bash
AI_API_KEY          # Required: Your AI API key
AI_PROVIDER         # Optional: deepseek|openai|gemini
AI_MODEL            # Optional: Model name
AI_TIMEOUT          # Optional: Request timeout in seconds
SERVER_PORT         # Optional: Server port (default: 8080)
```

### Application Configuration
Located in `application.yml`:
- Server port: 8080
- Logging level: DEBUG for ATS package
- AI provider settings
- Jackson serialization options

### Profiles
Can create `application-prod.yml` for production:
- Disable debug logging
- Set longer timeouts
- Production AI API keys
- Custom scoring weights

## Testing Strategy

### Unit Tests (Recommended)
```
ScoringEngineTest
  - calculateSkillsScore()
  - calculateExperienceScore()
  - getScoreLevel()
  - getRecommendation()

AiClientTest
  - parseAiResponse()
  - buildAnalysisPrompt()
  - Error handling

MatchingServiceTest
  - analyzeAndScore() flow
  - Error scenarios
```

### Integration Tests
```
MatchingControllerTest
  - POST /api/v1/matching/analyze
  - Validation errors
  - Success scenarios
  - Error responses
```

### Load Testing
```
Simulate 50+ concurrent requests
Measure:
  - Response time percentiles (p50, p95, p99)
  - Error rate
  - AI API quota usage
  - Memory usage
```

## Deployment Architecture

### Development
```
IDE → mvn spring-boot:run → http://localhost:8080
```

### Staging/Production
```
┌──────────────────────────────────┐
│ Docker Container                 │
│ ┌────────────────────────────┐   │
│ │ Spring Boot Application    │   │
│ │ :8080                      │   │
│ │                            │   │
│ │ ├─ MatchingController      │   │
│ │ ├─ MatchingService         │   │
│ │ ├─ AiClient                │   │
│ │ └─ ScoringEngine           │   │
│ └────────────────────────────┘   │
└────────────────┬─────────────────┘
                 │
    ┌────────────┴────────────┐
    ↓                         ↓
┌─────────────┐        ┌─────────────┐
│   Frontend  │        │  AI API     │
│   (Next.js) │        │  (External) │
└─────────────┘        └─────────────┘
```

### Docker Example
```dockerfile
FROM openjdk:17-slim
WORKDIR /app
COPY target/ats-backend-1.0.0-SNAPSHOT.jar app.jar
ENV AI_API_KEY=${AI_API_KEY}
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Future Enhancements

1. **Database Integration**
   - Store analysis history
   - Track candidate-job pairs
   - Analytics dashboard

2. **Caching**
   - Redis for frequently matched skill combinations
   - Reduce AI API calls

3. **Async Processing**
   - Batch matching API
   - Event-driven architecture
   - WebSocket for long-running tasks

4. **ML Model Integration**
   - Learn from hiring decisions
   - Continuously improve weights
   - Feedback loop from HR team

5. **Multi-language Support**
   - Support multiple languages in input
   - Translate requirements/skills internally
   - Return results in original language

---

This architecture balances:
- ✅ **Transparency**: Full scoring breakdown visible
- ✅ **Accuracy**: AI-powered semantic analysis
- ✅ **Fairness**: Deterministic formulas (no black-box)
- ✅ **Performance**: Fast (<5 seconds)
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Scalability**: Can handle MVP and beyond
