/* global process */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.PORT || 5000)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI
const client = mongoUri ? new MongoClient(mongoUri) : null
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = path.join(projectRoot, 'dist')
let db

app.use(cors())
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: db ? 'connected' : 'local demo mode' }))

app.get('/api/questions', async (_req, res) => {
  if (!db) return res.json({ questions: demoQuestions })
  const questions = await db.collection('questions').find({}, { projection: { answer: 0 } }).toArray()
  res.json({ questions })
})

app.post('/api/questions', async (req, res) => {
  if (!req.body?.prompt || !Array.isArray(req.body.options) || req.body.options.length < 2 || !Number.isInteger(req.body.answer)) return res.status(400).json({ error: 'Provide a prompt, options, and answer index.' })
  if (!db) return res.status(503).json({ error: 'Connect MongoDB to create questions.' })
  const question = { prompt: String(req.body.prompt), topic: String(req.body.topic || 'General'), options: req.body.options.map(String), answer: req.body.answer }
  const { insertedId } = await db.collection('questions').insertOne(question)
  res.status(201).json({ ...question, _id: insertedId })
})

app.put('/api/questions/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Connect MongoDB to update questions.' })
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid question ID.' })
  const updates = {}
  for (const key of ['prompt', 'topic', 'options', 'answer']) if (req.body[key] !== undefined) updates[key] = req.body[key]
  const result = await db.collection('questions').updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
  if (!result.matchedCount) return res.status(404).json({ error: 'Question not found.' })
  res.json({ updated: true })
})

app.delete('/api/questions/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Connect MongoDB to delete questions.' })
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid question ID.' })
  const result = await db.collection('questions').deleteOne({ _id: new ObjectId(req.params.id) })
  if (!result.deletedCount) return res.status(404).json({ error: 'Question not found.' })
  res.json({ deleted: true })
})

app.post('/api/results', async (req, res) => {
  const { student, score, total, answers } = req.body || {}
  if (!student?.name || !student?.email || !student?.id || !Number.isInteger(score) || !Number.isInteger(total)) return res.status(400).json({ error: 'Invalid exam result.' })
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  const result = { student: { name: String(student.name), email: String(student.email), id: String(student.id) }, score, total, answers: answers || {}, submittedAt: new Date() }
  const { insertedId } = await db.collection('results').insertOne(result)
  res.status(201).json({ id: insertedId, ...result })
})

app.get('/api/results', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  const filter = req.query.studentId ? { 'student.id': String(req.query.studentId) } : {}
  const results = await db.collection('results').find(filter).sort({ submittedAt: -1 }).limit(100).toArray()
  res.json({ results })
})

app.get('/api/students', async (_req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  const students = await db.collection('students').find({}, { projection: { name: 1, email: 1, studentId: 1 } }).limit(100).toArray()
  res.json({ students })
})

app.post('/api/students', async (req, res) => {
  const { name, email, studentId } = req.body || {}
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '')) || !studentId) return res.status(400).json({ error: 'Provide a name, valid email, and student ID.' })
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  const student = { name: String(name).trim(), email: String(email).trim().toLowerCase(), studentId: String(studentId).trim(), createdAt: new Date() }
  const result = await db.collection('students').updateOne({ studentId: student.studentId }, { $set: student }, { upsert: true })
  res.status(result.upsertedCount ? 201 : 200).json(student)
})

app.put('/api/students/:studentId', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  const updates = {}
  if (req.body.name) updates.name = String(req.body.name).trim()
  if (req.body.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(req.body.email))) return res.status(400).json({ error: 'Provide a valid email.' })
    updates.email = String(req.body.email).trim().toLowerCase()
  }
  const result = await db.collection('students').updateOne({ studentId: req.params.studentId }, { $set: updates })
  if (!result.matchedCount) return res.status(404).json({ error: 'Student not found.' })
  res.json({ updated: true })
})

app.delete('/api/students/:studentId', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  const result = await db.collection('students').deleteOne({ studentId: req.params.studentId })
  if (!result.deletedCount) return res.status(404).json({ error: 'Student not found.' })
  res.json({ deleted: true })
})

app.put('/api/results/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid result ID.' })
  const updates = {}
  if (Number.isInteger(req.body.score)) updates.score = req.body.score
  if (Number.isInteger(req.body.total)) updates.total = req.body.total
  const result = await db.collection('results').updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates })
  if (!result.matchedCount) return res.status(404).json({ error: 'Result not found.' })
  res.json({ updated: true })
})

app.delete('/api/results/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'MongoDB is not configured.' })
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid result ID.' })
  const result = await db.collection('results').deleteOne({ _id: new ObjectId(req.params.id) })
  if (!result.deletedCount) return res.status(404).json({ error: 'Result not found.' })
  res.json({ deleted: true })
})

app.use(express.static(distDirectory))
app.get(/.*/, (_req, res) => res.sendFile(path.join(distDirectory, 'index.html')))

const demoQuestions = [
  { id: 1, topic: 'HTML', prompt: 'Which HTML element represents the main content of a document?', options: ['<section>', '<main>', '<aside>', '<summary>'] },
  { id: 2, topic: 'CSS', prompt: 'Which CSS layout system is designed for arranging items in rows or columns?', options: ['Float', 'Position', 'Flexbox', 'Z-index'] },
  { id: 3, topic: 'JavaScript', prompt: 'Which array method creates a new array by transforming each item?', options: ['forEach()', 'filter()', 'map()', 'find()'] },
  { id: 4, topic: 'React', prompt: 'Which React hook stores a value that can change over time?', options: ['useMemo', 'useState', 'useId', 'useContext'] },
  { id: 5, topic: 'Databases', prompt: 'What kind of database is MongoDB?', options: ['Relational', 'Graph-only', 'Document-oriented', 'Keyless'] },
]

app.use((error, _req, res, _next) => {
  void _next
  console.error(error)
  res.status(500).json({ error: 'The server could not complete this request.' })
})

async function start() {
  if (client) {
    await client.connect()
    db = client.db(process.env.MONGODB_DB || 'examDB')
    console.log(`Connected to MongoDB database: ${db.databaseName}`)
  } else {
    console.log('MONGO_URI not set; API is in demo mode.')
  }
  app.listen(port, () => console.log(`Exam API listening on http://localhost:${port}`))
}

start().catch(error => {
  console.error('Could not start the exam API:', error.message)
  process.exitCode = 1
})
