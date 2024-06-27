process.env.MOCK_NEYNAR = "true";
process.env.MOCK_KV = "true";
process.env.COOLDOWN_TIME = "0";
process.env.DEFAULT_MAZE_SIZE = "20";

import request from "supertest";
import storage from "../storage";
import * as quest from "../quest";
import neynarClient from "../neynarClient";
import { hash } from "crypto";
import { server } from "../index";

beforeEach(() => {
  storage.del("maze");
});

afterAll((done) => {
  server.close(done);
});
describe("POST /", () => {
  it("should return 400 if command is unrecognized", async () => {
    const response = await request(server)
      .post("/")
      .send({
        data: {
          text: "!movebrian invalid",
          author: {
            fid: "123",
          },
        },
      });
    expect(response.status).toBe(400);
    expect(response.text).toBe("Unrecognized command");
  });

  it("should return 429 if there is a cooldown", async () => {
    // Mock the storage.hget function to return a recent command time
    jest.spyOn(storage, "hget").mockResolvedValueOnce(new Date().toISOString());
    jest.spyOn(neynarClient, "replyCast");

    const response = await request(server)
      .post("/")
      .send({
        data: {
          text: "!movebrian north",
          author: {
            fid: "123",
          },
          hash: "mockHash",
        },
      });
    expect(response.status).toBe(429);
    expect(response.text).toContain("You must wait");
    expect(neynarClient.replyCast).toHaveBeenCalledWith(
      expect.stringContaining("You must wait"),
      "mockHash"
    );
  });

  it("should return 500 if failed to set command time", async () => {
    // Mock the storage.hset function to throw an error
    jest
      .spyOn(storage, "hset")
      .mockRejectedValueOnce(new Error("Failed to set command time"));

    const response = await request(server)
      .post("/")
      .send({
        data: {
          text: "!movebrian north",
          author: {
            fid: "123",
          },
        },
      });
    expect(response.status).toBe(500);
    expect(response.text).toBe("Failed to set command time");
  });

  it("should return 200 and move successfully", async () => {
    // Mock the move function to return a successful move result
    jest.spyOn(quest, "move").mockResolvedValueOnce({
      position: 1,
      caught: false,
      won: false,
    });
    jest.spyOn(neynarClient, "replyCast");

    const response = await request(server)
      .post("/")
      .send({
        data: {
          text: "!movebrian north",
          author: {
            fid: "123",
          },
          hash: "mockHash",
        },
      });
    expect(response.status).toBe(200);
    expect(response.text).toContain("Brian moved");
    expect(neynarClient.replyCast).toHaveBeenCalledWith(
      expect.stringContaining("Brian moved"),
      "mockHash"
    );
  });

  it("should return 500 if an error occurs", async () => {
    // Mock the move function to throw an error
    jest
      .spyOn(quest, "move")
      .mockRejectedValueOnce(new Error("Something went wrong"));

    const response = await request(server)
      .post("/")
      .send({
        data: {
          text: "!movebrian north",
          author: {
            fid: "123",
          },
        },
      });
    expect(response.status).toBe(500);
    expect(response.text).toBe("Something went wrong");
  });
});

describe("POST /startGame", () => {
  it("should return 401 if API key is missing or incorrect", async () => {
    const response = await request(server).post("/startGame");
    expect(response.status).toBe(401);
    expect(response.text).toBe("Unauthorized");
  });

  it("should return 200 and start a new game", async () => {
    const response = await request(server)
      .post("/startGame")
      .set("x-api-key", process.env.START_API_KEY || "");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Game started successfully!");
  });

  it("should return 200 and indicate that the game is already started", async () => {
    await request(server)
      .post("/startGame")
      .set("x-api-key", process.env.START_API_KEY || "");
    const response = await request(server)
      .post("/startGame")
      .set("x-api-key", process.env.START_API_KEY || "");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Game already started!");
  });
});

describe("GET /", () => {
  it("should return 200 and a hello message", async () => {
    const response = await request(server).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello world!");
  });
});

describe.skip("Play the game", () => {
  it("should be able to finish the game", async () => {
    jest.setTimeout(999999999); // Setting a very long timeout
    const response = await request(server)
      .post("/startGame")
      .set("x-api-key", process.env.START_API_KEY || "");
    expect(response.status).toBe(200);
    expect(response.text).toBe("Game started successfully!");

    let won = false;
    let knownPath: Array<string> = [];
    let currentPosition = 0;
    let moveResponse;
    while (!won) {
      if (currentPosition < knownPath.length) {
        moveResponse = await request(server)
          .post("/")
          .send({
            data: {
              text: `!movebrian ${knownPath[currentPosition]}`,
              author: {
                fid: "123",
              },
            },
          });
        expect(moveResponse.status).toBe(200);
        currentPosition++;
      } else {
        const directions = ["N", "E", "S", "W"];
        const randomIndex = Math.floor(Math.random() * directions.length);
        const randomDirection = directions[randomIndex];
        moveResponse = await request(server)
          .post("/")
          .send({
            data: {
              text: `!movebrian ${randomDirection}`,
              author: {
                fid: "123",
              },
            },
          });

        expect(moveResponse.status).toBe(200);
        if (moveResponse.text.includes("Brian moved")) {
          currentPosition++;
          knownPath.push(randomDirection);
        }
      }

      if (moveResponse.text.includes(`Going back to last checkpoint`)) {
        currentPosition = parseInt(moveResponse.text.split(": ")[1]);
      }
      if (moveResponse.text.includes("You win!!!")) {
        won = true;
      }
    }
  });
});
