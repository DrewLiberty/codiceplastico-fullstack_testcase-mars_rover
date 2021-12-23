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
      const startRow = Surface.convertLatitudeAsRow(y)
      const startColumn = Surface.convertLongitudeAsColumn(x)
      return new Surface(startRow, startColumn, (<any>Direction)[direction])
    },
    getJourney (surface: Surface) {
      return surface.calcJourney()
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
      const currentRow = Surface.convertLatitudeAsRow(y)
      const currentColumn = Surface.convertLongitudeAsColumn(x)
      const obstaclePosition = Surface.calcObstaclePosition({
        row: currentRow,
        column: currentColumn,
        direction
      })

      surface.addObstacle(obstaclePosition.row, obstaclePosition.column)
      surface.setPosition({
        row: currentRow,
        column: currentColumn,
        direction: (<any>Direction)[direction]
      })
    }
  }
}

export default setupService()
