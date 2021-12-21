import 'express-session' // don't forget to import the original module
import { Rover } from '../../models/rover'

declare module 'express-session' {
  interface SessionData {
    rover: Rover
  }
}
