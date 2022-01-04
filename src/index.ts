import expressLoader from './loaders/express.loader'
import socketLoader from './loaders/socket.loader'
import * as http from 'http'
import io from 'socket.io'
require('dotenv').config()

const port = process.env.PORT

const server = async () => {
  const app = expressLoader()
  // app.listen(port)

  const server = http.createServer(app)
  const serverIo = socketLoader(app, new io.Server(server))

  app.set('serverIo', serverIo)

  server.listen(port)

  console.log(`Listening on 0.0.0.0:${port}`)
}

server()
