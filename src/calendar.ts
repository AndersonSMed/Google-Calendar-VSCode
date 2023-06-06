import * as fs from "fs";
import * as path from "path";
import * as process from "process";

import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

function loadSavedCredentialsIfExist() {
  try {
    const content = fs.readFileSync(TOKEN_PATH, "utf-8");
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials) as any;
  } catch (err) {
    return null;
  }
}

function saveCredentials(client: OAuth2Client) {
  const content = fs.readFileSync(CREDENTIALS_PATH, "utf-8");
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  fs.writeFileSync(TOKEN_PATH, payload);
}

async function authorize() {
  const savedClient = loadSavedCredentialsIfExist();

  if (savedClient) {
    return savedClient;
  }

  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });

  if (client.credentials) {
    saveCredentials(client);
  }

  return client;
}

export function subscribeToCalendar(listener: (auth: OAuth2Client) => void) {
  authorize().then(listener).catch(console.error);
}

export type OAuth2Client = typeof google.auth.OAuth2.prototype;
