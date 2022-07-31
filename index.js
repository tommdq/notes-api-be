const express = require('express')
const cors = require('cors')

const app = express()
const logger = require('./loggerMiddleware')

app.use(cors()) // Cualquier origen va a funcionar en nuestra api
app.use(express.json())

app.use(logger)

let notes = [
  {
    id: 1,
    content: 'Tengo que comprar esmalte',
    date: 'hoy',
    important: true
  },
  {
    id: 2,
    content: 'Comprar bajo',
    date: 'mañana',
    important: true
  },
  {
    id: 3,
    content: 'Vender criolla',
    date: 'hoy',
    important: true
  }
]

app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1>')
})

app.get('/api/notes', (req, res) => {
  res.json(notes)
})

app.get('/api/notes/:id', (req, res) => {
  const id = +req.params.id
  const note = notes.find(note => note.id === id)

  if (note) res.json(note)
  else res.status(404).send()
})

app.delete('/api/notes/:id', (req, res) => {
  const id = +req.params.id
  notes = notes.filter(note => note.id !== id)

  res.status(204).send()
})

app.post('/api/notes', (req, res) => {
  const note = req.body

  if (!note || !note.content) {
    return res.status(400).json({
      error: 'note.content is missing'
    })
  }

  const ids = notes.map(note => note.id)
  const maxId = Math.max(...ids)

  const newNote = {
    id: maxId + 1,
    content: note.content,
    important:
            typeof note.important !== 'undefined' ? note.important : false,
    date: new Date().toISOString()
  }

  notes = [...notes, newNote]

  res.json(newNote)
})

// ** Entra en todos los demas endpoints y este devuelve el error
app.use((req, res) => {
  res.status(404).json({
    error: '404 Not Found'
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
