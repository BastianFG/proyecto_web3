import { wallet } from './wallet.js';
import { sfx } from './audio.js';

export class DaoGovernance {
    constructor() {
        this.proposals = [
            {
                id: 'NIP-01',
                title: 'Integración de Agentes Autónomos de Liquidez en Arbitrum',
                author: '0x8472...B41A',
                category: 'Infraestructura',
                description: 'Desplegar contratos inteligentes gobernados por modelos de aprendizaje reforzado para rebalancear automáticamente pools de liquidez y minimizar impermanent loss.',
                votesFor: 84250,
                votesAgainst: 12100,
                userVoted: null,
                status: 'ACTIVA',
                endsIn: '2 días'
            },
            {
                id: 'NIP-02',
                title: 'Fondo de Tesorería de 250,000 $NEURA para Desarrolladores de IA Web3',
                author: '0x1F98...E492',
                category: 'Ecosistema',
                description: 'Asignar fondos para acelerar proyectos de código abierto que fusionen modelos locales de inferencia (WebLLM/ONNX) con billeteras no custodiales.',
                votesFor: 142800,
                votesAgainst: 3400,
                userVoted: null,
                status: 'ACTIVA',
                endsIn: '4 días'
            },
            {
                id: 'NIP-03',
                title: 'Actualización a zk-Rollups para Oráculos de Sentimiento Neuronal',
                author: '0x32A1...9F02',
                category: 'Seguridad',
                description: 'Migrar las pruebas de computación del modelo de análisis de sentimiento a pruebas de conocimiento cero (zk-SNARKs) para verificación on-chain instantánea y económica.',
                votesFor: 98120,
                votesAgainst: 65400,
                userVoted: null,
                status: 'ACTIVA',
                endsIn: '12 horas'
            }
        ];

        this.loadProposals();
    }

    loadProposals() {
        const saved = localStorage.getItem('neura3_dao_proposals');
        if (saved) {
            try {
                this.proposals = JSON.parse(saved);
            } catch (e) {
                // Keep default
            }
        }
    }

    saveProposals() {
        localStorage.setItem('neura3_dao_proposals', JSON.stringify(this.proposals));
    }

    vote(proposalId, choice) {
        const prop = this.proposals.find(p => p.id === proposalId);
        if (!prop) throw new Error('Propuesta no encontrada');

        const votingPower = Math.max(1, Math.floor(wallet.balanceNEURA));

        if (choice === 'FOR') {
            prop.votesFor += votingPower;
        } else if (choice === 'AGAINST') {
            prop.votesAgainst += votingPower;
        }
        prop.userVoted = choice;

        this.saveProposals();
        sfx.playSuccess();

        wallet.addTransaction({
            type: 'DAO_VOTE',
            hash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            amount: `${votingPower} Votos (${choice})`,
            status: 'CONFIRMED',
            timestamp: new Date().toLocaleTimeString()
        });

        return prop;
    }

    createProposal(title, description, category = 'General') {
        const newId = `NIP-0${this.proposals.length + 1}`;
        const newProp = {
            id: newId,
            title,
            description,
            category,
            author: wallet.shortAddress || '0xLocalMember',
            votesFor: Math.max(1, Math.floor(wallet.balanceNEURA)),
            votesAgainst: 0,
            userVoted: 'FOR',
            status: 'ACTIVA',
            endsIn: '7 días'
        };

        this.proposals.unshift(newProp);
        this.saveProposals();
        sfx.playSuccess();

        wallet.addTransaction({
            type: 'DAO_PROPOSAL_CREATED',
            hash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            amount: newId,
            status: 'CONFIRMED',
            timestamp: new Date().toLocaleTimeString()
        });

        return newProp;
    }
}

export const dao = new DaoGovernance();
