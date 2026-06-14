import fs from 'fs/promises';
import path from 'path';
import { RunStore } from '../orchestrator/runStore.js';
import { SynthesizedReport } from './synthesizer.js';
import { FactCheckReport } from './factChecker.js';

export class ReportFinalizer {
  static async run(runId: string): Promise<string> {
    console.log(`[Finalizer] Assembling final report...`);

    const synthesis = await RunStore.readArtifact<SynthesizedReport>(runId, 'synthesis.json');
    if (!synthesis) throw new Error('Synthesized report not found');

    const finalFactCheck = await RunStore.readArtifact<FactCheckReport>(runId, 'final_factcheck.json');

    let finalMarkdown = `# ${synthesis.title}\n\n`;
    finalMarkdown += `## Executive Summary\n\n${synthesis.markdown.split('\n\n')[0]}\n\n`; // Simplified
    finalMarkdown += `${synthesis.markdown}\n\n`;

    if (synthesis.open_questions.length > 0) {
      finalMarkdown += `## Disagreements & Open Questions\n\n`;
      synthesis.open_questions.forEach(q => {
        finalMarkdown += `- ${q}\n`;
      });
      finalMarkdown += `\n`;
    }

    finalMarkdown += `## Methodology\n\n${synthesis.methodology_summary}\n\n`;

    finalMarkdown += `## Fact-Check Summary\n\n`;
    finalMarkdown += `| Claim | Verdict | Confidence |\n`;
    finalMarkdown += `| :--- | :--- | :--- |\n`;
    finalFactCheck?.results.forEach(res => {
      finalMarkdown += `| ${res.claim_id} | ${res.verdict} | ${(res.confidence * 100).toFixed(0)}% |\n`;
    });
    finalMarkdown += `\n`;

    finalMarkdown += `## Resources & References\n\n`;
    synthesis.sources.forEach(s => {
      finalMarkdown += `- [${s.id}] **${s.title}**: ${s.url}\n`;
    });

    const reportPath = path.join(process.cwd(), 'runs', runId, 'final_report.md');
    await fs.writeFile(reportPath, finalMarkdown);
    
    await RunStore.writeArtifact(runId, 'final_report.json', { 
      markdown: finalMarkdown,
      timestamp: new Date().toISOString()
    });

    return finalMarkdown;
  }
}
