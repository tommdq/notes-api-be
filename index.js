require('dotenv').config()
require('./mongo')

const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const express = require('express')
const cors = require('cors')
const app = express()
const logger = require('./loggerMiddleware')
const Note = require('./models/note')
const notFound = require('./middleware/notFound')
const handleErrors = require('./middleware/handleErrors')

app.use(cors())// Cualquier origen va a funcionar en nuestra api
app.use(express.json())
app.use(logger)
// ** Esto sirve para servir 'estaticos' con express
app.use('/images', express.static('images'))

Sentry.init({
  dsn: 'https://eb0b0e28ba6d4003b56031b1da282bdb@o1362160.ingest.sentry.io/6653424',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0
})

app.use(Sentry.Handlers.requestHandler())
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler())

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
  Note.findById(id)
    .then(note => {
      return note
        ? res.json(note)
        : res.status(404).end()
      // ** Esto lleva al siguiente middleware que pueda manejar el error ( que tenga err como primer param)
    }).catch(err => next(err))
    // Tambien se puse acortar con .catch(next)
})

app.put('/api/notes/:id', (req, res, next) => {
  const id = req.params.id
  const note = req.body

  const newNoteInfo = {
    content: note.content,
    important: note.important
  }
  // ** Nos devuelve lo que encuentra por ID y no lo que actualizo
  // ** Agregamos tercer argumento para que nos devuelva la nueva nota { new : true}
  Note.findByIdAndUpdate(id, newNoteInfo, { new: true })
    .then(result => {
      res.json(result)
    })
    .catch(err => next(err))
})

app.delete('/api/notes/:id', (req, res, next) => {
  const id = req.params.id

  Note.findByIdAndDelete(id).then(result => {
    res.json(result)
    res.status(204).end()
  }).catch(err => next(err))
})

app.post('/api/notes', (req, res, next) => {
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
    .catch(err => next(err))
})

// ** Si no entra en ninguno, me da un 404
app.use(notFound)

app.use(Sentry.Handlers.errorHandler())

// ** Entra en todos los demas endpoints y si ninguno devuelve nada gracias al next() entra a este y valida el error
app.use(handleErrors)

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
