import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import webpush from "web-push";

export type Secrets = {
  authSecret: string;
  vapidPublicKey: string;
  vapidPrivateKey: string;
  vapidSubject: string;
};

let cached: Secrets | null = null;

function fromEnv(): Secrets | null {
  const authSecret = process.env.AUTH_SECRET;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!authSecret || !vapidPublicKey || !vapidPrivateKey) return null;
  return {
    authSecret,
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject: process.env.VAPID_SUBJECT || "mailto:family@example.com",
  };
}

export function getSecrets(): Secrets {
  if (cached) return cached;
  const envSecrets = fromEnv();
  if (envSecrets) {
    cached = envSecrets;
    return cached;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Set AUTH_SECRET, VAPID_PUBLIC_KEY, and VAPID_PRIVATE_KEY.");
  }

  const file = path.join(process.cwd(), ".data", "dev-secrets.json");
  if (existsSync(file)) {
    cached = JSON.parse(readFileSync(file, "utf8")) as Secrets;
    return cached;
  }

  const keys = webpush.generateVAPIDKeys();
  cached = {
    authSecret: randomBytes(32).toString("hex"),
    vapidPublicKey: keys.publicKey,
    vapidPrivateKey: keys.privateKey,
    vapidSubject: "mailto:dous-family@localhost",
  };
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(cached, null, 2));
  return cached;
}
