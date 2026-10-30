// Core AI Conversational Chatbot Engine with Intent Recognition & Lead Generation

export class BotEngine {
    constructor() {
        this.currentTemplate = 'sales'; // 'sales' | 'support' | 'booking' | 'custom'
        this.botName = 'Sofía (Ventas AI)';
        this.botAvatar = '🤖';
        this.companyName = 'Nexa Tech';
        this.botTone = 'amigable'; // 'amigable' | 'formal' | 'ejecutivo'

        // Custom Knowledge Base FAQs
        this.customFaqs = [
            {
                q: 'que servicios ofrecen',
                a: 'Ofrecemos soluciones de automatización con Inteligencia Artificial, chatbots omnicanal para sitios web, integración con WhatsApp y plataformas de comercio electrónico.'
            },
            {
                q: 'cuanto cuesta la integracion',
                a: 'Nuestros planes comienzan desde $29 USD al mes con periodo de prueba gratuito de 14 días sin necesidad de tarjeta de crédito.'
            },
            {
                q: 'como se instala en mi web',
                a: 'Se instala pegando una sola línea de código JavaScript (<script>) en el HTML de tu sitio, compatible con WordPress, Shopify, Wix, React y HTML puro.'
            }
        ];

        // Lead capture conversation state per session
        this.leadCaptureState = {
            step: 'idle', // 'idle' | 'awaiting_name' | 'awaiting_contact'
            data: { name: '', contact: '', interest: '' }
        };

        // Templates Config
        this.templates = {
            sales: {
                name: 'Sofía • Ventas & Leads',
                avatar: '💼',
                welcome: '¡Hola! 👋 Soy Sofía, asistente virtual de ventas de **Nexa Tech**. ¿Te gustaría conocer nuestros planes, agendar una demo o cotizar un chatbot para tu página web?',
                quickChips: [
                    '💰 Ver Planes y Precios',
                    '🎯 Solicitar Demo Gratuita',
                    '⚡ ¿Cómo se instala en mi web?',
                    '📞 Dejar mis datos para contacto'
                ]
            },
            support: {
                name: 'Alex • Soporte & Helpdesk',
                avatar: '🛠️',
                welcome: '¡Hola! 🛠️ Soy Alex del equipo de soporte técnico. Estoy aquí para resolver tus dudas sobre configuración, incidencias o guías de uso.',
                quickChips: [
                    '📦 Estado de servicio / Uptime',
                    '⏱️ Horarios de atención',
                    '🔄 Políticas de garantía',
                    '🤝 Hablar con un especialista humano'
                ]
            },
            booking: {
                name: 'Lucas • Reservas & Citas',
                avatar: '📅',
                welcome: '¡Hola! 📅 Soy Lucas, encargado de reservas automáticas. ¿Para qué fecha u horario te gustaría coordinar tu reunión o cita?',
                quickChips: [
                    '🗓️ Agendar para esta semana',
                    '🕒 Ver horarios disponibles',
                    '📍 Modalidad (Online / Presencial)',
                    '✅ Confirmar reserva'
                ]
            },
            custom: {
                name: 'NexaBot • Asistente Personalizado',
                avatar: '✨',
                welcome: '¡Bienvenido! Soy tu asistente de IA personalizado. He sido entrenado con la base de conocimientos de tu empresa. ¿En qué puedo orientarte hoy?',
                quickChips: [
                    '✨ ¿Qué servicios ofrecen?',
                    '💵 ¿Cuánto cuesta?',
                    '🚀 ¿Cómo empezar?',
                    '📩 Contactar asesor'
                ]
            }
        };
    }

    setTemplate(templateKey) {
        if (this.templates[templateKey]) {
            this.currentTemplate = templateKey;
            const t = this.templates[templateKey];
            this.botName = t.name;
            this.botAvatar = t.avatar;
            this.leadCaptureState = { step: 'idle', data: { name: '', contact: '', interest: '' } };
        }
    }

    addCustomFaq(question, answer) {
        this.customFaqs.unshift({
            q: question.toLowerCase().trim(),
            a: answer.trim()
        });
    }

    // Process user input and produce contextual response
    async processMessage(input) {
        const text = input.trim();
        const lower = text.toLowerCase();

        // 1. Check Lead Capture Active Flow
        if (this.leadCaptureState.step === 'awaiting_name') {
            this.leadCaptureState.data.name = text;
            this.leadCaptureState.step = 'awaiting_contact';
            return {
                text: `¡Mucho gusto, **${text}**! 😊 ¿Podrías indicarme tu **correo electrónico o número de WhatsApp** para que un asesor te envíe la información personalizada?`,
                quickChips: ['Prefiero por Email 📧', 'Prefiero por WhatsApp 📱'],
                isLeadStep: true
            };
        }

        if (this.leadCaptureState.step === 'awaiting_contact') {
            this.leadCaptureState.data.contact = text;
            this.leadCaptureState.step = 'idle';

            const capturedLead = {
                id: 'LEAD-' + Math.floor(1000 + Math.random() * 9000),
                name: this.leadCaptureState.data.name,
                contact: text,
                interest: this.leadCaptureState.data.interest || 'Información General / Demo',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'NUEVO'
            };

            return {
                text: `🎉 ¡Excelente, **${capturedLead.name}**! Hemos registrado tus datos con éxito. Un especialista de nuestro equipo se comunicará contigo a la brevedad a **${text}** con toda la propuesta y detalles.\n\n¿Deseas consultar algo más mientras tanto?`,
                quickChips: ['💡 ¿Cómo funciona la IA?', '📋 Ver características', '👋 Gracias, es todo'],
                leadCaptured: capturedLead
            };
        }

        // 2. Intent to Leave Contact Info / Demo
        if (lower.includes('demo') || lower.includes('contacto') || lower.includes('dejar mis datos') || lower.includes('cotizar') || lower.includes('asesor humano') || lower.includes('hablar con')) {
            this.leadCaptureState.step = 'awaiting_name';
            this.leadCaptureState.data.interest = text;
            return {
                text: `¡Con mucho gusto! Para coordinar tu demostración o conectarte con el asesor adecuado, **¿cuál es tu nombre completo?**`,
                quickChips: [],
                isLeadStep: true
            };
        }

        // 3. Match Custom Knowledge Base FAQs
        for (const item of this.customFaqs) {
            const keywords = item.q.split(' ').filter(w => w.length > 3);
            const matches = keywords.filter(k => lower.includes(k));
            if (matches.length >= Math.min(2, keywords.length)) {
                return {
                    text: item.a,
                    quickChips: ['💰 Ver Planes', '🎯 Solicitar Demo', '❓ Otra consulta']
                };
            }
        }

        // 4. Common Questions / General Intents
        if (lower.includes('precio') || lower.includes('plan') || lower.includes('costo') || lower.includes('cuanto vale')) {
            return {
                text: `Contamos con 3 planes escalables para cualquier tamaño de empresa:\n\n• **Plan Starter ($29/mes)**: Hasta 1,000 conversaciones/mes, 1 bot, soporte por email.\n• **Plan Pro ($79/mes)**: Hasta 10,000 conversaciones/mes, 3 bots, entrenamiento personalizado con PDFs/URLs y captura de leads.\n• **Plan Enterprise (A medida)**: Conversaciones ilimitadas, integración CRM (HubSpot, Salesforce) y agente dedicado.\n\n¿Te gustaría solicitar una **prueba gratuita de 14 días**?`,
                quickChips: ['🎯 Solicitar Prueba Gratuita', '📋 Comparar Características', '⚡ ¿Cómo se integra?']
            };
        }

        if (lower.includes('instala') || lower.includes('integrar') || lower.includes('codigo') || lower.includes('script') || lower.includes('wordpress') || lower.includes('shopify')) {
            return {
                text: `¡La integración toma **menos de 2 minutos**! ⏱️\n\nSolo copias una etiqueta \`<script>\` generada en el estudio y la pegas antes del cierre de \`</body>\` en tu sitio web. Es 100% compatible con:\n\n✓ **WordPress & WooCommerce**\n✓ **Shopify & Tiendanube**\n✓ **Wix, Webflow y Squarespace**\n✓ **React, Vue, Next.js y HTML nativo**\n\n¿Deseas generar el código de inserción para tu web ahora mismo?`,
                quickChips: ['💻 Generar Código de Inserción', '💬 Probar con mi propia marca', '📞 Contactar Soporte']
            };
        }

        if (lower.includes('horario') || lower.includes('atencion') || lower.includes('disponible')) {
            return {
                text: `¡La gran ventaja de nuestros chatbots de IA es que atienden a tus clientes **las 24 horas del día, los 7 días de la semana (24/7/365)** sin demoras ni colas de espera!\n\nPara atención con agentes humanos, nuestro equipo está disponible de Lunes a Viernes de 9:00 AM a 6:00 PM.`,
                quickChips: ['⚡ Probar Respuesta Rápida', '🎯 Dejar Mensaje para Asesor']
            };
        }

        if (lower.includes('garantia') || lower.includes('reembolso') || lower.includes('cancelar')) {
            return {
                text: `Ofrecemos **14 días de prueba sin compromiso** y garantía de satisfacción total de 30 días. Puedes cancelar tu suscripción en cualquier momento con un solo clic desde tu panel de control sin cláusulas de permanencia.`,
                quickChips: ['🚀 Empezar Prueba Gratuita', '📞 Hablar con Ventas']
            };
        }

        if (lower.includes('hola') || lower.includes('buenos dias') || lower.includes('buenas tardes') || lower.includes('que tal')) {
            return {
                text: `¡Hola! Qué gusto saludarte. ¿Cómo puedo ayudarte hoy con la implementación de chatbots en tu página web?`,
                quickChips: this.templates[this.currentTemplate].quickChips
            };
        }

        // 5. Default Contextual AI Fallback
        return {
            text: `Entiendo perfectamente tu consulta sobre "${text}". Como agente de IA conversacional para sitios web, puedo automatizar la atención a tus visitantes, capturar leads cualificados y responder preguntas sobre tu catálogo en tiempo real.\n\n¿Te gustaría que personalicemos este bot con la información específica de tu negocio?`,
            quickChips: ['🛠️ Personalizar mi Bot', '💰 Conocer Precios', '🎯 Hablar con un Asesor']
        };
    }
}

export const botEngine = new BotEngine();
