import { Matrix } from 'ml-matrix'
import { Direction, Commands } from './rover'

const unsignedLatitude = 90
const unsignedLongitude = 180
const maxRows = 180
const maxColumns = 360

// 0 --> empty
// 1 --> obstacle
export default class Surface {
  public matrix: Matrix
  public startRow: number
  public startColumn: number
  public startDirection: Direction
  public currentRow: number
  public currentColumn: number
  public currentDirection: Direction
  public commands: Array<String>

  constructor (startRow = 0, startColumn = 0, startDirection = Direction.Nord) {
    this.matrix = Matrix.ones(maxRows, maxColumns)

    this.startRow = startRow
    this.startColumn = startColumn
    this.startDirection = startDirection

    this.currentRow = this.startRow
    this.currentColumn = this.startColumn
    this.currentDirection = this.startDirection

    this.commands = []

    this.initialize()
  }

  public initialize () {
    for (let row = 0; row < this.matrix.rows; row++) {
      for (let col = 0; col < this.matrix.columns; col++) {
        this.addEmpty(row, col)
      }
    }

    this.currentRow = this.startRow
    this.currentColumn = this.startColumn
    this.currentDirection = this.startDirection
    this.commands = []
  }

  public addEmpty (row: number, col: number): void {
    this.matrix.set(row, col, 0)
  }
  public addObstacle (row: number, col: number): void {
    this.matrix.set(row, col, 1)
  }
  public isObstacle (row: number, col: number): boolean {
    return (
      row <= this.matrix.rows &&
      col <= this.matrix.columns &&
      this.matrix.get(row, col) === 1
    )
  }

  public calcNextMove (
    currentRow: number = this.currentRow,
    currentColumn: number = this.currentColumn
  ): any {
    let ways: Array<any> = [
      {
        key: Direction.Nord,
        row: currentRow + 1,
        col: currentColumn,
        valid: false
      },
      {
        key: Direction.Sud,
        row: currentRow - 1,
        col: currentColumn,
        valid: false
      },
      {
        key: Direction.Est,
        row: currentRow,
        col: currentColumn + 1,
        valid: false
      },
      {
        key: Direction.Ovest,
        row: currentRow,
        col: currentColumn - 1,
        valid: false
      }
    ]

    ways = ways.map(el => {
      if (!this.isObstacle(el.row, el.col)) return { ...el, valid: true }
    })

    const firstValidWay = ways.filter(el => el.valid === true).shift()
    if (firstValidWay) return firstValidWay
    else {
      throw new Error('Blocked')
    }
  }

  public calcJourney () {
    for (let i = 0; i < this.matrix.size; i++) {
      let {
        key: nextDirection,
        row: nextRow,
        col: nextCol
      } = this.calcNextMove(this.currentRow, this.currentColumn)
      // let newPosition = this.matrix.get(nextRow, nextCol)

      switch (nextDirection) {
        case Direction.Nord:
          this.commands.push(Commands.Forward)
          break
        case Direction.Sud:
          this.commands.push(Commands.Backward)
          break
        case Direction.Ovest:
          this.commands.push(Commands.Left)
          break
        case Direction.Est:
          this.commands.push(Commands.Right)
          break
        default:
          break
      }

      this.currentRow = nextRow
      this.currentColumn = nextCol
    }

    const rowAsLatitude =
      this.currentRow > unsignedLatitude
        ? unsignedLatitude - this.currentRow
        : this.currentRow - unsignedLatitude
    const rowAsLongitude =
      this.currentColumn > unsignedLongitude
        ? unsignedLongitude - this.currentColumn
        : this.currentColumn - unsignedLongitude

    return {
      x: rowAsLongitude,
      y: rowAsLatitude,
      direction: this.currentDirection,
      commands: this.commands
    }
  }
}
