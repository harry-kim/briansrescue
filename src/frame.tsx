import satori from "satori";
import sharp from "sharp";

import { Request, Response } from "express";
import React from "react";
import { join } from "path";
import * as fs from "fs";
import { mazeToLetters } from "./quest";
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

export async function lastMovesFrame(
  req: Request,
  res: Response,
  lastMoves: Array<number>
) {
  const lastMovesLetters = mazeToLetters(lastMoves);
  const chunks = [];
  const chunkSize = 20;
  for (let i = 0; i < lastMovesLetters.length; i += chunkSize) {
    chunks.push(lastMovesLetters.slice(i, i + chunkSize));
  }

  const svg = await satori(
    <div
      style={{
        justifyContent: "flex-start",
        alignItems: "flex-start",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        color: "white",
        padding: 10,
        lineHeight: 1.2,
        fontSize: 12,
        fontFamily: "Roboto, monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          marginTop: 20,
          paddingTop: 20,
        }}
      >
        {chunks.map((chunk, columnIndex) => (
          <div
            key={columnIndex}
            style={{
              display: "flex",
              flexDirection: "column",
              marginRight: 20,
              paddingRight: 10,
              borderRight: "1px solid white",
            }}
          >
            {chunk.map((move, index) => (
              <span key={index} style={{ margin: 0, padding: 0 }}>
                {String(columnIndex * chunkSize + index + 1).padStart(2, "0")} -{" "}
                {move}
              </span>
            ))}
          </div>
        ))}
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
