import storage from "./storage";

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

export const DEFAULT_SIZE: number =
  Number(process.env.DEFAULT_MAZE_SIZE) || 100;

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

export async function getPosition(): Promise<number> {
  try {
    let currentPositionString: string =
      (await storage.get("currentPosition")) || "0";
    const currentPosition: number = parseInt(currentPositionString);
    return currentPosition;
  } catch (error) {
    console.log("error getting current position setting to 0", error);
    return 0;
  }
}
export async function getHighestPosition(): Promise<number> {
  try {
    let highestPositionString: string =
      (await storage.get("highestPosition")) || "0";
    const highestPosition: number = parseInt(highestPositionString);
    return highestPosition;
  } catch (error) {
    console.log("error getting highest position setting to 0", error);
    return 0;
  }
}

async function setPosition(position: number): Promise<void> {
  try {
    await storage.set("currentPosition", position);
    const lastHighestPosition = await storage.get("highestPosition");
    const highestPosition = Math.max(position, lastHighestPosition);
    await storage.set("highestPosition", highestPosition);
  } catch (error) {
    console.log(`error setting current position setting to ${position}`, error);
  }
}

export function mazeToLetters(maze: Array<number>): string[] {
  let dir_maze = maze.map((element) => CHAR_DIR[element]);
  return dir_maze;
}

export async function getMaze(): Promise<{
  maze: Array<number>;
  newGame: boolean;
}> {
  try {
    let maze: number[] | null = await storage.get("maze");
    let newGame = false;
    if (maze == null) {
      console.log("Maze not found in DB, generating new maze...");
      maze = createMaze();
      console.log(mazeToLetters(maze));
      try {
        await storage.set("maze", maze);
        let getmaze;
        try {
          getmaze = await storage.get("maze");
        } catch (error) {
          console.error("Error retrieving maze", error);
        }
        await storage.set("checkpoint", "0");
        await storage.set("currentPosition", "0");
        await storage.set("highestPosition", "0");
        await storage.del("lastMoved");
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
    let checkpointString: string = (await storage.get("checkpoint")) || "0";
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
    await storage.set("checkpoint", position);
  } catch (error) {
    console.log(`error setting checkpoint to ${position}`, error);
  }
}

export async function move(
  direction: DIR
): Promise<{ position: number; caught: boolean; won: boolean }> {
  const { maze } = await getMaze();

  let currentPosition: number = await getPosition();
  let wonGame: boolean = false;
  if (maze[currentPosition] == direction) {
    currentPosition++;
    if (currentPosition == maze.length) {
      wonGame = true;
      await storage.del("maze");
    }
    await setPosition(currentPosition);

    if (currentPosition % 10 == 0) {
      saveCheckpoint(currentPosition);
    }
    return { position: currentPosition, caught: false, won: wonGame };
  }
  console.log("You got caught by GENSLER, going back to last checkpoint");
  currentPosition = await gotoCheckpoint();

  return { position: currentPosition, caught: true, won: wonGame };
}
