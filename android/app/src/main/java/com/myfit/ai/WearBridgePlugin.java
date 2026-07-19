package com.myfit.ai;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.wearable.PutDataRequest;
import com.google.android.gms.wearable.Wearable;

@CapacitorPlugin(name = "WearBridge")
public class WearBridgePlugin extends Plugin {
    public static final String STATE_PATH = "/myfit/workout-state/v1";

    @Override public void load() {
        getContext().registerReceiver(new BroadcastReceiver() {
            @Override public void onReceive(Context context, Intent intent) {
                deliverPendingCommands();
            }
        }, new IntentFilter(WearCommandListenerService.ACTION_WEAR_COMMAND), Context.RECEIVER_NOT_EXPORTED);
        deliverPendingCommands();
    }

    private void deliverPendingCommands() {
        for (String command : WearCommandListenerService.takePendingCommands(getContext())) {
            if (command.isEmpty()) continue;
            JSObject event = new JSObject();
            event.put("payload", command);
            notifyListeners("commandReceived", event, true);
        }
    }

    @PluginMethod public void publishWorkoutState(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null) { call.reject("payload é obrigatório"); return; }
        PutDataRequest request = PutDataRequest.create(STATE_PATH)
            .setData(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8)).setUrgent();
        Wearable.getDataClient(getContext()).putDataItem(request)
            .addOnSuccessListener(ignored -> call.resolve())
            .addOnFailureListener(error -> call.reject("Falha ao publicar estado", error));
    }
}
