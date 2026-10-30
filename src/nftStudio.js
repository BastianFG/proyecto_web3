import confetti from 'canvas-confetti';
import { wallet } from './wallet.js';
import { sfx } from './audio.js';

export class NftStudio {
    constructor(canvasId = 'nft-canvas') {
        this.canvasId = canvasId;
        this.currentSeed = Math.random();
        this.currentPrompt = 'Cybernetic Singularity 001';
        this.currentHash = '';
        this.currentCID = '';
        this.collection = [];

        this.loadCollection();
    }

    loadCollection() {
        const saved = localStorage.getItem('neura3_nfts');
        if (saved) {
            try {
                this.collection = JSON.parse(saved);
            } catch (e) {
                this.collection = [];
            }
        }
    }

    saveCollection() {
        localStorage.setItem('neura3_nfts', JSON.stringify(this.collection));
    }

    // Procedural neural generative art generator on Canvas
    generateArt(prompt = 'Genesis Cyberpunk AI') {
        sfx.playAiProcessing();
        this.currentPrompt = prompt;
        this.currentSeed = Math.random();

        const canvas = document.getElementById(this.canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Reset background
        const grad = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w*0.7);
        grad.addColorStop(0, '#0c0721');
        grad.addColorStop(0.5, '#05030d');
        grad.addColorStop(1, '#020108');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Cybernetic Grid
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 25;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Color palettes based on seed
        const palettes = [
            ['#00f3ff', '#bc13fe', '#ff007a', '#00ff88'], // Cyber Synth
            ['#ff0055', '#ff9900', '#ffee00', '#00ffee'], // Solar Flare
            ['#00ffaa', '#00b4d8', '#7209b7', '#f72585'], // Deep Quantum
            ['#4cc9f0', '#4361ee', '#3a0ca3', '#7209b7']  // Cyber Abyss
        ];
        const pal = palettes[Math.floor(this.currentSeed * palettes.length)];

        // Concentric Glowing Neural Rings
        const rings = 6 + Math.floor(this.currentSeed * 6);
        for (let i = 1; i <= rings; i++) {
            ctx.save();
            ctx.beginPath();
            const radius = (w * 0.38 / rings) * i;
            ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
            ctx.strokeStyle = pal[i % pal.length];
            ctx.shadowColor = pal[i % pal.length];
            ctx.shadowBlur = 15;
            ctx.lineWidth = 1.5 + (i % 3);
            ctx.stroke();
            ctx.restore();
        }

        // Algorithmic Fractal Curves & Synaptic Nodes
        const nodes = 18 + Math.floor(this.currentSeed * 16);
        const nodePositions = [];
        ctx.save();
        for (let i = 0; i < nodes; i++) {
            const angle = (i / nodes) * Math.PI * 2 + this.currentSeed * 5;
            const dist = 50 + Math.sin(angle * 3 + this.currentSeed * 10) * (w * 0.32);
            const nx = w / 2 + Math.cos(angle) * dist;
            const ny = h / 2 + Math.sin(angle) * dist;
            nodePositions.push({ x: nx, y: ny, color: pal[i % pal.length] });

            // Draw glowing node
            ctx.beginPath();
            ctx.arc(nx, ny, 3 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fillStyle = pal[i % pal.length];
            ctx.shadowColor = pal[i % pal.length];
            ctx.shadowBlur = 12;
            ctx.fill();
        }

        // Connect nodes with glowing vectors
        ctx.lineWidth = 1;
        for (let i = 0; i < nodePositions.length; i++) {
            for (let j = i + 1; j < nodePositions.length; j++) {
                const n1 = nodePositions[i];
                const n2 = nodePositions[j];
                const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
                if (d < 95) {
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.strokeStyle = n1.color;
                    ctx.globalAlpha = 0.45;
                    ctx.stroke();
                }
            }
        }
        ctx.restore();

        // Central Quantum Core
        ctx.save();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 30;
        ctx.fill();
        ctx.restore();

        // Generate Cryptographic Hashes (SHA-256 + IPFS CID)
        this.computeHashes(canvas);
    }

    async computeHashes(canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const encoder = new TextEncoder();
        const data = encoder.encode(dataUrl + this.currentPrompt + this.currentSeed);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        this.currentHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        this.currentCID = 'bafybeic' + hashArray.slice(0, 18).map(b => b.toString(36).padStart(2, '0')).join('') + 'neura3';

        const hashEl = document.getElementById('nft-hash-display');
        const cidEl = document.getElementById('nft-cid-display');
        if (hashEl) hashEl.textContent = `${this.currentHash.slice(0, 14)}...${this.currentHash.slice(-8)}`;
        if (cidEl) cidEl.textContent = `ipfs://${this.currentCID.slice(0, 16)}...`;
    }

    async mintCurrentNFT() {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) throw new Error('Canvas no encontrado');

        const mintCost = 5.0; // 5.0 NEURA
        wallet.deductForMint(mintCost);

        const dataUrl = canvas.toDataURL('image/png');
        const tokenId = this.collection.length + 101;
        const txHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');

        const newNFT = {
            id: tokenId,
            title: this.currentPrompt,
            image: dataUrl,
            ipfs: `ipfs://${this.currentCID}`,
            sha256: this.currentHash,
            txHash: txHash,
            owner: wallet.address || '0xLocalNeuralHolder',
            date: new Date().toLocaleDateString()
        };

        this.collection.unshift(newNFT);
        this.saveCollection();

        wallet.addTransaction({
            type: 'NFT_MINT',
            hash: txHash,
            amount: `-${mintCost.toFixed(2)} NEURA`,
            status: 'CONFIRMED',
            timestamp: new Date().toLocaleTimeString()
        });

        // Trigger celebratory sound & confetti
        sfx.playSuccess();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00f3ff', '#bc13fe', '#00ff88', '#ffffff']
        });

        return newNFT;
    }
}
