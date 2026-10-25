import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OBSWebSocketClient } from "../client.js";
import { z } from "zod";

export async function initialize(server: McpServer, client: OBSWebSocketClient): Promise<void> {
  // Get server status
  server.tool(
    "obs-get-status",
    "Get the current status of the OBS MCP server and OBS connection",
    {},
    async () => {
      const status = client.getConnectionStatus();
      const obsConnected = client.isConnected();
      
      const statusInfo = {
        server: {
          name: "obs-mcp",
          version: "1.0.1",
          status: "running"
        },
        obs: {
          connected: obsConnected,
          url: status.url,
          hasPassword: status.hasPassword,
          identified: status.identified
        },
        timestamp: new Date().toISOString()
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(statusInfo, null, 2)
          }
        ]
      };
    }
  );

  // Get OBS version info
  server.tool(
    "obs-get-version",
    "Get OBS Studio version information",
    {},
    async () => {
      if (!client.isConnected()) {
        return {
          content: [
            {
              type: "text",
              text: "Not connected to OBS WebSocket"
            }
          ],
          isError: true
        };
      }
      
      try {
        const version = await client.sendRequest("GetVersion");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(version, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to get OBS version: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Test OBS connection
  server.tool(
    "obs-test-connection",
    "Test the connection to OBS WebSocket",
    {},
    async () => {
      if (!client.isConnected()) {
        return {
          content: [
            {
              type: "text",
              text: "Not connected to OBS WebSocket"
            }
          ],
          isError: true
        };
      }
      
      try {
        // Try a simple request to test the connection
        await client.sendRequest("GetVersion");
        return {
          content: [
            {
              type: "text",
              text: "Connection test successful - OBS is responding"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Connection test failed: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // GetStats tool
  server.tool(
    "obs-get-stats",
    "Gets statistics about OBS, obs-websocket, and the current session",
    {},
    async () => {
      try {
        const stats = await client.sendRequest("GetStats");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stats, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting stats: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // BroadcastCustomEvent tool
  server.tool(
    "obs-broadcast-custom-event",
    "Broadcasts a CustomEvent to all WebSocket clients",
    {
      eventData: z.record(z.any()).describe("Data payload to emit to all receivers")
    },
    async ({ eventData }) => {
      try {
        await client.sendRequest("BroadcastCustomEvent", { eventData });
        return {
          content: [
            {
              type: "text",
              text: "Custom event broadcast successfully"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error broadcasting custom event: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Vendor requests are an open passthrough to plugins and are not exposed.
  // See src/request-policy.ts.

  // GetHotkeyList tool
  server.tool(
    "obs-get-hotkey-list",
    "Gets an array of all hotkey names in OBS",
    {},
    async () => {
      try {
        const hotkeyList = await client.sendRequest("GetHotkeyList");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(hotkeyList, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting hotkey list: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Triggering hotkeys is not exposed: a hotkey can stop the stream or switch
  // profiles, bypassing every other restriction. See src/request-policy.ts.

  // Sleep tool
  server.tool(
    "obs-sleep",
    "Sleeps for a time duration or number of frames",
    {
      sleepMillis: z.number().optional().describe("Number of milliseconds to sleep for"),
      sleepFrames: z.number().optional().describe("Number of frames to sleep for")
    },
    async ({ sleepMillis, sleepFrames }) => {
      try {
        const params: Record<string, any> = {};
        
        if (sleepMillis !== undefined) {
          params.sleepMillis = sleepMillis;
        }
        
        if (sleepFrames !== undefined) {
          params.sleepFrames = sleepFrames;
        }
        
        await client.sendRequest("Sleep", params);
        return {
          content: [
            {
              type: "text",
              text: "Sleep operation completed successfully"
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error during sleep operation: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );
}