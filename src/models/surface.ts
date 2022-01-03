import { Matrix } from 'ml-matrix'
import { Direction, Commands } from './rover'
import fs from 'fs'

const unsignedLatitude = 90
const unsignedLongitude = 180
const maxRows = 180
const maxColumns = 360

// X --> current position
// 0 --> not scanned
// 1 --> scanned and empty
// 2 -->scanned and NOT clear
class Surface {
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
        this.addNotScanned(row, col)
      }
    }

    this.currentRow = this.startRow
    this.currentColumn = this.startColumn
    this.currentDirection = this.startDirection
    this.commands = []

    this.addEmpty(this.currentRow, this.currentColumn)
  }

  public addNotScanned (row: number, col: number): void {
    this.matrix.set(row, col, 0)
  }
  public addEmpty (row: number, col: number): void {
    this.matrix.set(row, col, 1)
  }
  public addObstacle (row: number, col: number): void {
    this.matrix.set(row, col, 2)
  }
  public isValidCoordinate (row: number, col: number): boolean {
    return (
      row >= 0 &&
      col >= 0 &&
      row <= this.matrix.rows - 1 &&
      col <= this.matrix.columns - 1
    )
  }
  public isNotScanned (row: number, col: number): boolean {
    return this.isValidCoordinate(row, col) && this.matrix.get(row, col) === 0
  }
  public isScanned (row: number, col: number): boolean {
    return this.isValidCoordinate(row, col) && this.matrix.get(row, col) === 1
  }
  public isObstacle (row: number, col: number): boolean {
    // console.log('===========')
    // console.log(row)
    // console.log(col)
    // if (
    //   row >= 0 &&
    //   col >= 0 &&
    //   row <= this.matrix.rows - 1 &&
    //   col <= this.matrix.columns - 1
    // )
    //   console.log(this.matrix.get(row, col))
    return this.isValidCoordinate(row, col) && this.matrix.get(row, col) === 2
  }

  public setPosition ({
    row,
    column,
    direction
  }: {
    row: number
    column: number
    direction: Direction
  }): void {
    this.currentRow = row
    this.currentColumn = column
    this.currentDirection = direction
  }

  public calcNextMove (
    currentRow: number = this.currentRow,
    currentColumn: number = this.currentColumn
  ): any {
    if (currentRow == this.matrix.rows) currentRow = 0
    if (currentColumn == this.matrix.columns) currentColumn = 0

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
      if (
        this.isNotScanned(el.row, el.col) === true &&
        this.isObstacle(el.row, el.col) !== true
      )
        el.valid = true

      return el
    })

    console.log(ways)

    const firstValidWay = ways.filter(el => el.valid === true).shift()

    if (firstValidWay === undefined) {
      this.toFile()
      throw new Error('Blocked! Look at the map.txt file for a visual output')
    }

    this.addEmpty(firstValidWay.row, firstValidWay.col)
    console.log(
      `Moving to ${firstValidWay.row} | ${firstValidWay.col} | ${firstValidWay.key}`
    )
    return firstValidWay
  }

  public calcJourney () {
    for (let i = 0; i < this.matrix.size; i++) {
      if (this.isAllScanned() === true) break

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
          throw new Error('Unexpected direction')
          break
      }

      this.currentRow = nextRow
      this.currentColumn = nextCol
    }
    console.log('Row: ' + this.currentRow)
    console.log('Column: ' + this.currentColumn)

    this.toFile()

    return {
      x: Surface.convertColumnToLongitude(this.currentColumn),
      y: Surface.convertRowToLatitude(this.currentRow),
      direction: this.currentDirection,
      commands: this.commands
    }
  }

  // =================================================
  // STATIC HELPERS
  // =================================================
  public static convertRowToLatitude (value: number) {
    if (value !== 0) value += 1
    return value > unsignedLatitude
      ? 0 - unsignedLatitude - value
      : unsignedLatitude - value
  }
  public static convertColumnToLongitude (value: number) {
    if (value !== 0) value += 1
    return value > unsignedLongitude
      ? value - unsignedLongitude
      : 0 - unsignedLongitude + value
  }
  public static convertLatitudeToRow (value: number) {
    return unsignedLatitude - 1 + value
  }
  public static convertLongitudeToColumn (value: number) {
    return unsignedLongitude - 1 + value
  }
  public static calcObstaclePosition ({
    row,
    column,
    direction
  }: {
    row: number
    column: number
    direction: string
  }) {
    const directionEnum = (<any>Direction)[direction]

    switch (directionEnum) {
      case Direction.Nord:
        row += 1
        break
      case Direction.Sud:
        row -= 1
        break
      case Direction.Ovest:
        column -= 1
        break
      case Direction.Est:
        column += 1
        break
      default:
        break
    }

    return {
      row,
      column,
      direction: directionEnum
    }
  }

  // =================================================
  // OTHERS
  // =================================================
  public isAllScanned () {
    let result = true

    for (let row = 0; row < this.matrix.rows; row++) {
      for (let col = 0; col < this.matrix.columns; col++) {
        if (this.isScanned(row, col) !== true) result = false
      }
    }

    return result
  }
  public toString = (): string => {
    let output = ''

    for (let row = 0; row < this.matrix.rows; row++) {
      for (let col = 0; col < this.matrix.columns; col++) {
        if (col != 0 && col != this.matrix.columns) output += ' | '

        if (row == this.currentRow && col == this.currentColumn) output += 'X'
        else output += this.matrix.get(row, col)
      }
      output += '\r\n'
    }

    return output
  }
  public toFile () {
    fs.writeFileSync('map.txt', this.toString())
  }
}

export { unsignedLatitude, unsignedLongitude, maxRows, maxColumns, Surface }
