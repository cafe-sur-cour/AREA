# AREA

A new Flutter project.

AREA is the best automation app ever created.

## Getting Started

### Installing Flutter

Go check the documentation to install [flutter](https://docs.flutter.dev/get-started/install/).

### Adding devices

To run the app you need a phone device, if none, the app will run in a web page.

To list your available devices, run
```bash
flutter devices
```

You can use your phone as your device by connecting it to your pc and allowing USB Debugging in the developper settings.

If you want to emulate a phone, run
```bash
flutter emulators
```
And follow the displayed commands to `launch` a device or `create` one.

## Starting the app - via CLI

In the `mobile/` directory, run
```bash
flutter run
```
This is the `debug` version, allowing hot reload by pressing `r` in the CLI.
Add `--release` to run the app in its release version.

## Starting the app - via scripts

In the project's root, run
```bash
./scripts/runMobileDebug.sh
```
This is the `debug` version, allowing hot reload by pressing `r` in the CLI.
For the release verion, run
```bash
./scripts/runMobileRelease.sh
```

## Build the apk - via CLI

In the `mobile/` directory, run
```bash
flutter build apk --release
```
This will build the APK but you will have to move it by hand to the `builds/` directory that's in the root of the project.

## Build the apk - via scripts

In the project's root, run
```bash
./scripts/buildMobileApk.sh
```
It will automatically create the apk and move it to the `builds/` directory.

### Run the tests

In the `mobile/` directory, run
```bash
flutter test
```
This will run every tests in the AREA mobile project.
