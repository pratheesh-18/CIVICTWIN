import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.services.voice import process_voice_complaint, transcribe_audio_with_groq, analyze_semantic_meaning

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    """
    Accepts citizen voice recording/audio upload, transcribes it via Groq Whisper,
    and extracts full semantic meaning (category, severity, hazard weight, location).
    """
    try:
        content = await audio.read()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio file uploaded",
            )

        filename = audio.filename or "recording.webm"
        result = process_voice_complaint(content, filename=filename, language=language)

        return {
            "success": True,
            "transcription": result["transcription"],
            "semantic_meaning": result["semantic_meaning"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Voice transcription endpoint error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Voice processing failed: {str(e)}",
        )


@router.post("/semantic")
async def analyze_text_semantics_endpoint(
    payload: dict,
):
    """
    Directly extracts semantic meaning from text using Groq LLM (Qwen / GPT).
    """
    text = payload.get("text", "")
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'text' is required",
        )
    semantic = analyze_semantic_meaning(text)
    return {
        "success": True,
        "semantic_meaning": semantic,
    }

