const express = require('express')

const app = express()
const port = 4000

app.use(express.static('./'))

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})