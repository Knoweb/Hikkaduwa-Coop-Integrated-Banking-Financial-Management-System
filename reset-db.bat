@echo off
echo Stopping Docker containers...
docker-compose down

echo Deleting stale PostgreSQL data...
rmdir /S /Q postgres-data

echo Starting Docker containers and rebuilding...
docker-compose up -d --build

echo Waiting for database and backend to boot up (60 seconds)...
timeout /t 60 /nobreak

echo Seeding test users...
powershell -Command "Invoke-RestMethod -Method POST -Uri 'http://localhost:8080/api/v1/auth/seed-admin'"
powershell -Command "Invoke-RestMethod -Method POST -Uri 'http://localhost:8080/api/v1/auth/seed-all'"

echo ==============================================
echo Done! The database has been completely reset and seeded.
echo ==============================================
pause
