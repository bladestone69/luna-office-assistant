import "server-only";
import { google } from "googleapis";
import { requiredEnv } from "@/lib/env";

function getPrivateKey() {
  return requiredEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getClientEmail() {
  return requiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
}

export function getGoogleJwt(scopes: string[]) {
  return new google.auth.JWT({
    email: getClientEmail(),
    key: getPrivateKey(),
    scopes
  });
}
