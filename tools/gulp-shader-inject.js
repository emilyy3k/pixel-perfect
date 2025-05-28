const fs = require("fs");
const path = require("path");
const through = require("through2");
const PluginError = require("plugin-error");

const PLUGIN_NAME = "gulp-shader-inject";

function escapeContent(content) {
  // Escape backticks and backslashes for template literals
  return content.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function stripComments(content) {
  let output = content || "";
  // Split content into an array of lines
  const lines = content.split("\r\n");
  // Remove lines that start with "//" or empty lines
  const filteredLines = lines.filter((line) => {
    return !line.trim().startsWith("//");
  });
  // Remove any remaining // comments at ends of lines
  const filteredLinesAgain = filteredLines.map((line) => {
    return line.trim().split("//")[0].trim();
  });

  // Join the filtered lines back into a single string
  output = filteredLinesAgain.join("\\r\\\n");

  return output;
}

module.exports = function (options = {}) {
  const fragFile =
    options.fragFile ||
    path.join(__dirname, "..", "scripts", "shaders", "pixel-art.frag");
  const vertFile =
    options.vertFile ||
    path.join(__dirname, "..", "scripts", "shaders", "pixel-art.vert");

  return through.obj(function (file, encoding, callback) {
    if (file.isNull()) {
      return callback(null, file);
    }

    if (file.isStream()) {
      return callback(new PluginError(PLUGIN_NAME, "Streaming not supported"));
    }

    // Only process PixelArtFilter.js files
    if (!file.path.includes("PixelArtFilter.js")) {
      return callback(null, file);
    }

    try {
      // Read shader files
      const fragContent = escapeContent(fs.readFileSync(fragFile, "utf8"));
      const vertContent = escapeContent(fs.readFileSync(vertFile, "utf8"));

      // Get the JavaScript content
      let jsContent = file.contents.toString();

      // Replace the shader variables in the compiled JavaScript
      // Looking for patterns like: var fragmentShader = "..."; or let fragmentShader = `...`;
      jsContent = jsContent.replace(
        /(var|let|const)\s+fragmentShader\s*=\s*["`][\s\S]*?["`];?/g,
        `$1 fragmentShader = \`${stripComments(fragContent)}\`;`
      );

      jsContent = jsContent.replace(
        /(var|let|const)\s+vertexShader\s*=\s*["`][\s\S]*?["`];?/g,
        `$1 vertexShader = \`${stripComments(vertContent)}\`;`
      );

      // Update the file contents
      file.contents = Buffer.from(jsContent);

      console.log(`Shaders injected into ${path.basename(file.path)}`);
    } catch (err) {
      return callback(
        new PluginError(PLUGIN_NAME, `Error injecting shaders: ${err.message}`)
      );
    }

    callback(null, file);
  });
};
