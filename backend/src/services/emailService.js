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
- **Years of Experience**: 2+ years of software development experience

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
    const emailPrompt = `You are a modern tech career strategist and professional outreach copywriter.
Your task is to write a highly personalized, compelling, and casually formatted cold networking/job outreach email to "${companyName}" from Yuvraj.
Your goal is to pitch Yuvraj (from the Candidate Context) for a role, aligning their skills, experience, and projects with what the company does.

CANDIDATE CONTEXT (BACKGROUND & SKILLS):
${userContext}

TARGET COMPANY PROFILE:
Company: ${companyName}
What they do / Purpose: ${companyPurpose}

INSTRUCTIONS:
1. Write a casual, attention-grabbing, and click-worthy Subject Line.
2. In the email body, you MUST start precisely with:
Hello Team,
3. Use a casual, young, and modern tech lingo/vibe (e.g. enthusiastic, direct, relatable, using terms like "hacking on", "shipping fast", "obsessed with", "super down to contribute", etc. Keep it clean and readable but very casual).
4. Casually align Yuvraj's value proposition and skills (like Node.js, Puppeteer, React) with the company's purpose or tech stack.
5. End with a clear, casual call to action (CTA) for a quick virtual chat or sync.
6. You MUST end the email precisely with:
Regards,
Yuvraj
7. Keep the email concise (under 120 words).
8. Return only the email with the Subject Line first. Format like this:
Subject: [Subject Line]

Hello Team,

[Email Body]

Regards,
Yuvraj

Do not include any notes, formatting explanation, or prefaces. Just return the Subject and the Body.`;

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
