import math
from typing import Tuple
from sqlalchemy.orm import Session
from app.db.models import Cluster


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes the great-circle distance between two points on Earth in meters using the Haversine formula.
    """
    R = 6371000.0  # Earth's mean radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c


def run_cluster_agent(
    db: Session, lat: float, lon: float, category: str
) -> Tuple[int, bool, int]:
    """
    Agent 2: Spatial Clustering Agent
    Deduplicates and merges incoming reports within 50.0 meters into existing active clusters,
    or creates a new cluster if none exist nearby.
    Returns: (cluster_id, is_new_cluster, report_count)
    """
    active_clusters = (
        db.query(Cluster)
        .filter(Cluster.status.in_(["OPEN", "REOPENED"]))
        .filter(Cluster.category == category)
        .all()
    )

    closest_cluster = None
    min_distance = float("inf")

    for cluster in active_clusters:
        dist = haversine_distance(lat, lon, cluster.latitude, cluster.longitude)
        if dist <= 50.0 and dist < min_distance:
            min_distance = dist
            closest_cluster = cluster

    if closest_cluster:
        closest_cluster.report_count += 1
        db.flush()
        return (closest_cluster.id, False, closest_cluster.report_count)
    else:
        new_cluster = Cluster(
            title=f"{category} Hazard near ({round(lat, 3)}, {round(lon, 3)})",
            category=category,
            latitude=lat,
            longitude=lon,
            report_count=1,
            priority_score=0.0,
            status="OPEN",
        )
        db.add(new_cluster)
        db.flush()
        db.refresh(new_cluster)
        return (new_cluster.id, True, 1)
