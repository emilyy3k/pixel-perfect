// This script injects the contents of pixel-art.frag and pixel-art.vert into PixelArtFilter.ts
const fs = require("fs");
const path = require("path");

const tsFile = path.join(__dirname, "..", "scripts", "PixelArtFilter.ts");
const fragFile = path.join(
  __dirname,
  "..",
  "scripts",
  "shaders",
  "pixel-art.frag"
);
const vertFile = path.join(
  __dirname,
  "..",
  "scripts",
  "shaders",
  "pixel-art.vert"
);

function escapeContent(content) {
  // Escape backticks and backslashes for template literals
  return content.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

const fragContent = escapeContent(fs.readFileSync(fragFile, "utf8"));
const vertContent = escapeContent(fs.readFileSync(vertFile, "utf8"));

let tsSource = fs.readFileSync(tsFile, "utf8");

// Replace the entire template literal content for fragmentShader and vertexShader
tsSource = tsSource.replace(
  /let fragmentShader = `([\s\S]*?)`;/,
  "let fragmentShader = `" + fragContent + "`;"
);
tsSource = tsSource.replace(
  /let vertexShader = `([\s\S]*?)`;/,
  "let vertexShader = `" + vertContent + "`;"
);

fs.writeFileSync(tsFile, tsSource, "utf8");
console.log("Shaders injected into PixelArtFilter.ts");
