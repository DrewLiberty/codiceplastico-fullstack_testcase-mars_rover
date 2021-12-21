enum Direction {
  Nord = 'N',
  Sud = 'S',
  Est = 'E',
  Ovest = 'O'
}

class Rover {
  constructor (
    public x: number,
    public y: number,
    public direction: Direction
  ) {}
}

export { Rover, Direction }
