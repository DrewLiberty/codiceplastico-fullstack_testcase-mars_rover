import { Surface } from '../models/surface'
import { Direction } from '../models/rover'

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
      const startRow = Surface.convertLatitudeToRow(y)
      const startColumn = Surface.convertLongitudeToColumn(x)
      return new Surface(startRow, startColumn, (<any>Direction)[direction])
    },
    async getJourney (surface: Surface) {
      return await surface.calcJourneyRecursive().then(v => v)
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
        column: obstacleColumn,
        direction: obstacleDirection
      } = Surface.calcObstaclePosition({
        row: currentRow,
        column: currentColumn,
        direction
      })

      surface.addObstacle(obstacleRow, obstacleColumn)
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
