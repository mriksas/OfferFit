@echo off
REM Quick start script for development (Windows)

echo.
echo 🚀 OfferFit ATS Backend - Quick Start (Windows)
echo ===============================================
echo.

REM Check Java version
echo 📦 Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java not found. Please install Java 17 or higher.
    pause
    exit /b 1
)
for /f "tokens=3" %%i in ('java -version 2^>^&1 ^| findstr /R "version"') do (
    set JAVA_VERSION=%%i
)
echo ✅ Java version: %JAVA_VERSION%
echo.

REM Check Maven
echo 📦 Checking Maven installation...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Maven not found. Please install Maven 3.8 or higher.
    pause
    exit /b 1
)
echo ✅ Maven found
echo.

REM Set API Key
if "%AI_API_KEY%"=="" (
    echo ⚠️  AI_API_KEY environment variable not set
    echo.
    echo Available providers:
    echo   - DeepSeek: https://platform.deepseek.com
    echo   - OpenAI: https://platform.openai.com
    echo   - Gemini: https://ai.google.dev
    echo.
    set /p API_KEY="Enter API Key: "
    set AI_API_KEY=%API_KEY%
)

REM Build
echo.
echo 🔨 Building project...
call mvn clean package -DskipTests
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)
echo ✅ Build successful
echo.

REM Run
echo 🚀 Starting backend server...
echo 📡 Server will run on http://localhost:8080
echo 📚 API: POST http://localhost:8080/api/v1/matching/analyze
echo ❤️  Health: http://localhost:8080/api/v1/matching/health
echo.
echo Press Ctrl+C to stop the server
echo.

call mvn spring-boot:run
pause
