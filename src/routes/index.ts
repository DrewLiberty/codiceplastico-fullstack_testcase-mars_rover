import express from 'express'
import path from 'path'
import setup from './setup'
import actions from './actions'

export default (app: express.Application) => {
  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../views/index.html'))
  })

  app.use('/setup', setup())
  app.use('/actions', actions())
}
