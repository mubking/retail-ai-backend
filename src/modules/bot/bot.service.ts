import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { ProductsService } from '../products/products.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: TelegramBot;

  constructor(
    private configService: ConfigService,
    private productsService: ProductsService,
    private aiService: AiService,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not defined');

    this.bot = new TelegramBot(token, { polling: true });

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text?.trim();

      if (!text) return;

      if (text === '/start') {
        await this.bot.sendMessage(
          chatId,
    'Welcome! Type a product name to search, or tell me what you picked to calculate a total.',
  );
        return;
}

      // Handle greetings
      const greetings = /^(hi|hello|hey|good morning|good afternoon|good evening|wassup|sup|yo)$/i.test(text);
      if (greetings) {
        await this.bot.sendMessage(
          chatId,
          'Hello! 👋 Welcome to Pricepal.\n\nYou can:\n🔍 Search a product — type its name\n🧮 Calculate a cart — e.g. "I picked 2 Panadol how much?"',
        );
        return;
      }

      // Detect if user is asking for a cart calculation
      const isCartQuery = /how much|total|calculate|picked|bought|got/i.test(
        text,
      );

      if (isCartQuery) {
        await this.handleCartQuery(chatId, text);
      } else {
        await this.handleProductSearch(chatId, text);
      }
    });
  }

  // Simple product search (Phase 2 behavior)
                      private async handleProductSearch(chatId: number, text: string) {
                      const products = await this.productsService.searchByName(text.toLowerCase());

                      if (products.length === 0) {
                        await this.bot.sendMessage(
                          chatId,
                          `❌ No product found for "${text}".\n\nTry a different name or check the spelling.`,
                        );
                        return;
                      }

  const reply = products
    .map(
      (p) =>
        `📦 ${p.name}\n💰 Price: ₦${Number(p.price).toLocaleString()}\n✅ ${p.quantity > 0 ? 'Available' : '❌ Out of Stock'}`,
    )
    .join('\n\n');

  await this.bot.sendMessage(chatId, reply);
                      }

  // AI-powered cart calculation (Phase 3 behavior)
  private async handleCartQuery(chatId: number, text: string) {
    await this.bot.sendMessage(chatId, '🤖 Calculating your cart...');

    let cartItems: { name: string; quantity: number }[] = [];

    try {
      cartItems = await this.aiService.extractCartItems(text);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      await this.bot.sendMessage(
        chatId,
        '⚠️ AI service is unavailable right now. Try searching for a single product by name.',
      );
      return;
    }

    if (cartItems.length === 0) {
      await this.bot.sendMessage(
        chatId,
        'I could not find any products in your message. Try again.',
      );
      return;
    }

    let total = 0;
    const lines: string[] = [];

    for (const item of cartItems) {
      const products = await this.productsService.searchByName(
        item.name.toLowerCase(),
      );

      if (products.length === 0) {
        lines.push(`❌ "${item.name}" not found in store`);
        continue;
      }

      const product = products[0];
      const subtotal = Number(product.price) * item.quantity;
      total += subtotal;
      lines.push(`📦 ${product.name} x${item.quantity} = ₦${subtotal}`);
    }

    lines.push(`\n💰 Total: ₦${total}`);
    await this.bot.sendMessage(chatId, lines.join('\n'));
  }
}
