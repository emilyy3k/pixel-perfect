/**
 * Converts a hex color string to an RGB array [r,g,b] with values from 0-1
 * @param hex Hex color string (e.g. "#FF5500" or "#F50")
 * @returns RGB array with values from 0-1
 */
export function hexToRgb(hex) {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    // Handle shorthand format (e.g. #F50)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
}
