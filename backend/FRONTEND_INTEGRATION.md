# Frontend Integration Guide

## API Integration

### Backend URL

Development:
```
http://localhost:8080
```

Production:
```
https://api.offerfit.com  // or your domain
```

### Endpoint

```
POST /api/v1/matching/analyze
Content-Type: application/json
```

## TypeScript/React Integration

### 1. Define Types

```typescript
// types/ats.ts

export interface MatchingRequest {
  jobTitle: string;
  jobRequirements: string[];
  jobDescription?: string;
  jobKeywords?: string[];
  candidateName: string;
  candidateSkills: string[];
  candidateExperience?: string;
  candidateExperienceYears?: number;
  candidateEducation?: string;
  candidateCertifications?: string[];
  candidateKeywords?: string[];
  candidateSalaryExpectation?: string;
  candidatePreferredLocations?: string[];
}

export interface SkillMatch {
  requirement: string;
  candidateEvidence: string;
  matchLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  reason: string;
  confidence: number;
}

export interface PartialMatch {
  requirement: string;
  candidateEvidence: string;
  reason: string;
  relevanceScore: number;
}

export interface AiAnalysis {
  requirements: string[];
  candidateSkills: string[];
  matches: SkillMatch[];
  missingRequirements: string[];
  partialMatches: PartialMatch[];
  experienceMatch: number;
  educationMatch: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface ScoringBreakdown {
  skillsScore: number;
  skillsWeight: number;
  skillsContribution: number;
  matchedSkillsCount: number;
  totalRequiredSkills: number;
  
  experienceScore: number;
  experienceWeight: number;
  experienceContribution: number;
  experienceDescription: string;
  
  educationScore: number;
  educationWeight: number;
  educationContribution: number;
  educationDescription: string;
  
  keywordsScore: number;
  keywordsWeight: number;
  keywordsContribution: number;
  matchedKeywordsCount: number;
  
  conditionsScore: number;
  conditionsWeight: number;
  conditionsContribution: number;
  conditionsDescription: string;
  
  details: Record<string, unknown>;
}

export interface MatchingResponse {
  candidateName: string;
  jobTitle: string;
  finalScore: number;
  scoreLevel: 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  aiAnalysis: AiAnalysis;
  scoringBreakdown: ScoringBreakdown;
  recommendation: string;
  analyzedAt: string;
  processingTimeMs: number;
}
```

### 2. Create API Service

```typescript
// services/atsService.ts

import { MatchingRequest, MatchingResponse } from '@/types/ats';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function analyzeMatching(
  request: MatchingRequest
): Promise<MatchingResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/matching/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as MatchingResponse;
  } catch (error) {
    console.error('Error analyzing matching:', error);
    throw error;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/matching/health`
    );
    return response.ok;
  } catch {
    return false;
  }
}
```

### 3. React Component

```typescript
// components/MatchingAnalyzer.tsx

'use client';

import { useState } from 'react';
import { MatchingRequest, MatchingResponse } from '@/types/ats';
import { analyzeMatching } from '@/services/atsService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MatchingAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MatchingRequest>({
    jobTitle: 'Senior Backend Engineer',
    jobRequirements: ['Java', 'Spring Boot', 'Docker'],
    candidateName: 'John Doe',
    candidateSkills: ['Java', 'Spring Boot', 'Docker'],
    candidateExperienceYears: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await analyzeMatching(formData);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to analyze matching'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">ATS Matching Analysis</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Job Position</h3>
            <input
              type="text"
              placeholder="Job Title"
              value={formData.jobTitle}
              onChange={(e) =>
                setFormData({ ...formData, jobTitle: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
            />
            <textarea
              placeholder="Job Requirements (one per line)"
              value={formData.jobRequirements.join('\n')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jobRequirements: e.target.value.split('\n').filter(Boolean),
                })
              }
              rows={4}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Candidate Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Candidate</h3>
            <input
              type="text"
              placeholder="Candidate Name"
              value={formData.candidateName}
              onChange={(e) =>
                setFormData({ ...formData, candidateName: e.target.value })
              }
              className="w-full p-2 border rounded mb-2"
            />
            <textarea
              placeholder="Candidate Skills (one per line)"
              value={formData.candidateSkills.join('\n')}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  candidateSkills: e.target.value
                    .split('\n')
                    .filter(Boolean),
                })
              }
              rows={4}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="number"
              placeholder="Years of Experience"
              value={formData.candidateExperienceYears || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  candidateExperienceYears: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Analyzing...' : 'Analyze Match'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}
      </Card>

      {result && <ResultDisplay result={result} />}
    </div>
  );
}

// Result Display Component
function ResultDisplay({ result }: { result: MatchingResponse }) {
  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-600';
    if (score >= 0.70) return 'text-green-500';
    if (score >= 0.55) return 'text-yellow-500';
    if (score >= 0.40) return 'text-orange-500';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm">Final Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(result.finalScore)}`}>
              {Math.round(result.finalScore * 100)}%
            </p>
            <p className="text-sm text-gray-600 mt-1">{result.scoreLevel}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Recommendation</p>
            <p className="text-sm font-semibold mt-2">{result.recommendation}</p>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Processing time: {result.processingTimeMs}ms | Analyzed:{' '}
          {new Date(result.analyzedAt).toLocaleString()}
        </div>
      </Card>

      {/* Scoring Breakdown */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Scoring Breakdown</h3>
        <ScoringChart breakdown={result.scoringBreakdown} />
      </Card>

      {/* AI Analysis */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">AI Analysis</h3>
        <AnalysisDetails analysis={result.aiAnalysis} />
      </Card>

      {/* Matched Skills */}
      <Card className="p-6">
        <h3 className="font-bold text-lg mb-4">Skill Matching Details</h3>
        <MatchesList matches={result.aiAnalysis.matches} />
      </Card>
    </div>
  );
}

// Scoring Chart
function ScoringChart({ breakdown }: { breakdown: any }) {
  const categories = [
    { name: 'Skills', score: breakdown.skillsScore, weight: breakdown.skillsWeight },
    { name: 'Experience', score: breakdown.experienceScore, weight: breakdown.experienceWeight },
    { name: 'Education', score: breakdown.educationScore, weight: breakdown.educationWeight },
    { name: 'Keywords', score: breakdown.keywordsScore, weight: breakdown.keywordsWeight },
    { name: 'Conditions', score: breakdown.conditionsScore, weight: breakdown.conditionsWeight },
  ];

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{cat.name}</span>
            <span className="text-gray-600">
              {Math.round(cat.score * 100)}% (Weight: {Math.round(cat.weight * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${cat.score * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Analysis Details
function AnalysisDetails({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Summary</h4>
        <p className="text-gray-700">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2 text-green-600">Strengths</h4>
          <ul className="space-y-1">
            {analysis.strengths.map((str: string, i: number) => (
              <li key={i} className="text-sm flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-red-600">Weaknesses</h4>
          {analysis.weaknesses.length > 0 ? (
            <ul className="space-y-1">
              {analysis.weaknesses.map((weak: string, i: number) => (
                <li key={i} className="text-sm flex items-start">
                  <span className="text-red-600 mr-2">✗</span>
                  <span>{weak}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No weaknesses identified</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Matches List
function MatchesList({ matches }: { matches: any[] }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {matches.map((match, i) => (
        <div key={i} className="border rounded p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium">{match.requirement}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getLevelColor(match.matchLevel)}`}>
              {match.matchLevel}
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Evidence:</strong> {match.candidateEvidence}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Reason:</strong> {match.reason}
          </p>
          <p className="text-xs text-gray-500">
            Confidence: {Math.round(match.confidence * 100)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

### 4. Next.js Environment Configuration

```bash
# .env.local

NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 5. API Error Handling

```typescript
// hooks/useMatching.ts

import { useState } from 'react';
import { MatchingRequest, MatchingResponse } from '@/types/ats';
import { analyzeMatching, healthCheck } from '@/services/atsService';

export function useMatching() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);

  const analyze = async (request: MatchingRequest) => {
    setLoading(true);
    setError(null);

    try {
      // Check backend availability
      const available = await healthCheck();
      if (!available) {
        setIsBackendAvailable(false);
        throw new Error('Backend service is not available. Please try again later.');
      }

      const response = await analyzeMatching(request);
      setResult(response);
      setIsBackendAvailable(true);
      return response;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, result, error, isBackendAvailable };
}
```

## Backend Configuration for Frontend

### CORS Setup

The backend is already configured with CORS support. If you need to restrict it for production:

Edit `MatchingController.java`:

```java
@CrossOrigin(origins = "https://offerfit.com", maxAge = 3600)
```

### Authentication (Optional)

For production, you might want to add authentication:

```java
@PostMapping("/analyze")
@PreAuthorize("hasRole('USER')")
public ResponseEntity<MatchingResponseDto> analyzeMatching(
    @Valid @RequestBody MatchingRequestDto request) {
    // ...
}
```

## Testing the Integration

### Using Thunder Client / Postman

```
POST http://localhost:8080/api/v1/matching/analyze
Content-Type: application/json

{
  "jobTitle": "Senior Backend Engineer",
  "jobRequirements": ["Java", "Spring Boot"],
  "candidateName": "John Doe",
  "candidateSkills": ["Java", "Spring Boot"],
  "candidateExperienceYears": 5
}
```

### Using fetch in Browser Console

```javascript
fetch('http://localhost:8080/api/v1/matching/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobTitle: 'Senior Backend Engineer',
    jobRequirements: ['Java', 'Spring Boot'],
    candidateName: 'John Doe',
    candidateSkills: ['Java', 'Spring Boot'],
    candidateExperienceYears: 5
  })
})
.then(r => r.json())
.then(console.log)
```

## Deployment

### Frontend + Backend Together

Docker Compose example:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - AI_API_KEY=${AI_API_KEY}
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080
    depends_on:
      - backend
```

---

Happy integrating! 🚀
