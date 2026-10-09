import os
import google.generativeai as genai
from PIL import Image

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    from app.core.config import settings
    api_key = settings.GEMINI_API_KEY

if not api_key:
    print("Error: GEMINI_API_KEY environment variable is not set. Please set it in .env.")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-3.5-flash-lite")

img1 = Image.open("uploads/pothole_before.jpg")
img2 = Image.open("uploads/fake_closure_black.jpg")

prompt = """
You are CivicTwin's Autonomous Multimodal AI Inspector (Agent 5).
Analyze the two municipal defect photos:
Image 1: BEFORE complaint photo of a reported civic defect (e.g., Pothole/Road defect).
Image 2: AFTER contractor closure proof photo.

Check:
1. What was the civic defect in the BEFORE photo?
2. Has the defect been physically resolved/repaired in the AFTER photo?
3. Is Image 2 showing an unfixed defect, a fake/stock photo, or genuine completed repair?

Respond in valid JSON:
{
  "is_problem_solved": true/false,
  "verdict": "VERIFIED" or "REJECTED",
  "reason": "Detailed visual analysis explaining whether the problem is fixed or not."
}
"""

resp = model.generate_content([prompt, img1, img2])
print("GEMINI RESPONSE:")
print(resp.text)
