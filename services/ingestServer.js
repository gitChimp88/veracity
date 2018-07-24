
const express = require('express')
const app = express()
const port = 4000;
app.use((request, response, next) => {
  console.log(request.headers)
  next()
})

app.use((request, response, next) => {
  request.chance = Math.random()
  next()
})

app.use((err, request, response, next) => {
  // log the error, for now just console.log
  console.log(err)
  response.status(500).send('Something broke!')
})








app.get('/', (request, response) => {
  response.send('Hello from Express!')
})
app.get('/', (request, response) => {
  response.json({
    chance: request.chance
  })
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
