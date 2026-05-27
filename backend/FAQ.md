# FAQ & Troubleshooting

## 🤔 Frequently Asked Questions

### Q: Which AI provider should I use?

**A: For MVP/Development → DeepSeek (Recommended)**
- **Cost**: ~$0.14 per 1M input tokens (very cheap)
- **Speed**: Fast (2-3 seconds typical)
- **Quality**: Good semantic understanding
- **Free Tier**: Yes, you get free credits

**For Production → OpenAI GPT-4**
- **Cost**: Expensive but best quality
- **Speed**: 3-5 seconds
- **Quality**: Excellent, very accurate
- **Free Tier**: Small free tier, then pay-as-you-go

**For Free Tier → Gemini**
- **Cost**: Free tier available
- **Speed**: 2-4 seconds
- **Quality**: Good
- **Limitation**: 60 requests/minute rate limit

### Q: How do I change the scoring weights?

**A**: Edit `ScoringEngine.java`:

```java
private static final double SKILLS_WEIGHT = 0.40;       // ← Change these
private static final double EXPERIENCE_WEIGHT = 0.30;
private static final double EDUCATION_WEIGHT = 0.10;
private static final double KEYWORDS_WEIGHT = 0.15;
private static final double CONDITIONS_WEIGHT = 0.05;

// Make sure they sum to 1.0
// 0.40 + 0.30 + 0.10 + 0.15 + 0.05 = 1.00 ✓
```

Rebuild and restart:
```bash
mvn clean package
java -jar target/ats-backend-1.0.0-SNAPSHOT.jar
```

### Q: Can I use this in production?

**A**: Yes, but you should:
1. ✅ Add database (PostgreSQL)
2. ✅ Add caching (Redis)
3. ✅ Add monitoring (Actuator/Prometheus)
4. ✅ Add authentication (Spring Security)
5. ✅ Add rate limiting
6. ✅ Set up proper logging
7. ✅ Use HTTPS

See `OPTIMIZATION.md` for implementation details.

### Q: How do I integrate with my frontend?

**A**: See `FRONTEND_INTEGRATION.md` for:
- TypeScript types
- React component example
- Custom hooks
- Error handling

Quick start:
```typescript
const response = await fetch('http://localhost:8080/api/v1/matching/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobTitle: 'Engineer',
    jobRequirements: ['Java'],
    candidateName: 'John',
    candidateSkills: ['Java']
  })
});
const result = await response.json();
```

### Q: How long does analysis take?

**A**: Typically 2-5 seconds:
- 1-2 seconds: AI API call
- 0.5-1 second: Parsing response
- 0.5-2 seconds: Scoring calculation

**Optimization**: Enable caching for repeated analyses (10x faster)

### Q: What if AI API fails?

**A**: Backend returns fallback analysis:
```json
{
  "aiAnalysis": {
    "summary": "AI service unavailable, using fallback analysis",
    "strengths": ["Fallback mode"],
    "weaknesses": ["AI analysis unavailable"]
  }
}
```

The service still:
- ✅ Returns a score
- ✅ Provides a breakdown
- ✅ Doesn't crash

### Q: Can I customize the AI prompt?

**A**: Yes! Edit `AiClient.buildAnalysisPrompt()`:

```java
private String buildAnalysisPrompt(MatchingRequestDto request) {
    return String.format("""
        YOUR CUSTOM PROMPT HERE
        
        You can add:
        - Custom instructions
        - Industry-specific rules
        - Language preferences
        - Custom output format
        
        Job Title: %s
        Job Requirements: %s
        ...
        """, request.getJobTitle(), ...);
}
```

### Q: How do I add authentication?

**A**: Add Spring Security:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/matching/**").hasRole("USER")
                .anyRequest().permitAll()
            )
            .httpBasic();
        return http.build();
    }
}
```

Then call with auth:
```bash
curl -u username:password \
  http://localhost:8080/api/v1/matching/analyze
```

### Q: How do I store results in database?

**A**: See `OPTIMIZATION.md` section "Database Integration"

Quick version:
1. Add PostgreSQL dependency
2. Create `MatchingResult` entity
3. Create repository
4. Save after analysis

### Q: Can I run multiple backend instances?

**A**: Yes! For load balancing:

```yaml
# backend-1
server:
  port: 8080

# backend-2
server:
  port: 8081

# Use load balancer (nginx) to route requests
```

### Q: How do I monitor the backend?

**A**: Enable Spring Boot Actuator:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Access endpoints:
- Health: `http://localhost:8080/actuator/health`
- Metrics: `http://localhost:8080/actuator/metrics`
- Info: `http://localhost:8080/actuator/info`

### Q: Can I batch analyze multiple candidates?

**A**: Yes! Add endpoint (from `OPTIMIZATION.md`):

```bash
POST /api/v1/matching/batch-analyze

[
  { "jobTitle": "Job1", ... },
  { "jobTitle": "Job1", ... },
  { "jobTitle": "Job1", ... }
]
```

Returns array of results.

---

## 🐛 Troubleshooting

### Problem: "Cannot find AI_API_KEY"

**Error**:
```
AI service unavailable, using fallback analysis
```

**Solution**:
1. Verify API key is set:
```bash
echo $AI_API_KEY  # Linux/macOS
echo %AI_API_KEY%  # Windows
```

2. If empty, set it:
```bash
export AI_API_KEY="your-key"  # Linux/macOS
setx AI_API_KEY "your-key"    # Windows (permanent)
```

3. Restart backend after setting

### Problem: "Connection timeout to AI API"

**Error**:
```
Failed to analyze matching: Connection timed out
```

**Solution**:
1. Check internet connection
2. Verify AI API is up
3. Increase timeout in `application.yml`:
```yaml
ai:
  config:
    request-timeout-seconds: 60  # Increase from 30
```

4. Try different AI provider (might be faster)

### Problem: "Invalid JSON from AI"

**Error**:
```
Error parsing AI response: JSON parse exception
```

**Solution**:
1. Check AI provider documentation
2. Verify prompt format in `AiClient.java`
3. Try with explicit JSON instruction in prompt
4. Test with simpler input

### Problem: "High memory usage"

**Symptom**: Backend slows down or crashes

**Solution**:
1. Increase heap size:
```bash
java -Xmx2g -jar target/ats-backend-1.0.0-SNAPSHOT.jar
```

2. Add caching to reduce AI calls (see `OPTIMIZATION.md`)

3. Use database instead of storing everything in memory

### Problem: "CORS error when calling from frontend"

**Error**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:

1. In development: Already enabled in `MatchingController.java`
```java
@CrossOrigin(origins = "*")
```

2. In production: Restrict origins:
```java
@CrossOrigin(origins = "https://yourdomain.com", maxAge = 3600)
```

3. Verify frontend URL matches

### Problem: "Validation error: jobRequirements cannot be empty"

**Error**:
```json
{
  "error": "jobRequirements: must not be empty"
}
```

**Solution**:
1. Check request body has `jobRequirements` array
2. Array must have at least 1 element
3. Example:
```json
{
  "jobRequirements": ["Java", "Spring"],
  ...
}
```

### Problem: "Response is null or empty"

**Symptom**: Frontend gets empty response

**Solution**:
1. Check backend logs for errors
2. Verify request is valid (all required fields)
3. Check network tab in browser DevTools
4. Try direct cURL request:
```bash
curl -X POST http://localhost:8080/api/v1/matching/analyze \
  -H "Content-Type: application/json" \
  -d '{"jobTitle":"Job","jobRequirements":["Req"],"candidateName":"John","candidateSkills":["Skill"]}'
```

### Problem: "Score is always around 50%"

**Possible causes**:
1. AI analysis failed (check logs for "AI service unavailable")
2. Bad AI response parsing
3. Scoring formula issue

**Solution**:
1. Enable debug logging:
```yaml
logging:
  level:
    com.offerfit.ats: DEBUG
```

2. Check logs for exact error
3. Test with explicit, simple input
4. Verify scoring weights add up to 1.0

### Problem: "Backend won't start - port already in use"

**Error**:
```
Address already in use: bind
```

**Solution**:

Option 1: Kill process on port 8080
```bash
# Linux/macOS
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

Option 2: Use different port
```yaml
server:
  port: 8081  # Changed from 8080
```

Option 3: Change in command line
```bash
java -Dserver.port=8081 -jar target/ats-backend-1.0.0-SNAPSHOT.jar
```

### Problem: "Compilation error: Missing Lombok"

**Error**:
```
error: cannot find symbol @Data
```

**Solution**:
1. Ensure Lombok is in pom.xml (it is)
2. In IDE, install Lombok plugin:
   - IntelliJ: Preferences → Plugins → Lombok
   - VS Code: Install "Lombok Annotations Support for VS Code"
3. Rebuild project: `mvn clean compile`

### Problem: "Cannot parse response - looks like HTML error page"

**Symptom**: AI response contains HTML instead of JSON

**Cause**: AI API returning error page (auth, rate limit, etc.)

**Solution**:
1. Check API key is correct
2. Check rate limit (try Gemini with free tier)
3. Verify API URL in `application.yml`
4. Try with smaller request (fewer skills/requirements)

---

## 💡 Performance Tips

### Slow Responses?
1. **Enable caching** - 5-10x faster for repeated job-candidate pairs
2. **Use faster AI provider** - DeepSeek is faster than GPT-4
3. **Increase timeout** - Some slower responses are valid
4. **Add database** - Reduce AI calls with history

### High CPU Usage?
1. **Check scoring loops** - Profile with `async-profiler`
2. **Use thread pool** - Configure in `application.yml`
3. **Cache intermediate results**

### High Memory Usage?
1. **Increase heap**: `java -Xmx2g -jar ...`
2. **Add garbage collection tuning**
3. **Use streaming responses** for batch operations

---

## 📞 Getting Help

1. **Check this FAQ first** - Most issues covered
2. **Enable debug logging** - See what's happening
3. **Test with cURL** - Isolate frontend vs backend issue
4. **Read ARCHITECTURE.md** - Understand the flow
5. **Check AI provider docs** - API-specific issues

---

**Still stuck?** 
- Review the logs carefully
- Try simpler test cases first
- Test each component independently
- Reach out to AI provider support if it's an API issue
