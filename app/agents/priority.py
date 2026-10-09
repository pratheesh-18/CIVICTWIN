from sqlalchemy.orm import Session
from app.db.models import Cluster


def run_priority_agent(db: Session, cluster_id: int, hazard_weight: float) -> float:
    """
    Agent 3: Dynamic Priority Scoring Agent
    Evaluates hazard severity and report frequency to update cluster priority score.
    When previous priority exists, current priority increases upon previous priority
    (compounding risk escalation on incoming grievances).
    Formula:
        base_score = (0.4 * hazard_weight) + (0.3 * min(report_count * 0.15, 0.45)) + 0.25
        if previous_priority > 0:
            score = max(previous_priority + (0.15 * hazard_weight + 0.05), base_score)
        else:
            score = base_score
    Clamped between 0.10 and 0.98, rounded to 2 decimal places.
    """
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        return 0.50

    previous_priority = float(cluster.priority_score or 0.0)

    base_score = (
        (0.4 * hazard_weight)
        + (0.3 * min(cluster.report_count * 0.15, 0.45))
        + 0.25
    )

    if previous_priority > 0.0:
        # Priority escalates upon previous priority with every incoming report
        escalation_increment = (0.15 * hazard_weight) + 0.05
        raw_score = max(previous_priority + escalation_increment, base_score)
    else:
        raw_score = base_score

    clamped_score = max(0.10, min(0.98, round(raw_score, 2)))
    cluster.priority_score = clamped_score
    db.flush()

    return clamped_score
