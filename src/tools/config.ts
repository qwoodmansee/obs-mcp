import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OBSWebSocketClient } from "../client.js";

// Persistent data, profile switching/parameters, scene collection switching,
// video settings, stream service settings and the record directory are not
// exposed: they can read the stream key or change a live show's setup.
// See src/request-policy.ts.
export async function initialize(server: McpServer, client: OBSWebSocketClient): Promise<void> {
  // GetSceneCollectionList tool
  server.tool(
    "obs-get-scene-collection-list",
    "Gets an array of all scene collections",
    {},
    async () => {
      try {
        const response = await client.sendRequest("GetSceneCollectionList");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting scene collection list: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // GetProfileList tool
  server.tool(
    "obs-get-profile-list",
    "Gets an array of all profiles",
    {},
    async () => {
      try {
        const response = await client.sendRequest("GetProfileList");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting profile list: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // GetVideoSettings tool
  server.tool(
    "obs-get-video-settings",
    "Gets the current video settings",
    {},
    async () => {
      try {
        const response = await client.sendRequest("GetVideoSettings");
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting video settings: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // GetRecordDirectory tool
  server.tool(
    "obs-get-record-directory",
    "Gets the current directory that the record output is set to",
    {},
    async () => {
      try {
        const response = await client.sendRequest("GetRecordDirectory");
        return {
          content: [
            {
              type: "text",
              text: response.recordDirectory
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting record directory: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );
}
