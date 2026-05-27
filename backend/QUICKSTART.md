# OfferFit ATS Backend - Quick Summary

## 🎯 What's Included

Production-ready Spring Boot backend for ATS (Applicant Tracking System) with:

✅ **Hybrid Architecture**
- AI-powered semantic analysis (extract skills, match them, set confidence)
- Deterministic scoring formula (no black-box)
- Full explainability (breakdown of every score component)

✅ **REST API**
- Single endpoint: `POST /api/v1/matching/analyze`
- Input: Job position + candidate profile
- Output: Match score (0-100%) + detailed breakdown

✅ **AI Integration**
- Supports DeepSeek, OpenAI, Gemini, or any OpenAI-compatible API
- Structured JSON prompting for consistent responses
- Graceful fallback if AI fails

✅ **Production Quality**
- Input validation
- Error handling
- Logging
- Performance metrics
- CORS support for frontend

## 📋 Project Structure

```
backend/
├── pom.xml                          # Maven dependencies
├── src/main/java/com/offerfit/ats/
│   ├── AtsApplication.java          # Main entry point
│   ├── client/AiClient.java         # AI API integration
│   ├── service/
│   │   ├── MatchingService.java     # Business logic orchestration
│   │   └── ScoringEngine.java       # Deterministic scoring
│   ├── controller/MatchingController.java  # REST endpoints
│   ├── dto/                         # Data transfer objects
│   │   ├── MatchingRequestDto.java
│   │   ├── MatchingResponseDto.java
│   │   ├── AiAnalysisDto.java
│   │   ├── ScoringBreakdownDto.java
│   │   ├── SkillMatchDto.java
│   │   └── PartialMatchDto.java
│   ├── model/MatchLevel.java        # Enum for match confidence levels
│   └── config/                      # Configuration classes
├── src/main/resources/application.yml
├── README.md                        # Full documentation
├── SETUP.md                         # Step-by-step setup guide
├── ARCHITECTURE.md                  # System design & flow diagrams
├── EXAMPLES.md                      # Test requests & responses
├── FRONTEND_INTEGRATION.md          # How to integrate with Next.js
├── run.sh / run.bat                 # Quick start scripts
└── .gitignore
```

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites
- Java 17+
- Maven 3.8+
- AI API Key (https://platform.deepseek.com - free to sign up)

### 2. Set API Key
```bash
# Windows
setx AI_API_KEY "your-deepseek-key"

# macOS/Linux
export AI_API_KEY="your-deepseek-key"
```

### 3. Run Backend
```bash
# Windows
run.bat

# macOS/Linux
bash run.sh

# Or directly
mvn spring-boot:run
```

### 4. Verify
```bash
curl http://localhost:8080/api/v1/matching/health
```

## 📡 API Endpoint

```
POST /api/v1/matching/analyze
Content-Type: application/json

Request:
{
  "jobTitle": "Senior Backend Engineer",
  "jobRequirements": ["Java", "Spring Boot", "Docker", "Kubernetes"],
  "candidateName": "Alice Johnson",
  "candidateSkills": ["Java", "Spring Boot", "Docker", "Kubernetes"],
  "candidateExperienceYears": 8
}

Response:
{
  "finalScore": 0.88,
  "scoreLevel": "VERY_GOOD",
  "recommendation": "Recommended for interview",
  "aiAnalysis": {
    "matches": [...],
    "missingRequirements": [],
    "strengths": [...],
    "summary": "..."
  },
  "scoringBreakdown": {
    "skillsScore": 0.92,
    "skillsContribution": 0.368,
    "experienceScore": 0.95,
    ...
  },
  "processingTimeMs": 3245
}
```

## 💡 How It Works

### Step 1: AI Semantic Analysis
```
Prompt AI with:
- Job requirements
- Candidate skills
- Request structured JSON output

AI Returns:
- Matched requirements (HIGH/MEDIUM/LOW/NONE)
- Missing requirements
- Confidence levels
- Summary & recommendations
```

### Step 2: Deterministic Scoring
```
finalScore = 
  skillsScore × 0.40        +
  experienceScore × 0.30    +
  educationScore × 0.10     +
  keywordsScore × 0.15      +
  conditionsScore × 0.05

Where:
- HIGH match = 1.0
- MEDIUM match = 0.7
- LOW match = 0.4
- NONE match = 0.0
```

### Step 3: Response Breakdown
```
Return to Frontend:
- Final score (0-100%)
- Score level (EXCELLENT/VERY_GOOD/GOOD/FAIR/POOR)
- Recommendation
- Full breakdown of each component
- AI analysis details
- Processing time
```

## 🎓 Use Cases

✅ **Filtering candidates** - Show only matches > 70%
✅ **Ranking candidates** - Sort by final score
✅ **Explainability** - Show hiring team why a candidate scored this way
✅ **Learning** - Collect feedback to improve scoring weights
✅ **MVP** - Deploy as-is for initial launch
✅ **Diploma project** - Show hybrid AI + deterministic approach

## 📊 Scoring Formula Explained

### Skills Score (40% weight)
- Average of all matched skill levels
- Bonus for partial matches
- Range: 0.0 - 1.0

### Experience Score (30% weight)
- AI assessment (0-100%) + years bonus
- 5+ years = +0.3 bonus
- Range: 0.0 - 1.0

### Education Score (10% weight)
- AI assessment of education level
- Range: 0.0 - 1.0

### Keywords Score (15% weight)
- Count of matched keywords / total keywords
- Range: 0.0 - 1.0

### Conditions Score (5% weight)
- Penalize for missing location/salary
- Range: 0.2 - 1.0 (minimum 0.2)

## 🔧 Customization

### Change Scoring Weights
Edit `ScoringEngine.java`:
```java
private static final double SKILLS_WEIGHT = 0.40;      // Change to 0.50
private static final double EXPERIENCE_WEIGHT = 0.30;  // Change to 0.25
...
```

### Change AI Provider
Edit `application.yml`:
```yaml
# DeepSeek (default)
ai:
  config:
    api-url: https://api.deepseek.com/v1/chat/completions
    model: deepseek-chat

# Or OpenAI
ai:
  config:
    api-url: https://api.openai.com/v1/chat/completions
    model: gpt-4

# Or Gemini
ai:
  config:
    api-url: https://generativelanguage.googleapis.com/v1beta/openai/
    model: gemini-2.0-flash
```

### Adjust AI Prompt
Edit `AiClient.buildAnalysisPrompt()` to customize:
- What skills to extract
- How to judge "semantic match"
- Confidence thresholds
- Output format

## 📚 Documentation

- **README.md** - Full API documentation & features
- **SETUP.md** - Step-by-step installation guide
- **ARCHITECTURE.md** - System design, data flow, performance
- **EXAMPLES.md** - Test requests, cURL commands, Python scripts
- **FRONTEND_INTEGRATION.md** - TypeScript types, React components, hooks

## 🚀 Next Steps

1. Follow **SETUP.md** to get backend running (5 mins)
2. Test API with examples in **EXAMPLES.md**
3. Integrate with frontend using **FRONTEND_INTEGRATION.md**
4. Read **ARCHITECTURE.md** to understand the system
5. Customize scoring weights for your use case

## 📦 What You Get

✅ Production-ready code (not just examples)
✅ Full type safety (Java + Spring Boot)
✅ Error handling & logging
✅ API validation
✅ CORS support
✅ Comprehensive documentation
✅ Easy customization

## 💻 Tech Stack

- **Framework**: Spring Boot 3.2
- **Language**: Java 17
- **Build**: Maven
- **HTTP**: WebClient (non-blocking)
- **Serialization**: Jackson
- **Validation**: Jakarta Bean Validation

## 📄 License

MIT - Use for educational and commercial projects

---

**Ready to go?** Start with [SETUP.md](./SETUP.md) 🚀
