import { Rover, Direction } from '../models/rover'

const setupService = () => {
  return {
    create ({ x, y, direction }: { x: number; y: number; direction: string }) {
      return new Rover(x, y, (<any>Direction)[direction])
    }
  }
}

export default setupService()
