#!/bin/bash
# Quick start script for development

set -e

echo "🚀 OfferFit ATS Backend - Quick Start"
echo "======================================"

# Check Java version
echo "📦 Checking Java installation..."
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install Java 17 or higher."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "\K[0-9]+' | head -1)
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "❌ Java version must be 17 or higher. Current: $JAVA_VERSION"
    exit 1
fi
echo "✅ Java $JAVA_VERSION found"

# Check Maven
echo "📦 Checking Maven installation..."
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven not found. Please install Maven 3.8 or higher."
    exit 1
fi
echo "✅ Maven found"

# Set API Key
if [ -z "$AI_API_KEY" ]; then
    echo "⚠️  AI_API_KEY environment variable not set"
    echo "   Please set: export AI_API_KEY='your-api-key'"
    echo ""
    echo "   Available providers:"
    echo "   - DeepSeek: https://platform.deepseek.com"
    echo "   - OpenAI: https://platform.openai.com"
    echo "   - Gemini: https://ai.google.dev"
    echo ""
    read -p "   Enter API Key: " API_KEY
    export AI_API_KEY=$API_KEY
fi

# Build
echo ""
echo "🔨 Building project..."
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"

# Run
echo ""
echo "🚀 Starting backend server..."
echo "📡 Server will run on http://localhost:8080"
echo "📚 API: POST http://localhost:8080/api/v1/matching/analyze"
echo "❤️  Health: http://localhost:8080/api/v1/matching/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

mvn spring-boot:run
