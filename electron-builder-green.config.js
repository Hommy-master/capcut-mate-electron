/**
 * Electron Builder Configuration for Green Packages
 * This configuration is used specifically for building ZIP format packages
 */
module.exports = {
  appId: "com.gogoshine.capcut-mate",
  productName: "capcut-mate", // Changed from Chinese to avoid path length issues on macOS
  directories: {
    output: "dist"
  },
  files: [
    "**/*",
    "!dist/**/*",
    "!node_modules/electron/**/*",
    "!node_modules/electron-builder/**/*",
    "!node_modules/@electron/**/*",
    "!node_modules/**/*.md",
    "!node_modules/**/*.map",
    "!electron-builder.config.js",
    "!electron-builder-green.config.js",
    "!*.+(md|MD)"
  ],

  win: {
    icon: "assets/icons/logo.ico",
    target: "zip",
    artifactName: "capcut-mate-windows-x64.zip",
    // 禁用代码签名
    signingHashAlgorithms: []
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
  portable: {
    artifactName: "capcut-mate-windows-x64-portable.exe"
  },
  mac: {
    icon: "assets/icons/logo.icns",
    target: "zip",
    artifactName: "capcut-mate-macos-arm64.zip",
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

};