"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

type WearBridgePlugin = {
  publishWorkoutState(options: { payload: string }): Promise<void>;
  addListener(eventName: "commandReceived", listener: (event: { payload: string }) => void): Promise<{ remove(): Promise<void> }>;
};

const WearBridge = registerPlugin<WearBridgePlugin>("WearBridge");

export async function publishWearWorkoutState(state: Record<string, unknown>) {
  if (!Capacitor.isNativePlatform()) return;
  await WearBridge.publishWorkoutState({ payload: JSON.stringify({ ...state, version: 1 }) });
}

export async function listenForWearCommands(onCommand: (command: Record<string, unknown>) => void) {
  if (!Capacitor.isNativePlatform()) return () => undefined;
  const listener = await WearBridge.addListener("commandReceived", ({ payload }) => {
    try { onCommand(JSON.parse(payload)); } catch { /* comando inválido é ignorado */ }
  });
  return () => { void listener.remove(); };
}
