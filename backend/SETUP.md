# Setup Guide

## Prerequisites

- **Java 17+** - [Download](https://www.oracle.com/java/technologies/downloads/#java17)
- **Maven 3.8+** - [Download](https://maven.apache.org/download.cgi)
- **Git** - [Download](https://git-scm.com)
- **AI API Key** - Choose one:
  - DeepSeek: https://platform.deepseek.com (⭐ Recommended for MVP - cheaper)
  - OpenAI: https://platform.openai.com
  - Gemini: https://ai.google.dev

## Installation Steps

### 1. Clone / Download Project

```bash
# If using git
git clone <your-repo-url>
cd backend

# Or if already downloaded
cd OfferFit/backend
```

### 2. Verify Java Installation

```bash
java -version
# Should output: java version "17" or higher
```

If not installed:
- **Windows**: Download from oracle.com, run installer
- **macOS**: `brew install openjdk@17`
- **Linux**: `sudo apt install openjdk-17-jdk`

### 3. Verify Maven Installation

```bash
mvn -version
# Should output: Apache Maven 3.8.0 or higher
```

If not installed:
- **Windows/macOS**: Download from maven.apache.org/download.cgi, add to PATH
- **Linux**: `sudo apt install maven`

### 4. Get AI API Key

#### Option A: DeepSeek (Recommended for MVP) 🟢

1. Go to https://platform.deepseek.com
2. Sign up with email
3. Navigate to API Keys section
4. Create new API key
5. Copy the key (save in secure location)

**Cost**: Much cheaper than OpenAI (~$0.14 per 1M input tokens)

#### Option B: OpenAI

1. Go to https://platform.openai.com
2. Sign up or log in
3. Go to API Keys section
4. Create new API key
5. Copy the key

**Cost**: Higher (~$5 per 1M input tokens), but GPT-4 is very capable

#### Option C: Gemini

1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create new API key
4. Copy the key

**Cost**: Free tier available (60 requests/minute)

### 5. Set Environment Variable

#### Windows (Command Prompt)

```cmd
setx AI_API_KEY "your-api-key-here"
# Restart terminal after this
```

Or temporarily for this session:
```cmd
set AI_API_KEY=your-api-key-here
```

#### Windows (PowerShell)

```powershell
$env:AI_API_KEY = "your-api-key-here"
```

Or permanently:
```powershell
[System.Environment]::SetEnvironmentVariable("AI_API_KEY", "your-api-key-here", "User")
# Restart PowerShell/IDE after this
```

#### macOS/Linux

```bash
export AI_API_KEY="your-api-key-here"

# Or permanently in ~/.bashrc or ~/.zshrc:
echo 'export AI_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 6. Verify API Key

```bash
echo $AI_API_KEY  # Linux/macOS
echo %AI_API_KEY%  # Windows CMD
```

Should print your API key (or empty string if not set).

### 7. Build Project

```bash
# In the backend folder
mvn clean install
```

This will:
- Download dependencies (~500MB first time)
- Compile code
- Run tests (if any)
- Create JAR file

**Expected duration**: 5-10 minutes on first run

### 8. Start Backend Server

#### Option A: Quick Start Script

**Windows:**
```bash
run.bat
```

**macOS/Linux:**
```bash
bash run.sh
```

#### Option B: Maven Command

```bash
mvn spring-boot:run
```

#### Option C: Direct JAR Execution

```bash
java -jar target/ats-backend-1.0.0-SNAPSHOT.jar
```

### 9. Verify Server is Running

Open in browser or terminal:

```bash
# Check health
curl http://localhost:8080/api/v1/matching/health
# Should respond with: "ATS Backend is running"

# Or open in browser:
http://localhost:8080/api/v1/matching/health
```

### 10. Test API

Use any HTTP client (curl, Postman, Thunder Client, etc.):

```bash
curl -X POST http://localhost:8080/api/v1/matching/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Backend Engineer",
    "jobRequirements": ["Java", "Spring Boot"],
    "candidateName": "John Doe",
    "candidateSkills": ["Java", "Spring Boot"],
    "candidateExperienceYears": 5
  }'
```

If you are using Windows PowerShell, use either `curl.exe` or `Invoke-RestMethod`:

```powershell
curl.exe -X POST http://localhost:8080/api/v1/matching/analyze `
  -H "Content-Type: application/json" `
  -d '{
    "jobTitle": "Backend Engineer",
    "jobRequirements": ["Java", "Spring Boot"],
    "candidateName": "John Doe",
    "candidateSkills": ["Java", "Spring Boot"],
    "candidateExperienceYears": 5
  }'
```

or:

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/v1/matching/analyze -Method Post -Headers @{ "Content-Type" = "application/json" } -Body '{
  "jobTitle": "Backend Engineer",
  "jobRequirements": ["Java", "Spring Boot"],
  "candidateName": "John Doe",
  "candidateSkills": ["Java", "Spring Boot"],
  "candidateExperienceYears": 5
}'
```

You should get a response like:

```json
{
  "finalScore": 0.88,
  "scoreLevel": "VERY_GOOD",
  "recommendation": "Recommended for interview...",
  "aiAnalysis": {...},
  "scoringBreakdown": {...},
  "processingTimeMs": 3245,
  "analyzedAt": "2026-05-22T14:35:22"
}
```

## Troubleshooting

### Issue: Java not found

```
'java' is not recognized as an internal or external command
```

**Solution:**
1. Install Java 17+
2. Add to PATH:
   - Windows: Set `JAVA_HOME` environment variable
   - macOS/Linux: Verify `/usr/lib/jvm/java-17-openjdk` or similar exists

### Issue: Maven not found

```
'mvn' is not recognized
```

**Solution:**
1. Install Maven 3.8+
2. Add Maven `bin` folder to PATH
3. Restart terminal/IDE

### Issue: AI_API_KEY not set

Backend starts but matching fails with auth error.

**Solution:**
1. Verify API key is set: `echo $AI_API_KEY`
2. Set it again and restart backend
3. Check application.yml for correct API URL

### Issue: API returns 500 error

```json
{
  "error": "Failed to analyze matching"
}
```

**Solution:**
1. Check backend logs (see Debugging section)
2. Verify API key is correct
3. Check internet connection
4. Verify AI API is not down

### Issue: Slow response (>10s)

**Solution:**
1. AI API might be slow - increase timeout in application.yml:
   ```yaml
   ai:
     config:
       request-timeout-seconds: 60
   ```
2. Check internet connection
3. Try with different AI provider

## Debugging

### Enable Debug Logging

Edit `src/main/resources/application.yml`:

```yaml
logging:
  level:
    com.offerfit.ats: DEBUG
    org.springframework.web: INFO
```

Then restart:
```bash
mvn spring-boot:run
```

### View Logs

Logs appear in console. Look for:
- `[DEBUG]` - Detailed internal operations
- `[INFO]` - General information
- `[WARN]` - Warnings
- `[ERROR]` - Errors

Example debug output:
```
2026-05-22 14:35:20 DEBUG [AiClient] Calling AI for semantic analysis: Alice Johnson -> Senior Backend Engineer
2026-05-22 14:35:20 DEBUG [AiClient] Sending request to AI API: https://api.deepseek.com/v1/chat/completions
2026-05-22 14:35:22 DEBUG [AiClient] Received response from AI API
2026-05-22 14:35:22 INFO [ScoringEngine] Calculating score based on AI analysis
2026-05-22 14:35:22 INFO [MatchingService] Analysis completed successfully in 2450ms with score: 0.88
```

### Check Application Configuration

Verify `src/main/resources/application.yml`:

```bash
cat src/main/resources/application.yml
```

Should show your AI provider settings.

## Production Deployment

### Create Application Config for Production

Create `src/main/resources/application-prod.yml`:

```yaml
spring:
  profiles:
    active: prod

server:
  port: 8080

logging:
  level:
    root: WARN
    com.offerfit.ats: INFO

ai:
  config:
    api-key: ${AI_API_KEY}
    request-timeout-seconds: 45
```

### Build Production JAR

```bash
mvn clean package -Pprod
```

### Run with Production Profile

```bash
java -Dspring.profiles.active=prod -jar target/ats-backend-1.0.0-SNAPSHOT.jar
```

### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM openjdk:17-slim
WORKDIR /app
COPY target/ats-backend-1.0.0-SNAPSHOT.jar app.jar
ENV AI_API_KEY=${AI_API_KEY}
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Build and run:

```bash
docker build -t offerfit-ats-backend .
docker run -p 8080:8080 -e AI_API_KEY="your-key" offerfit-ats-backend
```

## IDE Setup

### IntelliJ IDEA

1. Open project folder: `File → Open → backend`
2. Configure JDK: `File → Project Structure → Project → SDK → 17`
3. Enable annotation processing: `File → Settings → Build → Compiler → Annotation Processors → Enable`
4. Run: Right-click `AtsApplication.java → Run` or press `Shift+F10`

### VS Code

1. Install extensions:
   - Extension Pack for Java
   - Spring Boot Extension Pack

2. Open folder: `backend`

3. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Spring Boot App",
      "request": "launch",
      "mainClass": "com.offerfit.ats.AtsApplication",
      "preLaunchTask": "maven: clean package -DskipTests",
      "env": {
        "AI_API_KEY": "${env:AI_API_KEY}"
      }
    }
  ]
}
```

## Next Steps

1. ✅ Backend running at http://localhost:8080
2. 📚 Read [README.md](./README.md) for API documentation
3. 🏗️ Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. 💻 Read [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) to connect frontend
5. 🧪 Read [EXAMPLES.md](./EXAMPLES.md) for test requests

## Support

For issues:
1. Check troubleshooting section above
2. Review logs in console (enable DEBUG logging)
3. Check official documentation:
   - Spring Boot: https://spring.io/projects/spring-boot
   - Maven: https://maven.apache.org
   - AI APIs: Refer to provider documentation

---

Happy coding! 🚀
