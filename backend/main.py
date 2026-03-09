
from typing import Optional

import asyncio
import os
import re
import tempfile
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import logging


logger = logging.getLogger("backend")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s - %(message)s")


app = FastAPI(title="AI Review Assistant - Backend")

# Allow frontend access (for local dev only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Use env var if provided so this is configurable in different environments
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-coder")


class CodeRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=20000, description="Source code to analyze")
    language: Optional[str] = Field("", max_length=64, description="Programming language name")


async def ask_ai(prompt: str, timeout: int = 10, retries: int = 3) -> str:
    """Send prompt to the local Ollama (or compatible) API and return text.

    Will retry a few times with exponential backoff on transient errors.
    """
    attempt = 0
    backoff = 0.5
    while attempt < retries:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    OLLAMA_URL,
                    json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
                )
                resp.raise_for_status()
                data = resp.json()

                # Ollama-style response may vary; try common keys
                if isinstance(data, dict):
                    for key in ("response", "text", "output"):
                        if key in data and data[key] is not None:
                            return str(data[key])

                # fallback to raw text
                if isinstance(data, str):
                    return data

                return ""
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            logger.warning("AI call failed on attempt %s: %s", attempt + 1, e)
            attempt += 1
            if attempt >= retries:
                logger.exception("AI request failed after retries")
                raise HTTPException(status_code=502, detail=f"AI request failed: {e}")
            await asyncio.sleep(backoff)
            backoff *= 2


# -----------------------------
# REVIEW ENDPOINT
# -----------------------------
@app.post("/review")
async def review_code(request: CodeRequest):
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

    result = await ask_ai(prompt)
    return {"review": result}


# -----------------------------
# FIX ENDPOINT
# -----------------------------
@app.post("/fix")
async def fix_code(request: CodeRequest):
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

    result = await ask_ai(prompt)
    return {"fixed_code": result}


# -----------------------------
# CHAT WITH CODE
# -----------------------------


class ChatRequest(BaseModel):
    code: str
    question: str


@app.post("/chat")
async def chat_code(request: ChatRequest):
    prompt = f"""
You are an expert software engineer.

The user is asking a question about the following code.

Code:
{request.code}

Question:
{request.question}

Provide a clear and helpful answer.
"""

    result = await ask_ai(prompt)
    return {"answer": result}


# -----------------------------
# REPOSITORY ANALYSIS ENDPOINT
# -----------------------------


class RepoRequest(BaseModel):
    repo_url: str

    @validator("repo_url")
    def validate_repo_url(cls, v: str) -> str:
        # Allow http(s), git@ and git:// urls for common git providers
        if not re.match(r"^(https?://|git@|git://)", v):
            raise ValueError("repo_url must start with http(s)://, git@ or git://")
        return v


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
async def root() -> dict:
    return {"service": "ai-review-backend", "status": "running"}


def _is_text_file(path: Path) -> bool:
    try:
        # small heuristic: try reading a bit
        with path.open("rb") as f:
            chunk = f.read(512)
        # if NUL byte present, it's likely binary
        return b"\x00" not in chunk
    except Exception:
        return False


@app.post("/analyze-repo")
async def analyze_repo(request: RepoRequest):
    # shallow clone into a tempdir
    with tempfile.TemporaryDirectory() as tmpdir:
        try:
            # --depth 1 reduces clone time and size
            proc = await asyncio.create_subprocess_exec(
                "git",
                "clone",
                "--depth",
                "1",
                request.repo_url,
                tmpdir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await proc.communicate()
            if proc.returncode != 0:
                stderr_text = stderr.decode("utf-8", errors="ignore")
                logger.error("git clone failed: %s", stderr_text)
                raise HTTPException(status_code=400, detail=f"git clone failed: {stderr_text}")
        except Exception as e:
            logger.exception("git clone failed")
            raise HTTPException(status_code=400, detail=f"git clone failed: {e}")

        code_snippets = []
        total_len = 0
        max_total = 60_000
        per_file_limit = 10_000

        for file in Path(tmpdir).rglob("*"):
            # skip .git and large folders
            if ".git" in file.parts or "node_modules" in file.parts:
                continue
            if file.suffix.lower() in [".py", ".js", ".ts", ".java", ".cpp", ".tsx", ".jsx"]:
                if not _is_text_file(file):
                    continue
                try:
                    text = file.read_text(errors="ignore")
                except Exception:
                    continue

                snippet = f"\nFILE: {file.relative_to(tmpdir)}\n"
                snippet += text[:per_file_limit]
                code_snippets.append(snippet)
                total_len += len(snippet)
                if total_len > max_total:
                    break

        prompt = f"""
You are a senior software engineer.

Analyze this repository.

Find:
- bugs
- bad practices
- security issues
- improvements

Code:
{''.join(code_snippets)}
"""

        result = await ask_ai(prompt)
        return {"analysis": result}
