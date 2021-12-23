import 'express-session' // don't forget to import the original module
import { Rover } from '../../models/rover'
import { Surface } from '../../models/surface'

declare module 'express-session' {
  interface SessionData {
    rover: Rover
    surface: Surface
  }
}
