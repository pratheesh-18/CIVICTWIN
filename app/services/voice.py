import json
import logging
import os
import re
from typing import Any, Dict, Optional, Tuple
from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)


def transcribe_audio_with_groq(
    audio_file_or_bytes: Any,
    filename: str = "voice_complaint.webm",
    language: Optional[str] = None,
) -> str:
    """
    Transcribes spoken voice audio (Tamil, Tanglish, English) using Groq Whisper.
    Supports explicit language hinting ('ta' for Tamil, 'en' for English) or autodetect.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured.")

    client = Groq(api_key=api_key)

    # Normalize filename extension for Groq Whisper audio decoder
    lower_fn = filename.lower()
    if not any(lower_fn.endswith(ext) for ext in [".webm", ".wav", ".mp3", ".ogg", ".m4a", ".mp4", ".flac"]):
        filename = f"{filename}.webm"

    # Prepare file tuple for Groq SDK
    if isinstance(audio_file_or_bytes, bytes):
        file_tuple = (filename, audio_file_or_bytes)
    else:
        file_tuple = (filename, audio_file_or_bytes)

    # Comprehensive vernacular prompt priming for Whisper acoustic model
    if language == "ta":
        whisper_prompt = (
            "பொதுமக்கள் நகராட்சி புகார்: சாலை விபத்து, ரோட்டில் பெரிய குழி அல்லது பள்ளம் உள்ளது, "
            "குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது, சாக்கடை கழிவுநீர் பெருக்கெடுத்து ஓடுகிறது, "
            "தெரு விளக்கு எரியவில்லை, இருட்டாக உள்ளது, குப்பை தொட்டி நிரம்பி வழிகிறது."
        )
    else:
        whisper_prompt = (
            "Citizen civic grievance in Tamil (தமிழ்), Tanglish, or English: "
            "சாலை விபத்து, ரோடு குழி பள்ளம் (pothole), குடிநீர் குழாய் leak (water leakage), "
            "சாக்கடை நீர் (sewage drain), தெரு விளக்கு பழுது (streetlight broken), குப்பை கழிவு (garbage pile). "
            "Anna Nagar, T. Nagar, Velachery, Guindy, Coimbatore, Madurai, Trichy."
        )

    # Prioritize whisper-large-v3 for vernacular/accents, then whisper-large-v3-turbo
    models = ["whisper-large-v3", "whisper-large-v3-turbo"]
    last_err = None

    # First attempt: With language parameter if specified
    for model_name in models:
        try:
            kwargs: Dict[str, Any] = {
                "file": file_tuple,
                "model": model_name,
                "prompt": whisper_prompt,
                "temperature": 0.0,
            }
            if language and language in ["ta", "en"]:
                kwargs["language"] = language

            transcription = client.audio.transcriptions.create(**kwargs)
            text = transcription.text.strip()
            if text:
                logger.info("Groq Whisper (%s) transcription success: %s", model_name, text[:60])
                return text
        except Exception as e:
            last_err = e
            logger.warning("Groq Whisper model %s failed with language=%s: %s", model_name, language, e)
            continue

    # Second attempt: If language was forced and failed, try autodetect without language constraint
    if language:
        for model_name in models:
            try:
                transcription = client.audio.transcriptions.create(
                    file=file_tuple,
                    model=model_name,
                    prompt=whisper_prompt,
                    temperature=0.2,
                )
                text = transcription.text.strip()
                if text:
                    logger.info("Groq Whisper (%s) autodetect fallback success: %s", model_name, text[:60])
                    return text
            except Exception as e:
                last_err = e
                continue

    # Third attempt: If transcription still didn't return text, try translation to English
    try:
        translation = client.audio.translations.create(
            file=file_tuple,
            model="whisper-large-v3",
            prompt="Translate citizen civic grievance spoken in Tamil or regional dialect into English.",
        )
        t_text = translation.text.strip()
        if t_text:
            logger.info("Groq Whisper translation fallback success: %s", t_text[:60])
            return t_text
    except Exception as e:
        logger.warning("Groq Whisper translation fallback error: %s", e)

    if last_err:
        raise last_err
    return ""


def analyze_semantic_meaning(transcript: str) -> Dict[str, Any]:
    """
    Extracts deep semantic understanding from the citizen's transcribed voice grievance:
    - Municipal defect category (Pothole, Water Leakage, Streetlight, Garbage)
    - Severity rating (Critical, High, Medium)
    - Hazard weight (0.10 to 0.98)
    - Extracted location mention (e.g. street, landmark)
    - Executive English semantic summary
    """
    if not transcript or not transcript.strip():
        return {
            "category": "General Civic Defect",
            "severity": "Medium",
            "hazard_weight": 0.50,
            "detected_location": "Not specified in speech",
            "semantic_summary": "No speech detected.",
        }

    api_key = settings.GROQ_API_KEY
    if api_key:
        try:
            client = Groq(api_key=api_key)
            prompt = f"""You are CivicTwin's Autonomous Municipal Grievance Semantic Analyzer.
Analyze the following citizen spoken grievance transcript (which may be in colloquial Tamil, Tanglish, or English):
"{transcript}"

Understand the real civic problem being reported and extract:
1. Category: Must be strictly one of ["Pothole", "Water Leakage", "Streetlight", "Garbage"]
   - If pothole/crater/damaged road/tar/pallam/kuzhi -> "Pothole"
   - If drinking water leak/burst pipe/thanni leak/drainage -> "Water Leakage"
   - If streetlight broken/dark road/wire exposed/vilakku -> "Streetlight"
   - If waste overflow/trash/kuppai -> "Garbage"
2. Severity: "Critical" (near school, hospital, major danger, risk of accident/falling), "High" (heavy disruption), or "Medium" (routine maintenance)
3. Hazard Weight: A float between 0.10 and 0.98 representing urgency
4. Detected Location: Any street name, school, bus stand, or landmark mentioned in the speech (or "Not specified")
5. Semantic Summary: A clear, professional 1-2 sentence English summary of the problem and immediate action needed.

Respond strictly in valid JSON format only:
{{
  "category": "Pothole" | "Water Leakage" | "Streetlight" | "Garbage",
  "severity": "Critical" | "High" | "Medium",
  "hazard_weight": 0.95,
  "detected_location": "...",
  "semantic_summary": "..."
}}
"""
            chat_models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "allam-2-7b"]
            for model_name in chat_models:
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        temperature=0.1,
                        max_tokens=300,
                    )
                    content = response.choices[0].message.content
                    parsed = json.loads(content)
                    return {
                        "category": str(parsed.get("category", "Pothole")),
                        "severity": str(parsed.get("severity", "Medium")),
                        "hazard_weight": float(parsed.get("hazard_weight", 0.50)),
                        "detected_location": str(parsed.get("detected_location", "Not specified")),
                        "semantic_summary": str(parsed.get("semantic_summary", transcript)),
                    }
                except Exception as inner_e:
                    logger.warning("Groq semantic model %s failed: %s", model_name, inner_e)
                    continue
        except Exception as e:
            logger.warning("Groq semantic LLM analysis error: %s", e)

    # Deterministic rule-based fallback from Agent 1 (Tamil + English lexicon)
    from app.agents.intake import run_intake_agent
    intake = run_intake_agent(text=transcript, filename="")
    return {
        "category": intake["category"],
        "severity": intake["severity"],
        "hazard_weight": intake["hazard_weight"],
        "detected_location": "Derived from GPS",
        "semantic_summary": f"Reported {intake['category']} grievance with {intake['severity']} priority.",
    }


def process_voice_complaint(
    audio_bytes: bytes,
    filename: str = "voice.webm",
    language: Optional[str] = None,
) -> Dict[str, Any]:
    """
    End-to-end voice complaint processor:
    1. Transcribes voice audio using Groq Whisper (with optional language hinting)
    2. Understands semantic meaning, intent, category, location, and hazard severity
    """
    transcription = transcribe_audio_with_groq(audio_bytes, filename=filename, language=language)
    semantic = analyze_semantic_meaning(transcription)

    return {
        "transcription": transcription,
        "semantic_meaning": semantic,
    }

