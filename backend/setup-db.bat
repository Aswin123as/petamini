@echo off
echo ================================
echo PetaMini Backend - Database Setup
echo ================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo Please edit .env file and add your MongoDB connection string
    echo Then run this script again
    pause
    exit /b
)

echo Step 1: Testing database connection...
echo.
go run scripts\test_connection.go
echo.

echo Step 2: Do you want to initialize the database? (Y/N)
set /p INIT_DB=
if /i "%INIT_DB%"=="Y" (
    echo.
    echo Initializing database...
    go run scripts\init_db.go
    echo.
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Start the backend: go run main.go
echo 2. Test the API at: http://localhost:8080/health
echo.
pause
