import satori from "satori";
import sharp from "sharp";

import { Request, Response } from "express";
import React from "react";
import { join } from "path";
import * as fs from "fs";
const fontPath = join(process.cwd(), "PressStart2P-vaV7.ttf");
let fontData = fs.readFileSync(fontPath);

export async function cooldownImage(
  req: Request,
  res: Response,
  cooldown: string
) {
  const svg = await satori(
    <div
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: "f4f4f4",
        padding: 50,
        lineHeight: 1.2,
        fontSize: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 100,
        }}
      >
        <h2 style={{ textAlign: "center", color: "lightgray" }}>{cooldown}</h2>
      </div>
    </div>,
    {
      width: 600,
      height: 400,
      fonts: [
        {
          name: "Roboto",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const pngBuffer = await sharp(Buffer.from(svg)).toFormat("png").toBuffer();

  // Set the content type to PNG and send the response
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "max-age=10");
  res.send(pngBuffer);
}

export async function currentPosition(
  req: Request,
  res: Response,
  position: string,
  mazeLength: string
) {
  const svg = await satori(
    <div
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: "f4f4f4",
        padding: 50,
        lineHeight: 1.2,
        fontSize: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 100,
        }}
      >
        <h2 style={{ textAlign: "center", color: "lightgray" }}>
           Position: {position} / {mazeLength}
        </h2>
      </div>
    </div>,
    {
      width: 600,
      height: 400,
      fonts: [
        {
          name: "Roboto",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );

  const pngBuffer = await sharp(Buffer.from(svg)).toFormat("png").toBuffer();

  // Set the content type to PNG and send the response
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "max-age=10");
  res.send(pngBuffer);
}
