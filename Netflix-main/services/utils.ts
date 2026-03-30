/**
 * Extracts the File ID from a Google Drive URL or returns the input if it matches the ID format.
 * 
 * Supported Patterns:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * - Raw ID (25+ chars, alphanumeric + _ -)
 * 
 * @param input The full URL or ID to process
 * @returns The extracted ID string, or null if no valid ID found
 */
export const extractGoogleDriveId = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();

    // 1. Try specific URL patterns first (Higher Precision)
    const urlPatterns = [
        // Standard File Link: /file/d/ID/...
        /(?:drive|docs)\.google\.com\/file\/d\/([-\w]{25,})/,
        // Open Link: open?id=ID
        /(?:drive|docs)\.google\.com\/open\?id=([-\w]{25,})/,
        // View/Preview link variations
        /(?:drive|docs)\.google\.com\/uc\?id=([-\w]{25,})/
    ];

    for (const pattern of urlPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // 2. Fallback: If it looks like a raw ID (no slashes, long enough)
    // Google IDs are typically base64url-like (A-Z, a-z, 0-9, -, _) and ~33 chars
    // We use 20 as a safe lower bound as requested, though most are longer.
    if (/^([-\w]{20,})$/.test(trimmed)) {
        return trimmed;
    }

    return null;
};

/**
 * Extracts the Video ID from a YouTube URL or returns the input if it matches the ID format.
 * 
 * Supported Patterns:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - Raw ID (11 chars, alphanumeric + _ -)
 * 
 * @param input The full URL or ID to process
 * @returns The extracted ID string, or null if no valid ID found
 */
export const extractYoutubeId = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();

    // 1. Try URL patterns
    const urlPatterns = [
        // Standard Watch: v=VIDEO_ID
        /(?:youtube\.com\/watch\?v=|youtube\.com\/v\/)([-\w]{11})/,
        // Shortened: youtu.be/VIDEO_ID
        /youtu\.be\/([-\w]{11})/,
        // Embed: embed/VIDEO_ID
        /youtube\.com\/embed\/([-\w]{11})/,
        // Shorts: shorts/VIDEO_ID
        /youtube\.com\/shorts\/([-\w]{11})/
    ];

    for (const pattern of urlPatterns) {
        const match = trimmed.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // 2. Fallback: Raw ID (Exactly 11 chars)
    if (/^([-\w]{11})$/.test(trimmed)) {
        return trimmed;
    }

    return null;
};
