def run_intake_agent(text: str, filename: str) -> dict:
    """
    Agent 1: Intake Agent
    Parses Tamil & English civic complaints, categorizes defects, and determines initial severity & hazard weight.
    """
    combined_input = f"{text} {filename}".lower()

    category_keywords = {
        "Pothole": ["kuzhi", "pothole", "pallam", "road", "tar", "crater"],
        "Streetlight": ["light", "vilakku", "pole", "eriyala", "dark", "wire"],
        "Water Leakage": ["water", "thanni", "pipe", "kuzhai", "leak", "drainage"],
        "Garbage": ["garbage", "kuppai", "trash", "waste", "dump"],
    }

    category = "General Civic Defect"
    max_matches = 0

    for cat, keywords in category_keywords.items():
        matches = sum(1 for kw in keywords if kw in combined_input)
        if matches > max_matches:
            max_matches = matches
            category = cat

    # Critical severity keywords check
    critical_keywords = ["school", "hospital", "bus stand", "danger", "accident", "pillai", "fall"]
    if any(kw in text.lower() for kw in critical_keywords):
        severity = "Critical"
        hazard_weight = 0.95
    else:
        severity = "Medium"
        hazard_weight = 0.50

    return {
        "category": category,
        "severity": severity,
        "hazard_weight": hazard_weight,
    }
