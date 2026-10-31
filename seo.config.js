// ==========================================================================
// SEO CONFIG — Fuente única de verdad de las páginas indexables del sitio.
// Se usa en vite.config.js para:
//   1) Registrar cada página como entrada de build (multi-page).
//   2) Generar sitemap.xml, robots.txt y llms.txt automáticamente.
// Para agregar una página nueva: crea la carpeta con su index.html y añádela aquí.
// ==========================================================================

export const site = {
    name: 'KUXO AI',
    // Dominio por defecto. Se sobrescribe con SITE_URL en el archivo .env
    defaultUrl: 'https://kuxo.ai',
    description:
        'Plataforma de chatbots con inteligencia artificial para páginas web: atiende clientes 24/7, capta prospectos y agenda citas automáticamente. Se instala en 1 minuto.',
};

/** Páginas indexables (aparecen en sitemap.xml y llms.txt). */
export const pages = [
    {
        path: '/',
        file: 'index.html',
        title: 'Chatbot con IA para tu página web',
        summary: 'Página principal: qué es KUXO AI, cómo funciona, demo interactiva, personalización e instalación.',
    },
    {
        path: '/chatbot-atencion-al-cliente/',
        file: 'chatbot-atencion-al-cliente/index.html',
        title: 'Chatbot de atención al cliente 24/7',
        summary: 'Automatiza respuestas a preguntas frecuentes y deriva a un humano cuando hace falta.',
    },
    {
        path: '/chatbot-para-ventas/',
        file: 'chatbot-para-ventas/index.html',
        title: 'Chatbot para ventas y captación de clientes',
        summary: 'Convierte visitas en prospectos calificados: el bot pregunta, califica y guarda los datos de contacto.',
    },
    {
        path: '/chatbot-para-reservas/',
        file: 'chatbot-para-reservas/index.html',
        title: 'Chatbot para reservas y citas',
        summary: 'Agenda turnos y citas desde tu web para clínicas, consultorios, restaurantes, salones y servicios.',
    },
    {
        path: '/chatbot-para-tienda-online/',
        file: 'chatbot-para-tienda-online/index.html',
        title: 'Chatbot para tienda online (Shopify, WooCommerce, Tiendanube)',
        summary: 'Responde dudas de productos, envíos y pagos para vender más en tu e-commerce.',
    },
    {
        path: '/chatbot-para-wordpress/',
        file: 'chatbot-para-wordpress/index.html',
        title: 'Chatbot para WordPress',
        summary: 'Guía para instalar un chatbot con IA en WordPress en 1 minuto, sin plugins pesados.',
    },
    {
        path: '/precios/',
        file: 'precios/index.html',
        title: 'Precios',
        summary: 'Planes Starter (29 USD/mes), Pro (79 USD/mes) y Enterprise a medida. 14 días de prueba gratis.',
    },
];

/** Entradas de build que NO se indexan (no van al sitemap). */
export const extraEntries = [{ path: '/404.html', file: '404.html' }];
