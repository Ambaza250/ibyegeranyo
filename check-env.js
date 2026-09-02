// check-env.js
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const val = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

console.log("Length:", val ? val.length : 0);
console.log("Starts with:", val ? val.slice(0, 60) : "UNDEFINED");
console.log("Ends with:", val ? val.slice(-40) : "UNDEFINED");

try {
  const parsed = JSON.parse(val);
  console.log("Is valid JSON? true");
  console.log("project_id:", parsed.project_id);
  console.log("client_email:", parsed.client_email);
} catch (e) {
  console.log("Is valid JSON? false");
  console.log("Parse error:", e.message);
}
