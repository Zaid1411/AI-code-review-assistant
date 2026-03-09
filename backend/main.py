from fastapi import FastAPI
from pydantic import BaseModel
import requests
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = "http://localhost:11434/api/generate"


class CodeRequest(BaseModel):
    code: str
    language: str


def ask_ai(prompt: str):

    try:

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": "deepseek-coder",
                "prompt": prompt,
                "stream": False
            }
        )

        data = response.json()

        if "response" in data:
            return data["response"]

        return "AI did not return a response"

    except Exception as e:
        return f"AI Error: {str(e)}"


# -----------------------------
# REVIEW ENDPOINT
# -----------------------------
@app.post("/review")
def review_code(request: CodeRequest):

    prompt = f"""
You are a senior software engineer reviewing code.

Analyze the following {request.language} code.

Respond EXACTLY like this:

ISSUES:
1. ...
2. ...

EXPLANATION:
Explain the issues clearly.

Code:
{request.code}
"""

    result = ask_ai(prompt)

    return {"review": result}


# -----------------------------
# FIX ENDPOINT
# -----------------------------
@app.post("/fix")
def fix_code(request: CodeRequest):

    prompt = f"""
You are a senior software engineer.

Fix the following {request.language} code.

IMPORTANT RULES:
- Return ONLY the corrected code
- Do NOT explain anything
- Do NOT add markdown
- Do NOT add text before or after the code

Code:
{request.code}
"""

    result = ask_ai(prompt)

    return {"fixed_code": result}

# -----------------------------
# CHAT WITH CODE
# -----------------------------

class ChatRequest(BaseModel):
    code: str
    question: str


@app.post("/chat")
def chat_code(request: ChatRequest):

    prompt = f"""
You are an expert software engineer.

The user is asking a question about the following code.

Code:
{request.code}

Question:
{request.question}

Provide a clear and helpful answer.
"""

    result = ask_ai(prompt)

    return {"answer": result}

# -----------------------------
# REPOSITORY ANALYSIS ENDPOINT
# -----------------------------
import os
import tempfile
import subprocess
from pathlib import Path

class RepoRequest(BaseModel):
    repo_url: str

@app.post("/analyze-repo")
def analyze_repo(request: RepoRequest):

    temp_dir = tempfile.mkdtemp()

    # clone the repository
    subprocess.run(["git", "clone", request.repo_url, temp_dir])

    code_data = ""

    # read code files
    for file in Path(temp_dir).rglob("*"):
        if file.suffix in [".py", ".js", ".ts", ".java", ".cpp"]:
            try:
                code_data += f"\nFILE: {file.name}\n"
                code_data += file.read_text()
            except:
                pass

    prompt = f"""
You are a senior software engineer.

Analyze this repository.

Find:
- bugs
- bad practices
- security issues
- improvements

Code:
{code_data[:6000]}
"""

    result = ask_ai(prompt)

    return {"analysis": result}
