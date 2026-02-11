import os
import io
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader
import openai
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory storage for user profile (from CV)
user_profile = "Experienced Frontend Developer with strong React skills and background in Fintech."

# Routes - we handle both with/without /api prefix because Vercel rewrites might pass either
@app.post("/scout")
@app.post("/api/scout")
async def scout_jobs(min_salary: int = 2500, contract_length: str = "6+ Months", currency: str = "USD"):
    global user_profile
    
    # 1. Real Jobs Data from Somewhere.com
    raw_jobs = [
        {"title": "Senior UX Designer", "company": "Somewhere.com", "salary": 5000, "contract": "6 Months", "description": "Looking for a designer with fintech experience.", "apply_url": "https://somewhere.com/jobs/apply?slug=17484142712420072484oBV"},
        {"title": "Frontend Developer", "company": "Somewhere.com", "salary": 4500, "contract": "12 Months", "description": "React specialist to build complex dashboards.", "apply_url": "https://somewhere.com/jobs/apply?slug=17704032787810075711wAl"},
        {"title": "Backend Engineer", "company": "Somewhere.com", "salary": 4800, "contract": "6 Months", "description": "Python/FastAPI expert for scalable APIs.", "apply_url": "https://somewhere.com/jobs/apply?slug=17688239540010072484fil"},
        {"title": "AI Product Manager", "company": "Somewhere.com", "salary": 5500, "contract": "12 Months", "description": "Drive AI initiatives and product strategy.", "apply_url": "https://somewhere.com/jobs/apply?slug=17703147395380072484wJs"},
        {"title": "DevOps Architect", "company": "Somewhere.com", "salary": 6000, "contract": "24 Months", "description": "Cloud infrastructure and CI/CD specialist.", "apply_url": "https://somewhere.com/jobs/apply?slug=17702207381760072484AdI"},
        {"title": "Mobile Lead (RN)", "company": "Somewhere.com", "salary": 5200, "contract": "6 Months", "description": "Lead React Native development for mobile apps.", "apply_url": "https://somewhere.com/jobs/apply?slug=17696162933170072484BAe"},
        {"title": "Full Stack Dev", "company": "Somewhere.com", "salary": 4200, "contract": "12 Months", "description": "Generalist developer for various client projects.", "apply_url": "https://somewhere.com/jobs/apply?slug=17695421202780072484URc"},
        {"title": "Data Engineer", "company": "Somewhere.com", "salary": 4700, "contract": "6 Months", "description": "Big data pipeline and warehouse specialist.", "apply_url": "https://somewhere.com/jobs/apply?slug=17690142241820072484JuR"},
        {"title": "Security Lead", "company": "Somewhere.com", "salary": 6500, "contract": "Indefinite", "description": "Cybersecurity and compliance expert.", "apply_url": "https://somewhere.com/jobs/apply?slug=17654841511140072484ZHY"}
    ]
    
    # Simple conversion logic: Jobs are stored in USD. 
    # If user searches in EUR, we convert their min_salary to USD for filtering.
    target_min_usd = min_salary
    if currency == "EUR":
        target_min_usd = min_salary * 1.08 # Approx conversion rate
    
    # 2. Filter by salary
    filtered_jobs = [job for job in raw_jobs if job["salary"] >= target_min_usd]
    
    # 3. LLM Analysis for Matching
    prompt = f"""
    Analyze the following job opportunities against this user profile:
    Profile: {user_profile}
    
    Jobs (Salaries in USD):
    {json.dumps(filtered_jobs, indent=2)}
    
    User Search Currency: {currency}
    
    Return a list of JSON objects each with:
    - title
    - company
    - salary (format nicely with the {currency} symbol, convert if needed using 1 USD = 0.93 EUR)
    - contract
    - match_score (0-100)
    - reason (one sentence explanation)
    - apply_url (MUST be present from the original data)
    
    Return ONLY JSON.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    results = json.loads(response.choices[0].message.content)
    matches = results.get("matches", list(results.values())[0] if isinstance(results, dict) else results)

    return {"matches": matches}

@app.post("/upload")
@app.post("/api/upload")
async def upload_cv(file: UploadFile = File(...)):
    global user_profile
    
    # 1. Parse PDF
    pdf_content = await file.read()
    reader = PdfReader(io.BytesIO(pdf_content))
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    
    # 2. Extract Profile with LLM
    prompt = f"""
    Extract a professional summary from this CV text:
    {text}
    
    Keep it concise (1-2 sentences).
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    user_profile = response.choices[0].message.content.strip()
    
    return {"status": "success", "filename": file.filename, "message": "CV parsed and profile updated."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
