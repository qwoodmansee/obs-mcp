import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OBSWebSocketClient } from "../client.js";
import { z } from "zod";

export async function initialize(server: McpServer, client: OBSWebSocketClient): Promise<void> {
  // GetSourceActive tool
  server.tool(
    "obs-get-source-active",
    "Gets the active and show state of a source",
    {
      sourceName: z.string().optional().describe("Name of the source to get the active state of"),
      sourceUuid: z.string().optional().describe("UUID of the source to get the active state of")
    },
    async ({ sourceName, sourceUuid }) => {
      try {
        const response = await client.sendRequest("GetSourceActive", {
          sourceName,
          sourceUuid
        });
        
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
              text: `Error getting source active state: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // GetSourceScreenshot tool
  server.tool(
    "obs-get-source-screenshot",
    "Gets a Base64-encoded screenshot of a source",
    {
      sourceName: z.string().optional().describe("Name of the source to take a screenshot of"),
      sourceUuid: z.string().optional().describe("UUID of the source to take a screenshot of"),
      imageFormat: z.string().describe("Image compression format to use"),
      imageWidth: z.number().optional().describe("Width to scale the screenshot to"),
      imageHeight: z.number().optional().describe("Height to scale the screenshot to"),
      imageCompressionQuality: z.number().optional().describe("Compression quality to use (0-100, -1 for default)")
    },
    async ({ sourceName, sourceUuid, imageFormat, imageWidth, imageHeight, imageCompressionQuality }) => {
      try {
        const response = await client.sendRequest("GetSourceScreenshot", {
          sourceName,
          sourceUuid,
          imageFormat,
          imageWidth,
          imageHeight,
          imageCompressionQuality
        });
        
        return {
          content: [
            {
              type: "text",
              text: `Screenshot data: ${response.imageData.substring(0, 100)}...`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting source screenshot: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    }
  );

  // Saving screenshots is not exposed: OBS would write to any path it is
  // given. See src/request-policy.ts.
}