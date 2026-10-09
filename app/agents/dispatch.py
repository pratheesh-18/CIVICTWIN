from typing import Tuple


def run_dispatch_agent(category: str, priority_score: float) -> Tuple[str, int]:
    """
    Agent 4: Department Dispatch & SLA Agent
    Routes complaint to appropriate civic wing and assigns SLA based on priority score.
    """
    routing_table = {
        "Pothole": "Roads & Infrastructure Maintenance Wing",
        "Streetlight": "Municipal Electrical & Lighting Dept",
        "Water Leakage": "TWAD / Metro Water Supply Board",
        "Garbage": "Solid Waste Management Division",
    }

    assigned_dept = routing_table.get(category, "Zonal Grievance Response Cell")

    # High priority complaints (>= 0.75) get 24 hours SLA; else 48 hours.
    sla_hours = 24 if priority_score >= 0.75 else 48

    return assigned_dept, sla_hours
