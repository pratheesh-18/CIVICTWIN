@echo off
echo ===================================================
echo 🏙️  CivicTwin Startup Orchestration Suite
echo ===================================================

echo [1/4] Installing Python Backend Dependencies...
pip install -r requirements.txt

echo.
echo [2/4] Generating Demo Test Image Assets...
python generate_assets.py

echo.
echo [3/4] Seeding SQLite Database with Municipal Clusters...
python seed_db.py

echo.
echo [4/4] Launching FastAPI Backend Server on port 8000...
echo.
echo ===================================================
echo  FastAPI Backend Live: http://localhost:8000/api/v1
echo  Interactive API Docs: http://localhost:8000/docs
echo.
echo  To start the Frontend, open a second terminal and run:
echo    cd frontend
echo    npm run dev
echo ===================================================
echo.

python -m uvicorn app.main:app --port 8000 --reload
