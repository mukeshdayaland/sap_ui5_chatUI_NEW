const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "webapp");
const target = path.join(root, "dist");
const archive = path.join(target, "sap-ui5-chat-ui.zip");

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });
fs.rmSync(archive, { force: true });

console.log(`Copied ${source} to ${target}`);

execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${path.join(target, "*").replace(/'/g, "''")}' -DestinationPath '${archive.replace(/'/g, "''")}' -Force`
  ],
  { stdio: "inherit" }
);

console.log(`Created ${archive}`);
