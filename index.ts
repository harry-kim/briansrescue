import neynarClient from "./neynarClient";
import Quest, { getDirection } from "./quest";
import { kv } from "@vercel/kv";

const q = new Quest(2);
q.printMap();
q.printMapLetters();
const DEFAULT_COOLDOWN: number = 4 * 60 * 60 * 1000; // 4 hours in milliseconds, clearly defined as a constant
const COOLDOWN_TIME: number =
  Number(process.env.COOLDOWN_TIME) || DEFAULT_COOLDOWN;

console.log("Starting...");
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      if (!process.env.SIGNER_UUID) {
        throw new Error("Make sure you set SIGNER_UUID in your .env file");
      }

      const body = await req.text();
      const hookData = JSON.parse(body);
      const letter_direction = hookData.data.text.split(" ")[1];
      const direction = getDirection(letter_direction);

      if (typeof direction === "undefined") {
        console.log("unrecognized command");
        return new Response("Unrecognized command");
      }
      let replyText: string;
      const now = new Date();
      const author_fid = hookData.data.author.fid;
      try {
        const date: string = (await kv.get(author_fid)) || "";
        const lastCommandTime = new Date(date);
        const diffSinceLastCommand = now.getTime() - lastCommandTime.getTime();
        if (diffSinceLastCommand < COOLDOWN_TIME) {
          replyText = `You must wait ${diffSinceLastCommand} until you can move Brian again!`;
          const replyResponse = await neynarClient.publishCast(
            process.env.SIGNER_UUID,
            replyText,
            {
              replyTo: hookData.data.hash,
            }
          );
          return new Response('Cooldown!')
        }
      } catch (error) {
        console.log(
          `failed to get time of last command for ${author_fid}`,
          error
        );
        return new Response("Failed to get ");
      }

      const moveSuccess = q.move(direction);

      try {
        await kv.set(author_fid, now.toISOString());
      } catch (error) {
        console.log(
          `failed to set time of last command for ${author_fid}`,
          error
        );
        return new Response("Failed to set ");
      }

      const position = q.position();
      if (moveSuccess) {
        if (q.wonGame()) {
          replyText = `Brian has successfully escaped the SEC offices!\n You win!!!`;
        } else {
          replyText = `Brian moved ${letter_direction}\nCurrent position ${position}`;
        }
      } else {
        replyText = `Brian got caught by Gensler!\nGoing back to last checkpoint: ${position}`;
      }

      const replyResponse = await neynarClient.publishCast(
        process.env.SIGNER_UUID,
        replyText,
        {
          replyTo: hookData.data.hash,
        }
      );
      console.log("REPLYING");
      // console.log(hookData);
      // console.log("reply:", reply);
      return new Response("Welcome to bun!");
    } catch (e: any) {
      console.log(e);
      return new Response(e.message, { status: 500 });
    }
  },
});

console.log(`Listening on localhost:${server.port}`);
