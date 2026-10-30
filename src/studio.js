import { botEngine } from './botEngine.js';
import { sfx } from './audio.js';

export class BotStudio {
    constructor() {
        this.config = {
            botName: 'Sofía',
            botRole: 'Asistente de Ventas & Leads',
            avatar: '💼',
            primaryColor: '#6366f1',
            welcomeMessage: '¡Hola! 👋 ¿En qué podemos ayudarte hoy?',
            theme: 'dark'
        };

        this.listeners = [];
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.config);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.config));
    }

    updateConfig(partial) {
        this.config = { ...this.config, ...partial };
        // Apply CSS variable for primary color dynamically
        document.documentElement.style.setProperty('--bot-primary', this.config.primaryColor);
        this.notify();
    }

    getEmbedSnippet(type = 'script') {
        const c = this.config;
        if (type === 'script') {
            return `<!-- Nexa AI Chatbot Widget para Sitio Web -->
<script 
  src="https://cdn.nexa-ai.com/v1/widget.js" 
  data-bot-id="nexa_${Math.abs(c.botName.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0))}" 
  data-bot-name="${c.botName}"
  data-primary-color="${c.primaryColor}"
  data-position="bottom-right"
  async>
</script>`;
        } else if (type === 'react') {
            return `// Integración en React / Next.js (useEffect o Script)
import Script from 'next/script';

export default function ChatbotWidget() {
  return (
    <Script
      src="https://cdn.nexa-ai.com/v1/widget.js"
      strategy="lazyOnload"
      data-bot-id="nexa_production"
      data-primary-color="${c.primaryColor}"
      data-bot-name="${c.botName}"
    />
  );
}`;
        } else {
            return `<!-- Iframe Embed directo -->
<iframe 
  src="https://app.nexa-ai.com/embed/nexa_live?color=${encodeURIComponent(c.primaryColor)}&name=${encodeURIComponent(c.botName)}"
  width="100%" 
  height="600" 
  frameborder="0" 
  style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
</iframe>`;
        }
    }
}

export const studio = new BotStudio();
