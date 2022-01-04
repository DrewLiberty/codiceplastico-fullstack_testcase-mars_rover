import { Socket } from 'socket.io'
import { Surface, Coordinate } from '../models/surface'

const setupService = () => {
  return {
    create ({
      x,
      y,
      direction
    }: {
      x: number
      y: number
      direction: string
    }): Surface {
      const row = Surface.convertLatitudeToRow(y)
      const column = Surface.convertLongitudeToColumn(x)
      return new Surface(<Coordinate>{ row, column, direction })
    },
    async getJourney (surface: Surface) {
      return await surface.calcJourneyRecursive()
    },
    async getJourneyStreamed (surface: Surface, socket: Socket) {
      return await surface.calcJourneyRecursive(false, [], message => {
        socket.send(message)
      })
    },
    reportObstacle (
      surface: Surface,
      {
        x,
        y,
        direction
      }: {
        x: number
        y: number
        direction: string
      }
    ) {
      const currentRow = Surface.convertLatitudeToRow(y)
      const currentColumn = Surface.convertLongitudeToColumn(x)
      const {
        row: obstacleRow,
        column: obstacleColumn
      } = Surface.calcObstaclePosition({
        row: currentRow,
        column: currentColumn,
        direction
      })

      surface.addObstacle(<Coordinate>{
        row: obstacleRow,
        column: obstacleColumn
      })
      surface.setPosition({
        row: currentRow,
        column: currentColumn,
        direction
      })

      surface.toFile()
    }
  }
}

export default setupService()
