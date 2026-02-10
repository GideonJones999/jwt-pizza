import * as fs from "fs";
import * as path from "path";

export default async function globalSetup() {
  // Ensure .nyc_output directory exists
  const nycOutputDir = path.join(process.cwd(), ".nyc_output");
  if (!fs.existsSync(nycOutputDir)) {
    fs.mkdirSync(nycOutputDir, { recursive: true });
  }
  console.log("Coverage directory ready");
}
