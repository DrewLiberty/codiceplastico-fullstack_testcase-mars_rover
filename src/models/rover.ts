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
    public x: number = 0,
    public y: number = 0,
    public direction: Direction = Direction.Nord
  ) {}
}

export { Direction, Commands, Rover }
