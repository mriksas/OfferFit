# OfferFit ATS Backend

Production-ready Spring Boot backend для ATS-системы с гибридной архитектурой: AI-powered semantic matching + deterministic scoring.

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ POST /api/v1/matching/analyze
                     │ (MatchingRequestDto)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   MatchingController                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    MatchingService                           │
│         (Orchestrates AI + Scoring workflow)                 │
└────────┬────────────────────────────────────┬────────────────┘
         │                                    │
         ↓                                    ↓
    ┌────────────┐                   ┌──────────────────┐
    │  AiClient  │                   │ ScoringEngine    │
    │            │                   │                  │
    │ Semantic   │                   │ Deterministic    │
    │ Analysis   │                   │ Formula:         │
    │            │                   │                  │
    │ - Extract  │                   │ finalScore =     │
    │   reqs     │                   │   skills*0.40 +  │
    │ - Extract  │                   │   exp*0.30 +     │
    │   skills   │                   │   edu*0.10 +     │
    │ - Match    │                   │   kw*0.15 +      │
    │   them     │                   │   cond*0.05      │
    │ - Set      │                   │                  │
    │   levels   │                   │ Returns detailed │
    │            │                   │ breakdown        │
    └────┬───────┘                   └──────┬───────────┘
         │                                   │
         │ AiAnalysisDto                     │ ScoringBreakdownDto
         └───────────────┬───────────────────┘
                         │
                         ↓
           ┌──────────────────────────┐
           │ MatchingResponseDto      │
           │                          │
           │ - finalScore: 0.75       │
           │ - scoreLevel: VERY_GOOD  │
           │ - aiAnalysis             │
           │ - scoringBreakdown       │
           │ - recommendation         │
           │ - processingTime         │
           └──────────────────────────┘
                         │
                         ↓ JSON
                    Frontend
```

## 🔄 Workflow

### 1. **Request (Frontend → Backend)**

```json
POST /api/v1/matching/analyze
Content-Type: application/json

{
  "jobTitle": "Senior Backend Engineer",
  "jobRequirements": [
    "Java/Spring Boot",
    "Microservices",
    "SQL & NoSQL",
    "Docker & Kubernetes",
    "5+ years experience"
  ],
  "jobDescription": "We are looking for...",
  "jobKeywords": ["cloud", "scalability", "performance"],
  
  "candidateName": "John Doe",
  "candidateSkills": [
    "Java", "Spring Boot", "AWS",
    "PostgreSQL", "Docker", "Kubernetes"
  ],
  "candidateExperience": "8 years backend development",
  "candidateExperienceYears": 8,
  "candidateEducation": "BS Computer Science",
  "candidateCertifications": ["AWS Solutions Architect"],
  "candidateKeywords": ["microservices", "performance optimization"]
}
```

### 2. **AI Semantic Analysis**

Backend отправляет запрос к AI API (DeepSeek/OpenAI/Gemini):

```json
{
  "model": "deepseek-chat",
  "temperature": 0.3,
  "max_tokens": 4000,
  "messages": [
    {
      "role": "user",
      "content": "Analyze match between candidate and job...[full prompt]"
    }
  ]
}
```

AI возвращает структурированный JSON:

```json
{
  "requirements": ["Java/Spring Boot", "Microservices", "SQL & NoSQL", ...],
  "candidateSkills": ["Java", "Spring Boot", "AWS", ...],
  "matches": [
    {
      "requirement": "Java/Spring Boot",
      "candidateEvidence": "Java, Spring Boot",
      "matchLevel": "HIGH",
      "reason": "Exact match - candidate has proven Spring Boot experience",
      "confidence": 0.98
    },
    {
      "requirement": "Docker & Kubernetes",
      "candidateEvidence": "Docker, Kubernetes",
      "matchLevel": "HIGH",
      "reason": "Direct match - both explicitly mentioned",
      "confidence": 0.95
    }
  ],
  "missingRequirements": [],
  "partialMatches": [],
  "experienceMatch": 95,
  "educationMatch": 90,
  "strengths": ["Strong technical skills", "Relevant experience"],
  "weaknesses": [],
  "summary": "Excellent match for the role"
}
```

### 3. **Deterministic Scoring**

Backend конвертирует MatchLevel → Score:
- **HIGH** = 1.0 (full match)
- **MEDIUM** = 0.7 (partial match)
- **LOW** = 0.4 (weak match)
- **NONE** = 0.0 (no match)

Формула расчета:

```
finalScore = 
    skillsScore × 0.40          +
    experienceScore × 0.30      +
    educationScore × 0.10       +
    keywordsScore × 0.15        +
    conditionsScore × 0.05

где:
  skillsScore = avg(matchLevels) + partialMatchBonus
  experienceScore = aiMatch/100 + yearsBonus
  educationScore = aiEducationMatch/100
  keywordsScore = matchedKeywords/totalKeywords
  conditionsScore = 1.0 - (criticalMissing × 0.15)
```

### 4. **Response (Backend → Frontend)**

```json
{
  "candidateName": "John Doe",
  "jobTitle": "Senior Backend Engineer",
  "finalScore": 0.88,
  "scoreLevel": "VERY_GOOD",
  "recommendation": "Recommended for interview - Solid match for the position",
  "analyzedAt": "2026-05-22T10:30:15",
  "processingTimeMs": 2450,
  
  "aiAnalysis": {
    "requirements": [...],
    "candidateSkills": [...],
    "matches": [...],
    "missingRequirements": [],
    "partialMatches": [],
    "experienceMatch": 95,
    "educationMatch": 90,
    "strengths": ["Strong technical skills"],
    "weaknesses": []
  },
  
  "scoringBreakdown": {
    "skillsScore": 0.92,
    "skillsWeight": 0.40,
    "skillsContribution": 0.368,
    "matchedSkillsCount": 6,
    "totalRequiredSkills": 6,
    
    "experienceScore": 0.95,
    "experienceWeight": 0.30,
    "experienceContribution": 0.285,
    "experienceDescription": "Experience match: 95% (8 years of relevant experience)",
    
    "educationScore": 0.90,
    "educationWeight": 0.10,
    "educationContribution": 0.090,
    "educationDescription": "Education: Excellent match",
    
    "keywordsScore": 0.85,
    "keywordsWeight": 0.15,
    "keywordsContribution": 0.1275,
    "matchedKeywordsCount": 2,
    
    "conditionsScore": 0.90,
    "conditionsWeight": 0.05,
    "conditionsContribution": 0.045,
    
    "details": {
      "missingRequirements": 0,
      "partialMatches": 0,
      "strengths": 2,
      "weaknesses": 0
    }
  }
}
```

## 🎯 Score Levels

| Score | Level | Recommendation |
|-------|-------|---|
| 0.85-1.0 | EXCELLENT | Highly recommended for interview |
| 0.70-0.84 | VERY_GOOD | Recommended for interview |
| 0.55-0.69 | GOOD | Consider for interview |
| 0.40-0.54 | FAIR | Not recommended |
| 0.25-0.39 | POOR | Not recommended |
| 0.0-0.24 | VERY_POOR | Not recommended |

## 🚀 Запуск Backend

### 1. Prerequisites

```bash
- Java 17+
- Maven 3.8+
- AI API Key (DeepSeek/OpenAI/Gemini)
```

### 2. Установка зависимостей

```bash
cd backend
mvn clean install
```

### 3. Конфигурация

Создайте `.env` файл или установите переменные окружения:

```bash
export AI_API_KEY="your-api-key-here"
```

Редактируйте `src/main/resources/application.yml` для выбора AI provider:

**DeepSeek (default):**
```yaml
ai:
  config:
    api-url: https://api.deepseek.com/v1/chat/completions
    model: deepseek-chat
```

**OpenAI:**
```yaml
ai:
  config:
    api-url: https://api.openai.com/v1/chat/completions
    model: gpt-4
```

**Gemini:**
```yaml
ai:
  config:
    api-url: https://generativelanguage.googleapis.com/v1beta/openai/
    model: gemini-2.0-flash
```

### 4. Запуск

```bash
# Development mode
mvn spring-boot:run

# Production mode
mvn clean package
java -jar target/ats-backend-1.0.0-SNAPSHOT.jar
```

Backend запустится на `http://localhost:8080`

## 📡 API Reference

### Health Check

```bash
GET /api/v1/matching/health
```

Response: `"ATS Backend is running"`

### Analyze Matching

```bash
POST /api/v1/matching/analyze
Content-Type: application/json

{
  "jobTitle": "...",
  "jobRequirements": [...],
  "candidateName": "...",
  "candidateSkills": [...]
}
```

## 📊 Explainability Features

Каждый ответ содержит полное объяснение:

1. **Matched Skills** - какие требования совпали с какой уверенностью
2. **Missing Requirements** - что не совпадает
3. **Partial Matches** - что частично совпадает
4. **Scoring Breakdown** - как рассчитан каждый компонент score
5. **Component Weights** - какие веса применены
6. **Contribution Analysis** - сколько баллов дала каждая категория
7. **Recommendation** - итоговая рекомендация

## 🔧 Кастомизация Scoring

Измените веса в `ScoringEngine.java`:

```java
private static final double SKILLS_WEIGHT = 0.40;      // Навыки
private static final double EXPERIENCE_WEIGHT = 0.30;  // Опыт
private static final double EDUCATION_WEIGHT = 0.10;   // Образование
private static final double KEYWORDS_WEIGHT = 0.15;    // Ключевые слова
private static final double CONDITIONS_WEIGHT = 0.05;  // Условия
```

## 📈 Производительность

- **Average response time**: ~2-5 seconds (зависит от AI API)
- **Concurrent requests**: Поддерживает multiple concurrent requests
- **Memory**: ~512MB (минимум)

## 🔒 Security

- Validation всех входных данных
- API Key хранится в переменных окружения
- CORS настроен для безопасного доступа с frontend
- Structured exception handling

## 📝 Project Structure

```
backend/
├── src/main/java/com/offerfit/ats/
│   ├── AtsApplication.java
│   ├── client/
│   │   └── AiClient.java          # AI API integration
│   ├── config/
│   │   ├── AiConfigProperties.java
│   │   ├── WebClientConfig.java
│   │   └── JacksonConfig.java
│   ├── controller/
│   │   └── MatchingController.java # REST endpoints
│   ├── dto/
│   │   ├── MatchingRequestDto.java
│   │   ├── MatchingResponseDto.java
│   │   ├── AiAnalysisDto.java
│   │   ├── ScoringBreakdownDto.java
│   │   ├── SkillMatchDto.java
│   │   └── PartialMatchDto.java
│   ├── model/
│   │   └── MatchLevel.java
│   └── service/
│       ├── MatchingService.java    # Orchestration
│       └── ScoringEngine.java      # Deterministic scoring
├── src/main/resources/
│   └── application.yml
└── pom.xml
```

## 🤖 AI Prompt Optimization

Промпт в `AiClient.java` учитывает:

- Semantic matching (не просто keyword matching)
- Synonyms и related technologies
- Confidence levels для каждого match
- Partial matches для близких совпадений
- Fair но strict assessment

Настройте промпт под ваши нужды!

## 🐛 Debugging

Enable debug logging:

```yaml
logging:
  level:
    com.offerfit.ats: DEBUG
```

Logs покажут:
- AI request/response
- Scoring calculations
- Performance metrics

## 📚 Dипломный проект

Это решение подходит для:
- ✅ Диплома/курсовой
- ✅ MVP для стартапа
- ✅ Production deployment с улучшениями
- ✅ Демонстрации гибридной архитектуры

## 🚀 Future Enhancements

- [ ] Database integration (PostgreSQL)
- [ ] Caching для результатов
- [ ] Batch processing API
- [ ] Analytics dashboard
- [ ] Admin panel для управления весами
- [ ] Support для множественных языков
- [ ] CV/Resume parsing

## 📄 License

MIT License - Feel free to use for educational and commercial projects

---

Developed with ❤️ for OfferFit
