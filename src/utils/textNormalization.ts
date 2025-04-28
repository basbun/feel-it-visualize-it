
/**
 * Normalizes text by trimming whitespace and standardizing line endings
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    // Normalize line endings to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove extra whitespace between words
    .replace(/\s+/g, ' ')
    // Remove extra line breaks
    .replace(/\n+/g, '\n');
};
