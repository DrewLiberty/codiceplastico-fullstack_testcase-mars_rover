import express from 'express'
import { body } from 'express-validator'
import setupService from '../services/setup'
import validationService from '../services/validation'

const routes = {
  createRover: function (req: express.Request, res: express.Response) {
    const { x, y, direction } = req.body

    const rover = setupService.create({ x, y, direction })

    req.session.rover = rover

    res.status(201).send({
      id: req.sessionID,
      rover: req.session.rover
    })
  }
}

export default () => {
  const route = express.Router()

  route.post(
    '/',
    [
      body('x')
        .isInt({ min: -180, max: +180 })
        .withMessage('X coordinate must be a number between -180 and +180'),
      body('y')
        .isInt({ min: -90, max: +90 })
        .withMessage('X coordinate must be a number between -90 and +90'),
      body('direction')
        .isIn(['N', 'E', 'S', 'W'])
        .withMessage('Direction value must be one of N, E, S, W')
    ],
    validationService.isValid,
    routes.createRover
  )

  return route
}
