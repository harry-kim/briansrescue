import dotenv from "dotenv";
dotenv.config();
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

export interface NeynarClient {
  replyCast(message: string, replyHash: string): Promise<any>;
  postCast(message: string, channel: string): Promise<any>;
  validateFrameAction(trustedData: string): Promise<any>;
}
class LiveNeynarClient implements NeynarClient {
  private neynarClient: NeynarAPIClient;
  private signerUuid: string;

  constructor() {
    if (!process.env.SIGNER_UUID) {
      throw new Error("Make sure you set SIGNER_UUID in your .env file");
    }
    this.signerUuid = process.env.SIGNER_UUID;
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error("Make sure you set NEYNAR_API_KEY in your .env file");
    }
    this.neynarClient = new NeynarAPIClient(process.env.NEYNAR_API_KEY);
  }

  async replyCast(message: string, replyHash: string): Promise<void> {
    await this.neynarClient.publishCast(this.signerUuid, message, {
      replyTo: replyHash,
    });
  }

  async postCast(message: string, channel: string): Promise<void> {
    await this.neynarClient.publishCast(this.signerUuid, message, {
      channelId: channel,
    });
  }
  async validateFrameAction(messageBytes: string): Promise<any> {
    return await this.neynarClient.validateFrameAction(messageBytes);
  }
}

class MockNeynarClient implements NeynarClient {
  async replyCast(message: string, replyHash: string): Promise<void> {
    console.log(`Hash:${replyHash}\n"${message}"`);
  }

  async postCast(message: string, channel: string): Promise<void> {
    console.log(`Channel:${channel}\n"${message}"`);
  }
  async validateFrameAction(messageBytes: string): Promise<void> {
    console.log("validating", messageBytes)
  }
}

const neynarClient: NeynarClient = !process.env.MOCK_NEYNAR
  ? new LiveNeynarClient()
  : new MockNeynarClient();

export default neynarClient;
