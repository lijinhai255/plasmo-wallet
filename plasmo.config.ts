import type { PlasmoConfig } from "plasmo"

const config: PlasmoConfig = {
  manifest: {
    background: {
      service_worker: "background.ts"
    }
  }
}

export default config