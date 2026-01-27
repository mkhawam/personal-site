/**
 * Helper to clean and parse JSON that might be malformed by LLMs.
 * Features:
 * - Removes comments (// and /*)
 * - Removes trailing commas
 * - Fixes single quotes to double quotes
 * - Auto-closes truncated arrays/objects
 */
export function tryParseJSON(str: string): any {
    try {
        return JSON.parse(str);
    } catch (e) {
        // failed, try cleaning
        try {
            let cleaned = str;
            // 1. Remove comments (//... and /*...*/)
            cleaned = cleaned.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            // 2. Remove trailing commas
            cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
            // 3. Try to fix single quotes to double quotes
            cleaned = cleaned.replace(/'/g, '"');
            // 4. Fix arrays closed by }
            // 4. Fix arrays closed by }
            // Matches: [ "string", "string" } -> [ "string", "string" ]
            // We use a lazy match for content inside [] to avoid over-matching
            cleaned = cleaned.replace(/(\[[^\]\{\}]*?)\}/g, '$1]');

            return JSON.parse(cleaned);
        } catch (e2) {
             // 5. Try auto-closing truncated JSON
             const stack: string[] = [];
             let inString = false;
             let escaped = false;
             
             for (let i = 0; i < str.length; i++) {
                 const char = str[i];
                 if (char === '"' && !escaped) inString = !inString;
                 if (!inString && char === '\\') escaped = !escaped;
                 else escaped = false;
                 
                 if (!inString) {
                     if (char === '{') stack.push('}');
                     if (char === '[') stack.push(']');
                     // pop logic
                     if (char === '}' || char === ']') {
                         if (stack.length > 0 && stack[stack.length-1] === char) {
                             stack.pop();
                         }
                     }
                 }
             }
             
             const reparsed = str + stack.reverse().join('');
             try {
                 return JSON.parse(reparsed);
             } catch(e3) {
                 return null;
             }
        }
    }
}
