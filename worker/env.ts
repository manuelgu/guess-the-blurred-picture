import type { Room } from "./room";

export interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  IMAGES: R2Bucket;
  DB: D1Database;
  ASSETS: Fetcher;
}
