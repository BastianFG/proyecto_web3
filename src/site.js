// ==========================================================================
// SITE.JS — Lógica común y ultraligera para TODAS las páginas.
// - Carga diferida del chatbot: su código se descarga solo cuando hace falta
//   (al interactuar o cuando el navegador está libre), sin afectar la velocidad
//   de carga inicial (LCP / INP) que Google usa para posicionar.
// - Botones [data-open-chat="mensaje opcional"] abren el chat y envían el mensaje.
// - Cierra los menús popover al navegar.
// ==========================================================================

let widgetPromise = null;

/** Descarga e inicializa el widget flotante una sola vez. */
export function getFloatingWidget() {
    if (!widgetPromise) {
        widgetPromise = Promise.all([import('./botWidget.js'), import('./botEngine.js')]).then(
            ([{ ChatWidgetController }, { botEngine }]) => {
                // Cada landing puede elegir la plantilla del bot: <body data-bot-template="booking">
                const tmplKey = document.body.dataset.botTemplate;
                if (tmplKey && botEngine.templates[tmplKey]) {
                    botEngine.setTemplate(tmplKey);
                    const tmpl = botEngine.templates[tmplKey];
                    const avatar = document.getElementById('floating-avatar');
                    const name = document.getElementById('floating-bot-name');
                    if (avatar) avatar.textContent = tmpl.avatar;
                    if (name) name.textContent = tmpl.name;
                }
                const widget = new ChatWidgetController('floating');
                widget.init();
                return widget;
            }
        );
    }
    return widgetPromise;
}

/** Abre el chat flotante (y opcionalmente envía un mensaje inicial). */
export async function openChat(message = '') {
    const widget = await getFloatingWidget();
    if (!widget.isOpen) document.getElementById('floating-widget-trigger')?.click();
    if (message) widget.handleUserText(message);
    return widget;
}

function setupChatTriggers() {
    const trigger = document.getElementById('floating-widget-trigger');
    if (!trigger) return;

    // Primer clic en la burbuja: descarga el widget y lo abre.
    trigger.addEventListener(
        'click',
        (e) => {
            if (widgetPromise) return; // ya cargado: el propio widget gestiona el clic
            e.stopImmediatePropagation();
            openChat();
        },
        { once: true }
    );

    // Botones de llamada a la acción en cualquier parte de la página.
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-open-chat]');
        if (!btn) return;
        e.preventDefault();
        openChat(btn.dataset.openChat || '');
    });

    // Precarga anticipada al mostrar intención (hover / foco) o en tiempo libre.
    const warmUp = () => getFloatingWidget();
    trigger.addEventListener('pointerenter', warmUp, { once: true });
    document.querySelectorAll('[data-open-chat]').forEach((el) => {
        el.addEventListener('pointerenter', warmUp, { once: true });
        el.addEventListener('focus', warmUp, { once: true });
    });
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 2500));
    window.addEventListener('load', () => idle(warmUp, { timeout: 6000 }), { once: true });
}

function setupPopovers() {
    // Al elegir un enlace dentro de un menú popover, se cierra (útil para anclas /#...).
    document.querySelectorAll('[popover]').forEach((pop) => {
        pop.addEventListener('click', (e) => {
            if (e.target.closest('a') && typeof pop.hidePopover === 'function') pop.hidePopover();
        });
    });
}

setupChatTriggers();
setupPopovers();
