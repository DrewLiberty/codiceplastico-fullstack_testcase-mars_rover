import express from 'express'
import setup from './setup'
import actions from './actions'

export default (app: express.Application) => {
  app.use('/setup', setup())
  app.use('/actions', actions())
}
