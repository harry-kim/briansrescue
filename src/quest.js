"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirection = void 0;
var CHAR_DIR = ["N", "E", "S", "W"];
var LETTER_DIR = {
    "N": 0 /* DIR.NORTH */,
    "E": 1 /* DIR.EAST */,
    "S": 2 /* DIR.SOUTH */,
    "W": 3 /* DIR.WEST */,
};
function getDirection(dir) {
    if (!dir)
        return undefined;
    return LETTER_DIR[dir[0].toUpperCase()];
}
exports.getDirection = getDirection;
var ALLOWED_NEXT_DIRS = (_a = {},
    _a[0 /* DIR.NORTH */] = [0 /* DIR.NORTH */, 1 /* DIR.EAST */, 3 /* DIR.WEST */],
    _a[1 /* DIR.EAST */] = [1 /* DIR.EAST */, 0 /* DIR.NORTH */, 2 /* DIR.SOUTH */],
    _a[2 /* DIR.SOUTH */] = [2 /* DIR.SOUTH */, 1 /* DIR.EAST */, 3 /* DIR.WEST */],
    _a[3 /* DIR.WEST */] = [3 /* DIR.WEST */, 0 /* DIR.NORTH */, 2 /* DIR.SOUTH */],
    _a);
var directions = [0 /* DIR.NORTH */, 1 /* DIR.EAST */, 2 /* DIR.SOUTH */, 3 /* DIR.WEST */];
function createMaze(size) {
    if (size === void 0) { size = 100; }
    var randomIndex = Math.floor(Math.random() * directions.length);
    var randomDirection = directions[randomIndex];
    var maze = [randomDirection];
    for (var i = 0; i < size - 1; i++) {
        var directions_1 = ALLOWED_NEXT_DIRS[maze[i]];
        var randomIndex_1 = Math.floor(Math.random() * directions_1.length);
        var randomDirection_1 = directions_1[randomIndex_1];
        maze.push(randomDirection_1);
    }
    return maze;
}
var Quest = /** @class */ (function () {
    function Quest(mazeSize) {
        if (mazeSize === void 0) { mazeSize = 100; }
        this.mazeSize = mazeSize;
        this.maze = createMaze(this.mazeSize);
        this.currentPosition = 0;
        this.lastCheckPoint = 0;
    }
    Quest.prototype.move = function (direction) {
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
        console.log("You got caught by GENSLER, going back to last checkpoint: ", this.currentPosition);
        return false;
    };
    Quest.prototype.position = function () {
        return this.currentPosition;
    };
    Quest.prototype.wonGame = function () {
        var won = this.currentPosition == this.mazeSize;
        if (won)
            console.log("BRIAN HAS ESCAPED THE SEC!!");
        return won;
    };
    Quest.prototype.printMap = function () {
        console.log(this.maze);
    };
    Quest.prototype.printMapLetters = function () {
        var dir_maze = this.maze.map(function (element) { return CHAR_DIR[element]; });
        console.log(dir_maze);
    };
    Quest.prototype.printDirections = function () {
        var gridSize = 30; // Define the size of the grid
        var grid = Array.from({ length: gridSize }, function () {
            return Array.from({ length: gridSize }, function () { return " "; });
        }); // Create a 2D grid filled with spaces
        // Starting position in the middle of the grid
        var x = Math.floor(gridSize / 2);
        var y = Math.floor(gridSize / 2);
        grid[y][x] = "S"; // Mark the starting point
        var symbol;
        // Function to move the position based on direction
        var move = function (dir) {
            switch (dir) {
                case 0 /* DIR.NORTH */:
                    //   y = Math.max(0, y - 1);
                    y--;
                    symbol = "↑";
                    break;
                case 1 /* DIR.EAST */:
                    //   x = Math.min(gridSize - 1, x + 1);
                    x++;
                    symbol = "→";
                    break;
                case 2 /* DIR.SOUTH */:
                    //   y = Math.min(gridSize - 1, y + 1);
                    y++;
                    symbol = "↓";
                    break;
                case 3 /* DIR.WEST */:
                    //   x = Math.max(0, x - 1);
                    x--;
                    symbol = "←";
                    break;
            }
            grid[y][x] = symbol; // Mark the path
        };
        // Apply each direction in the maze to move from the starting point
        this.maze.forEach(function (dir) { return move(dir); });
        // Convert the grid to a string and print it
        var gridString = grid.map(function (row) { return row.join(" "); }).join("\n");
        console.log(gridString);
    };
    return Quest;
}());
exports.default = Quest;
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
