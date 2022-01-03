import { Matrix } from 'ml-matrix'
import { Direction, Commands } from './rover'
import fs from 'fs'

const unsignedLatitude = 90
const unsignedLongitude = 180
const maxRows = 180
const maxColumns = 360

const timeout = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms))

// X --> current position
// 0 --> not scanned
// 1 --> scanned and empty
// 2 --> scanned and NOT clear
class Surface {
  public matrix: Matrix
  public startRow: number
  public startColumn: number
  public startDirection: Direction
  public currentRow: number
  public currentColumn: number
  public currentDirection: Direction
  public commands: Array<String>

  constructor (
    startRow = 0,
    startColumn = 0,
    startDirection = Direction.Nord,
    currentRow = 0,
    currentColumn = 0,
    currentDirection = Direction.Nord
  ) {
    this.matrix = Matrix.ones(maxRows, maxColumns)

    this.startRow = startRow
    this.startColumn = startColumn
    this.startDirection = startDirection

    this.currentRow = currentRow
    this.currentColumn = currentColumn
    this.currentDirection = currentDirection

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

  public calcNextMove ({
    currentRow = this.currentRow,
    currentColumn = this.currentColumn,
    forceSearch = false,
    previousPositions = []
  }: {
    currentRow: number
    currentColumn: number
    forceSearch: boolean
    previousPositions: Array<any>
  }): any {
    if (
      currentRow == this.matrix.rows - 1 &&
      currentColumn == this.matrix.columns - 1
    ) {
      currentRow = 0
      currentColumn = -1
    }

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
        this.isValidCoordinate(el.row, el.col) === true &&
        this.isObstacle(el.row, el.col) !== true
      ) {
        if (
          this.isNotScanned(el.row, el.col) === true ||
          (forceSearch === true &&
            previousPositions.filter(v => v.row == el.row && v.col == el.col)
              .length === 0)
        )
          el.valid = true
      }

      return el
    })

    const firstValidWay = ways.filter(el => el.valid === true).shift()

    if (firstValidWay === undefined) {
      this.toFile()
      if (forceSearch === true)
        throw new Error('Blocked! Look at the map.txt file for a visual output')
      else
        return {
          error: true
        }
    }

    this.addEmpty(firstValidWay.row, firstValidWay.col)
    console.log(
      `Moving to ${firstValidWay.row} | ${firstValidWay.col} | ${firstValidWay.key}`
    )
    return firstValidWay
  }

  public async calcJourneyRecursive (
    force: boolean = false,
    previousPositions: Array<any> = []
  ): Promise<any> {
    if (this.isAllScanned() === true) {
      this.toFile()
      return {
        x: Surface.convertColumnToLongitude(this.currentColumn),
        y: Surface.convertRowToLatitude(this.currentRow),
        direction: this.currentDirection,
        commands: this.commands
      }
    }

    const {
      key: nextDirection,
      row: nextRow,
      col: nextCol,
      error: _error
    } = this.calcNextMove({
      currentRow: this.currentRow,
      currentColumn: this.currentColumn,
      forceSearch: force,
      previousPositions
    })
    if (_error === true)
      return await this.calcJourneyRecursive(true, previousPositions)

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

    if (force === true)
      previousPositions.push({
        row: this.currentRow,
        col: this.currentColumn
      })

    // Prevent Maximum call stack size exceeded error
    await timeout()
    return await this.calcJourneyRecursive(force, previousPositions)
  }

  // =================================================
  // STATIC HELPERS
  // =================================================
  public static convertRowToLatitude (value: number) {
    if (value !== 0) value += 1
    return value > unsignedLatitude
      ? unsignedLatitude + (0 - value)
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
