import { ethers } from 'ethers';
import { sfx } from './audio.js';

class Web3WalletManager {
    constructor() {
        this.isConnected = false;
        this.isMetaMask = false;
        this.address = null;
        this.balanceETH = 2.50;
        this.balanceNEURA = 100.00;
        this.network = {
            id: '1337',
            name: 'Neura3 Neural Mainnet',
            currency: 'NEURA'
        };
        this.simulatedWallet = null;
        this.transactions = [];
        this.listeners = [];

        this.initSimulatedWallet();
    }

    initSimulatedWallet() {
        // Load or create simulated random wallet
        const savedKey = localStorage.getItem('neura3_wallet_pk');
        if (savedKey) {
            try {
                this.simulatedWallet = new ethers.Wallet(savedKey);
            } catch (e) {
                this.simulatedWallet = ethers.Wallet.createRandom();
                localStorage.setItem('neura3_wallet_pk', this.simulatedWallet.privateKey);
            }
        } else {
            this.simulatedWallet = ethers.Wallet.createRandom();
            localStorage.setItem('neura3_wallet_pk', this.simulatedWallet.privateKey);
        }

        const savedBalance = localStorage.getItem('neura3_balance');
        if (savedBalance) {
            this.balanceNEURA = parseFloat(savedBalance);
        }

        const savedTx = localStorage.getItem('neura3_txs');
        if (savedTx) {
            try {
                this.transactions = JSON.parse(savedTx);
            } catch (e) {
                this.transactions = [];
            }
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.getState());
    }

    notify() {
        const state = this.getState();
        this.listeners.forEach(cb => cb(state));
    }

    getState() {
        return {
            isConnected: this.isConnected,
            isMetaMask: this.isMetaMask,
            address: this.address,
            shortAddress: this.address ? `${this.address.slice(0, 6)}...${this.address.slice(-4)}` : '',
            balanceETH: this.balanceETH.toFixed(4),
            balanceNEURA: this.balanceNEURA.toFixed(2),
            network: this.network,
            privateKey: this.simulatedWallet ? this.simulatedWallet.privateKey : null,
            transactions: this.transactions
        };
    }

    async connectMetaMask() {
        sfx.playClick();
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();
                this.address = await signer.getAddress();
                this.isMetaMask = true;
                this.isConnected = true;

                const network = await provider.getNetwork();
                this.network = {
                    id: network.chainId.toString(),
                    name: network.name || 'Ethereum Chain',
                    currency: 'ETH'
                };

                const balance = await provider.getBalance(this.address);
                this.balanceETH = parseFloat(ethers.formatEther(balance));
                
                sfx.playConnect();
                this.notify();
                return { success: true, mode: 'metamask', address: this.address };
            } catch (err) {
                console.warn('MetaMask connection rejected/failed:', err);
                // Fallback to simulated
                return this.connectSimulated();
            }
        } else {
            // No extension found, seamlessly connect to Built-in Neural HD Wallet
            return this.connectSimulated();
        }
    }

    connectSimulated() {
        sfx.playClick();
        this.address = this.simulatedWallet.address;
        this.isMetaMask = false;
        this.isConnected = true;
        sfx.playConnect();
        this.notify();
        return { success: true, mode: 'simulated', address: this.address };
    }

    disconnect() {
        sfx.playClick();
        this.isConnected = false;
        this.address = null;
        this.notify();
    }

    setNetwork(netId, netName, currency = 'ETH') {
        this.network = { id: netId, name: netName, currency };
        sfx.playClick();
        this.notify();
    }

    claimFaucet() {
        sfx.playSuccess();
        this.balanceNEURA += 25.0;
        this.balanceETH += 0.5;
        localStorage.setItem('neura3_balance', this.balanceNEURA.toString());

        this.addTransaction({
            type: 'FAUCET_CLAIM',
            hash: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
            amount: '+25.00 NEURA',
            status: 'CONFIRMED',
            timestamp: new Date().toLocaleTimeString()
        });

        this.notify();
        return { neura: this.balanceNEURA, eth: this.balanceETH };
    }

    deductForMint(cost = 5.0) {
        if (this.balanceNEURA < cost) {
            throw new Error(`Fondos insuficientes. Se requieren ${cost} NEURA.`);
        }
        this.balanceNEURA -= cost;
        localStorage.setItem('neura3_balance', this.balanceNEURA.toString());
        this.notify();
    }

    async signMessage(message) {
        sfx.playAiProcessing();
        if (this.isMetaMask && typeof window.ethereum !== 'undefined') {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            return await signer.signMessage(message);
        } else {
            // Sign using simulated wallet
            return await this.simulatedWallet.signMessage(message);
        }
    }

    addTransaction(tx) {
        this.transactions.unshift(tx);
        if (this.transactions.length > 20) this.transactions.pop();
        localStorage.setItem('neura3_txs', JSON.stringify(this.transactions));
        this.notify();
    }
}

export const wallet = new Web3WalletManager();
