const fs = require('fs').promises;
const path = require('path');
const duckduckgoService = require('./duckduckgoService');
const googleService = require('./googleService');
const llmService = require('./llmService');

class EmailService {
  constructor() {
    // Resolve email_context.md at the workspace root
    // __dirname is H:\search-goat\backend\src\services
    this.contextPath = path.resolve(__dirname, '..', '..', '..', 'email_context.md');
  }

  /**
   * Reads the contents of email_context.md.
   * If it doesn't exist, returns a placeholder/default.
   * @returns {Promise<string>}
   */
  async readContext() {
    try {
      const data = await fs.readFile(this.contextPath, 'utf8');
      return data;
    } catch (err) {
      console.warn(`Context file not found at ${this.contextPath}. Creating default template.`);
      const defaultContent = `# Candidate Job Hunt & Outreach Context

## 1. Candidate Profile & Target Roles
- **Name**: Yuvraj
- **Target Role(s)**: Full-Stack Engineer, Frontend Engineer, Software Developer
- **Years of Experience**: 4+ years of software development experience

## 2. Core Technical Skills & Tech Stack
- **Languages**: JavaScript (ES6+), TypeScript, HTML5/CSS3, Python
- **Frameworks & Libraries**: React, Next.js, Express.js, Node.js, TailwindCSS
- **Database & Dev Tools**: MongoDB, Mongoose, Git, Vite, Puppeteer, RESTful APIs

## 3. Experience & Key Achievements
- **Full-Stack Developer**: Built and maintained SearchGoat, an AI-powered search aggregation and intelligence scraping service using Node.js, Puppeteer, and React, increasing data extraction speed by 40%.
- **Frontend Optimization**: Integrated Framer Motion and modern Tailwind styling configurations, raising UX engagement rates on production dashboards.

## 4. Cold Outreach Pitch & CTA
- **Target Person**: Hiring Manager, Engineering Team Lead, or Recruiter
- **The Angle**: Express genuine interest in the company's mission and explain how my skills in React, TypeScript, and web automation/scraping can contribute to their engineering team.
- **Call to Action (CTA)**: "Would you be open to a brief 10-minute virtual chat next week to see if there might be a fit for me on your team or to learn more about your engineering roadmap?"`;
      
      await this.writeContext(defaultContent);
      return defaultContent;
    }
  }

  /**
   * Writes context content to email_context.md.
   * @param {string} content 
   */
  async writeContext(content) {
    // Ensure parent directories exist (should exist since it's root)
    await fs.mkdir(path.dirname(this.contextPath), { recursive: true });
    await fs.writeFile(this.contextPath, content, 'utf8');
    return true;
  }

  /**
   * Searches for a company, summarizes its purpose, and generates a cold email.
   * @param {string} companyName Name of the company
   * @param {string} userContext Context contents of email_context.md
   * @param {Object} options Configuration options (signal, engine)
   * @returns {Promise<{ company: string, purpose: string, email: string }>}
   */
  async generateEmailForCompany(companyName, userContext, options = {}) {
    const { signal, engine = 'duckduckgo' } = options;
    if (!companyName || !companyName.trim()) {
      throw new Error('Company name is required');
    }

    console.log(`[EmailService] Processing company: "${companyName}"...`);

    // 1. Search for company purpose and what they do
    const searchQuery = `${companyName} company purpose what they do product service`;
    let searchResults = [];

    try {
      if (engine === 'google') {
        searchResults = await googleService.search(searchQuery, { signal });
      } else {
        searchResults = await duckduckgoService.search(searchQuery, { signal });
      }
    } catch (searchErr) {
      console.warn(`Search failed for ${companyName} using ${engine}, trying fallback:`, searchErr.message);
      // Try fallback engine
      try {
        if (engine === 'google') {
          searchResults = await duckduckgoService.search(searchQuery, { signal });
        } else {
          searchResults = await googleService.search(searchQuery, { signal });
        }
      } catch (fallbackErr) {
        console.error(`Both engines failed searching for ${companyName}:`, fallbackErr.message);
      }
    }

    // 2. Synthesize company profile (purpose and what they do) based on search results
    let companyPurpose = '';
    if (searchResults && searchResults.length > 0) {
      const formattedResults = searchResults
        .slice(0, 5)
        .map((r, i) => `[Result ${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
        .join('\n\n');

      const analyzePrompt = `You are an expert market analyst. Summarize what the company "${companyName}" does, their main products or services, their core business purpose, and target market based on these search results:

${formattedResults}

Write a concise, accurate description (maximum 3 sentences, under 100 words). Be objective and focus on facts. Do not write introductory text, just output the description.`;

      try {
        const modelId = await llmService.getModelId();
        const response = await fetch(`${llmService.baseUrl}/chat/completions`, {
          method: 'POST',
          signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmService.apiKey}`
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: 'You summarize company profiles from search results.' },
              { role: 'user', content: analyzePrompt }
            ],
            temperature: 0.2,
            max_tokens: 150
          })
        });

        if (response.ok) {
          const data = await response.json();
          companyPurpose = data.choices?.[0]?.message?.content?.trim() || '';
        }
      } catch (err) {
        console.error(`Failed to analyze company purpose via LLM for ${companyName}:`, err.message);
      }
    }

    if (!companyPurpose) {
      // Fallback description based on search snippets or placeholder
      if (searchResults && searchResults.length > 0) {
        companyPurpose = searchResults.slice(0, 2).map(r => r.snippet).join(' ');
      } else {
        companyPurpose = `Could not gather detailed search results for ${companyName}. Assuming general business operations.`;
      }
    }

    // 3. Generate cold email based on user context and company purpose
    let emailContent = '';
    const emailPrompt = `You are a sharp, young tech founder who writes cold outreach that actually gets replies.
Write a cold email from Yuvraj to "${companyName}" for a full-stack engineering role.

CANDIDATE CONTEXT:
${userContext}

COMPANY:
Name: ${companyName}
What they do: ${companyPurpose}

RULES:
- Subject must be a HOOK — a specific observation, question, or provocative claim. NEVER a job title. Examples: "built a marketplace at 19 — want to chat?", "saw what Kavia is doing with codebases", "shipped this, think it maps to your stack"
- The company callout must include a TECHNICAL or PRODUCT-SPECIFIC detail from their profile — not just their name
- Whenever using CompanyName, use only name not the full legal entity (e.g., "Kavia" not "Kavia Inc.")
- BANNED phrases (add to existing list): "I'd love to discuss", "contribute to your mission", "my experience can", "resonates with me"
- After the company callout, immediately pivot to ONE concrete technical match — e.g. "we're both dealing with [X problem], I solved it with [Y]"
- The technical bridge MUST be honest — only draw a parallel if Yuvraj's work genuinely maps to the company's problem. If it doesn't map cleanly, lead with curiosity about their stack instead, not a forced analogy.
- Subject formula: "[specific action] + [implied stakes]" — e.g. "shipped X at 19", "noticed Y in your stack", "built this, might be relevant"
- BANNED: "caught my attention", "we're both dealing with", "I saw that"
- Start EXACTLY with: Hello Team,
- End EXACTLY with: Regards,\nYuvraj
- BANNED CTA phrases: "to see if there might be a fit", "learn more about your engineering roadmap", "given the overlap in our interests", "robust and scalable", "make a real impact", "what struck me","intrigued me", "caught my attention", "piqued my interest"
- CTA must be ONE short sentence. Max 10 words. Examples: "Quick 10-min chat this week?", "Worth a quick call?"
- If the company is not a strong technical fit, keep the email SHORT and curiosity-led — do not pad with forced relevance
- Under 250 words total (body only dividing in 3 paragraphs, not counting subject or sign-off)
- Voice: confident, casual, builder-first — use terms like "shipped", "built from scratch", "obsessed with", "moving fast", "would love to contribute"
- ONE specific callout to what ${companyName} actually does — show you did the homework
- ONE concrete thing Yuvraj built that maps to their stack or problem space
- CTA: low-friction ask — "quick 10-min chat?" not a formal interview request
- NO filler phrases: "I came across", "I would love the opportunity", "I am writing to", "I hope this finds you well"
- NO bullet points in the email body
- NO corporate tone whatsoever
- NO generic compliments about the company or its mission
- No "—" anywhere in the response, only use commas or periods
FORMAT (return ONLY this, nothing else):
Subject: [subject]

Hello Team,

[body]

Regards,
Yuvraj`;

    try {
      const modelId = await llmService.getModelId();
      const response = await fetch(`${llmService.baseUrl}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmService.apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            { role: 'system', content: 'You are an elite career advisor and professional outreach writer drafting personalized cold networking/job emails.' },
            { role: 'user', content: emailPrompt }
          ],
          temperature: 0.5,
          max_tokens: 400
        })
      });

      if (response.ok) {
        const data = await response.json();
        emailContent = data.choices?.[0]?.message?.content?.trim() || '';
      } else {
        throw new Error(`LLM endpoint returned status ${response.status}`);
      }
    } catch (err) {
      console.error(`Failed to generate cold email via LLM for ${companyName}:`, err.message);
      emailContent = `Subject: Quick question for ${companyName}\n\nHi [Contact],\n\nI was researching ${companyName} and wanted to reach out regarding how we can help support your operations. Please let me know if you have time for a brief call.\n\nBest regards,\n[My Name]`;
    }

    return {
      company: companyName,
      purpose: companyPurpose,
      email: emailContent
    };
  }

  /**
   * Orchestrates bulk cold email generation.
   * Processes company names sequentially/staggered.
   * @param {string[]} companyNames Array of company names
   * @param {Object} options Options including signal and engine
   * @returns {Promise<Array<{company: string, purpose: string, email: string}>>}
   */
  async generateBulkEmails(companyNames, options = {}) {
    const results = [];
    const userContext = await this.readContext();

    for (let i = 0; i < companyNames.length; i++) {
      const company = companyNames[i];
      if (!company || !company.trim()) continue;

      if (options.signal?.aborted) {
        console.log('Bulk generation aborted by user.');
        break;
      }

      // Add a staggering delay between queries to avoid rate limits
      if (i > 0) {
        console.log(`[EmailService] Staggering next search query by 500ms...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      try {
        const result = await this.generateEmailForCompany(company.trim(), userContext, options);
        results.push(result);
      } catch (err) {
        console.error(`[EmailService] Error processing company "${company}":`, err.message);
        results.push({
          company: company.trim(),
          purpose: 'Failed to retrieve profile data.',
          email: `Failed to generate email: ${err.message}`
        });
      }
    }

    return results;
  }
}

module.exports = new EmailService();
