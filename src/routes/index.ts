import express from 'express'
import setup from './setup'

export default (app: express.Application) => {
  app.use('/setup', setup())
}
