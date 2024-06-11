import dotenv from "dotenv";
dotenv.config();
const { performance } = require("perf_hooks");

import neynarClient from "./neynarClient";
import { getDirection, move, getMaze } from "./quest";
import { kv } from "@vercel/kv";
import { Request, Response } from "express";
import express from "express";

const DEFAULT_COOLDOWN: number = 4 * 60 * 60 * 1000; // 4 hours in milliseconds, clearly defined as a constant
const CHANNEL = process.env.CHANNEL || "brians-rescue";
const COOLDOWN_TIME: number =
  Number(process.env.COOLDOWN_TIME) || DEFAULT_COOLDOWN;

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

app.post("/", async (req: Request, res: Response) => {
  try {
    const start = performance.now();
    if (!process.env.SIGNER_UUID) {
      throw new Error("Make sure you set SIGNER_UUID in your .env file");
    }

    const hookData = req.body;
    const letterDirection = hookData.data.text.split(" ")[1];
    const direction = getDirection(letterDirection);

    if (typeof direction === "undefined") {
      console.log("unrecognized command");
      return res.status(400).send("Unrecognized command");
    }

    const now = new Date();
    const authorFid = hookData.data.author.fid;
    console.log("Time elapsed", performance.now() - start);

    const cooldownCheck = await checkCooldown(authorFid, now);
    if (cooldownCheck.isCooldown) {
      console.log(cooldownCheck.message);
      await neynarClient.publishCast(
        process.env.SIGNER_UUID,
        cooldownCheck.message,
        {
          replyTo: hookData.data.hash,
        }
      );
      return res.status(429).send(cooldownCheck.message);
    }

    const moveResult = await move(direction);

    try {
      await kv.hset("lastMoved", {
        fid: authorFid,
        timestamp: now.toISOString(),
      });
    } catch (error) {
      console.log(`Failed to set time of last command for ${authorFid}`, error);
      return res.status(500).send("Failed to set command time");
    }

    const replyText = generateReplyText(moveResult, letterDirection);
    await neynarClient.publishCast(process.env.SIGNER_UUID, replyText, {
      replyTo: hookData.data.hash,
    });

    console.log(replyText);
    return res.send(`Moved successfully to ${moveResult.position}`);
  } catch (e: any) {
    console.log(e);
    return res.status(500).send(e.message);
  }
});

async function checkCooldown(
  authorFid: string,
  now: Date
): Promise<{ isCooldown: boolean; message: string }> {
  try {
    const date: string = (await kv.hget("lastMoved", authorFid)) || "";
    const lastCommandTime = new Date(date);
    const diffSinceLastCommand = now.getTime() - lastCommandTime.getTime();
    if (diffSinceLastCommand < COOLDOWN_TIME) {
      const message = `You must wait ${diffSinceLastCommand}ms until you can move Brian again!`;
      return { isCooldown: true, message };
    }
    return { isCooldown: false, message: "" };
  } catch (error) {
    console.log(`Failed to get time of last command for ${authorFid}`, error);
    return { isCooldown: true, message: "Failed to get command time" };
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

async function startGame(): Promise<boolean> {
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

    const postGame = await neynarClient.publishCast(
      process.env.SIGNER_UUID,
      newGameMessage,
      {
        channelId: CHANNEL,
      }
    );
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
}

app.post("/startGame", async (req: Request, res: Response) => {
  const apiKey = req.headers["x-api-key"]; // Typically sent in headers for better security

  console.log("starting");
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

module.exports = app;
