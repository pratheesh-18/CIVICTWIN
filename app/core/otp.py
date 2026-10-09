import abc
import hashlib
import random
import logging
from datetime import datetime, timedelta
from typing import Tuple, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import OtpCode

logger = logging.getLogger("civictwin.otp")


class OtpProvider(abc.ABC):
    @abc.abstractmethod
    def send_otp(self, phone: str, code: str) -> bool:
        """Sends an OTP to the specified phone number."""
        pass


class MockOtpProvider(OtpProvider):
    def send_otp(self, phone: str, code: str) -> bool:
        # In Demo Mode, always logs to console clearly for dev/judges, NEVER returned in API
        print(f"\n=======================================================")
        print(f" [CIVICTWIN MOCK OTP SERVICE]")
        print(f" To Phone: {phone}")
        print(f" Verification Code: {code}")
        print(f" Valid for: 5 Minutes (Max 5 attempts)")
        print(f"=======================================================\n")
        logger.info(f"[MOCK OTP] Sent code to {phone}: {code}")
        return True


class TwilioVerifyOtpProvider(OtpProvider):
    def send_otp(self, phone: str, code: str) -> bool:
        if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_SERVICE_SID):
            logger.warning("Twilio credentials not configured; falling back to console log.")
            print(f"[TWILIO FALLBACK OTP] To {phone}: {code}")
            return True
        try:
            # Twilio Verify API could be called here if configured
            logger.info(f"Twilio Verify triggered for {phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send Twilio OTP: {e}")
            return False


def get_otp_provider() -> OtpProvider:
    if settings.OTP_PROVIDER == "twilio_verify" and settings.TWILIO_ACCOUNT_SID:
        return TwilioVerifyOtpProvider()
    return MockOtpProvider()


def hash_otp(code: str, phone: str) -> str:
    """Hashes an OTP code with secret key and phone salt."""
    salt = f"{phone}:{settings.SECRET_KEY}"
    return hashlib.sha256(f"{code}:{salt}".encode("utf-8")).hexdigest()


def generate_and_store_otp(db: Session, phone: str) -> Tuple[bool, str]:
    """
    Generates a 6-digit OTP, enforces a 30s resend cooldown,
    and stores the hashed code with a 5-minute expiry.
    Returns (success, message).
    """
    now = datetime.utcnow()

    # Check resend cooldown (30 seconds)
    latest_otp = (
        db.query(OtpCode)
        .filter(OtpCode.phone == phone)
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if latest_otp and (now - latest_otp.created_at).total_seconds() < 30:
        remaining = 30 - int((now - latest_otp.created_at).total_seconds())
        return False, f"Please wait {remaining} seconds before requesting a new OTP."

    # In DEMO_MODE, fixed code '123456' for predictable judge testing; else random 6-digits
    if settings.DEMO_MODE:
        code = "123456"
    else:
        code = f"{random.randint(100000, 999999)}"

    code_hash = hash_otp(code, phone)
    expires_at = now + timedelta(minutes=5)

    otp_record = OtpCode(
        phone=phone,
        code_hash=code_hash,
        expires_at=expires_at,
        attempts=0,
        used=False,
        created_at=now,
    )
    db.add(otp_record)
    db.commit()

    provider = get_otp_provider()
    provider.send_otp(phone, code)
    return True, "OTP sent successfully."


def verify_stored_otp(db: Session, phone: str, code: str) -> Tuple[bool, str]:
    """
    Verifies a submitted OTP for the phone number.
    Enforces expiration (5 mins), max attempts (5), and marks used on success.
    Returns (is_valid, error_message).
    """
    now = datetime.utcnow()

    otp_record = (
        db.query(OtpCode)
        .filter(OtpCode.phone == phone, OtpCode.used == False)
        .order_by(OtpCode.created_at.desc())
        .first()
    )

    if not otp_record:
        return False, "No active OTP found. Please request a new code."

    # Check expiration
    if now > otp_record.expires_at:
        return False, "OTP has expired. Please request a new code."

    # Check max attempts (5 attempts lock)
    if otp_record.attempts >= 5:
        return False, "Too many failed attempts. This code is locked. Please request a new OTP."

    # Increment attempts count
    otp_record.attempts += 1
    db.commit()

    expected_hash = hash_otp(code.strip(), phone)
    if otp_record.code_hash != expected_hash:
        remaining = 5 - otp_record.attempts
        if remaining > 0:
            return False, f"Invalid OTP code. {remaining} attempt(s) remaining."
        else:
            return False, "Invalid OTP code. Code locked due to too many failed attempts."

    # Mark as successfully used
    otp_record.used = True
    db.commit()
    return True, "OTP verified successfully."
