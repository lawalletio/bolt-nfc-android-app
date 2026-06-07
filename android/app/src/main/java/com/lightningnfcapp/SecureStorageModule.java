package com.lacrypta.cardinstaller;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.io.IOException;
import java.security.GeneralSecurityException;

public class SecureStorageModule extends ReactContextBaseJavaModule {

    private static final String PREFS_FILE = "cardinstaller_secure_prefs";

    private SharedPreferences encryptedPrefs = null;

    public SecureStorageModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "SecureStorageModule";
    }

    private synchronized SharedPreferences getPrefs() throws GeneralSecurityException, IOException {
        if (encryptedPrefs == null) {
            encryptedPrefs = buildPrefs();
        }
        return encryptedPrefs;
    }

    private SharedPreferences buildPrefs() throws GeneralSecurityException, IOException {
        Context ctx = getReactApplicationContext().getApplicationContext();
        MasterKey masterKey = new MasterKey.Builder(ctx)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
        return EncryptedSharedPreferences.create(
                ctx,
                PREFS_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );
    }

    // On Keystore corruption (OEM bugs, credential reset), clear the prefs and rebuild.
    private synchronized void recoverFromCorruption() {
        encryptedPrefs = null;
        Context ctx = getReactApplicationContext().getApplicationContext();
        if (Build.VERSION.SDK_INT >= 24) {
            ctx.deleteSharedPreferences(PREFS_FILE);
        } else {
            ctx.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE).edit().clear().commit();
        }
        try {
            encryptedPrefs = buildPrefs();
        } catch (Exception e) {
            Log.e(Constants.TAG, "SecureStorage: failed to rebuild after corruption", e);
        }
    }

    @ReactMethod
    public void setItem(String key, String value, Promise promise) {
        try {
            getPrefs().edit().putString(key, value).apply();
            promise.resolve(null);
        } catch (GeneralSecurityException | IOException e) {
            Log.w(Constants.TAG, "SecureStorage.setItem: corruption detected, retrying", e);
            recoverFromCorruption();
            try {
                getPrefs().edit().putString(key, value).apply();
                promise.resolve(null);
            } catch (Exception e2) {
                promise.reject("E_SECURE_STORAGE_SET", e2.getMessage(), e2);
            }
        }
    }

    @ReactMethod
    public void getItem(String key, Promise promise) {
        try {
            promise.resolve(getPrefs().getString(key, null));
        } catch (GeneralSecurityException | IOException e) {
            Log.w(Constants.TAG, "SecureStorage.getItem: corruption detected, clearing store", e);
            recoverFromCorruption();
            // Return null so the caller treats it as "no stored value" and forces re-login.
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void removeItem(String key, Promise promise) {
        try {
            getPrefs().edit().remove(key).apply();
            promise.resolve(null);
        } catch (GeneralSecurityException | IOException e) {
            Log.w(Constants.TAG, "SecureStorage.removeItem: corruption detected, clearing store", e);
            recoverFromCorruption();
            promise.resolve(null);
        }
    }

    @ReactMethod
    public void clear(Promise promise) {
        try {
            getPrefs().edit().clear().apply();
            promise.resolve(null);
        } catch (GeneralSecurityException | IOException e) {
            Log.w(Constants.TAG, "SecureStorage.clear: corruption detected, force clearing", e);
            recoverFromCorruption();
            promise.resolve(null);
        }
    }
}
