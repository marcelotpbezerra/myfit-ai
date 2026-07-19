package com.myfit.ai;

import android.content.Intent;
import android.content.Context;
import android.content.SharedPreferences;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;
import org.json.JSONArray;

/** Recebe comandos autenticados pelo Data Layer; o plugin os entrega ao WebView quando estiver disponível. */
public class WearCommandListenerService extends WearableListenerService {
    public static final String COMMAND_PATH = "/myfit/command/v1";
    public static final String ACTION_WEAR_COMMAND = "com.myfit.ai.WEAR_COMMAND";
    public static final String EXTRA_COMMAND = "command";

    @Override public void onMessageReceived(MessageEvent event) {
        if (!COMMAND_PATH.equals(event.getPath())) return;
        String command = new String(event.getData(), java.nio.charset.StandardCharsets.UTF_8);
        enqueueCommand(this, command);
        Intent intent = new Intent(ACTION_WEAR_COMMAND).setPackage(getPackageName());
        intent.putExtra(EXTRA_COMMAND, command);
        sendBroadcast(intent);
    }

    /** Preserva comandos recebidos enquanto o WebView está fechado. */
    public static synchronized void enqueueCommand(Context context, String command) {
        SharedPreferences prefs = context.getSharedPreferences("wear_commands", Context.MODE_PRIVATE);
        JSONArray commands;
        try { commands = new JSONArray(prefs.getString("pending", "[]")); }
        catch (Exception ignored) { commands = new JSONArray(); }
        commands.put(command);
        prefs.edit().putString("pending", commands.toString()).apply();
    }

    public static synchronized String[] takePendingCommands(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("wear_commands", Context.MODE_PRIVATE);
        JSONArray commands;
        try { commands = new JSONArray(prefs.getString("pending", "[]")); }
        catch (Exception ignored) { commands = new JSONArray(); }
        String[] result = new String[commands.length()];
        for (int index = 0; index < commands.length(); index++) result[index] = commands.optString(index, "");
        prefs.edit().remove("pending").apply();
        return result;
    }
}
