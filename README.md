# OBS MCP Server

An MCP server for OBS Studio that provides tools to control OBS via the OBS WebSocket protocol.

## Safe for live streams (this fork)

This fork of [royshil/obs-mcp](https://github.com/royshil/obs-mcp) is meant to let an AI assistant run OBS during a live stream. It cannot:

- read the stream key or other secrets (stream service settings, profile parameters, output settings, persistent data, vendor requests)
- start, stop or toggle the stream or any output, or trigger hotkeys, which could do the same
- switch or create profiles and scene collections, or change video and stream settings
- delete scenes, sources, scene items or filters (hide or disable them instead)
- write files to disk (saving screenshots, changing the record directory)

`obs-get-input-settings` reduces URLs to their origin and redacts fields whose names look secret, because overlay URLs carry account tokens. `obs-set-input-settings` always layers settings on top of the existing ones and never resets an input.

Enforcement lives in `src/request-policy.ts`. The client refuses any OBS request that is not on its allowlist, so a tool added later cannot reach a blocked request without someone editing that list.

## Features

- Connect to OBS WebSocket server
- Control OBS via MCP tools
- Provides tools for:
  - General operations
  - Scene management
  - Source control
  - Scene item manipulation
  - Streaming and recording
  - Transitions


## Usage

1. Make sure OBS Studio is running with WebSocket server enabled (Tools > WebSocket Server Settings). Note the password for the WS.
2. Set the WebSocket password in environment variable (if needed):

```bash
export OBS_WEBSOCKET_PASSWORD="your_password_here"
```

3. Add the MCP server to Claude desktop with the MCP server settings:

```json
{
  "mcpServers": {
    "obs": {
      "command": "npx",
      "args": ["-y", "obs-mcp@latest"],
      "env": {
        "OBS_WEBSOCKET_PASSWORD": "<password_from_obs>"
      }
    }
  }
}
```

4. Use Claude to control your OBS!

## Development

If you want to run the server locally using the code in this git repo, you can do the following:


```bash
npm run build
npm run start
```

Then configure Claude desktop:

```json
{
  "mcpServers": {
    "obs": {
      "command": "node",
      "args": [
        "<obs-mcp_root>/build/index.js"
      ],
      "env": {
        "OBS_WEBSOCKET_PASSWORD": "<password_from_obs>"
      }
    }
  }
}
```

## Available Tools

The server provides tools organized by category:

- General tools: Version info, stats, hotkeys, studio mode
- Scene tools: List scenes, switch scenes, create/remove scenes
- Source tools: Manage sources, settings, audio levels, mute/unmute
- Scene item tools: Manage items in scenes (position, visibility, etc.)
- Streaming tools: Start/stop streaming, recording, virtual camera
- Transition tools: Set transitions, durations, trigger transitions

## Environment Variables

- `OBS_WEBSOCKET_URL`: WebSocket URL (default: ws://localhost:4455)
- `OBS_WEBSOCKET_PASSWORD`: Password for authenticating with OBS WebSocket (if required)

## Requirements

- Node.js 16+
- OBS Studio 31+ with WebSocket server enabled
- Claude desktop

## License

See the [LICENSE](LICENSE) file for details.