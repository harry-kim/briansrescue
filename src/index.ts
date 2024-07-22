import dotenv from "dotenv";
dotenv.config();

import neynarClient from "./neynarClient";
import { getDirection, move, getMaze, getPosition } from "./quest";
import storage from "./storage";
import { Request, Response } from "express";
import express from "express";
import satori from "satori";
import { cooldownImage, currentPosition, lastMovesFrame } from "./frame";

const DEFAULT_COOLDOWN: number = 4 * 60 * 60 * 1000; // 4 hours in milliseconds, clearly defined as a constant
const CHANNEL = process.env.CHANNEL || "brians-rescue";
const COOLDOWN_TIME: number =
  Number(process.env.COOLDOWN_TIME) || DEFAULT_COOLDOWN;

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

const BRIAN_ESCAPE_IMGURL =
  "https://yellow-charming-gull-339.mypinata.cloud/ipfs/QmS6CumVsHfqpRkHDpwQTPV2cQH6GJH3LYFH4dRK4AgMs2";
const BRIAN_FRAME_BACKGROUND =
  "https://yellow-charming-gull-339.mypinata.cloud/ipfs/QmSwD2awem6wRibta2GXUiNt1Lormb2xYCAighv8onPooo";
function createWinningMessage(username: string) {
  return `
    🚀✨ VICTORY! ✨🚀
    🔥 @${username} rescued Brian from Gary and the SEC office! 🔥
    🎉 Brian is FREE! 🎉
    🏆 Your bravery is legendary! 🏆
    🥳 /1337 Skulls hail you! 🥳
  `;
}

async function isEventProcessed(hash: string) {
  const exists = await storage.hget("processed_events", hash);
  if (exists) {
    return true;
  } else {
    await storage.hset("processed_events", {
      [hash]: true,
    });
    return false;
  }
}

app.post("/", async (req: Request, res: Response) => {
  try {
    if (!process.env.SIGNER_UUID) {
      throw new Error("Make sure you set SIGNER_UUID in your .env file");
    }

    const hookData = req.body;
    if (
      !hookData ||
      !hookData.data ||
      !hookData.data.hash ||
      hookData.data.parent_hash
    ) {
      return res.status(400).send("Invalid event");
    }
    const hash = hookData.data.hash;
    // Check if the event has already been processed
    const processed = await isEventProcessed(hash);
    if (processed) {
      console.log("Duplicate event received, ignoring:", hash);
      return res.status(200).send("Event already processed");
    }

    const letterDirection = hookData.data.text.split(/\s+/)[1].toUpperCase();
    const direction = getDirection(letterDirection);

    if (typeof direction === "undefined") {
      console.log("unrecognized command: ", letterDirection);
      return res.status(400).send("Unrecognized command");
    }

    const now = new Date();
    const authorFid = hookData.data.author.fid;

    const cooldownCheck = await checkCooldown(authorFid, now);
    if (cooldownCheck.isCooldown) {
      console.log(cooldownCheck.message);
      await neynarClient.replyCast(cooldownCheck.message, hookData.data.hash);
      return res.status(429).send(cooldownCheck.message);
    }

    const moveResult = await move(direction);

    try {
      await storage.hset("lastMoved", {
        [authorFid]: now.toISOString(),
      });
    } catch (error) {
      console.log(`Failed to set time of last command for ${authorFid}`, error);
      return res.status(500).send("Failed to set command time");
    }

    const replyText = generateReplyText(moveResult, letterDirection);
    await neynarClient.replyCast(replyText, hookData.data.hash);
    if (moveResult.won) {
      await neynarClient.postCast(
        createWinningMessage(hookData.data.author.username),
        CHANNEL
      );
      startGame();
    }
    return res.send(replyText);
  } catch (e: any) {
    console.log(e);
    return res.status(500).send(e.message);
  }
});

async function checkCooldown(
  authorFid: string,
  now: Date = new Date()
): Promise<{ isCooldown: boolean; message: string; cooldownTime: string }> {
  try {
    const date: string = (await storage.hget("lastMoved", authorFid)) || "";
    const lastCommandTime = new Date(date);
    const diffSinceLastCommand = now.getTime() - lastCommandTime.getTime();
    const remainingCooldownTime = COOLDOWN_TIME - diffSinceLastCommand;
    if (diffSinceLastCommand < COOLDOWN_TIME) {
      const totalSeconds = Math.floor(remainingCooldownTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const message = `You must wait ${hours} hours, ${minutes} minutes, and ${seconds} seconds until you can move Brian again!`;

      // pad the first digit with zero if its a single digit eg 01:01:01
      const paddedHours = hours.toString().padStart(2, "0");
      const paddedMinutes = minutes.toString().padStart(2, "0");
      const paddedSeconds = seconds.toString().padStart(2, "0");
      const cooldownTime = `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
      return { isCooldown: true, message, cooldownTime };
    }
    return { isCooldown: false, message: "", cooldownTime: "" };
  } catch (error) {
    console.log(`Failed to get time of last command for ${authorFid}`, error);
    return {
      isCooldown: true,
      message: "Failed to get command time",
      cooldownTime: "",
    };
  }
}

function generateReplyText(moveResult: any, letterDirection: string): string {
  if (!moveResult.caught) {
    if (moveResult.won) {
      return `Brian has successfully escaped the SEC offices!\n You win!!!`;
    } else {
      return `Brian moved ${letterDirection}\nCurrent position ${moveResult.position}`;
    }
  } else {
    return `Brian got caught by Gensler!\nGoing back to last checkpoint: ${moveResult.position}`;
  }
}

export async function startGame(): Promise<boolean> {
  try {
    const { maze, newGame } = await getMaze();
    if (!newGame) {
      return false;
    }

    if (!process.env.SIGNER_UUID) {
      throw new Error("Make sure you set SIGNER_UUID in your .env file");
    }

    const newGameMessage = `🚨 **BRIAN TRAPPED AT SEC!** 🚨  
    Caught in a cat and mouse game, Brian faces Gary's interrogation. 
    /1337 breaches SEC’s comms, offering a lifeline.
    
    Can they help him escape? Join and outsmart!  
    👾 Play: !movebrian <dir> #EscapeTheSEC #1337Hackers`;

    const postGame = await neynarClient.postCast(newGameMessage, CHANNEL);
    console.log("newgame:", postGame);
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
}

app.post("/startGame", async (req: Request, res: Response) => {
  const apiKey = req.headers["x-api-key"]; // Typically sent in headers for better security

  if (!apiKey || apiKey !== process.env.START_API_KEY) {
    return res.status(401).send("Unauthorized");
  }
  const newGame = await startGame();

  if (newGame) {
    res.status(200).send("Game started successfully!");
  } else {
    res.status(200).send("Game already started!");
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world!");
});

app.get("/frame/cooldown", async (req: Request, res: Response) => {
  const fid = (req.query.fid as string) || "";
  const cooldown = await checkCooldown(fid);
  cooldownImage(req, res, cooldown.cooldownTime || "0");
});

app.get("/frame/currentPosition", async (req: Request, res: Response) => {
  const position = (req.query.position as string) || "";
  const length = (req.query.length as string) || "";
  currentPosition(req, res, position, length);
});

app.get("/frame/lastMoves", async (req: Request, res: Response) => {
  const position = await getPosition();
  const maze = (await getMaze()).maze;
  const lastMoves = maze.slice(0, position);
  lastMovesFrame(req, res, lastMoves);
});

app.get("/frame", (req: Request, res: Response) => {
  const server_url = req.protocol + "://" + req.get("host") + req.originalUrl;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
				<meta property="fc:frame" content="vNext" />
				<meta property="fc:frame:image" content="${BRIAN_FRAME_BACKGROUND}" />
				<meta property="fc:frame:post_url" content="${server_url}" />
        <meta property="fc:frame:button:1" content="Cooldown" />
        <meta property="fc:frame:button:2" content="Position" />
        <meta property="fc:frame:button:3" content="Last Moves" />
        <meta property="og:title" content="Brian's Rescue" />
        <meta property="og:image" content="${BRIAN_FRAME_BACKGROUND}" />
      </head>
    </html>
`);
});

app.post("/frame", async (req: Request, res: Response) => {
  const server_url = req.protocol + "://" + req.get("host") + req.originalUrl;
  const data = await neynarClient.validateFrameAction(
    req.body.trustedData.messageBytes
  );
  const fid = data.action.interactor.fid;
  const tappedButton = data.action.tapped_button.index;

  let frameImage = BRIAN_FRAME_BACKGROUND;
  if (tappedButton === 1) {
    frameImage = server_url + `/cooldown?fid=${fid}`;
  } else if (tappedButton === 2) {
    const position = await getPosition();
    const length = (await getMaze()).maze.length;
    frameImage =
      server_url + `/currentPosition?position=${position}&length=${length}`;
  } else if (tappedButton === 3) {
    const position = await getPosition();
    const length = (await getMaze()).maze.length;
    frameImage = server_url + `/lastMoves`;
  }

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
				<meta property="fc:frame" content="vNext" />
				<meta property="fc:frame:image" content="${frameImage}" />
        <meta property="fc:frame:button:1" content="Cooldown" />
        <meta property="fc:frame:button:2" content="Position" />
        <meta property="fc:frame:button:3" content="Last Moves" />
      </head>
    </html>
`);
});

const server = app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});

export { server };
export default app;
