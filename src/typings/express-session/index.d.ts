import 'express-session' // don't forget to import the original module
import { Rover } from '../../models/rover'
import { Surface } from '../../models/surface'
import { Socket } from 'socket.io'

declare module 'express-session' {
  interface SessionData {
    rover: Rover
    surface: Surface
    socket: Socket
  }
}
