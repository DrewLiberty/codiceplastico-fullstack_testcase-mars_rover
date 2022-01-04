import express from 'express'
import { validationResult } from 'express-validator'
import { Direction } from '../models/rover'
import { Coordinate, Surface } from '../models/surface'

const validationService = {
  isValid (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(422).json(errors.array())
    else next()
  },
  roverExists (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.session.rover === undefined)
      return res.status(400).send({
        message: 'You need to create a rover in order to use the actions'
      })
    next()
  },
  parseSurface (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.session.surface === undefined)
      return res.status(400).send({
        message: 'You need to create a surface in order to use the actions'
      })
    else {
      const sessionSurface = req.session.surface
      const surface = new Surface(
        sessionSurface.startLocation,
        sessionSurface.currentLocation
      )
      surface.load(sessionSurface.matrix as any)

      req.session.surface = surface
    }

    next()
  }
}

export default validationService
