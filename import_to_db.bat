@echo off
echo ========================================================
echo Hikkaduwa Bank - Database Importer
echo ========================================================
echo.
echo This will import the new database into your Docker PostgreSQL.
echo It might take a few seconds...
echo.

docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < hikkaduwa_db_latest_for_friend.sql

echo.
echo ========================================================
echo Database imported successfully!
echo ========================================================
pause
