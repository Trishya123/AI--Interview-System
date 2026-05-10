import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Upload from './pages/Upload'
import Interview from './pages/Interview'
import Summary from './pages/Summary'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
    </Router>
  )
}

export default App