from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=True)  # Normalised to +91XXXXXXXXXX
    username = Column(String, unique=True, index=True, nullable=True)  # For department / commissioner
    role = Column(String, nullable=False, default="citizen")  # citizen | department | commissioner
    department = Column(String, nullable=True)  # e.g. Roads, Water & Drainage, etc.
    password_hash = Column(String, nullable=True)  # Only for department / commissioner
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="user")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, index=True, nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    citizen_name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    voice_transcript = Column(Text, nullable=True)
    raw_text = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="complaints")
    cluster = relationship("Cluster", back_populates="complaints")


# Alias Ticket to Complaint for seamless domain naming
Ticket = Complaint


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    report_count = Column(Integer, default=1, nullable=False)
    priority_score = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="OPEN", nullable=False)
    assigned_dept = Column(String, nullable=True)
    sla_hours = Column(Integer, default=24, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="cluster")
    work_orders = relationship("WorkOrder", back_populates="cluster")
    agent_logs = relationship("AgentAuditLog", back_populates="cluster")


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)
    assigned_contractor = Column(String, nullable=False)
    contractor_trust_score = Column(Float, default=100.0, nullable=False)
    before_image = Column(String, nullable=False)
    after_image = Column(String, nullable=True)
    before_latitude = Column(Float, nullable=True)
    before_longitude = Column(Float, nullable=True)
    after_latitude = Column(Float, nullable=True)
    after_longitude = Column(Float, nullable=True)
    gyro_tilt = Column(Float, nullable=True)
    compass_bearing = Column(Float, nullable=True)
    verification_status = Column(String, default="PENDING", nullable=False)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    cluster = relationship("Cluster", back_populates="work_orders")


class AgentAuditLog(Base):
    __tablename__ = "agent_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    agent_name = Column(String, nullable=False)
    input_data = Column(Text, nullable=False)
    decision_output = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    cluster = relationship("Cluster", back_populates="agent_logs")
