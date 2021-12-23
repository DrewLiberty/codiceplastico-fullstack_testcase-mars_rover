import express from 'express'
import { body } from 'express-validator'
import { Rover } from '../models/rover'
import { Surface } from '../models/surface'
import surfaceService from '../services/surface'
import validationService from '../services/validation'

const routes = {
  createSurface: function (req: express.Request, res: express.Response) {
    const rover = req.session.rover || new Rover()
    const surface = surfaceService.create({
      x: rover.x,
      y: rover.y,
      direction: rover.direction
    })

    req.session.surface = surface

    res.status(201).send({
      id: req.sessionID,
      rover: req.session.rover,
      surface: req.session.surface
    })
  },
  getJourney: function (req: express.Request, res: express.Response) {
    const surface = req.session.surface || new Surface()
    const journey = surfaceService.getJourney(surface)

    res.status(201).send({
      id: req.sessionID,
      journey: journey
    })
  },
  reportObstacle: function (req: express.Request, res: express.Response) {
    const surface = req.session.surface || new Surface()
    const { x, y, direction } = req.body

    surfaceService.reportObstacle(surface, {
      x,
      y,
      direction
    })

    res.sendStatus(204)
  }
}

export default () => {
  const route = express.Router()

  route.post('/surface', validationService.roverExists, routes.createSurface)

  route.get('/journey', validationService.roverExists, routes.reportObstacle)

  route.post(
    '/report',
    [
      body('x')
        .isInt({ min: -90, max: +90 })
        .withMessage('X coordinate must be a number between -90 and +90'),
      body('y')
        .isInt({ min: -180, max: +180 })
        .withMessage('X coordinate must be a number between -180 and +180'),
      body('direction')
        .isIn(['N', 'E', 'S', 'W'])
        .withMessage('Direction value must be one of N, E, S, W')
    ],
    validationService.roverExists,
    routes.reportObstacle
  )

  return route
}
