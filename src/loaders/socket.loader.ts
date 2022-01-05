import { Express, Request, Response, NextFunction } from 'express'
import io from 'socket.io'
import { Random } from 'random-js'
import { sample } from 'lodash'
import surfaceService from '../services/surface'
import { Direction } from '../models/rover'

const random = new Random()

export default (app: Express, server: io.Server) => {
  server.on('connection', socket => {
    console.log('client connected, creating the surface instance')
    const surface = surfaceService.create({
      x: random.integer(-180, 180),
      y: random.integer(-90, 90),
      direction: sample(Object.values(Direction)) as Direction
    })

    socket.on('getJourneyStreamed', () => {
      surfaceService.getJourneyStreamed(surface, socket)
    })

    socket.on('disconnect', reason => {
      console.log('client disconnected, destroying the surface instance')
      surface.destroy = true
    })
  })

  return server
}
