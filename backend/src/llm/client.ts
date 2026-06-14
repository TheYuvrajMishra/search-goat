import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:3001/v1';
const API_KEY = process.env.LLM_API_KEY || '';
const MODEL = process.env.CHAT_MODEL || 'auto';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' | 'json_schema', schema?: any };
}

export class LLMClient {
  static async chat(messages: Message[], options: LLMOptions = {}): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: MODEL,
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens,
            response_format: options.response_format,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          if ([502, 503, 504].includes(response.status) && attempts < maxAttempts - 1) {
            attempts++;
            console.warn(`LLM API Gateway error (${response.status}). Retrying... attempt ${attempts}`);
            await new Promise(r => setTimeout(r, 2000 * attempts));
            continue;
          }
          throw new Error(`LLM API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error: any) {
        if (attempts < maxAttempts - 1) {
          attempts++;
          console.warn(`LLM API fetch failed: ${error.message}. Retrying... attempt ${attempts}`);
          await new Promise(r => setTimeout(r, 2000 * attempts));
          continue;
        }
        throw error;
      }
    }
    throw new Error('LLM API failed after maximum retry attempts.');
  }

  static async chatStructured<T>(
    messages: Message[],
    schema: z.ZodSchema<T>,
    options: LLMOptions = {}
  ): Promise<T> {
    let attempts = 0;
    const maxAttempts = 2;
    let lastError = '';

    while (attempts < maxAttempts) {
      try {
        const promptMessages = [...messages];
        if (attempts > 0) {
          promptMessages.push({
            role: 'user',
            content: `Your previous response failed validation with the following error: ${lastError}. Please provide a corrected JSON response following the schema exactly.`
          });
        }

        const content = await this.chat(promptMessages, {
          ...options,
          response_format: { type: 'json_object' }
        });

        // Robust JSON extraction
        let jsonStr = content.trim();
        
        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }

        // Find the first { and last }
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr);
        return schema.parse(parsed);
      } catch (error: any) {
        attempts++;
        lastError = error.message;
        console.warn(`LLM structured output attempt ${attempts} failed: ${lastError}`);
      }
    }

    throw new Error(`Failed to get valid structured output from LLM after ${maxAttempts} attempts. Last error: ${lastError}`);
  }
}
