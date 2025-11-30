/**
 * Electron Builder Configuration
 */
module.exports = {
  appId: "com.gogoshine.capcut-mate",
  productName: "路飞剪映小助手",
  extraResources: [
    {
      from: "resources/icon",
      to: "icon"
    }
  ],
  publish: false,
  win: {
    target: "nsis",
    icon: "resources/icon/logo.ico",
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false,
    artifactName: "capcut-mate-windows-x64-installer.exe"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    allowElevation: false,
    installerIcon: "resources/icon/logo.ico",
    uninstallerIcon: "resources/icon/logo.ico",
    installerHeaderIcon: "resources/icon/logo.ico"
  },
  mac: {
    target: [
      {
        target: "dmg",
        arch: [
          "x64",
          "arm64"
        ]
      },
      {
        target: "zip",
        arch: [
          "x64",
          "arm64"
        ]
      }
    ],
    category: "public.app-category.productivity",
    icon: "resources/icon/logo.icns",
    extendInfo: {
      "NSAppleEventsUsageDescription": "Application requires access to Apple Events to function properly"
    },
    artifactName: "capcut-mate-macos-apple.dmg"
  },
  linux: {
    icon: "resources/icon/logo.png"
  }
};