function parseRobotsTxt(text) {
   const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
   const groups = []
   let current = null

   for (const line of lines) {
      if (line.startsWith('#')) continue
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue

      const key = line.slice(0, colonIndex).trim().toLowerCase()
      const value = line.slice(colonIndex + 1).trim()

      if (key === 'user-agent') {
         if (!current || current.ruleStarted) {
            current = { agents: [], disallow: [], allow: [], ruleStarted: false }
            groups.push(current)
         }
         current.agents.push(value)
      } else if (key === 'disallow' && current) {
         current.ruleStarted = true
         if (value) current.disallow.push(value)
      } else if (key === 'allow' && current) {
         current.ruleStarted = true
         if (value) current.allow.push(value)
      }
   }

   const wildcardGroup = groups.find((group) => group.agents.includes('*'))
   return wildcardGroup
      ? { disallow: wildcardGroup.disallow, allow: wildcardGroup.allow }
      : { disallow: [], allow: [] }
}

function matchesPattern(path, pattern) {
   if (pattern === '') return false
   const hasEndAnchor = pattern.endsWith('$')
   const hasRawPattern = hasEndAnchor ? pattern.slice(0, -1) : pattern
   const escaped = hasRawPattern 
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
   const regex = new RegExp('^' + escaped + (hasEndAnchor ? '$' : ''))
   return regex.test(path)
}

function isPathAllowed(path, rules) {
   const matches = [
      ...rules.disallow.map((pattern) => ({  type: 'disallow', pattern: pattern })),
      ...rules.allow.map((pattern) => ({ type: 'allow', pattern: pattern })),
   ].filter((rule) => matchesPattern(path, rule.pattern))

   if (matches.length === 0) return true
   matches.sort((a, b) => b.pattern.length - a.pattern.length)
   return matches[0].type === 'allow'
}

export async function checkRobots(baseUrl, userAgent) {
   const robotsUrl = new URL('/robots.txt', baseUrl).href

   try {
      const response = await fetch(robotsUrl, { headers: { 'User-Agent': userAgent } });

      if (response.ok) {
         const text = await response.text();
         const rules = parseRobotsTxt(text);
         console.log(`[robots] 200 from ${robotsUrl} — ${rules.disallow.length} disallow rule(s) for *`);
         return { status: 'rules', rules };
      }

      if (response.status >= 400 && response.status < 500) {
         console.log(`[robots] ${response.status} from ${robotsUrl} — unavailable, treating as unrestricted (RFC 9309)`);
         return { status: 'unrestricted', rules: { disallow: [], allow: [] } };
      }

      console.error(`[robots] ${response.status} from ${robotsUrl} — server error, treating as fully disallowed (fail closed)`);
      return { status: 'disallowed', rules: { disallow: ['/'], allow: [] } };
   } catch (err) {
      console.error(`[robots] network error fetching ${robotsUrl}: ${err.message} — treating as fully disallowed (fail closed)`);
      return { status: 'disallowed', rules: { disallow: ['/'], allow: [] } };
   }
}

export function isAllowed(path, robotResult) {
   if (robotResult.status === 'disallowed') return false
   return isPathAllowed(path, robotResult.rules)
}