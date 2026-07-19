package com.myfit.ai;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.myfit.ai.WearBridgePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(WearBridgePlugin.class);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Força o WebView a interceptar as URLs e manter dentro do app
        WebView webView = this.bridge.getWebView();
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.contains("fitness.marcelotpbezerra.com.br") || url.contains("clerk.com")) {
                    view.loadUrl(url);
                    return true;
                }
                return false;
            }
        });
    }
}
