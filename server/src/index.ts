import { createApp } from "./app.ts";
import { ClaudeAssistant } from "./assistant.ts";

const port = Number(process.env.PORT ?? 8787);
const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = createApp({ assistant: new ClaudeAssistant(), corsOrigins });

// Bind to all interfaces so a phone on the same Wi-Fi can reach the dev server.
app.listen(port, "0.0.0.0", () => {
  console.log(`VoiceFlow server listening on http://0.0.0.0:${port}`);
});
