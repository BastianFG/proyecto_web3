import { initModernBackground } from './src/background3d.js';
import { sfx } from './src/audio.js';
import { botEngine } from './src/botEngine.js';
import { studio } from './src/studio.js';
import { analytics } from './src/analytics.js';
import { ChatWidgetController } from './src/botWidget.js';

// ==========================================================================
// TOAST UTILITY
// ==========================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = '⚡';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3800);
}

// ==========================================================================
// MASTER INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Modern 3D Ambient Canvas
    initModernBackground('dynamic-bg');

    // 2. Audio Toggle
    const btnSound = document.getElementById('btn-toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            const enabled = sfx.toggle();
            soundIcon.textContent = enabled ? '🔊' : '🔇';
            showToast(enabled ? 'Efectos de sonido activados' : 'Efectos silenciados');
        });
    }

    // 3. Initialize Both Widgets (Website Simulator & Floating Bottom-Right)
    const simWidget = new ChatWidgetController('sim');
    simWidget.init();

    const floatingWidget = new ChatWidgetController('floating');
    floatingWidget.init();

    // Reset button in simulator
    const btnResetSim = document.getElementById('sim-btn-reset');
    if (btnResetSim) {
        btnResetSim.addEventListener('click', () => {
            sfx.playClick();
            simWidget.loadWelcomeMessage();
            showToast('Conversación reiniciada');
        });
    }

    // Header CTA: Open Floating Chatbot
    const btnHeaderDemo = document.getElementById('btn-header-demo');
    if (btnHeaderDemo) {
        btnHeaderDemo.addEventListener('click', () => {
            sfx.playClick();
            const trigger = document.getElementById('floating-widget-trigger');
            if (trigger) trigger.click();
        });
    }

    // 4. Industry Template Switcher
    const templateTabs = document.querySelectorAll('.template-tab');
    const simAvatar = document.getElementById('sim-avatar');
    const simBotName = document.getElementById('sim-bot-name');
    const floatingAvatar = document.getElementById('floating-avatar');
    const floatingBotName = document.getElementById('floating-bot-name');

    templateTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sfx.playClick();
            templateTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tmplKey = tab.dataset.template;
            botEngine.setTemplate(tmplKey);

            // Update UI elements
            const current = botEngine.templates[tmplKey];
            if (simAvatar) simAvatar.textContent = current.avatar;
            if (simBotName) simBotName.textContent = current.name;
            if (floatingAvatar) floatingAvatar.textContent = current.avatar;
            if (floatingBotName) floatingBotName.textContent = current.name;

            // Reload widgets
            simWidget.loadWelcomeMessage();
            floatingWidget.loadWelcomeMessage();

            showToast(`Plantilla cargada: ${tab.textContent.trim()}`);
        });
    });

    // 5. Bot Customization Studio
    const studioBotName = document.getElementById('studio-bot-name');
    const avatarBtns = document.querySelectorAll('.avatar-opt-btn');
    const colorBtns = document.querySelectorAll('.color-circle-btn');
    const studioTone = document.getElementById('studio-bot-tone');

    if (studioBotName) {
        studioBotName.addEventListener('input', (e) => {
            const val = e.target.value.trim() || 'Sofía';
            studio.updateConfig({ botName: val });
            if (simBotName) simBotName.textContent = `${val} • Personalizado`;
            if (floatingBotName) floatingBotName.textContent = `${val} • Asistente Nexa`;
        });
    }

    avatarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playClick();
            avatarBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const av = btn.dataset.avatar;
            studio.updateConfig({ avatar: av });
            if (simAvatar) simAvatar.textContent = av;
            if (floatingAvatar) floatingAvatar.textContent = av;
            showToast(`Avatar actualizado a: ${av}`);
        });
    });

    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playClick();
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const color = btn.dataset.color;
            studio.updateConfig({ primaryColor: color });
            showToast(`Color de marca aplicado`);
        });
    });

    if (studioTone) {
        studioTone.addEventListener('change', (e) => {
            botEngine.botTone = e.target.value;
            showToast(`Tono ajustado a: ${e.target.selectedOptions[0].text}`);
        });
    }

    // 6. Custom FAQ Trainer Box
    const btnAddFaq = document.getElementById('btn-add-faq');
    const faqQInput = document.getElementById('faq-question-input');
    const faqAInput = document.getElementById('faq-answer-input');
    const faqsContainer = document.getElementById('faqs-list-container');
    const faqsCountBadge = document.getElementById('faqs-count');

    function renderFaqsList() {
        if (!faqsContainer) return;
        faqsCountBadge.textContent = `${botEngine.customFaqs.length} FAQs`;

        faqsContainer.innerHTML = botEngine.customFaqs.map(item => `
            <div class="faq-card-item">
                <div class="faq-card-q">❓ ${item.q.charAt(0).toUpperCase() + item.q.slice(1)}</div>
                <div class="faq-card-a">💡 ${item.a}</div>
            </div>
        `).join('');
    }

    renderFaqsList();

    if (btnAddFaq) {
        btnAddFaq.addEventListener('click', () => {
            const q = faqQInput.value.trim();
            const a = faqAInput.value.trim();

            if (!q || !a) {
                showToast('Ingresa tanto la pregunta como la respuesta', 'error');
                return;
            }

            botEngine.addCustomFaq(q, a);
            faqQInput.value = '';
            faqAInput.value = '';
            renderFaqsList();
            sfx.playLeadSuccess();
            showToast('¡Pregunta guardada y aprendida por el Bot!', 'success');
        });
    }

    // 7. Embed Code Generator Tabs
    const platTabs = document.querySelectorAll('.plat-tab');
    const codeDisplay = document.getElementById('embed-code-display');
    const btnCopyCode = document.getElementById('btn-copy-code');
    const copyText = document.getElementById('copy-btn-text');
    let currentCodeType = 'script';

    function updateCodeDisplay() {
        if (!codeDisplay) return;
        codeDisplay.textContent = studio.getEmbedSnippet(currentCodeType);
    }

    platTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sfx.playClick();
            platTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            currentCodeType = tab.dataset.type;
            updateCodeDisplay();
        });
    });

    studio.subscribe(() => {
        updateCodeDisplay();
    });

    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', () => {
            sfx.playClick();
            if (codeDisplay) {
                navigator.clipboard.writeText(codeDisplay.textContent);
                copyText.textContent = '¡Copiado!';
                showToast('Código de inserción copiado al portapapeles', 'success');
                setTimeout(() => {
                    copyText.textContent = 'Copiar Código';
                }, 2000);
            }
        });
    }

    // 8. Captured Leads Table & CSV Export
    const leadsTbody = document.getElementById('leads-table-body');
    const leadsCountTitle = document.getElementById('leads-count-title');
    const btnExportCsv = document.getElementById('btn-export-csv');

    function renderLeadsTable(leads = []) {
        if (!leadsTbody) return;
        if (leadsCountTitle) leadsCountTitle.textContent = `Prospectos Capturados (${leads.length})`;

        if (leads.length === 0) {
            leadsTbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">
                        No hay prospectos capturados aún. Interactúa con el chatbot para generar nuevos leads.
                    </td>
                </tr>
            `;
            return;
        }

        leadsTbody.innerHTML = leads.map(l => `
            <tr>
                <td><span class="lead-id-pill">${l.id}</span></td>
                <td><strong>${l.name}</strong></td>
                <td><span style="color:var(--bot-primary);">${l.contact}</span></td>
                <td>${l.interest}</td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${l.date} ${l.time || ''}</td>
                <td><span class="status-badge-lead ${l.status.includes('NUEVO') ? 'NUEVO' : 'CONTACTO'}">${l.status}</span></td>
            </tr>
        `).join('');
    }

    analytics.subscribe((data) => {
        renderLeadsTable(data.leads);
    });

    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            sfx.playClick();
            const csv = analytics.exportLeadsCSV();
            if (!csv) {
                showToast('No hay prospectos para exportar', 'error');
                return;
            }

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nexa_leads_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('Archivo CSV descargado con éxito', 'success');
        });
    }
});
