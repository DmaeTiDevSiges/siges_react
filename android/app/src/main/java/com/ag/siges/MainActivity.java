package com.ag.siges;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(LocationServicePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
