import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GEMINI_API_KEY') || '',
    );
  }

  async extractCartItems(
    userMessage: string,
  ): Promise<{ name: string; quantity: number }[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a shopping assistant. Extract product names and quantities from the user's message.
Always respond with a JSON object only, no explanation, no markdown, no code blocks.
Format: {"items": [{"name": "product name", "quantity": 2}]}
If no products are mentioned, return: {"items": []}

User message: "${userMessage}"`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out')), 10000),
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise,
    ]);

    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed.items || [];
}
}
