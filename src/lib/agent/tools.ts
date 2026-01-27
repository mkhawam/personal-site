
export type Tool = {
  name: string;
  description: string;
  execute: (args: any) => Promise<string>;
  parameters?: any; // checking if needed
};

export const tools: Record<string, Tool> = {
  submit_tasks: {
    name: 'submit_tasks',
    description: 'FINAL STEP: Call this tool to submit the list of tasks to the user. Do not call this until you have all necessary information.',
    execute: async (args: any) => {
        // This execution is largely symbolic as core.ts intercepts it to end the turn,
        // but we return a success message in case the loop continues for some reason.
        return "Tasks submitted successfully.";
    }
  },
  read_url: {
    name: 'read_url',
    description: 'Fetches and returns the text content of a URL. Use this to read documentation, articles, or GitHub files.',
    execute: async ({ url }: { url: string }) => {
      try {
        console.log(`[Tool: read_url] Fetching ${url}`);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        const html = await res.text();
        
        // Simple regex-based text extraction since we don't have cheerio/jsdom
        // 1. Remove scripts and styles
        let text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                       .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
                       
        // 2. Remove tags
        text = text.replace(/<[^>]+>/g, "\n");
        
        // 3. Decode entities (basic coverage)
        text = text.replace(/&nbsp;/g, " ")
                   .replace(/&amp;/g, "&")
                   .replace(/&lt;/g, "<")
                   .replace(/&gt;/g, ">")
                   .replace(/&quot;/g, '"');
                   
        // 4. Collapse whitespace
        text = text.replace(/\s+/g, " ").trim();
        
        // 5. Truncate to avoid context window explosion (e.g. 10k chars)
        const MAX_CHARS = 10000;
        if (text.length > MAX_CHARS) {
            text = text.slice(0, MAX_CHARS) + `\n\n[...Truncated. Original length: ${text.length} chars]`;
        }
        
        return `URL: ${url}\nContent:\n${text}`;
      } catch (e: any) {
        return `Failed to read URL ${url}: ${e.message}`;
      }
    }
  },
  search_web: {
    name: 'search_web',
    description: 'Searches the web for a given query. Returns a list of relevant URLs and snippets. Use this to find documentation, libraries, or solve problems.',
    execute: async ({ query }: { query: string }) => {
      try {
        console.log(`[Tool: search_web] Searching for: ${query}`);
        const searchUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
        const res = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Agent/1.0)'
            }
        });
        
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const html = await res.text();
        
        // Simple extraction of results from DDG Lite
        // DDG Lite results are roughly: <tr>...<a class="result-link" href="...">...</a>...</tr>
        // We will regex for links.
        
        const results: string[] = [];
        const linkRegex = /<a[^>]+class=["']result-link["'][^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/g;
        let match;
        
        while ((match = linkRegex.exec(html)) !== null) {
            const link = match[1];
            let title = match[2].replace(/<[^>]+>/g, '').trim(); // Strip tags from title
            
            if (link && title && !link.includes('duckduckgo.com')) {
                results.push(`- [${title}](${link})`);
            }
            if (results.length >= 5) break; // Limit to 5 results
        }
        
        if (results.length === 0) {
            return `No results found for "${query}".`;
        }
        
        return `Search Results for "${query}":\n${results.join('\n')}\n\n(Tip: You can use 'read_url' to read the content of these links)`;
        
      } catch (e: any) {
        return `Failed to search web: ${e.message}`;
      }
    }
  }
};
