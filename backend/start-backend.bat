@echo off
echo ================================
echo Starting PetaMini Backend Server
echo ================================
echo.

REM Refresh PATH to include Go
set PATH=%PATH%;C:\Program Files\Go\bin

REM Check if Go is available
where go >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Go is not installed or not in PATH
    echo.
    echo Please:
    echo 1. Close this terminal
    echo 2. Open a NEW PowerShell window
    echo 3. Try: go version
    echo 4. If still not working, restart your computer
    echo.
    pause
    exit /b 1
)

REM Display Go version
echo Go version:
go version
echo.

REM Check if .env file exists
if not exist .env (
    echo WARNING: .env file not found
    echo Creating .env from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo.
        echo Please edit .env file with your configuration:
        echo - TELEGRAM_BOT_TOKEN
        echo - MONGODB_URI
        echo.
        pause
    ) else (
        echo ERROR: .env.example not found
        pause
        exit /b 1
    )
)

REM Download dependencies if needed
echo Downloading Go dependencies...
go mod download
echo.

REM Start the server
echo Starting server on port 8080...
echo Press Ctrl+C to stop
echo.
go run main.go

pause
