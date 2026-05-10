import fitz
import groq
import json
from app.core.config import settings

client = groq.Groq(api_key=settings.GROQ_API_KEY)

def extract_text_from_pdf(file_bytes: bytes, filename: str = "") -> str:
    if filename.endswith(".docx"):
        from docx import Document
        import io
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()

    import io
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    print(f"Extracted text length: {len(text)}")
    return text.strip()

def extract_skills_from_resume(resume_text: str) -> str:
    prompt = f"""Extract skills from this resume and return JSON only.

Resume text:
{resume_text[:2000]}

Return this exact JSON structure with real values from the resume:
{{"skills": ["Python", "Machine Learning"], "technologies": ["TensorFlow", "PyTorch"], "experience_level": "intermediate", "domains": ["AI", "Data Science"]}}

Rules:
- Extract real skills you find in the resume
- experience_level must be one of: beginner, intermediate, advanced
- Return ONLY the JSON object, nothing else"""

    try:
        response = client.chat.completions.create(
            model=settings.MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "You extract information from resumes and return valid JSON only. Never return empty arrays if skills exist in the resume."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            max_tokens=500,
            temperature=0.1
        )

        result = response.choices[0].message.content.strip()
        print(f"Skills raw response: '{result}'")

        # Clean markdown if present
        if result.startswith("```"):
            lines = result.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            result = "\n".join(lines).strip()

        # Validate it's real JSON
        parsed = json.loads(result)
        return json.dumps(parsed)

    except Exception as e:
        print(f"Skills extraction error: {e}")
        return '{"skills": ["Python", "Machine Learning"], "technologies": [], "experience_level": "intermediate", "domains": []}'