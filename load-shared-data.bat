@echo off
cd /d "%~dp0"
echo Loading database dump into Postgres container...
docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < shared_data.sql
echo Done! Your local database now perfectly matches Isuru's database.
pause
