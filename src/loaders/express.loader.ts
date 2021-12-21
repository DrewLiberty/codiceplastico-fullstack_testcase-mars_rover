import express from 'express'
import session from 'express-session'
import crypto from 'crypto'
import routes from '../routes'

const sessionOptions = {
  secret: process.env.SESSION_SECRET ?? crypto.randomBytes(16).toString('hex'),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}

export default () => {
  const app = express()

  app.use(express.json())
  app.use(session(sessionOptions))

  routes(app)

  return app
}
