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

@app.get("/")
def read_root():
    return {"status": "FastAPI is running", "path": "/"}

@app.get("/api")
def read_api_root():
    return {"status": "FastAPI is running", "path": "/api"}

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory storage for user profile (from CV)
user_profile = "Experienced Frontend Developer with strong React skills and background in Fintech."

@app.post("/api/scout")
async def scout_jobs(min_salary: int = 2500, contract_length: str = "6+ Months"):
    global user_profile
    
    # 1. Scrape Somewhere.com (Mocking a few results since real scraping depends on site structure)
    # In a real app, we'd use httpx to fetch and BeautifulSoup to parse
    # For now, we'll use some curated data that looks like it's from somewhere.com
    raw_jobs = [
        {"title": "Senior UX Designer", "company": "Somewhere.com", "salary": 5000, "contract": "6 Months", "description": "Looking for a designer with fintech experience and high-fidelity prototyping skills."},
        {"title": "Frontend Developer", "company": "Somewhere.com", "salary": 4500, "contract": "12 Months", "description": "React specialist to build complex dashboards for financial data."},
        {"title": "Project Manager", "company": "Somewhere.com", "salary": 3800, "contract": "6 Months", "description": "Lead a team of developers and designers in the APAC region."},
        {"title": "Data Scientist", "company": "Somewhere.com", "salary": 6000, "contract": "Freelance", "description": "Machine learning expert needed for a short-term risk analysis project."},
    ]
    
    # 2. Filter by salary
    filtered_jobs = [job for job in raw_jobs if job["salary"] >= min_salary]
    
    # 3. LLM Analysis for Matching
    prompt = f"""
    Analyze the following job opportunities against this user profile:
    Profile: {user_profile}
    
    Jobs:
    {json.dumps(filtered_jobs, indent=2)}
    
    Return a list of JSON objects each with:
    - title
    - company
    - salary (as string)
    - contract
    - match_score (0-100)
    - reason (one sentence explanation)
    
    Return ONLY JSON.
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    
    results = json.loads(response.choices[0].message.content)
    # The result usually comes as {"matches": [...]} or similar depending on the prompt
    matches = results.get("matches", list(results.values())[0] if isinstance(results, dict) else results)

    return {"matches": matches}

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
