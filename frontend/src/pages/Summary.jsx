import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Summary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const sessionId = localStorage.getItem('session_id')
    if (!sessionId) {
      navigate('/')
      return
    }
    fetchSummary(sessionId)
  }, [navigate])

  const fetchSummary = async (sessionId) => {
    try {
      const response = await axios.get(
        'http://127.0.0.1:8000/interview/summary/' + sessionId
      )
      setSummary(response.data)
    } catch (err) {
      setError('Could not load summary: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleStartNew = () => {
    localStorage.clear()
    navigate('/')
  }

  if (loading) return (
    <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <p>⏳ Loading your summary...</p>
    </div>
  )

  if (error) return (
    <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
      <p className="error">{error}</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>
        Go Home
      </button>
    </div>
  )

  const answeredQuestions = summary?.qa_records?.filter(qa => qa.answer) || []
  const totalQuestions = summary?.qa_records?.length || 0
  const skills = summary?.extracted_skills?.skills || []
  const technologies = summary?.extracted_skills?.technologies || []

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h1 style={{ fontSize: '1.75rem', color: '#4f46e5', marginBottom: '0.5rem' }}>
          Interview Complete!
        </h1>
        <p style={{ color: '#6b7280' }}>
          Here's a summary of your {summary?.role} interview
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {[
          { icon: '❓', label: 'Total Questions', value: totalQuestions },
          { icon: '✅', label: 'Answered', value: answeredQuestions.length },
          { icon: '🎯', label: 'Skills Found', value: skills.length }
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#4f46e5' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Skills summary */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
          🧠 Detected Skills
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Skills:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {skills.map(skill => (
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
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Technologies:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {technologies.map(tech => (
              <span key={tech} style={{
                background: '#f0fdf4',
                color: '#16a34a',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Q&A Records */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
          📝 Interview Questions & Answers
        </h2>
        {summary?.qa_records?.map((qa, i) => (
          <div key={i} style={{
            borderLeft: '4px solid #4f46e5',
            paddingLeft: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Question {i + 1} • {qa.context_used}
            </p>
            <p style={{ fontWeight: '600', marginBottom: '0.5rem', lineHeight: '1.5' }}>
              {qa.question}
            </p>
            {qa.answer ? (
              <div style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#374151'
              }}>
                {qa.answer}
              </div>
            ) : (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>
                Not answered
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Session info */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>
          📊 Session Info
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { label: 'Role', value: summary?.role },
            // { label: 'Session ID', value: summary?.session_id?.slice(0, 8) + '...' },
            { label: 'Experience Level', value: summary?.extracted_skills?.experience_level },
            { label: 'Date', value: new Date(summary?.created_at).toLocaleDateString() }
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.label}</p>
              <p style={{ fontWeight: '600' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleStartNew}
          style={{ flex: 1 }}
        >
          🔄 Start New Interview
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => window.print()}
          style={{ flex: 1 }}
        >
          🖨️ Print Summary
        </button>
      </div>
    </div>
  )
}
