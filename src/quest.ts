const enum DIR {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

const CHAR_DIR = ["N", "E", "S", "W"];


const LETTER_DIR: { [key: string]: DIR } = {
  "N": DIR.NORTH,
  "E": DIR.EAST,
  "S": DIR.SOUTH,
  "W": DIR.WEST,
};


export function getDirection(dir: string): DIR | undefined {
  if (!dir) return undefined;  
  return LETTER_DIR[dir[0].toUpperCase()];
}

const ALLOWED_NEXT_DIRS: { [key: number]: DIR[] } = {
  [DIR.NORTH]: [DIR.NORTH, DIR.EAST, DIR.WEST],
  [DIR.EAST]: [DIR.EAST, DIR.NORTH, DIR.SOUTH],
  [DIR.SOUTH]: [DIR.SOUTH, DIR.EAST, DIR.WEST],
  [DIR.WEST]: [DIR.WEST, DIR.NORTH, DIR.SOUTH],
};

const directions = [DIR.NORTH, DIR.EAST, DIR.SOUTH, DIR.WEST];

function createMaze(size: number = 100): Array<number> {
  const randomIndex = Math.floor(Math.random() * directions.length);
  const randomDirection = directions[randomIndex];
  let maze: number[] = [randomDirection];

  for (let i = 0; i < size - 1; i++) {
    let directions = ALLOWED_NEXT_DIRS[maze[i]];
    const randomIndex = Math.floor(Math.random() * directions.length);
    const randomDirection = directions[randomIndex];
    maze.push(randomDirection);
  }
  return maze;
}

export default class Quest {
  readonly maze: Array<DIR>;
  readonly mazeSize: number;
  currentPosition: number;
  lastCheckPoint: number;

  constructor(mazeSize: number = 100) {
    this.mazeSize = mazeSize;
    this.maze = createMaze(this.mazeSize);
    this.currentPosition = 0;
    this.lastCheckPoint = 0;
  }

  move(direction: DIR): boolean {
    console.log(this.maze[this.currentPosition], direction);
    if (this.maze[this.currentPosition] == direction) {
      this.currentPosition++;

      if (this.currentPosition % 25 == 0) {
        this.lastCheckPoint = this.currentPosition;
      }

      // console.log("moved: ", this.currentPosition);
      return true;
    }

    this.currentPosition = this.lastCheckPoint;
    console.log(
      "You got caught by GENSLER, going back to last checkpoint: ",
      this.currentPosition
    );
    return false;
  }

  position(): number {
    return this.currentPosition;
  }

  wonGame(): boolean {
    const won = this.currentPosition == this.mazeSize;
    if (won) console.log("BRIAN HAS ESCAPED THE SEC!!");
    return won;
  }
  printMap() {
    console.log(this.maze);
  }
  printMapLetters() {
    let dir_maze = this.maze.map((element) => CHAR_DIR[element]);
    console.log(dir_maze);
  }
  printDirections() {
    const gridSize = 30; // Define the size of the grid
    const grid: string[][] = Array.from({ length: gridSize }, () =>
      Array.from({ length: gridSize }, () => " ")
    ); // Create a 2D grid filled with spaces

    // Starting position in the middle of the grid
    let x = Math.floor(gridSize / 2);
    let y = Math.floor(gridSize / 2);

    grid[y][x] = "S"; // Mark the starting point
    let symbol: string;
    // Function to move the position based on direction
    const move = (dir: DIR) => {
      switch (dir) {
        case DIR.NORTH:
          //   y = Math.max(0, y - 1);
          y--;
          symbol = "↑";
          break;
        case DIR.EAST:
          //   x = Math.min(gridSize - 1, x + 1);
          x++;
          symbol = "→";
          break;
        case DIR.SOUTH:
          //   y = Math.min(gridSize - 1, y + 1);
          y++;
          symbol = "↓";
          break;
        case DIR.WEST:
          //   x = Math.max(0, x - 1);
          x--;
          symbol = "←";
          break;
      }
      grid[y][x] = symbol; // Mark the path
    };

    // Apply each direction in the maze to move from the starting point
    this.maze.forEach((dir) => move(dir));

    // Convert the grid to a string and print it
    const gridString = grid.map((row) => row.join(" ")).join("\n");
    console.log(gridString);
  }
}

// let q = new Quest();
// q.printMap();
// q.printMapLetters();
//
// let validPath: number[] = [];
// // let currentPosition = 0;
// let direction: number;
// while (!q.wonGame()) {
//   // console.log("current position", q.currentPosition);
//   // console.log("valid path", validPath);
//   if (q.currentPosition < validPath.length) {
//     // console.log("following last path", validPath[q.currentPosition]);
//     direction = validPath[q.currentPosition];
//   } else {
//     const randomIndex = Math.floor(Math.random() * directions.length);
//     direction = directions[randomIndex];
//     // console.log("trying random direction", direction);
//   }

//   if (q.move(direction)) {
//     process.stdout.write(direction.toString())
//     if (q.currentPosition > validPath.length) {
//       validPath.push(direction);
//     }
//   }
// }
// console.log(JSON.stringify(q.maze));

// console.log(q.maze.length)
