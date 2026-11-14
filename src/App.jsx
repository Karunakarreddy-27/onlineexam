import { useMemo, useState } from 'react'
import './App.css'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
const apiUrl = (route) => `${apiBaseUrl}/api${route}`

const questions = [
  { id: 1, topic: 'HTML', prompt: 'Which HTML element represents the main content of a document?', options: ['<section>', '<main>', '<aside>', '<summary>'], answer: 1 },
  { id: 2, topic: 'CSS', prompt: 'Which CSS layout system is designed for arranging items in rows or columns?', options: ['Float', 'Position', 'Flexbox', 'Z-index'], answer: 2 },
  { id: 3, topic: 'JavaScript', prompt: 'Which array method creates a new array by transforming each item?', options: ['forEach()', 'filter()', 'map()', 'find()'], answer: 2 },
  { id: 4, topic: 'React', prompt: 'Which React hook stores a value that can change over time?', options: ['useMemo', 'useState', 'useId', 'useContext'], answer: 1 },
  { id: 5, topic: 'Databases', prompt: 'What kind of database is MongoDB?', options: ['Relational', 'Graph-only', 'Document-oriented', 'Keyless'], answer: 2 },
]

const letters = ['A', 'B', 'C', 'D']

function Brand({ onHome }) {
  return <button className="brand" onClick={onHome} aria-label="Go to exam home"><span className="brand-mark">n</span><span>northstar<span className="brand-sub"> / CAMPUS</span></span></button>
}

function Progress({ current, total }) {
  return <div className="progress-wrap"><div className="progress-meta"><span>QUESTION {String(current).padStart(2, '0')} <i>/ {String(total).padStart(2, '0')}</i></span><span>{Math.round(current / total * 100)}% complete</span></div><div className="progress-track"><div style={{ width: `${current / total * 100}%` }} /></div></div>
}

function QuestionCard({ question, selected, onSelect }) {
  return <section className="question-card" aria-labelledby={`question-${question.id}`}>
    <div className="question-overline"><span className="topic-pill">{question.topic}</span><span>Multiple choice <span className="dot">·</span> 1 point</span></div>
    <h2 id={`question-${question.id}`}>{question.prompt}</h2>
    <div className="answer-list" role="radiogroup" aria-label="Answer choices">
      {question.options.map((option, i) => <button key={option} className={`answer-option ${selected === i ? 'selected' : ''}`} role="radio" aria-checked={selected === i} onClick={() => onSelect(i)}><span className="option-letter">{letters[i]}</span><span className="option-text">{option}</span><span className="radio-mark" /></button>)}
    </div>
  </section>
}

function ScoreList({ answers }) {
  return <div className="score-list">{questions.map((question, index) => {
    const correct = answers[question.id] === question.answer
    return <div className="score-row" key={question.id}><span className={`score-icon ${correct ? 'correct' : 'incorrect'}`}>{correct ? '✓' : '–'}</span><span className="score-question"><b>Question {String(index + 1).padStart(2, '0')}</b><small>{question.topic}</small></span><span className={`score-result ${correct ? 'good' : ''}`}>{correct ? 'Correct' : 'Not quite'}</span><span className="score-points">{correct ? '+1' : '0'} <i>/ 1</i></span></div>
  })}</div>
}

function App() {
  const [screen, setScreen] = useState('login')
  const [student, setStudent] = useState({ name: '', email: '', id: '' })
  const [formError, setFormError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [saveError, setSaveError] = useState('')
  const score = useMemo(() => questions.reduce((total, q) => total + (answers[q.id] === q.answer ? 1 : 0), 0), [answers])

  async function startExam(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const id = String(data.get('studentId') || '').trim()
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || id.length < 3) {
      setFormError('Enter your full name, a valid college email, and a student ID (at least 3 characters).')
      return
    }
    setStudent({ name, email, id })
    setFormError('')
    try {
      await fetch(apiUrl('/students'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, studentId: id }),
      })
    } catch {
      // Keep the demo usable when the API or Atlas is not connected yet.
    }
    setScreen('instructions')
  }

  async function finishExam() {
    const result = { student, score, total: questions.length, answers, submittedAt: new Date().toISOString() }
    localStorage.setItem('northstar-last-result', JSON.stringify(result))
    setScreen('result')
    setSaveError('')
    try {
      const response = await fetch(apiUrl('/results'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) })
      if (!response.ok && response.status !== 404) setSaveError('Your result is saved on this device. The server could not save it.')
    } catch {
      setSaveError('Your result is saved on this device. Connect the exam API to sync it to the server.')
    }
  }

  function goHome() {
    setScreen('login'); setAnswers({}); setCurrent(0); setAgreed(false); setSaveError(''); setFormError('')
  }

  return <div className="app-shell">
    <header className="topbar"><Brand onHome={goHome} /><div className="topbar-right"><span className="secure-indicator"><span /> SECURE EXAM PORTAL</span><span className="topbar-divider" /><span className="term-label">FALL SEMESTER <b>2025</b></span></div></header>
    <main className={`main-content screen-${screen}`}>
      {screen === 'login' && <div className="login-layout"><div className="welcome-copy"><span className="eyebrow"><span className="eyebrow-line" /> NORTHSTAR COLLEGE OF ARTS & SCIENCES</span><h1>Your next<br />chapter <span>starts here.</span></h1><p>Sign in to your student account to access your assessment and track your progress.</p><div className="welcome-note"><span className="note-icon">✳</span><span>YOUR FUTURE, IN FOCUS</span><span className="note-line" /></div><div className="welcome-index">01 <span>—</span> 04 <i>STUDENT PORTAL</i></div></div>
        <section className="login-card"><div className="card-topline"><span>STUDENT ACCESS</span><span>01 / 04</span></div><h2>Welcome back<span className="period">.</span></h2><p className="card-intro">Enter your details to continue to the examination.</p><form onSubmit={startExam} noValidate><label htmlFor="name">FULL NAME</label><div className="input-wrap"><span className="input-icon">◉</span><input id="name" name="name" autoComplete="name" placeholder="e.g. Jordan Lee" required minLength="2" /></div><label htmlFor="email">COLLEGE EMAIL</label><div className="input-wrap"><span className="input-icon">✉</span><input id="email" name="email" type="email" autoComplete="email" placeholder="you@northstar.edu" required /></div><label htmlFor="studentId">STUDENT ID</label><div className="input-wrap"><span className="input-icon">▤</span><input id="studentId" name="studentId" placeholder="e.g. NS-240184" required minLength="3" /></div>{formError && <p className="form-error" role="alert">{formError}</p>}<button className="primary-button full-button" type="submit">Continue to exam <span>↗</span></button></form><div className="card-footer"><span>◈ &nbsp;Your session is private and secure.</span><span>NEED HELP? <a href="mailto:exams@northstar.edu">CONTACT US</a></span></div></section></div>}

      {screen === 'instructions' && <div className="instructions-layout"><div className="page-heading"><span className="eyebrow"><span className="eyebrow-line" /> EXAMINATION PORTAL <span className="heading-divider">/</span> CANDIDATE BRIEFING</span><h1>Before you <span>begin.</span></h1><p>Take a moment to review the details. A clear mind makes all the difference.</p></div><div className="exam-summary"><div className="summary-main"><span className="summary-kicker">ASSESSMENT 01 <span>•</span> FOUNDATIONS</span><h2>Web Development<br />Fundamentals</h2><p>HTML, CSS, JavaScript &amp; React</p></div><div className="summary-stat"><span>TIME ALLOWED</span><b>20 <i>min</i></b><small>One sitting</small></div><div className="summary-stat"><span>QUESTIONS</span><b>05 <i>items</i></b><small>Multiple choice</small></div><div className="summary-stat"><span>PASS MARK</span><b>60<i>%</i></b><small>3 out of 5</small></div></div><div className="instruction-grid"><section className="instruction-card"><div className="section-label"><span>01</span> EXAM GUIDELINES</div><ul className="guidelines"><li><span>01</span><div><b>One question at a time</b><small>Move between questions using the navigation controls.</small></div></li><li><span>02</span><div><b>Choose one answer</b><small>Select the option that best answers each question.</small></div></li><li><span>03</span><div><b>Review before submitting</b><small>You can revisit questions until you submit the exam.</small></div></li><li><span>04</span><div><b>Submit when ready</b><small>Your score is calculated as soon as you finish.</small></div></li></ul></section><aside className="student-card"><div className="student-avatar">{student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div><span className="section-label">CANDIDATE</span><h3>{student.name}</h3><p>{student.email}</p><div className="student-id"><span>STUDENT ID</span><b>{student.id}</b></div><div className="ready-indicator"><span /> READY TO BEGIN</div></aside></div><div className="instructions-bottom"><label className="agree-control"><input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} /><span className="custom-check">✓</span><span>I have read and understood the exam guidelines.</span></label><button className="primary-button" disabled={!agreed} onClick={() => setScreen('exam')}>Begin examination <span>↗</span></button></div></div>}

      {screen === 'exam' && <div className="exam-layout"><div className="exam-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> ASSESSMENT 01 <span className="heading-divider">/</span> WEB DEVELOPMENT</span><h1>Think it <span>through.</span></h1></div><div className="timer"><span className="timer-icon">◷</span><div><small>TIME ALLOWED</small><b>20 min</b></div></div></div><Progress current={current + 1} total={questions.length} /><QuestionCard question={questions[current]} selected={answers[questions[current].id]} onSelect={answer => setAnswers(previous => ({ ...previous, [questions[current].id]: answer }))} /><div className="exam-nav"><button className="text-button" disabled={current === 0} onClick={() => setCurrent(i => i - 1)}>← <span>Previous</span></button><div className="question-dots" aria-label={`Question ${current + 1} of ${questions.length}`}>{questions.map((question, i) => <button key={question.id} aria-label={`Go to question ${i + 1}`} className={`${i === current ? 'active' : ''} ${answers[question.id] !== undefined ? 'answered' : ''}`} onClick={() => setCurrent(i)} />)}</div>{current < questions.length - 1 ? <button className="primary-button" onClick={() => setCurrent(i => i + 1)}>Next question <span>→</span></button> : <button className="primary-button submit-button" onClick={finishExam}>Submit examination <span>↗</span></button>}</div><div className="exam-hint"><span>◎</span> {Object.keys(answers).length} of {questions.length} questions answered <span className="hint-separator">·</span> You can return to any question before submitting.</div></div>}

      {screen === 'result' && <div className="result-layout"><div className="result-heading"><span className="eyebrow"><span className="eyebrow-line" /> EXAMINATION COMPLETE <span className="heading-divider">/</span> ASSESSMENT 01</span><h1>Well done, <span>{student.name.split(' ')[0]}.</span></h1><p>Your responses have been reviewed. Here’s how you did.</p></div><div className="result-overview"><div className="result-score"><div className="score-ring" style={{ '--score': `${score / questions.length * 100}%` }}><div><b>{score}<i>/{questions.length}</i></b><small>POINTS</small></div></div></div><div className="result-verdict"><span className={`verdict-pill ${score >= 3 ? '' : 'needs-work'}`}><span /> {score >= 3 ? 'PASSING SCORE' : 'KEEP PRACTICING'}</span><h2>{score >= 3 ? 'A solid foundation.' : 'A good start.'}</h2><p>{score >= 3 ? 'You’ve demonstrated a strong grasp of the fundamentals. Keep building on that momentum.' : 'Every assessment is a chance to grow. Review your answers and give it another try.'}</p><div className="result-meta"><span><small>CANDIDATE</small><b>{student.name}</b></span><span><small>STUDENT ID</small><b>{student.id}</b></span><span><small>ASSESSMENT</small><b>Web Development</b></span></div></div><div className="result-percent"><span>FINAL SCORE</span><b>{Math.round(score / questions.length * 100)}<i>%</i></b><small>{score} correct out of {questions.length}</small></div></div><div className="breakdown-heading"><div><span className="section-label">YOUR BREAKDOWN</span><h2>Question by question</h2></div><span>{score} / {questions.length} CORRECT</span></div><ScoreList answers={answers} />{saveError && <p className="save-notice">{saveError}</p>}<div className="result-actions"><button className="text-button" onClick={() => setScreen('exam')}>← <span>Review answers</span></button><button className="primary-button" onClick={goHome}>Back to portal <span>↗</span></button></div></div>}
    </main>
    <footer className="site-footer"><span>© 2025 NORTHSTAR COLLEGE OF ARTS &amp; SCIENCES</span><span>LEARN WITH PURPOSE <i>✳</i></span><span>EXAM PORTAL <b>·</b> V1.0</span></footer>
  </div>
}

export default App
