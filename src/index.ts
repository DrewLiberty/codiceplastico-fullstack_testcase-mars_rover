import expressLoader from './loaders/express.loader'
require('dotenv').config()

const server = async () => {
  const app = expressLoader()
  const port = process.env.PORT
  app.listen(port)

  console.log(`Listening on 0.0.0.0:${port}`)
}

server()
