// This fork is meant to be driven by an AI assistant during a live stream.
// Every OBS request the server sends must be on this allowlist, so a request
// that is left off it is refused even if a tool for it is added later.
//
// Deliberately absent, and why:
// - Reads the stream key or other secrets: GetStreamServiceSettings,
//   GetProfileParameter, GetPersistentData, GetOutputSettings,
//   CallVendorRequest, OpenInputPropertiesDialog (shows settings on screen).
// - Ends or reconfigures the live show: StartStream, StopStream, ToggleStream,
//   Start/Stop/ToggleOutput, TriggerHotkeyByName/ByKeySequence (a hotkey can
//   stop the stream), SetCurrentProfile, CreateProfile, RemoveProfile,
//   SetCurrentSceneCollection, CreateSceneCollection, SetVideoSettings,
//   SetStreamServiceSettings, SetProfileParameter, SetOutputSettings,
//   SetPersistentData.
// - Deletes part of the setup: RemoveScene, RemoveInput, RemoveSceneItem,
//   RemoveSourceFilter.
// - Writes to disk: SaveSourceScreenshot, SetRecordDirectory.
export const ALLOWED_REQUESTS: ReadonlySet<string> = new Set([
  // General
  "GetVersion",
  "GetStats",
  "BroadcastCustomEvent",
  "GetHotkeyList",
  "Sleep",

  // Config (read-only)
  "GetSceneCollectionList",
  "GetProfileList",
  "GetVideoSettings",
  "GetRecordDirectory",

  // Scenes
  "GetSceneList",
  "GetCurrentProgramScene",
  "SetCurrentProgramScene",
  "GetCurrentPreviewScene",
  "SetCurrentPreviewScene",
  "CreateScene",

  // Scene items
  "GetSceneItemList",
  "CreateSceneItem",
  "SetSceneItemEnabled",
  "GetSceneItemTransform",
  "SetSceneItemTransform",
  "GetSceneItemId",

  // Inputs (GetInputSettings is redacted by its tool)
  "GetInputList",
  "GetInputKindList",
  "GetSpecialInputs",
  "CreateInput",
  "SetInputName",
  "GetInputDefaultSettings",
  "GetInputSettings",
  "SetInputSettings",
  "GetInputMute",
  "SetInputMute",
  "ToggleInputMute",
  "GetInputVolume",
  "SetInputVolume",
  "GetInputAudioBalance",
  "SetInputAudioBalance",
  "GetInputAudioSyncOffset",
  "SetInputAudioSyncOffset",
  "GetInputAudioMonitorType",
  "SetInputAudioMonitorType",

  // Media inputs
  "GetMediaInputStatus",
  "SetMediaInputCursor",
  "OffsetMediaInputCursor",
  "TriggerMediaInputAction",

  // Sources
  "GetSourceActive",
  "GetSourceScreenshot",

  // Filters
  "GetSourceFilterKindList",
  "GetSourceFilterList",
  "GetSourceFilterDefaultSettings",
  "CreateSourceFilter",
  "SetSourceFilterName",
  "GetSourceFilter",
  "SetSourceFilterIndex",
  "SetSourceFilterSettings",
  "SetSourceFilterEnabled",

  // Transitions
  "GetTransitionList",
  "GetCurrentSceneTransition",
  "SetCurrentSceneTransition",
  "GetCurrentSceneTransitionDuration",
  "SetCurrentSceneTransitionDuration",
  "GetCurrentSceneTransitionSettings",
  "SetCurrentSceneTransitionSettings",
  "TriggerStudioModeTransition",

  // Streaming (status and captions only)
  "GetStreamStatus",
  "SendStreamCaption",

  // Recording
  "GetRecordStatus",
  "ToggleRecord",
  "StartRecord",
  "StopRecord",
  "ToggleRecordPause",
  "PauseRecord",
  "ResumeRecord",
  "SplitRecordFile",
  "CreateRecordChapter",

  // Outputs (virtual cam, replay buffer, and status only)
  "GetOutputList",
  "GetOutputStatus",
  "GetVirtualCamStatus",
  "ToggleVirtualCam",
  "StartVirtualCam",
  "StopVirtualCam",
  "GetReplayBufferStatus",
  "ToggleReplayBuffer",
  "StartReplayBuffer",
  "StopReplayBuffer",
  "SaveReplayBuffer",
  "GetLastReplayBufferReplay",

  // UI
  "GetStudioModeEnabled",
  "SetStudioModeEnabled",
  "OpenInputFiltersDialog",
  "OpenInputInteractDialog",
  "GetMonitorList",
  "OpenVideoMixProjector",
  "OpenSourceProjector",
]);

export function assertRequestAllowed(requestType: string): void {
  if (!ALLOWED_REQUESTS.has(requestType)) {
    throw new Error(`OBS request '${requestType}' is not allowed by this server's request policy`);
  }
}

const REDACTED = "[redacted]";
const SECRET_FIELD_NAME = /key|token|secret|password|passwd|auth|cookie|credential/i;
const URL_WITH_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

// Overlay URLs (alert boxes, chat widgets) carry account tokens in their path
// or query, so a URL keeps only its origin.
function redactString(value: string): string {
  if (!URL_WITH_SCHEME.test(value)) {
    return value;
  }
  try {
    const { origin } = new URL(value);
    return origin && origin !== "null" ? `${origin}/${REDACTED}` : REDACTED;
  } catch {
    return REDACTED;
  }
}

export function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([field, fieldValue]) => [
        field,
        SECRET_FIELD_NAME.test(field) ? REDACTED : redactSecrets(fieldValue),
      ])
    );
  }
  return value;
}
