import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import storage from "../storage";
import { createMaze, DEFAULT_SIZE, getMaze, move } from "../quest";

describe("Quest", () => {
  describe("createMaze", () => {
    it("should create a maze of default size if no size is provided", () => {
      const maze = createMaze();
      expect(maze.length).toBe(DEFAULT_SIZE);
    });

    it("should create a maze of the specified size", () => {
      const size = 50;
      const maze = createMaze(size);
      expect(maze.length).toBe(size);
    });
  });

  describe("getMaze", () => {
    beforeEach(() => {
      // Reset mocks/spies between tests if necessary
      jest.clearAllMocks();
    });
    it("should return the maze from storage if it exists", async () => {
      const existingMaze = [0, 1, 2, 3];
      const mockGet = jest
        .spyOn(storage, "get")
        .mockResolvedValue(existingMaze);

      try {
        await storage.set("maze", existingMaze);

        const result = await getMaze();

        expect(result.maze).toEqual(existingMaze);
        expect(result.newGame).toBe(false);
      } finally {
        mockGet.mockRestore();
      }
    });

    it("should generate a new maze and save it to storage if it doesn't exist", async () => {
      const mockGet = jest.spyOn(storage, "get").mockResolvedValue(null);
      const mockSet = jest.spyOn(storage, "set").mockResolvedValue();
      const mockDel = jest.spyOn(storage, "del").mockResolvedValue(1);

      try {
        const result = await getMaze();
        expect(result.newGame).toBe(true);
        expect(storage.set).toHaveBeenCalledWith("maze", expect.anything());
        expect(storage.set).toHaveBeenCalledWith("checkpoint", "0");
        expect(storage.set).toHaveBeenCalledWith("currentPosition", "0");
        expect(storage.del).toHaveBeenCalledWith("lastMoved");
      } finally {
        jest.restoreAllMocks();
      }
    });
  });

  describe("move", () => {
    it("should move to the next position if the direction is correct", async () => {
      const mazeResult = await getMaze();

      for (let i = 0; i < mazeResult.maze.length - 1; i++) {
        const direction = mazeResult.maze[i];
        const result = await move(direction);
        expect(result.position).toBe(i + 1);
        expect(result.caught).toBe(false);
        expect(result.won).toBe(false);
      }

      const result = await move(mazeResult.maze[mazeResult.maze.length - 1]);
      expect(result.position).toBe(mazeResult.maze.length);
      expect(result.caught).toBe(false);
      expect(result.won).toBe(true);
    });

    it("should go back to the last checkpoint if the direction is incorrect", async () => {
      const mazeResult = await getMaze();

      let pos = 0;
      let won = false;
      let checkpoints = new Map<number, boolean>();

      // Function to move in the maze and update position
      const makeMove = async (
        direction: number,
        expectedPos: number,
        expectedCaught: boolean
      ) => {
        const result = await move(direction);
        expect(result.position).toBe(expectedPos);
        expect(result.caught).toBe(expectedCaught);
        won = result.won;
        pos = result.position;
      };

      while (!won) {
        let direction = mazeResult.maze[pos];

        // Check if current position is a checkpoint
        if (pos % 25 === 24 && pos > 0 && !checkpoints.get(pos)) {
          checkpoints.set(pos, true);

          // Use wrong direction to go back to checkpoint
          direction = (direction + 1) % 4;
          await makeMove(direction, pos - 24, true);
        } else {
          await makeMove(direction, pos + 1, false);
        }
      }
    });
  });
});
