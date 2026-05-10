import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import API_BASE from '../api'

const ROLES = [
  'AI/ML Engineer',
  'Data Scientist',
  'Backend Engineer',
  'Frontend Engineer',
  'Full Stack Engineer'
]

export default function Upload() {
  const [file, setFile] = useState(null)
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const navigate = useNavigate()

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected && (selected.type === 'application/pdf' || selected.name.endsWith('.docx'))) {
      setFile(selected)
      setError('')
    } else {
      setError('Please upload a PDF or DOCX file')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!file) return setError('Please upload your resume')
    if (!role) return setError('Please select a role')

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('role', role)

      const response = await axios.post(
        `${API_BASE}/interview/start`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      // Save to localStorage for other pages
      localStorage.setItem('session_id', response.data.session_id)
      localStorage.setItem('questions', JSON.stringify(response.data.questions))
      localStorage.setItem('role', response.data.role)
      localStorage.setItem('skills', JSON.stringify(response.data.extracted_skills))

      navigate('/interview')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingTop: '3rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#4f46e5', marginBottom: '0.5rem' }}>
          🤖 AI Interview System
        </h1>
        <p style={{ color: '#6b7280' }}>
          Upload your resume and get a personalized technical interview
        </p>
      </div>

      <div className="card">
        {/* Resume Upload */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            📄 Upload Resume (PDF or DOCX)
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
            style={{
              border: `2px dashed ${dragOver ? '#4f46e5' : '#d1d5db'}`,
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? '#eef2ff' : '#f9fafb',
              transition: 'all 0.2s'
            }}
          >
            {file ? (
              <div>
                <div style={{ fontSize: '2rem' }}>✅</div>
                <p style={{ fontWeight: '600', color: '#4f46e5' }}>{file.name}</p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Click to change file</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2rem' }}>📁</div>
                <p style={{ fontWeight: '600' }}>Drag & drop your resume here</p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>or click to browse</p>
              </div>
            )}
          </div>
          <input
            id="fileInput"
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* Role Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            💼 Select Target Role
          </label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">-- Choose a role --</option>
            {ROLES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <p className="error">⚠️ {error}</p>}

        {/* Submit */}
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {loading ? '⏳ Analyzing resume and generating questions...' : '🚀 Start Interview'}
        </button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        {[
          { icon: '📚', title: 'RAG Powered', desc: 'Questions from real ML textbooks' },
          { icon: '🎯', title: 'Personalized', desc: 'Tailored to your resume skills' },
          { icon: '🔄', title: 'Adaptive', desc: 'Follow-up questions based on answers' }
        ].map(item => (
          <div key={item.title} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
            <p style={{ fontWeight: '600', margin: '0.5rem 0 0.25rem' }}>{item.title}</p>
            <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}