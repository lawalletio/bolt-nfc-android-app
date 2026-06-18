package com.lacrypta.cardinstaller;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.PackageList;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import java.util.List;

/**
 * App entry point. NTAG424 NFC is handled entirely in JavaScript through
 * react-native-nfc-manager (raw ISO-DEP APDUs + AES via CryptoJS). The legacy
 * native NXP TapLinX integration has been removed — it required a paid license
 * and is no longer used.
 */
public class MainActivity extends ReactActivity {

  private ReactRootView mReactRootView;
  private ReactInstanceManager mReactInstanceManager;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    // Set the theme to AppTheme BEFORE onCreate to support coloring the
    // background, status bar, and navigation bar.
    setTheme(R.style.AppTheme);
    super.onCreate(savedInstanceState);

    mReactRootView = new ReactRootView(this);
    List<ReactPackage> packages = new PackageList(getApplication()).getPackages();
    mReactInstanceManager = this.getReactInstanceManager();

    // The string here must match AppRegistry.registerComponent() in index.js.
    Bundle initialProperties = new Bundle();
    mReactRootView.startReactApplication(mReactInstanceManager, "cardinstaller", initialProperties);
  }

  /**
   * NFC tags are handled by react-native-nfc-manager (reader mode) + the JS
   * Ntag424 implementation — never through a native path. Just defer to the
   * framework (this also avoids the NPE when intent.getAction() was null).
   */
  @Override
  public void onNewIntent(final Intent intent) {
    super.onNewIntent(intent);
  }

  @Override
  protected void onPause() {
    super.onPause();
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onHostPause(this);
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onHostResume(this, this);
    }
  }

  @Override
  protected void onDestroy() {
    super.onDestroy();
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onHostDestroy(this);
    }
    if (mReactRootView != null) {
      mReactRootView.unmountReactApplication();
    }
  }

  @Override
  public void onBackPressed() {
    if (mReactInstanceManager != null) {
      mReactInstanceManager.onBackPressed();
    } else {
      super.onBackPressed();
    }
  }

  @Override
  public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager != null) {
      mReactInstanceManager.showDevOptionsDialog();
      return true;
    }
    return super.onKeyUp(keyCode, event);
  }

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  @Override
  protected String getMainComponentName() {
    return "cardinstaller";
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
      this,
      getMainComponentName(),
      DefaultNewArchitectureEntryPoint.getFabricEnabled(),
      DefaultNewArchitectureEntryPoint.getConcurrentReactEnabled()
    );
  }

  /**
   * Align the back button behavior with Android S where moving root activities
   * to background instead of finishing activities.
   */
  @Override
  public void invokeDefaultOnBackPressed() {
    if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
      if (!moveTaskToBack(false)) {
        super.invokeDefaultOnBackPressed();
      }
      return;
    }
    super.invokeDefaultOnBackPressed();
  }
}
