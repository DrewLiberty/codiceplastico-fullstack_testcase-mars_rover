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
  }
}

export default validationService
