enum Direction {
  Nord = 'N',
  Sud = 'S',
  Est = 'E',
  Ovest = 'O'
}

enum Commands {
  Forward = 'F',
  Backward = 'B',
  Left = 'L',
  Right = 'R'
}

class Rover {
  constructor (
    public x: number,
    public y: number,
    public direction: Direction
  ) {}
}

export { Direction, Commands, Rover }
