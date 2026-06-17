[![Android build](https://github.com/AmazonAppDev/amazon-iap-kotlin/actions/workflows/android.yml/badge.svg)](https://github.com/AmazonAppDev/amazon-iap-kotlin/actions/workflows/android.yml)

# Amazon IAP Kotlin Example  

This project is a simple demonstration of the [Amazon IAP API](https://developer.amazon.com/docs/in-app-purchasing/iap-overview.html) on a Amazon Fire Tablet.
 
## 💻 Building the IAP demo

1. Clone the demo app repository:
`git clone https://github.com/AmazonAppDev/amazon-iap-kotlin.git`
2. Connect your Fire tablet device following these [instructions](https://developer.amazon.com/docs/fire-tablets/connecting-adb-to-device.html).

## 🧪 How to test with In-App Items

**Step 1:** 
Push the example [amazon.sdktester.json](https://github.com/AmazonAppDev/amazon-iap-kotlin/blob/main/amazon.sdktester.json) file to your device using the command:
```
adb push <_Your_JSON_File_Folder_>/amazon.sdktester.json /sdcard/amazon.sdktester.json
```
This JSON file is usually created when you [create IAP items](https://www.youtube.com/watch?v=cmPAY16wGb0) in the developer portal, however, for the sake of this demo we can use an example JSON.

**Step 2:**
Set your app in sandbox mode using the following command:

```
adb shell setprop debug.amazon.sandboxmode debug
```

Sandbox mode constrains calls that would normally go to the Appstore client to route to the Amazon App Tester app instead. Use this mode only for testing locally.

**Step 3:** 
Install the IAP app tester from the Amazon appstore. Once you install it you should be able to see the JSON file of the IAP items you created.

![image](https://user-images.githubusercontent.com/39306477/215546889-50440242-bc6f-4408-acd0-1c57936ac3c1.png)

You can now run the demo app!

*Note: When you run the demo app, it uses the App Tester, which allows you to test the In-App Purchasing (IAP) functionality of your app in sandbox mode.*

## 👩‍💻 Building your app
You can use this demo as a starting point to build a Kotlin app with an integration to the Amazon IAP API. 
To learn more about the API you can check out the [documentation](https://developer.amazon.com/docs/in-app-purchasing/iap-overview.html) or the [YouTube series](https://www.youtube.com/watch?v=cmPAY16wGb0_) I created.

## Get support
If you found a bug or want to suggest a new [feature/use case/sample], please [file an issue](../../issues).

If you have questions, comments, or need help with code, we're here to help:
- on X at [@AmazonAppDev](https://twitter.com/AmazonAppDev)
- on Stack Overflow at the [amazon-appstore](https://stackoverflow.com/questions/tagged/amazon-appstore) tag

### Stay updated
Get the most up to date Amazon Appstore developer news, product releases, tutorials, and more:

* 📣 Follow [@AmazonAppDev](https://twitter.com/AmazonAppDev) and [our team](https://twitter.com/i/lists/1580293569897984000) on [Twitter](https://twitter.com/AmazonAppDev)

* 📺 Subscribe to our [Youtube channel](https://www.youtube.com/amazonappstoredevelopers)

* 📧 Sign up for the [Developer Newsletter](https://m.amazonappservices.com/devto-newsletter-subscribe)

## 🔍 Checking GitHub Actions runs with GitHub CLI

Use the included helper script (`scripts/gh-actions-run.sh`) to inspect any workflow run programmatically — no browser required.

### Install GitHub CLI

| Platform | Command |
|----------|---------|
| macOS    | `brew install gh` |
| Ubuntu/Debian | `sudo apt install gh` |
| Fedora/RHEL | `sudo dnf install gh` |
| Windows  | `winget install GitHub.cli` |
| All platforms | [cli.github.com](https://cli.github.com/) |

### Authenticate once

```bash
gh auth login
gh auth status        # verify
```

### Quick-start: inspect run `23652704571`

```bash
# Summary (status, conclusion, branch, SHA)
./scripts/gh-actions-run.sh -R QueenFi703/amazon-iap-kotlin 23652704571

# Identical — pass the full URL instead of the run id
./scripts/gh-actions-run.sh \
  https://github.com/QueenFi703/amazon-iap-kotlin/actions/runs/23652704571

# Stream the full log
./scripts/gh-actions-run.sh -R QueenFi703/amazon-iap-kotlin 23652704571 --log

# Machine-readable JSON (status, conclusion, branch, SHA, timestamps, URL + jobs)
./scripts/gh-actions-run.sh -R QueenFi703/amazon-iap-kotlin 23652704571 --json
```

### List recent runs on `main`

```bash
gh run list -R QueenFi703/amazon-iap-kotlin --branch main --limit 10
```

### Re-run failed jobs

```bash
gh run rerun 23652704571 -R QueenFi703/amazon-iap-kotlin --failed
```

### Trigger a fresh `workflow_dispatch` run

```bash
gh workflow run "AWS Gradle Pipeline (S3 + CodeArtifact + Device Farm)" \
  -R QueenFi703/amazon-iap-kotlin \
  --ref main
```

## Authors

- [@anishamalde](https://anisha.dev)
