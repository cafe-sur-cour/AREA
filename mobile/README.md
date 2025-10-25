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

## Starting the app

### Via CLI

In the `mobile/` directory, run
```bash
flutter run
```
This is the `debug` version, allowing hot reload by pressing `r` in the CLI.
Add `--release` to run the app in its release version.

### Via scripts

In the project's root, run
```bash
./scripts/runMobileDebug.sh
```
This is the `debug` version, allowing hot reload by pressing `r` in the CLI.
For the release verion, run
```bash
./scripts/runMobileRelease.sh
```

## Build the apk

### Via CLI

In the `mobile/` directory, run
```bash
flutter build apk --release
```
This will build the APK but you will have to move it by hand to the `builds/` directory that's in the root of the project.

### Via scripts

In the project's root, run
```bash
./scripts/buildMobileApk.sh
```
It will automatically create the apk and move it to the `builds/` directory.

## Useful commands

### Run the tests

In the `mobile/` directory, run
```bash
flutter test
```
This will run every tests in the AREA mobile project.

### Coverage

To run tests and display tests, in the `mobile/` directory, run:
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
firefox coverage/html/index.html
```

### Format the files

In the `mobile/` directory, run
```bash
dart format .
```
This will format every file in the AREA mobile project.

### Analyze code conformity

In the `mobile/` directory, run
```bash
dart analyze
```
This will output every code errors/warnings.
Static analysis allows you to find problems before executing a single line of code.
It's a powerful tool used to prevent bugs and ensure that code conforms to style guidelines.

With the help of the analyzer, you can find simple typos.
For example, perhaps an accidental semicolon made its way into an if statement.

### Auto fix issues found by analysis

To preview the proposed changes, go to the `mobile/` directory and run
```bash
dart fix --dry-run
```

To apply the proposed changes, go to the `mobile/` directory and run
```bash
dart fix --apply
```
This will fix analysis issues identified by dart analyze that have associated automated fixes
(sometimes called quick-fixes or code actions).

### Generate the code for translations
In the `mobile/` directory, run
```bash
flutter gen-l10n
```
This will update the code that handles the translations written in `lib/`.
