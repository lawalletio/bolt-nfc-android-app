# Boltcard NFC Programming App

Quickly program a blank NFC card (NTAG424DNA) to act as your own personal Boltcard. A contactless / paywave like experience for the Lightning network. Before programming your NFC card you must set up your own [boltcard server](https://github.com/boltcard/boltcard).

The boltcard can be used with Lightning PoS terminals that have NFC support, or Breez wallet PoS App.

The app is currently Android only.

Since December 2022 it may be possible to add iOS support using the new [NXP Mifare TapLinx iOS SDK library](https://www.mifare.net/en/products/tools/taplinx/) as this application is written in React Native.

Find out more at [boltcard.org](https://boltcard.org)

# [Card programming errors](card-programming-errors.md)

## Current Version

v0.1.9

## NFC Card Support

- NXP NTAG424 DNA
- NXP NTAG424 DNA TT (Tag Tamper) Thanks to [Bassim](https://github.com/bassim)

## Quick Install

Download the compiled APK from the [latest release](https://github.com/boltcard/bolt-nfc-android-app/releases) and install on your android phone.

Download from the [Google Play store](https://play.google.com/store/apps/details?id=com.lacrypta.cardinstaller&hl=en&gl=US)

## Pinned toolchain

This project is locked to a specific build toolchain. Versions are declared in repo
config and consumed automatically by the helper scripts — no manual env-var juggling.

| Tool                | Version              | Source of truth                                   |
| ------------------- | -------------------- | ------------------------------------------------- |
| Java                | Zulu 11.0.26         | `.sdkmanrc`                                       |
| Node                | 18.15                | `.nvmrc`, `.node-version`                         |
| Yarn                | 1.x (classic)        | installed by `scripts/setup.sh`                   |
| Gradle              | 7.5.1                | `android/gradle/wrapper/gradle-wrapper.properties`|
| Android Gradle Plugin | 7.3.1              | `android/build.gradle`                            |
| Kotlin              | 1.7.0                | `android/gradle.properties`                       |
| Android SDK         | API 31 (Android 12)  | `android/build.gradle`                            |
| Build Tools         | 33.0.0               | `android/build.gradle`                            |
| NDK                 | 23.1.7779620         | `android/build.gradle`                            |

Bumping any of these is a deliberate change — they're committed to git and shared
across machines.

## Quick start

### One-shot setup (new machine)

Requires Android Studio + Android SDK installed separately
(see https://reactnative.dev/docs/environment-setup → "React Native CLI Quickstart").

```bash
git clone <repo>
cd bolt-nfc-android-app
yarn setup       # installs SDKMAN, nvm, Zulu 11, Node 18.15, yarn, JS deps
```

The setup script is idempotent — safe to re-run after pulling changes.

After setup:
1. Edit `.env` and set your `MIFARE_KEY` (register at https://inspire.nxp.com/mifare/).
2. Connect an Android device with USB debugging enabled, or start an emulator.
3. Build & run (see commands below).

### Day-to-day commands

```bash
yarn build:debug     # build debug APK (no install)
yarn build:release   # build signed release APK
yarn build:bundle    # build AAB for Google Play
yarn android         # build + install debug on connected device/emulator
yarn start           # start Metro bundler
yarn clean           # gradle clean
yarn clean:full      # nuke gradle daemons + local caches (use after JDK changes)
```

All build commands route through `./scripts/build`, which sets `JAVA_HOME` to a
JDK 11 install automatically (via SDKMAN, then macOS `java_home`, then known
Linux JDK paths). You don't need to set `JAVA_HOME` manually.

### Deploying a release

1. Place your upload keystore at `android/app/my-upload-key.keystore`
   (signing config + credentials are in `android/gradle.properties`).
2. `yarn build:bundle` → produces `android/app/build/outputs/bundle/release/app-release.aab`
3. Upload the AAB to Google Play Console.

For first-time keystore generation:
```bash
keytool -genkeypair -v -keystore android/app/my-upload-key.keystore \
  -alias onesandzeros-key -keyalg RSA -keysize 2048 -validity 10000
```

### Manual setup (if you don't want yarn setup)

<details>
<summary>Click to expand</summary>

1. Install Android Studio + Android 12 (API 31) SDK, build-tools 33.0.0, NDK 23.1.7779620
2. Install SDKMAN: `curl -s https://get.sdkman.io | bash`
3. In the repo root, run `sdk env install` (reads `.sdkmanrc`, installs Zulu 11)
4. Install nvm: https://github.com/nvm-sh/nvm
5. In the repo root, run `nvm install` (reads `.nvmrc`, installs Node 18.15)
6. `npm install -g yarn`
7. `yarn install`
8. `cp .env-example .env` and set `MIFARE_KEY` (register at https://inspire.nxp.com/mifare/)
9. Connect device or start emulator
10. `yarn android`

</details>

## Usage

1. Install [boltcard server](https://github.com/boltcard/boltcard) and aquire some blank NTAG424DNA tags.
2. When app has loaded go to the write screen and put your lnurlw domain and path in to the text box.
3. When finished tap a card on the NFC scanner to write the card.
4. Go to the read screen and check that your URL looks correct. Should also be outputting the PICC and CMAC as URL paramters
5. To change your keys (to prevent malicious re-writing of your card) Go to the boltcard server terminal and run the command to show the card key change URL in QR code form and then scan this with the phone camera to load the server keys.
6. When the keys are loaded, Hold the NFC card to the phone to run the key change on the card. Do not move the card until the key change has completed.
   Warning! If you lose the new keys then you will be unable to reprogram the card again

## Wiping cards

To wipe a card get the keys into a json in the following format:

```
{
	"version": 1,
	"action": "wipe",
	"k0": "11111111111111111111111111111111",
	"k1": "22222222222222222222222222222222",
	"k2": "33333333333333333333333333333333",
	"k3": "44444444444444444444444444444444",
	"k4": "55555555555555555555555555555555"
}
```

Go to the advanced > key reset screen and either paste this json from the clipboard or scan a QR code with this JSON encoded in it.
Then press "reset card now" and tap and hold your card against the NFC reader.

## UID Privacy

As of 0.1.4 the app now supports card UID Randomisation (irreversable). If you add the "uid_privacy" field and set its value to "Y" the card will be programmed to have a random UID. Any other value or ommission of this field will leave the card UID as-is. Please note this action is irreversable.

```
{
    "protocol_name": "new_bolt_card_response",
    "protocol_version":1,
    "card_name": "Spending_Card",
    "lnurlw_base": "lnurlw://your.domain.com/ln",
    "uid_privacy": "Y"
    "k0":"11111111111111111111111111111111",
    "k1":"22222222222222222222222222222222",
    "k2":"33333333333333333333333333333333",
    "k3":"44444444444444444444444444444444",
    "k4":"55555555555555555555555555555555"
}
```

# Dependencies / Security considerations

We rely on the Taplinx 2.0 Android library supplied by NXP.

React native libraries are also used to make building the UI easier.

Keep all your keys secret, and be careful when creating your cards that there are no other potential listening devices in range.

# Version info

## 0.1.9

Various fixes to attempt to prevent card programming errors

## 0.1.6

Remove key check code to prevent card programming errors

## 0.1.4

Added support for random UID to increase privacy. https://github.com/boltcard/bolt-nfc-android-app/issues/25

# [Testing](testing.md)

## Useful debug commands

- npm run run-android
- adb logcat -s "cardinstaller"
- java --module-path ~/Android/javafx-sdk-18.0.2/lib --add-modules javafx.controls,javafx.fxml -jar TagXplorer-v1.2.jar
- ./gradlew assembleRelease
- \copy (select \* from cards order by card_id) to export.csv CSV HEADER;
- echo \"{\\\"commit\\\":\\\"`git rev-parse --short HEAD`\\\"}\" > gitinfo.json
