require('dotenv').config()
require('./mongo')

const express = require('express')
const cors = require('cors')
const app = express()
const logger = require('./loggerMiddleware')
const Note = require('./models/note')

app.use(cors()) // Cualquier origen va a funcionar en nuestra api
app.use(express.json())
app.use(logger)

app.get('/', (req, res) => {
  res.send('<h1>Hello World</h1>')
})

app.get('/api/notes', (req, res) => {
  // ** El objeto vacio devuelve todas las notas
  Note.find({})
    .then(notes => {
      res.json(notes)
    })
})

app.get('/api/notes/:id', (req, res, next) => {
  const id = req.params.id

  // ** Diferencio errores dando un 404 si no encontro la nota o un 503 si los caracteres no son validos
  Note.findById(id).then(note => {
    if (note) {
      res.json(note)
    } else {
      res.status(404).end()
    }
  }).catch(err => {
    next(err)
  })
})

app.put('/api/notes/:id', (req, res, next) => {
  const id = req.params.id
  const note = req.body

  const newNoteInfo = {
    content: note.content,
    important: note.important
  }
  // ** Agregamos tercer argumento para que nos devuelva la nueva nota { new : true}
  Note.findByIdAndUpdate(id, newNoteInfo, { new: true })
    .then(result => {
      res.json(result)
    })
})

app.delete('/api/notes/:id', (req, res, next) => {
  const id = req.params.id

  Note.findByIdAndDelete(id).then(result => {
    res.json(result)
    res.status(204).end()
  }).catch(err => next(err))
})

app.post('/api/notes', (req, res) => {
  const note = req.body

  if (!note || !note.content) {
    return res.status(400).json({
      error: 'note.content is missing'
    })
  }

  const newNote = new Note({
    content: note.content,
    date: new Date(),
    important: note.important || false
  })

  newNote.save()
    .then(savedNote => {
      res.json(savedNote)
    })
})

// ** Entra en todos los demas endpoints y si ninguno devuelve nada gracias al next() entra a este y valida el error
app.use((err, req, res, next) => {
  console.error(err)

  if (err.name === 'CastError') {
    res.status(400).send({ error: 'request is not valid ' })
  } else {
    res.status(500).end()
  }
})

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
