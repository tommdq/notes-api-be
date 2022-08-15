const mongoose = require('mongoose')

const connectionString = process.env.MONGO_DB_URI
// Conexion a mongoDb

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Database connected')
  }).catch((err) => {
    console.error(err)
  })

// ** Quito la conexion si hay algun problema
process.on('uncaughtException', () => {
  mongoose.connection.disconnect()
})
