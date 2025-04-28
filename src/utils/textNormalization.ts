
/**
 * Normalizes text by trimming whitespace, standardizing line endings,
 * and removing surrounding quotes
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    // Remove surrounding quotes (both single and double)
    .replace(/^["'](.*)["']$/, '$1')
    // Normalize line endings to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove extra whitespace between words
    .replace(/\s+/g, ' ')
    // Remove extra line breaks
    .replace(/\n+/g, '\n');
};
