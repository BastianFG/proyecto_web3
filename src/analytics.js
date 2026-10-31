// Lead Capture and Real-Time Chatbot Analytics

export class AnalyticsManager {
    constructor() {
        this.leads = [];
        this.metrics = {
            totalConversations: 1482,
            leadsCapturedCount: 0,
            avgResponseTimeMs: 640,
            satisfactionRate: 98.4
        };

        this.listeners = [];
        this.loadLeads();
    }

    loadLeads() {
        // Migra leads guardados con la clave antigua si existen
        const saved = localStorage.getItem('kuxo_leads') || localStorage.getItem('ziravo_leads') || localStorage.getItem('nexa_leads');
        if (saved) {
            try {
                this.leads = JSON.parse(saved);
            } catch (e) {
                this.leads = [];
            }
        } else {
            // Seed sample leads for great first-look impression
            this.leads = [
                {
                    id: 'LEAD-9412',
                    name: 'Carlos Mendoza',
                    contact: 'carlos.mendoza@innova.co',
                    interest: 'Plan Pro para E-commerce Shopify',
                    date: new Date(Date.now() - 3600000 * 4).toLocaleDateString(),
                    time: '14:20',
                    status: 'EN CONTACTO'
                },
                {
                    id: 'LEAD-9413',
                    name: 'Valentina Soto',
                    contact: '+56 9 8412 9041',
                    interest: 'Cotización de Chatbot para Clínica Dental',
                    date: new Date(Date.now() - 3600000 * 2).toLocaleDateString(),
                    time: '16:45',
                    status: 'NUEVO'
                }
            ];
            this.saveLeads();
        }

        this.metrics.leadsCapturedCount = this.leads.length;
    }

    saveLeads() {
        localStorage.setItem('kuxo_leads', JSON.stringify(this.leads));
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.getData());
    }

    notify() {
        const data = this.getData();
        this.listeners.forEach(cb => cb(data));
    }

    getData() {
        return {
            leads: this.leads,
            metrics: {
                ...this.metrics,
                leadsCapturedCount: this.leads.length
            }
        };
    }

    addLead(lead) {
        this.leads.unshift(lead);
        this.metrics.totalConversations += 1;
        this.saveLeads();
        this.notify();
    }

    exportLeadsCSV() {
        if (this.leads.length === 0) return '';
        const headers = ['ID', 'Nombre', 'Contacto', 'Interes', 'Fecha', 'Hora', 'Estado'];
        const rows = this.leads.map(l => [
            l.id,
            `"${l.name}"`,
            `"${l.contact}"`,
            `"${l.interest}"`,
            l.date,
            l.time,
            l.status
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }
}

export const analytics = new AnalyticsManager();
