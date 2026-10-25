import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ALLOWED_REQUESTS, assertRequestAllowed, redactSecrets } from './request-policy.js';
import { OBSWebSocketClient } from './client.js';

// Requests that can read the stream key or other secrets, end or reconfigure a
// live show, delete part of the setup, or write to disk. None may ever be sent.
const DANGEROUS_REQUESTS = [
  'GetStreamServiceSettings',
  'SetStreamServiceSettings',
  'GetProfileParameter',
  'SetProfileParameter',
  'GetPersistentData',
  'SetPersistentData',
  'GetOutputSettings',
  'SetOutputSettings',
  'CallVendorRequest',
  'StartStream',
  'StopStream',
  'ToggleStream',
  'StartOutput',
  'StopOutput',
  'ToggleOutput',
  'TriggerHotkeyByName',
  'TriggerHotkeyByKeySequence',
  'SetCurrentProfile',
  'CreateProfile',
  'RemoveProfile',
  'SetCurrentSceneCollection',
  'CreateSceneCollection',
  'SetVideoSettings',
  'RemoveScene',
  'RemoveInput',
  'RemoveSceneItem',
  'RemoveSourceFilter',
  'SaveSourceScreenshot',
  'SetRecordDirectory',
  'OpenInputPropertiesDialog',
];

const toolsDir = path.resolve(__dirname, 'tools');
const requestTypesUsedByTools = fs
  .readdirSync(toolsDir)
  .filter((file) => file.endsWith('.ts'))
  .flatMap((file) => {
    const source = fs.readFileSync(path.join(toolsDir, file), 'utf8');
    return [...source.matchAll(/sendRequest\(\s*["'](\w+)["']/g)].map((match) => match[1]);
  });

describe('request policy', () => {
  it('allows none of the dangerous requests', () => {
    for (const requestType of DANGEROUS_REQUESTS) {
      expect(ALLOWED_REQUESTS.has(requestType), requestType).toBe(false);
    }
  });

  it('allows every request a registered tool sends', () => {
    expect(requestTypesUsedByTools.length).toBeGreaterThan(50);
    for (const requestType of requestTypesUsedByTools) {
      expect(ALLOWED_REQUESTS.has(requestType), requestType).toBe(true);
    }
  });

  it('no registered tool sends a dangerous request', () => {
    for (const requestType of requestTypesUsedByTools) {
      expect(DANGEROUS_REQUESTS).not.toContain(requestType);
    }
  });

  it('throws for a request outside the allowlist', () => {
    expect(() => assertRequestAllowed('GetStreamServiceSettings')).toThrow(/not allowed/);
    expect(() => assertRequestAllowed('SomeFutureRequest')).toThrow(/not allowed/);
    expect(() => assertRequestAllowed('GetSceneList')).not.toThrow();
  });

  it('the client refuses a blocked request before it checks the connection', async () => {
    const client = new OBSWebSocketClient('ws://127.0.0.1:1', null);
    await expect(client.sendRequest('GetStreamServiceSettings')).rejects.toThrow(/not allowed/);
    await expect(client.sendRequest('GetSceneList')).rejects.toThrow(/Not connected/);
  });
});

describe('redactSecrets', () => {
  it('reduces URLs to their origin', () => {
    expect(
      redactSecrets({ url: 'https://streamelements.com/overlay/abc123/eyJhbGciOi?token=x' })
    ).toEqual({ url: 'https://streamelements.com/[redacted]' });
  });

  it('redacts fields whose names look secret, at any depth', () => {
    expect(
      redactSecrets({
        inputSettings: {
          key: 'live_123',
          stream_key: 'live_456',
          apiToken: 't',
          password: 'p',
          nested: [{ client_secret: 's', auth: 'a' }],
          width: 1920,
          window: 'Dolphin:Dolphin',
        },
        inputKind: 'browser_source',
      })
    ).toEqual({
      inputSettings: {
        key: '[redacted]',
        stream_key: '[redacted]',
        apiToken: '[redacted]',
        password: '[redacted]',
        nested: [{ client_secret: '[redacted]', auth: '[redacted]' }],
        width: 1920,
        window: 'Dolphin:Dolphin',
      },
      inputKind: 'browser_source',
    });
  });

  it('leaves ordinary strings and local file paths alone', () => {
    expect(redactSecrets({ local_file: '/Users/me/overlay.html', text: 'Hello chat' })).toEqual({
      local_file: '/Users/me/overlay.html',
      text: 'Hello chat',
    });
  });
});
