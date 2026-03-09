"use client"

import { useState } from "react"
import Editor from "@monaco-editor/react"
import { motion } from "framer-motion"

export default function Home(){

const [code, setCode] = useState<string>(`def divide(a,b):
    return a/b

print(divide(10,0))
`)

const [review, setReview] = useState<string>("")
const [language, setLanguage] = useState<string>("python")
const [loading, setLoading] = useState<boolean>(false)
const [fileName, setFileName] = useState<string>("")
const [repoUrl, setRepoUrl] = useState<string>("")
const [selection, setSelection] = useState("")
  const reviewCode = async () => {

    setLoading(true)
    setReview("🤖 AI analyzing your code...")

    try {

      const res = await fetch("http://127.0.0.1:8000/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, language })
      })

      const data = await res.json()

      setReview(data.review || data.response || JSON.stringify(data))

    } catch {

      setReview("❌ Backend connection error")

    }

    setLoading(false)
  }

  const fixCode = async () => {

    setLoading(true)
    setReview("🤖 Generating fix...")

    try {

      const res = await fetch("http://127.0.0.1:8000/fix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, language })
      })

      const data = await res.json()

     setReview("FIXED CODE:\n" + data.fixed_code)
    } catch {

      setReview("❌ Backend connection error")

    }

    setLoading(false)
  }
  const analyzeRepo = async () => {

  setLoading(true)
  setReview("🤖 Analyzing repository...")

  try {

    const res = await fetch("http://127.0.0.1:8000/analyze-repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ repo_url: repoUrl })
    })

    const data = await res.json()

    setReview(data.analysis)

  } catch {

    setReview("❌ Backend connection error")

  }

  setLoading(false)
}
  
  const handleFile = (file: File) => {

    setFileName(file.name)

    const reader = new FileReader()

    reader.onload = (event) => {
      const content = event.target?.result as string
      setCode(content)
    }

    reader.readAsText(file)
  }

  const extract = (title: string) => {

    if (!review) return ""

    const parts = review.split(title)

    if (parts.length < 2) return ""

    const next = parts[1].split(/\n[A-Z ]+:/)[0]

    return next.trim()
  }

  const issues = extract("ISSUES:")
  const explanation = extract("EXPLANATION:")
  let fixedCode = extract("FIXED CODE:")
  // CLEAN AI MARKDOWN
fixedCode = fixedCode
  .replace(/```python/g, "")
  .replace(/```/g, "")
  .trim()

  const cleanLines = fixedCode.split("\n").filter((line) => {

    if (
      line.startsWith("Here") ||
      line.startsWith("In ") ||
      line.trim() === "python"
    ) return false

    return true
  })

  fixedCode = cleanLines.join("\n").trim()
const explainSelection = async () => {

  console.log("Selection:", selection)

  if (!selection) {
    setReview("⚠️ Please select code first")
    return
  }

  setLoading(true)
  setReview("🤖 Explaining selected code...")

  try {

    const res = await fetch("http://127.0.0.1:8000/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: selection,
        language
      })
    })

    const data = await res.json()

    setReview(data.review)

  } catch {

    setReview("❌ Backend connection error")

  }

  setLoading(false)

}
return (
<main
style={{
minHeight:"100vh",
background:"linear-gradient(135deg,#020617,#0f172a,#020617)",
color:"white",
padding:"40px",
fontFamily:"system-ui, sans-serif"
}}
>

{/* HEADER */}

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"30px"
}}
>

<h1 style={{fontSize:"34px"}}>
🤖 AI Code Review Assistant
</h1>

<div style={{display:"flex",gap:"20px",color:"#94a3b8"}}>
</div>

</div>

{/* REPOSITORY ANALYZER */}

<div
style={{
background:"rgba(255,255,255,0.05)",
border:"1px solid rgba(255,255,255,0.08)",
borderRadius:"14px",
padding:"20px",
marginBottom:"25px",
backdropFilter:"blur(10px)"
}}
>

<h3 style={{marginBottom:"10px"}}>
🔎 Analyze GitHub Repository
</h3>

<input
type="text"
value={repoUrl}
onChange={(e)=>setRepoUrl(e.target.value)}
placeholder="Paste GitHub repo URL"
style={{
width:"100%",
padding:"10px",
background:"#020617",
border:"1px solid #334155",
borderRadius:"8px",
color:"white"
}}
/>

<button
onClick={analyzeRepo}
style={{
marginTop:"12px",
padding:"8px 18px",
background:"#9333ea",
border:"none",
borderRadius:"8px",
cursor:"pointer",
transition:"all 0.2s",
boxShadow:"0 0 12px #9333ea66"
}}
>
Analyze Repository
</button>

</div>

{/* GRID */}

<div
style={{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:"30px"
}}
>

{/* LEFT PANEL */}

<div
style={{
background:"rgba(255,255,255,0.05)",
border:"1px solid rgba(255,255,255,0.08)",
borderRadius:"14px",
padding:"20px",
backdropFilter:"blur(10px)"
}}
>

<h3>🧠 Code Editor</h3>

<select
value={language}
onChange={(e)=>setLanguage(e.target.value)}
style={{
marginTop:"10px",
padding:"6px",
background:"#020617",
border:"1px solid #334155",
borderRadius:"6px",
color:"white"
}}
>
<option value="python">Python</option>
<option value="javascript">JavaScript</option>
<option value="typescript">TypeScript</option>
<option value="java">Java</option>
<option value="cpp">C++</option>
</select>

{/* FILE UPLOAD */}

<div
  onClick={() => document.getElementById("fileUpload")?.click()}
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }}
  style={{
    border: "2px dashed #475569",
    padding: "16px",
    borderRadius: "10px",
    marginBottom: "12px",
    textAlign: "center",
    color: "#94a3b8",
    cursor: "pointer",
    background: "rgba(15,23,42,0.4)"
  }}
>
  📂 Drag & Drop Code File Here
  <br />
  <span style={{ fontSize: "13px" }}>or click to upload</span>
</div>

<input
  type="file"
  id="fileUpload"
  style={{ display: "none" }}
  onChange={(e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }}
/>

{/* EDITOR */}

<Editor
height="420px"
language={language}
theme="vs-dark"
value={code}
onChange={(value)=>setCode(value || "")}
/>

{/* BUTTONS */}

<div
style={{
marginTop:"15px",
display:"flex",
gap:"10px",
flexWrap:"wrap"
}}
>

<button
onClick={reviewCode}
style={{
padding:"10px 18px",
background:"#2563eb",
border:"none",
borderRadius:"8px",
cursor:"pointer",
boxShadow:"0 0 10px #2563eb66",
transition:"0.2s"
}}
>
Review Code
</button>

<button
onClick={fixCode}
style={{
padding:"10px 18px",
background:"#22c55e",
border:"none",
borderRadius:"8px",
cursor:"pointer",
boxShadow:"0 0 10px #22c55e66"
}}
>
Fix Code
</button>

<button
onClick={explainSelection}
style={{
padding:"10px 18px",
background:"#a855f7",
border:"none",
borderRadius:"8px",
cursor:"pointer",
boxShadow:"0 0 10px #a855f766"
}}
>
Explain Selection
</button>

<button
onClick={()=>{
setCode("")
setReview("")
}}
style={{
padding:"10px 18px",
background:"#ef4444",
border:"none",
borderRadius:"8px",
cursor:"pointer",
boxShadow:"0 0 10px #ef444466"
}}
>
Clear
</button>

</div>

</div>

{/* RIGHT PANEL */}

<div
style={{
background:"rgba(255,255,255,0.05)",
border:"1px solid rgba(255,255,255,0.08)",
borderRadius:"14px",
padding:"20px",
height:"550px",
overflowY:"auto",
backdropFilter:"blur(10px)"
}}
>

<h3>🤖 AI Analysis</h3>

{loading && (
<p style={{color:"#94a3b8"}}>
AI is analyzing code...
</p>
)}

{review && (

<pre
style={{
whiteSpace:"pre-wrap",
marginTop:"15px",
lineHeight:"1.5"
}}
>
{review}
</pre>

)}

{fixedCode && (

<div style={{marginTop:"20px"}}>

<h4 style={{color:"#22c55e"}}>
Fixed Code
</h4>

<Editor
height="300px"
language={language}
theme="vs-dark"
value={fixedCode}
options={{
readOnly:true,
minimap:{enabled:false}
}}
/>

<div
style={{
marginTop:"10px",
display:"flex",
gap:"10px"
}}
>

<button
onClick={()=>navigator.clipboard.writeText(fixedCode)}
style={{
padding:"6px 14px",
background:"#2563eb",
border:"none",
borderRadius:"6px"
}}
>
Copy
</button>

<button
onClick={()=>setCode(fixedCode)}
style={{
padding:"6px 14px",
background:"#22c55e",
border:"none",
borderRadius:"6px"
}}
>
Apply Fix
</button>

</div>

</div>

)}

</div>

</div>

{/* FOOTER */}

<div
style={{
marginTop:"40px",
textAlign:"center",
color:"#64748b",
borderTop:"1px solid #334155",
paddingTop:"15px"
}}
>
Powered by Ollama • DeepSeek • Local AI
</div>

</main>
)
}