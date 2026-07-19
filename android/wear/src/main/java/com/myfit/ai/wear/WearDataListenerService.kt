package com.myfit.ai.wear

import android.content.Intent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONObject

/** Recebe o estado publicado pelo telefone; não persiste dados biométricos. */
class WearDataListenerService : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        events.use { buffer ->
            buffer.filter { it.dataItem.uri.path == WearContracts.STATE_PATH }.forEach { event ->
                val payload = event.dataItem.data?.toString(Charsets.UTF_8) ?: return@forEach
                sendBroadcast(Intent(ACTION_STATE_CHANGED).setPackage(packageName).putExtra(EXTRA_STATE, payload))
            }
        }
    }

    companion object {
        const val ACTION_STATE_CHANGED = "com.myfit.ai.wear.STATE_CHANGED"
        const val EXTRA_STATE = "state"
    }
}
