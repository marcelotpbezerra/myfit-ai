package com.myfit.ai;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.myfit.ai.WearBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(WearBridgePlugin.class);

        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setJavaScriptEnabled(true);
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
    }

    @Override
    public void onStop() {
        // Força a escrita em disco do cookie de sessão do Clerk antes que o
        // Android possa matar o processo em background — sem isso, um cookie
        // atualizado pouco antes do app ir pra background pode nunca ser
        // persistido, derrubando o login no próximo start (bug crônico).
        CookieManager.getInstance().flush();
        super.onStop();
    }
}
