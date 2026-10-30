import { init3DBackground } from './src/background3d.js';
import { wallet } from './src/wallet.js';
import { aiEngine } from './src/aiEngine.js';
import { NftStudio } from './src/nftStudio.js';
import { oracle } from './src/oracle.js';
import { dao } from './src/dao.js';
import { sfx } from './src/audio.js';

// ==========================================================================
// TOAST NOTIFICATION UTILITY
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
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize 3D Three.js Background
    init3DBackground('dynamic-bg');

    // 2. Audio Toggle
    const btnSound = document.getElementById('btn-toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    if (btnSound) {
        btnSound.addEventListener('click', () => {
            const enabled = sfx.toggle();
            soundIcon.textContent = enabled ? '🔊' : '🔇';
            showToast(enabled ? 'Efectos de sonido activados' : 'Efectos de sonido silenciados');
        });
    }

    // 3. Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playClick();
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetEl = document.getElementById(target);
            if (targetEl) targetEl.classList.add('active');
        });
    });

    // ==========================================================================
    // WALLET CONTROLS & EVENT SUBSCRIPTION
    // ==========================================================================
    const btnConnect = document.getElementById('btn-connect-wallet');
    const walletDropdown = document.getElementById('wallet-dropdown');
    const walletBtnText = document.getElementById('wallet-btn-text');
    const dropdownAddress = document.getElementById('dropdown-address-badge');
    const dropdownBalNeura = document.getElementById('dropdown-bal-neura');
    const dropdownBalEth = document.getElementById('dropdown-bal-eth');
    const btnFaucet = document.getElementById('btn-faucet');
    const btnViewPk = document.getElementById('btn-view-pk');
    const btnDisconnect = document.getElementById('btn-disconnect');
    const networkSelect = document.getElementById('network-select');

    btnConnect.addEventListener('click', async () => {
        if (!wallet.isConnected) {
            const res = await wallet.connectMetaMask();
            if (res.mode === 'metamask') {
                showToast(`MetaMask conectada: ${wallet.getState().shortAddress}`, 'success');
            } else {
                showToast(`Billetera Neural HD conectada: ${wallet.getState().shortAddress}`, 'success');
            }
        } else {
            walletDropdown.classList.toggle('hidden');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!btnConnect.contains(e.target) && !walletDropdown.contains(e.target)) {
            walletDropdown.classList.add('hidden');
        }
    });

    btnFaucet.addEventListener('click', () => {
        const res = wallet.claimFaucet();
        showToast(`¡Faucet reclamado! Saldo actual: ${res.neura.toFixed(2)} NEURA`, 'success');
    });

    btnDisconnect.addEventListener('click', () => {
        wallet.disconnect();
        walletDropdown.classList.add('hidden');
        showToast('Billetera desconectada');
    });

    networkSelect.addEventListener('change', (e) => {
        const opt = e.target.selectedOptions[0];
        wallet.setNetwork(e.target.value, opt.text);
        showToast(`Red cambiada a: ${opt.text}`);
    });

    // Export PK Modal
    const modalPk = document.getElementById('modal-private-key');
    const pkDisplayText = document.getElementById('pk-display-text');
    const btnClosePk = document.getElementById('btn-close-pk-modal');
    const btnCopyPk = document.getElementById('btn-copy-pk');

    btnViewPk.addEventListener('click', () => {
        sfx.playClick();
        walletDropdown.classList.add('hidden');
        const st = wallet.getState();
        pkDisplayText.textContent = st.privateKey || 'No disponible para billetera externa';
        modalPk.classList.remove('hidden');
    });

    btnClosePk.addEventListener('click', () => {
        modalPk.classList.add('hidden');
    });

    btnCopyPk.addEventListener('click', () => {
        navigator.clipboard.writeText(pkDisplayText.textContent);
        showToast('Llave privada copiada al portapapeles', 'success');
    });

    // Wallet State Subscriber
    wallet.subscribe((state) => {
        if (state.isConnected) {
            walletBtnText.textContent = `${state.shortAddress} (${state.balanceNEURA} NEURA)`;
            dropdownAddress.textContent = `${state.address.slice(0, 10)}...${state.address.slice(-8)}`;
            dropdownBalNeura.textContent = state.balanceNEURA;
            dropdownBalEth.textContent = state.balanceETH;
        } else {
            walletBtnText.textContent = 'CONECTAR BILLETERA';
        }

        renderTransactionsLedger(state.transactions);
    });

    // Automatically initialize simulated wallet state on first load
    wallet.connectSimulated();

    // ==========================================================================
    // MODULE 1: SMART CONTRACT AUDITOR & GENERATOR
    // ==========================================================================
    const editor = document.getElementById('solidity-editor');
    const templateBtns = document.querySelectorAll('.template-btn');
    const btnRunAudit = document.getElementById('btn-run-audit');
    const btnClearEditor = document.getElementById('btn-clear-editor');
    const promptInput = document.getElementById('contract-prompt-input');
    const btnGenerateContract = document.getElementById('btn-generate-contract');

    const gaugeScore = document.getElementById('gauge-score');
    const gaugeCircle = document.getElementById('gauge-circle');
    const auditStatusTitle = document.getElementById('audit-status-title');
    const auditStatusDesc = document.getElementById('audit-status-desc');
    const issuesList = document.getElementById('issues-list');
    const securityScoreBadge = document.getElementById('security-score-badge');

    // Load initial template
    editor.value = aiEngine.contractsCatalog.vulnerable_vault;

    templateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sfx.playClick();
            templateBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tmpl = btn.dataset.template;
            if (aiEngine.contractsCatalog[tmpl]) {
                editor.value = aiEngine.contractsCatalog[tmpl];
                showToast(`Plantilla cargada: ${btn.textContent}`);
            }
        });
    });

    btnClearEditor.addEventListener('click', () => {
        sfx.playClick();
        editor.value = '';
    });

    btnGenerateContract.addEventListener('click', () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            showToast('Ingresa una descripción para el contrato', 'error');
            return;
        }
        sfx.playAiProcessing();
        showToast('Generando contrato inteligente con modelo Neura3...');
        
        setTimeout(() => {
            const generatedCode = aiEngine.generateSmartContract(prompt);
            editor.value = generatedCode;
            showToast('¡Contrato generado con éxito!', 'success');
            sfx.playSuccess();
            // Automatically audit generated code
            btnRunAudit.click();
        }, 600);
    });

    btnRunAudit.addEventListener('click', () => {
        const code = editor.value.trim();
        if (!code) {
            showToast('El editor está vacío', 'error');
            return;
        }

        sfx.playAiProcessing();
        const report = aiEngine.auditContract(code);

        // Update score & colors
        gaugeScore.textContent = report.score;
        let color = 'var(--neon-green)';
        let badgeClass = 'badge-status success';

        if (report.score < 60) {
            color = 'var(--neon-red)';
            badgeClass = 'badge-status danger';
        } else if (report.score < 85) {
            color = 'var(--neon-gold)';
            badgeClass = 'badge-status warning';
        }

        gaugeCircle.style.borderColor = color;
        gaugeScore.style.color = color;
        securityScoreBadge.className = badgeClass;
        securityScoreBadge.textContent = `${report.status} (${report.score}/100)`;

        auditStatusTitle.textContent = `Auditoría Completada: ${report.issuesCount} Hallazgos`;
        auditStatusDesc.textContent = report.score >= 85 
            ? 'El contrato presenta alta resiliencia y sigue las mejores prácticas de OpenZeppelin.' 
            : 'Se detectaron riesgos potenciales de seguridad. Revisa las recomendaciones a continuación.';

        // Render issues list
        if (report.issues.length === 0) {
            issuesList.innerHTML = `
                <div class="issue-item LOW">
                    <div class="issue-top-row">
                        <span class="issue-title">✅ No se detectaron vulnerabilidades críticas</span>
                        <span class="issue-line">Líneas analizadas: ${code.split('\n').length}</span>
                    </div>
                    <p class="issue-desc">El código pasa todas las heurísticas de seguridad contra ataques de reentrancia, desbordamiento y autorización indebida.</p>
                </div>
            `;
        } else {
            issuesList.innerHTML = report.issues.map(issue => `
                <div class="issue-item ${issue.severity}">
                    <div class="issue-top-row">
                        <span class="issue-title">[${issue.severity}] ${issue.title}</span>
                        <span class="issue-line">Línea ${issue.line}</span>
                    </div>
                    <p class="issue-desc">${issue.description}</p>
                    <div class="issue-recom">💡 Solución sugerida: ${issue.recommendation}</div>
                </div>
            `).join('');
        }

        sfx.playSuccess();
        showToast(`Auditoría finalizada: Score ${report.score}/100`, report.score >= 70 ? 'success' : 'error');
    });

    // Auto-run audit on first load
    setTimeout(() => {
        btnRunAudit.click();
    }, 400);

    // ==========================================================================
    // MODULE 2: GENERATIVE NFT STUDIO
    // ==========================================================================
    const nftStudio = new NftStudio('nft-canvas');
    const nftPromptInput = document.getElementById('nft-prompt-input');
    const btnGenerateNft = document.getElementById('btn-generate-nft');
    const btnMintNft = document.getElementById('btn-mint-nft');
    const nftGallery = document.getElementById('nft-gallery');
    const collectionCount = document.getElementById('collection-count');

    function renderNftGallery() {
        collectionCount.textContent = `${nftStudio.collection.length} NFTs`;
        if (nftStudio.collection.length === 0) {
            nftGallery.innerHTML = `
                <div class="empty-state">
                    Aún no has acuñado ningún NFT en esta sesión. ¡Genera uno y haz clic en Acuñar!
                </div>
            `;
            return;
        }

        nftGallery.innerHTML = nftStudio.collection.map(item => `
            <div class="gallery-card">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="gallery-info">
                    <div class="gallery-title">${item.title}</div>
                    <div class="gallery-sub">Token #${item.id}</div>
                    <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono); margin-top:4px;">
                        ${item.ipfs.slice(0, 18)}...
                    </div>
                </div>
            </div>
        `).join('');
    }

    btnGenerateNft.addEventListener('click', () => {
        const p = nftPromptInput.value.trim() || 'Neural Cyberpunk Core';
        nftStudio.generateArt(p);
        showToast('Nueva obra neuronal generada');
    });

    btnMintNft.addEventListener('click', async () => {
        try {
            const minted = await nftStudio.mintCurrentNFT();
            renderNftGallery();
            showToast(`¡NFT #${minted.id} acuñado exitosamente en la blockchain!`, 'success');
        } catch (err) {
            showToast(err.message, 'error');
            sfx.playClick();
        }
    });

    // Initial art generation & gallery load
    nftStudio.generateArt('Cybernetic Singularity 001');
    renderNftGallery();

    // ==========================================================================
    // MODULE 3: LIVE CRYPTO ORACLE
    // ==========================================================================
    const oracleGrid = document.getElementById('oracle-tokens-grid');
    const headerGasDisplay = document.getElementById('header-gas-display');
    const tickerBtc = document.getElementById('ticker-btc');
    const tickerEth = document.getElementById('ticker-eth');
    const tickerSol = document.getElementById('ticker-sol');
    const gasSlow = document.getElementById('gas-slow');
    const gasNormal = document.getElementById('gas-normal');
    const gasFast = document.getElementById('gas-fast');
    const gasInstant = document.getElementById('gas-instant');

    oracle.subscribe((data) => {
        // Ticker Header
        if (data.tokens.bitcoin) tickerBtc.textContent = `BTC: $${data.tokens.bitcoin.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        if (data.tokens.ethereum) tickerEth.textContent = `ETH: $${data.tokens.ethereum.price.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
        if (data.tokens.solana) tickerSol.textContent = `SOL: $${data.tokens.solana.price.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;

        // Gas Header
        headerGasDisplay.textContent = `${data.gas.normal} Gwei`;
        if (gasSlow) gasSlow.textContent = `${data.gas.slow} Gwei`;
        if (gasNormal) gasNormal.textContent = `${data.gas.normal} Gwei`;
        if (gasFast) gasFast.textContent = `${data.gas.fast} Gwei`;
        if (gasInstant) gasInstant.textContent = `${data.gas.instant} Gwei`;

        // Tokens Grid
        if (oracleGrid) {
            oracleGrid.innerHTML = Object.values(data.tokens).map(tok => {
                const isPos = tok.change24h >= 0;
                return `
                    <div class="token-card">
                        <div class="token-top">
                            <span class="token-sym">${tok.symbol}</span>
                            <span class="token-name">${tok.name}</span>
                        </div>
                        <div class="token-price">$${tok.price < 2 ? tok.price.toFixed(4) : tok.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="token-change ${isPos ? 'positive' : 'negative'}">
                            ${isPos ? '▲ +' : '▼ '}${tok.change24h.toFixed(2)}% (24h)
                        </div>
                    </div>
                `;
            }).join('');
        }
    });

    // ==========================================================================
    // MODULE 4: DAO GOVERNANCE
    // ==========================================================================
    const proposalsContainer = document.getElementById('proposals-container');
    const btnOpenCreateProp = document.getElementById('btn-open-create-prop');
    const modalProposal = document.getElementById('modal-create-proposal');
    const btnClosePropModal = document.getElementById('btn-close-proposal-modal');
    const btnSubmitProposal = document.getElementById('btn-submit-proposal');
    const newPropTitle = document.getElementById('new-prop-title');
    const newPropCategory = document.getElementById('new-prop-category');
    const newPropDesc = document.getElementById('new-prop-desc');

    function renderProposals() {
        if (!proposalsContainer) return;

        proposalsContainer.innerHTML = dao.proposals.map(prop => {
            const total = prop.votesFor + prop.votesAgainst;
            const forPercent = total > 0 ? ((prop.votesFor / total) * 100).toFixed(1) : 50;

            return `
                <div class="proposal-card">
                    <div class="proposal-top">
                        <div class="proposal-meta">
                            <span class="prop-id">${prop.id}</span>
                            <span class="prop-cat">${prop.category}</span>
                            <span class="badge-status success">${prop.status}</span>
                        </div>
                        <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">Finaliza en: ${prop.endsIn}</span>
                    </div>

                    <h3 class="proposal-title">${prop.title}</h3>
                    <p class="proposal-desc">${prop.description}</p>

                    <div class="proposal-votes-bar">
                        <div class="votes-for-fill" style="width: ${forPercent}%;"></div>
                    </div>

                    <div class="proposal-vote-counts">
                        <span class="for-count">A FAVOR: ${prop.votesFor.toLocaleString()} (${forPercent}%)</span>
                        <span class="against-count">EN CONTRA: ${prop.votesAgainst.toLocaleString()} (${(100 - forPercent).toFixed(1)}%)</span>
                    </div>

                    <div class="proposal-actions">
                        <button class="btn-vote for" data-id="${prop.id}" data-choice="FOR" ${prop.userVoted ? 'disabled' : ''}>
                            👍 Votar A Favor
                        </button>
                        <button class="btn-vote against" data-id="${prop.id}" data-choice="AGAINST" ${prop.userVoted ? 'disabled' : ''}>
                            👎 Votar En Contra
                        </button>
                        ${prop.userVoted ? `<span style="align-self:center; font-size:0.8rem; color:var(--neon-cyan);">✓ Has votado (${prop.userVoted})</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add vote listeners
        proposalsContainer.querySelectorAll('.btn-vote').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const choice = btn.dataset.choice;
                try {
                    dao.vote(id, choice);
                    renderProposals();
                    showToast(`Voto registrado on-chain para ${id}`, 'success');
                } catch (e) {
                    showToast(e.message, 'error');
                }
            });
        });
    }

    renderProposals();

    btnOpenCreateProp.addEventListener('click', () => {
        sfx.playClick();
        modalProposal.classList.remove('hidden');
    });

    btnClosePropModal.addEventListener('click', () => {
        modalProposal.classList.add('hidden');
    });

    btnSubmitProposal.addEventListener('click', () => {
        const title = newPropTitle.value.trim();
        const desc = newPropDesc.value.trim();
        const cat = newPropCategory.value;

        if (!title || !desc) {
            showToast('Por favor completa todos los campos de la propuesta', 'error');
            return;
        }

        const newP = dao.createProposal(title, desc, cat);
        modalProposal.classList.add('hidden');
        newPropTitle.value = '';
        newPropDesc.value = '';
        renderProposals();
        showToast(`Propuesta ${newP.id} publicada en gobernanza DAO`, 'success');
    });

    // ==========================================================================
    // MODULE 5: AI CONVERSATIONAL WEB3 ASSISTANT
    // ==========================================================================
    const chatInput = document.getElementById('chat-input');
    const btnSendChat = document.getElementById('btn-send-chat');
    const chatMessages = document.getElementById('chat-messages');

    function appendChatMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.innerHTML = `
            <div class="msg-avatar">${sender === 'bot' ? '🤖' : '👤'}</div>
            <div class="msg-bubble">${text.replace(/\n/g, '<br>')}</div>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleChatSend() {
        const q = chatInput.value.trim();
        if (!q) return;

        sfx.playClick();
        appendChatMessage('user', q);
        chatInput.value = '';

        setTimeout(() => {
            sfx.playAiProcessing();
            const answer = aiEngine.answerQuestion(q);
            appendChatMessage('bot', answer);
            sfx.playClick();
        }, 500);
    }

    btnSendChat.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    // ==========================================================================
    // MODULE 6: ON-CHAIN TRANSACTIONS LEDGER
    // ==========================================================================
    function renderTransactionsLedger(txs) {
        const tbody = document.getElementById('ledger-tbody');
        const countBadge = document.getElementById('ledger-tx-count');
        if (!tbody || !countBadge) return;

        countBadge.textContent = `${txs.length} Transacciones`;

        if (txs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No hay transacciones registradas aún en esta sesión.</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = txs.map(tx => `
            <tr>
                <td><strong>${tx.type}</strong></td>
                <td><span class="tx-hash-badge">${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}</span></td>
                <td>${tx.amount}</td>
                <td><span class="badge-status success">${tx.status}</span></td>
                <td>${tx.timestamp}</td>
            </tr>
        `).join('');
    }
});
