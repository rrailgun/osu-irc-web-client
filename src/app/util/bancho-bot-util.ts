
/*
* Extracts the match ID from a BanchoBot message.
* @param message - The full message containing the mp link.
* @returns The match ID as a string, or null if not found.
*/
export function extractMPId(message: string): string | null {
    const match = message.match(/mp\/(\d+)/);
    return match ? match[1] : null;
}