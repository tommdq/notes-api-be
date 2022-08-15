module.exports = (err, req, res, next) => {
  console.error(err)

  if (err.name === 'CastError') {
    res.status(400).send({ error: 'request is not valid' })
  } else {
    res.status(500).end()
  }
}
