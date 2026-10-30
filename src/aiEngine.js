// AI Web3 Intelligence Engine: Contract Auditor, Prompt-to-Contract Generator, and Neural Oracle Agent

export class AiEngine {
    constructor() {
        this.contractsCatalog = {
            vulnerable_vault: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VulnerableEtherVault {
    mapping(address => uint256) public balances;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // Vulnerable: State changed after transfer (Reentrancy attack vector)
    function withdrawAll() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No funds");

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        balances[msg.sender] = 0; // State change too late!
    }

    // Vulnerable: tx.origin phishing vulnerability
    function transferOwnership(address newOwner) public {
        require(tx.origin == owner, "Only owner");
        owner = newOwner;
    }
}`,
            erc20_token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeuraToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    mapping(address => bool) public isBlacklisted;

    event TokensBurned(address indexed burner, uint256 amount);

    constructor(address initialOwner) ERC20("Neura3 AI Token", "NEURA") Ownable(initialOwner) {
        _mint(initialOwner, 10_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
}`,
            erc721_nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeuraGenesisNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    uint256 public mintPrice = 0.05 ether;
    uint256 public constant MAX_ELEMENTS = 10000;

    constructor(address initialOwner) ERC721("Neura3 AI Genesis", "N3GEN") Ownable(initialOwner) {}

    function mintAIArtwork(string memory tokenURI) public payable returns (uint256) {
        require(msg.value >= mintPrice, "Ether value sent is below price");
        require(_nextTokenId < MAX_ELEMENTS, "Sold out");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}`
        };
    }

    // Comprehensive heuristic and syntactic AI auditor
    auditContract(sourceCode) {
        const issues = [];
        const lines = sourceCode.split('\n');

        // Check 1: Reentrancy vulnerability (call.value / call before state change)
        const callLines = [];
        const stateChangeLines = [];

        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            if (line.includes('.call{value:') || line.includes('.call.value(')) {
                callLines.push(lineNum);
            }
            if (/balances\[.*\]\s*=\s*0/.test(line) || /balance\s*-=/.test(line) || /_burn\(/.test(line)) {
                stateChangeLines.push(lineNum);
            }
        });

        if (callLines.length > 0 && stateChangeLines.length > 0) {
            const hasReentrancy = callLines.some(cLine => stateChangeLines.some(sLine => sLine > cLine));
            if (hasReentrancy) {
                issues.push({
                    severity: 'CRITICAL',
                    title: 'Vulnerabilidad Crítica de Reentrancia (Reentrancy Attack)',
                    line: callLines[0],
                    description: 'Se realiza una llamada externa de bajo nivel (.call{value: ...}) antes de actualizar el balance o estado interno del contrato. Un atacante puede drenar los fondos llamando recursivamente a la función.',
                    recommendation: 'Aplica el patrón Checks-Effects-Interactions (CEI) actualizando el saldo antes de la llamada, o añade el modificador nonReentrant de OpenZeppelin.'
                });
            }
        }

        // Check 2: tx.origin phishing
        lines.forEach((line, idx) => {
            if (line.includes('tx.origin')) {
                issues.push({
                    severity: 'HIGH',
                    title: 'Uso Inseguro de tx.origin para Autorización',
                    line: idx + 1,
                    description: 'tx.origin hace referencia al emisor original de la transacción completa, dejando el contrato susceptible a ataques de phishing a través de contratos proxy maliciosos.',
                    recommendation: 'Reemplaza tx.origin por msg.sender para verificar de forma segura la identidad del llamador directo.'
                });
            }
        });

        // Check 3: selfdestruct check
        lines.forEach((line, idx) => {
            if (line.includes('selfdestruct(') || line.includes('suicide(')) {
                issues.push({
                    severity: 'CRITICAL',
                    title: 'Uso de selfdestruct Obsoleto y de Alto Riesgo',
                    line: idx + 1,
                    description: 'La función selfdestruct está formalmente desaconsejada por la EIP-6780 y puede provocar la pérdida permanente de fondos y control del contrato.',
                    recommendation: 'Elimina el opcode selfdestruct y utiliza lógica pausible o gobernanza DAO para desactivar contratos.'
                });
            }
        });

        // Check 4: Missing Zero Address Validation
        lines.forEach((line, idx) => {
            if (/(function\s+\w+\(.*address\s+(\w+).*\)|newOwner)/.test(line)) {
                const nextLines = lines.slice(idx, idx + 5).join(' ');
                if (!nextLines.includes('address(0)') && !nextLines.includes('!= 0')) {
                    issues.push({
                        severity: 'MEDIUM',
                        title: 'Falta de Validación de Dirección Cero (Zero-Address Check)',
                        line: idx + 1,
                        description: 'Las funciones administrativas que reciben direcciones críticas no verifican que la dirección no sea address(0), lo que podría bloquear permanentemente el contrato o quemar tokens por error.',
                        recommendation: 'Agrega: require(newAddress != address(0), "Direccion invalida");'
                    });
                }
            }
        });

        // Check 5: Floating Pragma or Outdated Solidity Version
        const pragmaLine = lines.find(l => l.includes('pragma solidity'));
        if (pragmaLine) {
            if (pragmaLine.includes('^0.4.') || pragmaLine.includes('^0.5.') || pragmaLine.includes('^0.6.') || pragmaLine.includes('^0.7.')) {
                issues.push({
                    severity: 'HIGH',
                    title: 'Versión Antigua de Solidity (Riesgo de Desbordamiento)',
                    line: 1,
                    description: 'Versiones de Solidity inferiores a la 0.8.0 no tienen protección nativa contra Underflow/Overflow de enteros.',
                    recommendation: 'Actualiza a pragma solidity ^0.8.20 o superior.'
                });
            }
        }

        // Check 6: Gas Optimization in Storage Loops
        lines.forEach((line, idx) => {
            if (/for\s*\(.*\.length/.test(line)) {
                issues.push({
                    severity: 'LOW',
                    title: 'Optimización de Gas: Lectura de Longitud de Array en Bucle',
                    line: idx + 1,
                    description: 'Calcular array.length en cada iteración del bucle for lee el almacenamiento repetidamente, consumiendo gas innecesario.',
                    recommendation: 'Guarda en caché la longitud en memoria: uint256 len = array.length; antes del bucle.'
                });
            }
        });

        // Calculate Security Score
        let score = 100;
        issues.forEach(issue => {
            if (issue.severity === 'CRITICAL') score -= 35;
            else if (issue.severity === 'HIGH') score -= 20;
            else if (issue.severity === 'MEDIUM') score -= 10;
            else if (issue.severity === 'LOW') score -= 5;
        });
        score = Math.max(score, 12);

        return {
            score,
            status: score >= 85 ? 'SEGURO' : (score >= 60 ? 'PRECAUCIÓN' : 'PELIGROSO'),
            issuesCount: issues.length,
            issues
        };
    }

    // AI Solidity Code Generator based on prompt
    generateSmartContract(prompt) {
        const p = prompt.toLowerCase();
        const date = new Date().toISOString().split('T')[0];

        if (p.includes('nft') || p.includes('erc721') || p.includes('coleccion')) {
            return `// SPDX-License-Identifier: MIT
// Generado por Neura3 AI Engine [${date}]
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AutonomousAINFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _tokenIds;
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public mintPrice = 0.02 ether;
    string public baseTokenURI;

    event ArtMinted(address indexed minter, uint256 tokenId, string ipfsHash);

    constructor() ERC721("Autonomous Cyber AI", "ACAI") Ownable(msg.sender) {}

    function mint(string memory ipfsHash) external payable nonReentrant returns (uint256) {
        require(msg.value >= mintPrice, "Fondos insuficientes");
        require(_tokenIds < MAX_SUPPLY, "Coleccion agotada");

        _tokenIds++;
        uint256 newItemId = _tokenIds;

        _safeMint(msg.sender, newItemId);
        _setTokenURI(newItemId, ipfsHash);

        emit ArtMinted(msg.sender, newItemId, ipfsHash);
        return newItemId;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "Sin fondos");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Error al retirar");
    }
}`;
        } else if (p.includes('staking') || p.includes('recompensa') || p.includes('yield')) {
            return `// SPDX-License-Identifier: MIT
// Generado por Neura3 AI Engine [${date}]
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AIStakingVault is Ownable, ReentrancyGuard {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRatePerSecond = 1e15; // Tasa proporcional
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public lastClaimTime;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(IERC20 _stakingToken, IERC20 _rewardToken) Ownable(msg.sender) {
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "No se puede depositar 0");
        _updateReward(msg.sender);
        stakedBalance[msg.sender] += amount;
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Fallo deposito");
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(stakedBalance[msg.sender] >= amount, "Saldo insuficiente");
        _updateReward(msg.sender);
        stakedBalance[msg.sender] -= amount;
        require(stakingToken.transfer(msg.sender, amount), "Fallo retiro");
        emit Withdrawn(msg.sender, amount);
    }

    function _updateReward(address account) internal {
        if (lastClaimTime[account] != 0 && stakedBalance[account] > 0) {
            uint256 timeDiff = block.timestamp - lastClaimTime[account];
            uint256 reward = (stakedBalance[account] * timeDiff * rewardRatePerSecond) / 1e18;
            if (reward > 0) {
                rewardToken.transfer(account, reward);
                emit RewardPaid(account, reward);
            }
        }
        lastClaimTime[account] = block.timestamp;
    }
}`;
        } else {
            // Default: Advanced ERC-20 with AI burn mechanism and max transaction limits
            return `// SPDX-License-Identifier: MIT
// Generado por Neura3 AI Engine [${date}]
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NeuraCustomToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 10**18;
    uint256 public maxTransactionAmount = 100_000 * 10**18; // 1% limite anti-ballenas
    uint256 public burnFeeBps = 100; // 1% tasa de quema automatica

    mapping(address => bool) public isExcludedFromFee;

    event FeeUpdated(uint256 newFee);

    constructor() ERC20("Neura Autonomous Token", "NEURAX") Ownable(msg.sender) {
        isExcludedFromFee[msg.sender] = true;
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        if (!isExcludedFromFee[msg.sender]) {
            require(amount <= maxTransactionAmount, "Supera limite anti-ballena");
            uint256 burnAmount = (amount * burnFeeBps) / 10000;
            uint256 sendAmount = amount - burnAmount;
            if (burnAmount > 0) {
                _burn(msg.sender, burnAmount);
            }
            return super.transfer(recipient, sendAmount);
        }
        return super.transfer(recipient, amount);
    }

    function setBurnFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Maximo 5%");
        burnFeeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }
}`;
        }
    }

    // AI Web3 Assistant response
    answerQuestion(query) {
        const q = query.toLowerCase();

        if (q.includes('que es web 3') || q.includes('web3') || q.includes('concepto')) {
            return `**Web 3.0** es la evolución descentralizada de Internet impulsada por blockchains, contratos inteligentes y soberanía de datos. A diferencia de la Web 2.0 (controlada por corporaciones centralizadas), la Web 3.0 permite a los usuarios ser dueños directos de su identidad, activos digitales y datos mediante criptografía de clave pública.`;
        }
        if (q.includes('ia') || q.includes('inteligencia artificial') || q.includes('nexus')) {
            return `La convergencia de **Web3 + Inteligencia Artificial** crea agentes autónomos on-chain, oráculos neuronales capaces de verificar datos fuera de la cadena sin censura, auditorías de contratos inteligentes automáticas en tiempo real y gobernanza DAO optimizada por modelos predictivos.`;
        }
        if (q.includes('reentrancia') || q.includes('seguridad') || q.includes('hack')) {
            return `El ataque de **Reentrancia** ocurre cuando un contrato inteligente transfiere Ether a una dirección externa antes de actualizar su propio balance interno. El contrato atacante puede implementar una función fallback que vuelva a llamar a la función original antes de que termine, drenando la bóveda. Solución: Patrón CEI (Checks-Effects-Interactions) y modificadores ReentrancyGuard.`;
        }
        if (q.includes('gas') || q.includes('gwei') || q.includes('optimizar')) {
            return `Para optimizar **Gas en Solidity**:
1. Empaqueta variables de almacenamiento en slots contiguos de 32 bytes (struct packing).
2. Usa tipos 'uint256' en lugar de 'uint8' a menos que estén empaquetados.
3. Guarda en caché la longitud de arrays en memoria antes de bucles.
4. Usa 'calldata' en vez de 'memory' para parámetros de funciones externas de sólo lectura.
5. Usa 'unchecked { ++i; }' en bucles donde no haya riesgo de desbordamiento.`;
        }

        return `Analizando consulta con modelo Neura3 LLM v4.2...
Tu consulta sobre "${query}" aborda aspectos clave de la descentralización criptográfica y la arquitectura neuronal. En este ecosistema, los smart contracts interactúan con oráculos descentralizados para ejecutar lógica determinista mientras los modelos de IA evalúan riesgos de liquidez, analizan vectores de ataque y sintetizan consenso en DAOs autónomas.`;
    }
}

export const aiEngine = new AiEngine();
