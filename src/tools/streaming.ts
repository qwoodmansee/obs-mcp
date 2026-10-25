import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OBSWebSocketClient } from "../client.js";
import { z } from "zod";

export async function initialize(server: McpServer, client: OBSWebSocketClient): Promise<void> {
  // GetStreamStatus tool
  server.tool(
    "obs-get-stream-status",
    "Get the current streaming status",
    {},
    async () => {
      try {
        const status = await client.sendRequest("GetStreamStatus");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting stream status: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Starting and stopping the stream is left to the person streaming.
  // See src/request-policy.ts.

  // SendStreamCaption tool
  server.tool(
    "obs-send-stream-caption",
    "Sends CEA-608 caption text over the stream output",
    {
      captionText: z.string().describe("Caption text to send")
    },
    async ({ captionText }) => {
      try {
        await client.sendRequest("SendStreamCaption", { captionText });
        return {
          content: [
            {
              type: "text",
              text: "Successfully sent stream caption"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error sending stream caption: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );
}