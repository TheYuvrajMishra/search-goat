import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.LLM_BASE_URL || 'http://localhost:3001/v1';
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
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      throw new Error(`LLM API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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

        // Try to parse JSON from content (it might be wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
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
