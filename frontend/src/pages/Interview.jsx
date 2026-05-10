import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../api'

export default function Interview() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [role, setRole] = useState('')
  const [skills, setSkills] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    const storedQuestions = localStorage.getItem('questions')
    const storedSessionId = localStorage.getItem('session_id')
    const storedRole = localStorage.getItem('role')
    const storedSkills = localStorage.getItem('skills')

    if (!storedQuestions || !storedSessionId) {
      navigate('/')
      return
    }

    setQuestions(JSON.parse(storedQuestions))
    setSessionId(storedSessionId)
    setRole(storedRole || '')
    setSkills(JSON.parse(storedSkills || '{}'))
  }, [navigate])

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return setError('Please write an answer before continuing')

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('session_id', sessionId)
      formData.append('question_index', currentIndex)
      formData.append('answer', answer)

      const response = await axios.post(
        `${API_BASE}/interview/answer`,
        formData
      )

      // If followup question came back, add it
      if (response.data.followup_question) {
        setQuestions(prev => [...prev, response.data.followup_question])
      }

      // Move to next question
      if (currentIndex < questions.length - 1 || response.data.followup_question) {
        setCurrentIndex(prev => prev + 1)
        setAnswer('')
      } else {
        // Go to summary
        navigate('/summary')
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    navigate('/summary')
  }

  if (questions.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p>Loading interview...</p>
      </div>
    )
  }

  const progress = ((currentIndex) / questions.length) * 100
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex >= questions.length - 1

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#4f46e5' }}>
          🎯 {role} Interview
        </h1>
      </div>

      {/* Skills bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Your skills:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(skills.skills || []).slice(0, 6).map(skill => (
            <span key={skill} style={{
              background: '#eef2ff',
              color: '#4f46e5',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#4f46e5', fontWeight: '600' }}>
            {Math.round(progress)}% complete
          </span>
        </div>
        <div style={{
          background: '#e5e7eb',
          borderRadius: '999px',
          height: '8px'
        }}>
          <div style={{
            background: '#4f46e5',
            borderRadius: '999px',
            height: '8px',
            width: `${progress}%`,
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Question card */}
      <div className="card">
        <div style={{
          background: '#eef2ff',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            ❓ Question {currentIndex + 1}
          </p>
          <p style={{ fontSize: '1.1rem', fontWeight: '600', lineHeight: '1.6' }}>
            {currentQuestion?.question}
          </p>
          {currentQuestion?.context_used && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              📚 Topic: {currentQuestion.context_used}
            </p>
          )}
        </div>

        {/* Answer box */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            ✍️ Your Answer:
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            style={{ resize: 'vertical' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            {answer.length} characters
          </p>
        </div>

        {error && <p className="error">⚠️ {error}</p>}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmitAnswer}
            disabled={loading || !answer.trim()}
            style={{ flex: 1 }}
          >
            {loading ? '⏳ Saving...' : isLastQuestion ? '✅ Submit & Finish' : '➡️ Next Question'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleFinish}
          >
            📊 View Summary
          </button>
        </div>
      </div>

      {/* Previous questions */}
      {currentIndex > 0 && (
        <div className="card">
          <p style={{ fontWeight: '600', marginBottom: '1rem', color: '#6b7280' }}>
            📝 Previous Questions
          </p>
          {questions.slice(0, currentIndex).map((q, i) => (
            <div key={i} style={{
              borderLeft: '3px solid #4f46e5',
              paddingLeft: '1rem',
              marginBottom: '0.75rem'
            }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>Q{i + 1}: {q.question}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}