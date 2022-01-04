import { Matrix } from 'ml-matrix'
import { Direction, Commands } from './rover'
import fs from 'fs'

const unsignedLatitude = 90
const unsignedLongitude = 180
const maxRows = 180
const maxColumns = 360

enum LocationStatus {
  CURRENT = 'X',
  NOT_SCANNED = 0,
  EMPTY = 1,
  OBSTACLE = 2
}
interface Coordinate {
  row: number
  column: number
  direction: string
}

const timeout = (ms: number = 0) =>
  new Promise(resolve => setTimeout(resolve, ms))

class Surface {
  public matrix: Matrix
  public startLocation: Coordinate
  public currentLocation: Coordinate
  public commands: Array<String>

  constructor (start: Coordinate, current?: Coordinate) {
    this.matrix = Matrix.ones(maxRows, maxColumns)

    this.startLocation = this.currentLocation = start

    if (current) {
      this.currentLocation = current
    }

    this.commands = []

    this.initialize()
  }

  public initialize () {
    for (let row = 0; row < this.matrix.rows; row++) {
      for (let column = 0; column < this.matrix.columns; column++) {
        this.addNotScanned(<Coordinate>{ row, column })
      }
    }

    this.currentLocation = this.startLocation
    this.commands = []

    this.addEmpty(this.currentLocation)
  }

  public load (matrix: Array<Array<number>>) {
    matrix.forEach((element, row) =>
      element.forEach((value, column) => {
        let location = <Coordinate>{ row, column }
        if (value === LocationStatus.NOT_SCANNED) this.addNotScanned(location)
        if (value === LocationStatus.EMPTY) this.addEmpty(location)
        if (value === LocationStatus.OBSTACLE) this.addObstacle(location)
      })
    )
  }

  public addNotScanned (location: Coordinate): void {
    this.matrix.set(location.row, location.column, LocationStatus.NOT_SCANNED)
  }
  public addEmpty (location: Coordinate): void {
    this.matrix.set(location.row, location.column, LocationStatus.EMPTY)
  }
  public addObstacle (location: Coordinate): void {
    this.matrix.set(location.row, location.column, LocationStatus.OBSTACLE)
  }

  public isValid (location: Coordinate): boolean {
    return (
      location.row >= 0 &&
      location.column >= 0 &&
      location.row <= this.matrix.rows - 1 &&
      location.column <= this.matrix.columns - 1
    )
  }
  public isNotScanned (location: Coordinate): boolean {
    return (
      this.isValid(location) &&
      this.matrix.get(location.row, location.column) ===
        LocationStatus.NOT_SCANNED
    )
  }
  public isEmpty (location: Coordinate): boolean {
    return (
      this.isValid(location) &&
      this.matrix.get(location.row, location.column) === LocationStatus.EMPTY
    )
  }
  public isObstacle (location: Coordinate): boolean {
    return (
      this.isValid(location) &&
      this.matrix.get(location.row, location.column) === LocationStatus.OBSTACLE
    )
  }

  public setPosition (location: Coordinate): void {
    this.currentLocation = location
  }

  public calcNextMove ({
    location = this.currentLocation,
    forceSearch = false,
    previousLocations = []
  }: {
    location: Coordinate
    forceSearch: boolean
    previousLocations: Array<Coordinate>
  }): Coordinate | any {
    if (
      location.row == this.matrix.rows - 1 &&
      location.column == this.matrix.columns - 1
    ) {
      location.row = 0
      location.column = -1
    }

    let ways: Array<any> = [
      {
        location: <Coordinate>{
          ...location,
          direction: Direction.Nord,
          row: location.row + 1
        },
        valid: false
      },
      {
        location: <Coordinate>{
          ...location,
          direction: Direction.Sud,
          row: location.row - 1
        },
        valid: false
      },
      {
        location: <Coordinate>{
          ...location,
          direction: Direction.Est,
          column: location.column + 1
        },
        valid: false
      },
      {
        location: <Coordinate>{
          ...location,
          direction: Direction.Ovest,
          column: location.column - 1
        },
        valid: false
      }
    ]

    ways = ways.map(el => {
      if (
        this.isValid(el.location) === true &&
        this.isObstacle(el.location) !== true
      ) {
        if (
          this.isNotScanned(el.location) === true ||
          (forceSearch === true &&
            previousLocations.filter(
              v => v.row == el.row && v.column == el.column
            ).length === 0)
        )
          el.valid = true
      }

      return el
    })

    const firstValidWay = ways.filter(el => el.valid === true).shift()

    if (firstValidWay === undefined) {
      if (forceSearch === true) {
        this.toFile()
        throw new Error('Blocked! Look at the map.txt file for a visual output')
      } else
        return {
          error: true
        }
    }

    this.addEmpty(firstValidWay.location)
    console.log(
      `Moving to ${firstValidWay.location.row} | ${firstValidWay.location.column} | ${firstValidWay.location.direction}`
    )
    return firstValidWay
  }

  public async calcJourneyRecursive (
    force: boolean = false,
    previousLocations: Array<Coordinate> = []
  ): Promise<any> {
    if (this.isAllScanned() === true) {
      return {
        x: Surface.convertColumnToLongitude(this.currentLocation.column),
        y: Surface.convertRowToLatitude(this.currentLocation.row),
        direction: this.currentLocation.direction,
        commands: this.commands
      }
    }

    const { location: _currentLocation, error: _error } = this.calcNextMove({
      location: this.currentLocation,
      forceSearch: force,
      previousLocations
    })
    if (_error === true)
      return await this.calcJourneyRecursive(true, previousLocations)

    switch (_currentLocation.direction) {
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

    this.currentLocation = _currentLocation

    if (force === true) previousLocations.push(_currentLocation)

    // Prevent Maximum call stack size exceeded error
    await timeout()
    return await this.calcJourneyRecursive(force, previousLocations)
  }

  // =================================================
  // STATIC HELPERS
  // =================================================
  public static convertRowToLatitude (row: number): number {
    if (row !== 0) row += 1
    return row > unsignedLatitude
      ? unsignedLatitude + (0 - row)
      : unsignedLatitude - row
  }
  public static convertColumnToLongitude (column: number): number {
    if (column !== 0) column += 1
    return column > unsignedLongitude
      ? column - unsignedLongitude
      : 0 - unsignedLongitude + column
  }
  public static convertLatitudeToRow (latitude: number): number {
    return unsignedLatitude - 1 + latitude
  }
  public static convertLongitudeToColumn (longitude: number): number {
    return unsignedLongitude - 1 + longitude
  }
  public static calcObstaclePosition (position: Coordinate): Coordinate {
    switch (position.direction) {
      case Direction.Nord:
        position = { ...position, row: position.row + 1 }
        break
      case Direction.Sud:
        position = { ...position, row: position.row - 1 }
        break
      case Direction.Ovest:
        position = { ...position, column: position.column - 1 }
        break
      case Direction.Est:
        position = { ...position, column: position.column + 1 }
        break
      default:
        break
    }

    return position
  }

  // =================================================
  // OTHERS
  // =================================================
  public isAllScanned (): boolean {
    for (let row = 0; row < this.matrix.rows; row++) {
      for (let column = 0; column < this.matrix.columns; column++) {
        if (this.isEmpty(<Coordinate>{ row, column }) !== true) return false
      }
    }

    return true
  }
  public toString = (): string => {
    let output = ''

    for (let row = 0; row < this.matrix.rows; row++) {
      for (let column = 0; column < this.matrix.columns; column++) {
        if (column != 0 && column != this.matrix.columns) output += ' | '

        if (
          row == this.currentLocation.row &&
          column == this.currentLocation.column
        )
          output += 'X'
        else output += this.matrix.get(row, column)
        // output += this.matrix.get(row, col)
      }
      output += '\r\n'
    }

    return output
  }
  public toFile (): void {
    fs.writeFileSync('map.txt', this.toString())
  }
}

export {
  unsignedLatitude,
  unsignedLongitude,
  maxRows,
  maxColumns,
  Surface,
  Coordinate
}
