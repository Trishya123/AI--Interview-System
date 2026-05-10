import groq
import json
from app.core.config import settings
from app.services.rag_service import retrieve_context

client = groq.Groq(api_key=settings.GROQ_API_KEY)

def clean_json_response(text: str):
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        text = "\n".join(lines)
    return text.strip()

def generate_questions(role: str, skills: str, num_questions: int = 3) -> list:
    try:
        skills_data = json.loads(skills)
        skills_list = skills_data.get("skills", [])
        experience = skills_data.get("experience_level", "intermediate")
    except:
        skills_list = []
        experience = "intermediate"

    query = f"{role} technical interview questions machine learning"
    context = retrieve_context(query, n_results=3)

    prompt = f"""You are a technical interviewer for a {role} position.
Candidate experience: {experience}
Candidate skills: {', '.join(skills_list) if skills_list else 'machine learning, python'}

Knowledge base context:
{context[:2000]}

Generate exactly {num_questions} interview questions as a JSON array.
Respond with ONLY a valid JSON array, no markdown, no explanation:
[
  {{"question": "your question here", "context_used": "concept being tested"}},
  {{"question": "your question here", "context_used": "concept being tested"}},
  {{"question": "your question here", "context_used": "concept being tested"}}
]"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "You are a JSON generator. Return only valid JSON arrays. No markdown, no explanation."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=1000,
        temperature=0.3
    )

    content = clean_json_response(response.choices[0].message.content)
    print(f"Questions raw response: {content}")

    try:
        questions = json.loads(content)
        if isinstance(questions, list):
            return questions
        else:
            raise ValueError("Not a list")
    except Exception as e:
        print(f"JSON parse error: {e}")
        # Return as single question if parsing fails
        return [
            {"question": content, "context_used": "generated"},
        ]

def generate_followup_question(role: str, previous_question: str, answer: str) -> dict:
    context = retrieve_context(f"{role} {previous_question}", n_results=2)

    prompt = f"""You are a technical interviewer for a {role} position.
Previous question: {previous_question}
Candidate answer: {answer}

Context: {context[:1000]}

Generate one follow-up question as JSON only:
{{"question": "follow-up question here", "context_used": "what this tests"}}"""

    response = client.chat.completions.create(
        model=settings.MODEL_NAME,
        messages=[
            {
                "role": "system",
                "content": "Return only valid JSON. No markdown, no explanation."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=300,
        temperature=0.3
    )

    content = clean_json_response(response.choices[0].message.content)
    print(f"Followup raw response: {content}")

    try:
        return json.loads(content)
    except:
        return {"question": content, "context_used": "follow-up"}