from fastapi import APIRouter
from app.api.endpoints import health, complaints, clusters, verification, analytics, auth, departments, voice

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(auth.router, prefix="", tags=["User Profile"])
api_router.include_router(departments.router, prefix="", tags=["Department Dashboards"])
api_router.include_router(health.router, prefix="/system", tags=["System"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Transcription & Semantics"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["Clusters"])
api_router.include_router(verification.router, prefix="/verification", tags=["Verification"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

