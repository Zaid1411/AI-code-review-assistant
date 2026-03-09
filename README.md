# AI Code Review Assistant

An AI-powered code review tool built with **React / Next.js, FastAPI, and DeepSeek AI (via Ollama)**.
This application allows developers to paste or upload code and receive **automated code analysis, bug detection, explanations, and fixes**.

---

## Features

* AI-powered **code review**
* **Automatic bug fixing**
* **Code explanation**
* **File upload for code analysis**
* **GitHub repository analysis**
* **Monaco code editor integration**
* Supports multiple programming languages

---

## Tech Stack

### Frontend

* React / Next.js
* Monaco Editor
* TypeScript
* CSS

### Backend

* FastAPI (Python)

### AI

* Ollama
* DeepSeek Coder model

---

## Project Structure

```
ai-code-review-assistant
│
├── frontend        # React / Next.js UI
│
├── backend         # FastAPI backend
│
└── README.md
```

---

## How It Works

1. User pastes or uploads code in the editor.
2. The React frontend sends a request to the FastAPI backend.
3. The backend sends the code to the **DeepSeek AI model via Ollama**.
4. The AI analyzes the code and returns:

   * Issues
   * Explanation
   * Fixed code
5. The frontend displays the AI response.

---

## Installation

### 1. Clone Repository

```
git clone https://github.com/YOUR_USERNAME/ai-code-review-assistant.git
cd ai-code-review-assistant
```

---

## Backend Setup

```
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn requests
uvicorn main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## AI Setup

Install Ollama and download the model:

```
ollama pull deepseek-coder
ollama serve
```

---

## Challenges Faced

* Integrating **Monaco Editor** with React.
* Managing communication between **React frontend and FastAPI backend**.
* Formatting AI responses to properly display issues, explanations, and fixed code.
* Handling **large code inputs** and AI response formatting.
* Implementing **code selection explanation feature**.

---

## Future Improvements

* Deploy the application to cloud infrastructure.
* Add support for more AI models.
* Improve UI with advanced design components.
* Add authentication and project history.

