import { kv } from "@vercel/kv";
const enum DIR {
  NORTH = 0,
  EAST = 1,
  SOUTH = 2,
  WEST = 3,
}

const CHAR_DIR = ["N", "E", "S", "W"];

const LETTER_DIR: { [key: string]: DIR } = {
  N: DIR.NORTH,
  E: DIR.EAST,
  S: DIR.SOUTH,
  W: DIR.WEST,
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

const DEFAULT_SIZE: number = Number(process.env.DEFAULT_MAZE_SIZE) || 100;

export function createMaze(size: number = DEFAULT_SIZE): Array<number> {
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

async function getPosition(): Promise<number> {
  try {
    let currentPositionString: string =
      (await kv.get("currentPosition")) || "0";
    const currentPosition: number = parseInt(currentPositionString);
    return currentPosition;
  } catch (error) {
    console.log("error getting current position setting to 0", error);
    return 0;
  }
}

async function setPosition(position: number): Promise<void> {
  try {
    await kv.set("currentPosition", position);
  } catch (error) {
    console.log(`error setting current position setting to ${position}`, error);
  }
}

function printMapLetters(maze: Array<number>): void {
  let dir_maze = maze.map((element) => CHAR_DIR[element]);
  console.log(dir_maze);
}

export async function getMaze(): Promise<{
  maze: Array<number>;
  newGame: boolean;
}> {
  try {
    let maze: number[] | null = await kv.get("maze");
    let newGame = false;
    if (maze == null) {
      console.log("Maze not found in DB, generating new maze...");
      maze = createMaze();
      printMapLetters(maze);
      try {
        await kv.set("maze", maze);
        await kv.set("checkpoint", "0");
        await kv.set("currentPosition", "0");
        await kv.set("lastMoved", "0");
        await kv.del("lastMoved");
        newGame = true;
      } catch (error) {
        console.log("error saving new maze", error);
        throw error;
      }
    }
    return { maze, newGame };
  } catch (error) {
    console.log("error getting maze", error);
    throw error;
  }
}

async function gotoCheckpoint(): Promise<number> {
  try {
    let checkpointString: string = (await kv.get("checkpoint")) || "0";
    const checkpoint: number = parseInt(checkpointString);
    console.log("going to checkpoint", checkpoint);
    await setPosition(checkpoint);
    return checkpoint;
  } catch (error) {
    console.log("error getting checkpoint", error);
    throw error;
  }
}
async function saveCheckpoint(position: number): Promise<void> {
  try {
    await kv.set("checkpoint", position);
  } catch (error) {
    console.log(`error setting checkpoint to ${position}`, error);
  }
}

export async function move(
  direction: DIR
): Promise<{ position: number; caught: boolean; won: boolean }> {
  // console.log(this.maze[this.currentPosition], direction);
  const { maze } = await getMaze();

  let currentPosition: number = await getPosition();
  let wonGame: boolean = false;
  if (maze[currentPosition] == direction) {
    currentPosition++;
    if (currentPosition == maze.length - 1) {
      wonGame = true;
    }
    await setPosition(currentPosition);

    if (currentPosition % 25 == 0) {
      saveCheckpoint(currentPosition);
    }
    return { position: currentPosition, caught: false, won: wonGame };
  }
  console.log("You got caught by GENSLER, going back to last checkpoint");
  await gotoCheckpoint();

  return { position: currentPosition, caught: true, won: wonGame };
}
// export default class Quest {
//   readonly maze: Array<DIR>;
//   readonly mazeSize: number;
//   currentPosition: number;
//   lastCheckPoint: number;

//   constructor(mazeSize: number = 100) {
//     this.mazeSize = mazeSize;
//     this.maze = createMaze(this.mazeSize);
//     this.currentPosition = 0;
//     this.lastCheckPoint = 0;
//   }

//   position(): number {
//     return this.currentPosition;
//   }

//   wonGame(): boolean {
//     const won = this.currentPosition == this.mazeSize;
//     if (won) console.log("BRIAN HAS ESCAPED THE SEC!!");
//     return won;
//   }
//   printMap() {
//     console.log(this.maze);
//   }
//   printMapLetters() {
//     let dir_maze = this.maze.map((element) => CHAR_DIR[element]);
//     console.log(dir_maze);
//   }
//   printDirections() {
//     const gridSize = 30; // Define the size of the grid
//     const grid: string[][] = Array.from({ length: gridSize }, () =>
//       Array.from({ length: gridSize }, () => " ")
//     ); // Create a 2D grid filled with spaces

//     // Starting position in the middle of the grid
//     let x = Math.floor(gridSize / 2);
//     let y = Math.floor(gridSize / 2);

//     grid[y][x] = "S"; // Mark the starting point
//     let symbol: string;
//     // Function to move the position based on direction
//     const move = (dir: DIR) => {
//       switch (dir) {
//         case DIR.NORTH:
//           //   y = Math.max(0, y - 1);
//           y--;
//           symbol = "↑";
//           break;
//         case DIR.EAST:
//           //   x = Math.min(gridSize - 1, x + 1);
//           x++;
//           symbol = "→";
//           break;
//         case DIR.SOUTH:
//           //   y = Math.min(gridSize - 1, y + 1);
//           y++;
//           symbol = "↓";
//           break;
//         case DIR.WEST:
//           //   x = Math.max(0, x - 1);
//           x--;
//           symbol = "←";
//           break;
//       }
//       grid[y][x] = symbol; // Mark the path
//     };

//     // Apply each direction in the maze to move from the starting point
//     this.maze.forEach((dir) => move(dir));

//     // Convert the grid to a string and print it
//     const gridString = grid.map((row) => row.join(" ")).join("\n");
//     console.log(gridString);
//   }
// }

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
