from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, InterviewSession, QARecord
from app.services.resume_service import extract_text_from_pdf, extract_skills_from_resume
from app.services.question_service import generate_questions, generate_followup_question
import json

router = APIRouter(prefix="/interview", tags=["interview"])

def safe_parse_json(text: str) -> dict:
    if not text or not text.strip():
        return {}
    # Clean markdown code blocks if present
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()
    try:
        return json.loads(text)
    except:
        return {"skills": [], "technologies": [], "experience_level": "intermediate", "domains": []}

@router.post("/start")
async def start_interview(
    file: UploadFile = File(...),
    role: str = Form(...),
    db: Session = Depends(get_db)
):
    # Read and parse resume
    file_bytes = await file.read()
    resume_text = extract_text_from_pdf(file_bytes, file.filename)

    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from resume")

    # Extract skills using LLM
    extracted_skills_raw = extract_skills_from_resume(resume_text)
    extracted_skills_dict = safe_parse_json(extracted_skills_raw)
    extracted_skills_str = json.dumps(extracted_skills_dict)

    # Create session in DB
    session = InterviewSession(
        role=role,
        resume_text=resume_text,
        extracted_skills=extracted_skills_str
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate initial questions
    questions = generate_questions(role, extracted_skills_str, num_questions=3)

    # Store questions in DB
    for i, q in enumerate(questions):
        qa = QARecord(
            session_id=session.id,
            question=q["question"],
            context_used=q.get("context_used", ""),
            order_num=i
        )
        db.add(qa)
    db.commit()

    return {
        "session_id": session.id,
        "role": role,
        "extracted_skills": extracted_skills_dict,
        "questions": questions,
        "message": "Interview started successfully"
    }

@router.post("/answer")
async def submit_answer(
    session_id: str = Form(...),
    question_index: int = Form(...),
    answer: str = Form(...),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    qa_records = db.query(QARecord).filter(
        QARecord.session_id == session_id
    ).order_by(QARecord.order_num).all()

    if question_index >= len(qa_records):
        raise HTTPException(status_code=400, detail="Invalid question index")

    # Save answer
    qa_records[question_index].answer = answer
    db.commit()

    is_last = question_index >= len(qa_records) - 1

    if not is_last:
        return {
            "message": "Answer saved",
            "is_last": False,
            "next_question_index": question_index + 1
        }
    else:
        # Generate adaptive follow-up
        followup = generate_followup_question(
            session.role,
            qa_records[question_index].question,
            answer
        )

        new_qa = QARecord(
            session_id=session_id,
            question=followup["question"],
            context_used=followup.get("context_used", ""),
            order_num=len(qa_records)
        )
        db.add(new_qa)
        db.commit()

        return {
            "message": "Answer saved, follow-up generated",
            "is_last": False,
            "followup_question": followup,
            "next_question_index": question_index + 1
        }

@router.get("/summary/{session_id}")
async def get_summary(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    qa_records = db.query(QARecord).filter(
        QARecord.session_id == session_id
    ).order_by(QARecord.order_num).all()

    qa_list = [
        {
            "question": qa.question,
            "answer": qa.answer,
            "context_used": qa.context_used
        }
        for qa in qa_records
    ]

    return {
        "session_id": session_id,
        "role": session.role,
        "extracted_skills": safe_parse_json(session.extracted_skills),
        "total_questions": len(qa_records),
        "qa_records": qa_list,
        "created_at": str(session.created_at)
    }