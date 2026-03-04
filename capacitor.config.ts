import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.harman.shiftwise",
  appName: "ShiftWise",
  webDir: ".next",
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || "https://shiftwise.vercel.app",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 700,
      launchAutoHide: true,
      backgroundColor: "#f0f4f8",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f0f4f8",
      overlaysWebView: false,
    },
  },
}

export default config
