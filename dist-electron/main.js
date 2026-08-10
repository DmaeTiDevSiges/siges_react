import { app as n, BrowserWindow as r, shell as a } from "electron";
import o from "path";
import { fileURLToPath as d } from "url";
const c = d(import.meta.url), t = o.dirname(c);
let e = null;
const i = process.env.VITE_DEV_SERVER_URL;
function l() {
  e = new r({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: o.join(t, "../public/siges_logo.png"),
    webPreferences: {
      preload: o.join(t, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !1,
      webSecurity: !0,
      allowRunningInsecureContent: !1
    },
    show: !1,
    titleBarStyle: "hiddenInset",
    frame: process.platform !== "darwin"
    // macOS uses hiddenInset titleBarStyle
  }), i ? (e.loadURL(i), e.webContents.openDevTools({ mode: "bottom" })) : e.loadFile(o.join(t, "../dist/index.html")), e.once("ready-to-show", () => {
    e == null || e.show();
  }), e.webContents.setWindowOpenHandler(({ url: s }) => (a.openExternal(s), { action: "deny" })), e.on("closed", () => {
    e = null;
  });
}
n.whenReady().then(() => {
  l(), n.on("activate", () => {
    r.getAllWindows().length === 0 && l();
  });
});
n.on("window-all-closed", () => {
  process.platform !== "darwin" && n.quit();
});
