import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, normalize } from 'node:path';
import { readFileSync } from 'node:fs';
import { site, pages, extraEntries } from './seo.config.js';

const root = dirname(fileURLToPath(import.meta.url));
const partialsDir = normalize(resolve(root, 'partials'));

// --------------------------------------------------------------------------
// Generadores de archivos SEO (sitemap.xml, robots.txt, llms.txt)
// --------------------------------------------------------------------------
function buildSitemap(siteUrl) {
    const today = new Date().toISOString().split('T')[0];
    const urls = pages
        .map((p) => `  <url>\n    <loc>${siteUrl}${p.path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRobots(siteUrl) {
    return `# KUXO AI — todos los rastreadores (incluidos buscadores con IA) son bienvenidos\nUser-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

// llms.txt: estándar emergente para que asistentes de IA (ChatGPT, Gemini, Perplexity...)
// entiendan el sitio y lo citen correctamente.
function buildLlmsTxt(siteUrl) {
    const list = pages.map((p) => `- [${p.title}](${siteUrl}${p.path}): ${p.summary}`).join('\n');
    return `# ${site.name}\n\n> ${site.description}\n\n## Páginas principales\n\n${list}\n\n## Datos clave\n\n- Instalación: una línea de código <script> antes de </body>. Compatible con WordPress, Shopify, WooCommerce, Tiendanube, Wix, Webflow, React/Next.js y HTML.\n- Planes: Starter 29 USD/mes, Pro 79 USD/mes, Enterprise a medida.\n- Prueba gratis de 14 días sin tarjeta de crédito. Cancelación en cualquier momento.\n- Idioma principal: español.\n`;
}

// --------------------------------------------------------------------------
// Plugin: includes de parciales + variables + archivos SEO (dev y build)
// --------------------------------------------------------------------------
function kuxoSeo({ siteUrl }) {
    const generated = {
        '/sitemap.xml': { type: 'application/xml; charset=utf-8', build: () => buildSitemap(siteUrl) },
        '/robots.txt': { type: 'text/plain; charset=utf-8', build: () => buildRobots(siteUrl) },
        '/llms.txt': { type: 'text/plain; charset=utf-8', build: () => buildLlmsTxt(siteUrl) },
    };

    const applyVars = (html) =>
        html.replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{YEAR}}', String(new Date().getFullYear()));

    return {
        name: 'kuxo-seo',

        // <!-- @include nombre --> → contenido de /partials/nombre.html
        transformIndexHtml: {
            order: 'pre',
            handler(html) {
                const withPartials = html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) =>
                    readFileSync(resolve(partialsDir, `${name}.html`), 'utf-8')
                );
                return applyVars(withPartials);
            },
        },

        configureServer(server) {
            // Recarga completa al editar un parcial
            server.watcher.add(partialsDir);
            server.watcher.on('change', (file) => {
                if (normalize(file).startsWith(partialsDir)) server.ws.send({ type: 'full-reload' });
            });
            // Sirve sitemap/robots/llms también en desarrollo
            server.middlewares.use((req, res, next) => {
                const gen = generated[(req.url || '').split('?')[0]];
                if (!gen) return next();
                res.setHeader('Content-Type', gen.type);
                res.end(gen.build());
            });
        },

        generateBundle() {
            for (const [path, gen] of Object.entries(generated)) {
                this.emitFile({ type: 'asset', fileName: path.slice(1), source: gen.build() });
            }
        },
    };
}

// --------------------------------------------------------------------------
// Configuración Vite (Multi-Page App)
// --------------------------------------------------------------------------
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, root, '');
    const siteUrl = (env.SITE_URL || site.defaultUrl).replace(/\/+$/, '');

    const input = Object.fromEntries(
        [...pages, ...extraEntries].map((p) => {
            const key = p.file.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/^index$/, 'home');
            return [key, resolve(root, p.file)];
        })
    );

    return {
        plugins: [kuxoSeo({ siteUrl })],
        build: {
            target: 'es2022',
            rollupOptions: { input },
        },
    };
});
