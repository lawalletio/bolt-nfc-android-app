package com.lacrypta.cardinstaller;

import static com.lacrypta.cardinstaller.Constants.TAG;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import android.util.Log;
import java.util.HashMap;
import java.util.Map;

/**
 * Bridges a few native values to JS. The legacy TapLinX NFC methods
 * (setCardMode / changeKeys / setResetKeys / setNodeURL) were removed — all NFC
 * now runs in JS over react-native-nfc-manager.
 */
public class MyReactModule extends ReactContextBaseJavaModule {

    public MyReactModule(ReactApplicationContext reactContext) {
        super(reactContext);
        Log.d(TAG, "reactContext");
    }

    @Override
    public String getName() {
        return getClass().getSimpleName();
    }

    // Expose the app version (from BuildConfig) to JS as constants, so the
    // Login screen can display the currently installed build.
    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("versionName", BuildConfig.VERSION_NAME);
        constants.put("versionCode", BuildConfig.VERSION_CODE);
        return constants;
    }
}
