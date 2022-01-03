import express from 'express'
import { validationResult } from 'express-validator'

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
  }
}

export default validationService
