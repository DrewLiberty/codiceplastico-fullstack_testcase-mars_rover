import { Express, Request, Response, NextFunction } from 'express'
import io from 'socket.io'
import { Random } from 'random-js'
import { sample } from 'lodash'
import surfaceService from '../services/surface'
import { Direction } from '../models/rover'

const random = new Random()

export default (app: Express, server: io.Server) => {
  server.on('connection', socket => {
    socket.on('getJourneyStreamed', () => {
      const surface = surfaceService.create({
        x: random.integer(-90, 90),
        y: random.integer(-180, 180),
        direction: sample(Object.values(Direction)) as Direction
      })

      surfaceService.getJourneyStreamed(surface, socket)
    })
  })

  return server
}
