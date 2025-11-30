/**
 * Electron Builder Configuration
 */
module.exports = {
  appId: "com.gogoshine.capcut-mate",
  productName: "CapCut Mate",
  directories: {
    output: "dist"
  },
  extraResources: [
    {
      from: "resources/icon",
      to: "icon"
    }
  ],
  publish: false,
  win: {
    icon: "resources/icon/logo.ico",
    target: "nsis",
    artifactName: "capcut-mate-windows-x64-installer.exe",
    // 禁用代码签名
    signingHashAlgorithms: [],
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false
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
    icon: "resources/icon/logo.icns",
    target: "dmg",
    artifactName: "capcut-mate-macos-apple.dmg",
    category: "public.app-category.productivity"
  },
  dmg: {
    background: null,
    window: {
      width: 540,
      height: 380
    },
    contents: [
      {
        x: 130,
        y: 150,
        type: "file"
      },
      {
        x: 410,
        y: 150,
        type: "link",
        path: "/Applications"
      }
    ]
  },
  linux: {
    icon: "resources/icon/logo.png"
  }
};