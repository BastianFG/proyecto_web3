import { botEngine } from './botEngine.js';
import { analytics } from './analytics.js';
import { sfx } from './audio.js';
import confetti from 'canvas-confetti';

export class ChatWidgetController {
    constructor(prefix = 'sim') {
        this.prefix = prefix; // 'sim' for embedded simulator, 'floating' for bottom-right widget
        this.messagesContainer = null;
        this.inputEl = null;
        this.chipsContainer = null;
        this.isOpen = prefix === 'sim'; // Simulator starts open, floating starts closed
    }

    init() {
        this.messagesContainer = document.getElementById(`${this.prefix}-chat-messages`);
        this.inputEl = document.getElementById(`${this.prefix}-chat-input`);
        this.chipsContainer = document.getElementById(`${this.prefix}-quick-chips`);

        const sendBtn = document.getElementById(`${this.prefix}-btn-send`);
        if (sendBtn && this.inputEl) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            this.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        // Trigger button for floating widget
        if (this.prefix === 'floating') {
            const triggerBtn = document.getElementById('floating-widget-trigger');
            const windowEl = document.getElementById('floating-widget-window');
            const closeBtn = document.getElementById('floating-btn-close');
            const badge = document.getElementById('floating-unread-badge');

            if (triggerBtn && windowEl) {
                triggerBtn.addEventListener('click', () => {
                    sfx.playClick();
                    this.isOpen = !this.isOpen;
                    if (this.isOpen) {
                        windowEl.classList.remove('hidden');
                        triggerBtn.classList.add('active');
                        if (badge) badge.classList.add('hidden');
                        if (this.inputEl) this.inputEl.focus();
                    } else {
                        windowEl.classList.add('hidden');
                        triggerBtn.classList.remove('active');
                    }
                });
            }

            if (closeBtn && windowEl && triggerBtn) {
                closeBtn.addEventListener('click', () => {
                    sfx.playClick();
                    this.isOpen = false;
                    windowEl.classList.add('hidden');
                    triggerBtn.classList.remove('active');
                });
            }
        }

        // Load Initial Welcome Message
        this.loadWelcomeMessage();
    }

    loadWelcomeMessage() {
        if (!this.messagesContainer) return;
        this.messagesContainer.innerHTML = '';
        const currentTmpl = botEngine.templates[botEngine.currentTemplate];

        this.appendMessage('bot', currentTmpl.welcome);
        this.renderQuickChips(currentTmpl.quickChips);
    }

    renderQuickChips(chips = []) {
        if (!this.chipsContainer) return;
        this.chipsContainer.innerHTML = '';

        chips.forEach(chipText => {
            const btn = document.createElement('button');
            btn.className = 'chip-pill';
            btn.textContent = chipText;
            btn.addEventListener('click', () => {
                sfx.playClick();
                this.handleUserText(chipText);
            });
            this.chipsContainer.appendChild(btn);
        });
    }

    appendMessage(sender, text, isHtml = false) {
        if (!this.messagesContainer) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `widget-msg ${sender}`;

        // Format markdown basic bold/newlines
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        msgDiv.innerHTML = `
            <div class="msg-content">${formatted}</div>
            <span class="msg-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;

        this.messagesContainer.appendChild(msgDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        if (!this.messagesContainer) return null;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'widget-msg bot typing';
        typingDiv.id = `${this.prefix}-typing-indicator`;
        typingDiv.innerHTML = `
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;

        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        return typingDiv;
    }

    removeTypingIndicator() {
        const typingDiv = document.getElementById(`${this.prefix}-typing-indicator`);
        if (typingDiv) typingDiv.remove();
    }

    async sendMessage() {
        if (!this.inputEl) return;
        const text = this.inputEl.value.trim();
        if (!text) return;

        this.inputEl.value = '';
        await this.handleUserText(text);
    }

    async handleUserText(text) {
        sfx.playSent();
        this.appendMessage('user', text);
        this.renderQuickChips([]); // Clear chips while processing

        // Show typing indicator
        this.showTypingIndicator();

        // Process message via bot engine with natural delay
        const delay = 400 + Math.random() * 400;
        setTimeout(async () => {
            this.removeTypingIndicator();
            const response = await botEngine.processMessage(text);

            sfx.playReceived();
            this.appendMessage('bot', response.text);

            if (response.quickChips && response.quickChips.length > 0) {
                this.renderQuickChips(response.quickChips);
            }

            // If a lead was captured in this message
            if (response.leadCaptured) {
                analytics.addLead(response.leadCaptured);
                sfx.playLeadSuccess();
                confetti({
                    particleCount: 60,
                    spread: 60,
                    origin: { y: 0.8 },
                    colors: ['#6366f1', '#06b6d4', '#10b981', '#ffffff']
                });
            }
        }, delay);
    }
}
