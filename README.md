# NEURA3 // Autonomous Web3 & AI Nexus

Plataforma descentralizada de última generación que fusiona **Web 3.0**, **Contratos Inteligentes** y **Agentes de Inteligencia Artificial Autónomos**.

---

## 🚀 Características Principales (100% Funcionales)

1. **🛡️ Auditor & Generador de Smart Contracts con IA**:
   - Análisis heurístico y sintáctico en tiempo real para Solidity (0.8.20).
   - Detección de vulnerabilidades críticas: Reentrancy (CEI pattern), ataques de `tx.origin`, `selfdestruct`, optimización de gas en bucles de almacenamiento y validación de `address(0)`.
   - Generación de contratos inteligentes a partir de descripciones en lenguaje natural.

2. **🎨 Estudio Generativo NFT On-Chain**:
   - Generación procedural/neuronal directa en `<canvas>` basada en semillas algorítmicas.
   - Cálculo criptográfico de **Hash SHA-256** e identificador descentralizado **IPFS CID v1**.
   - Acuñación on-chain con deducción de saldo en $NEURA, efectos de confeti y galería de colección.

3. **🔮 Oráculo de Mercado en Tiempo Real & Sentimiento de IA**:
   - Conexión con datos en vivo (CoinGecko API + motor algorítmico) para BTC, ETH, SOL, POL y NEURA.
   - Medidor de Sentimiento Neuronal & Ballenas (Fear & Greed Index, flujo de Smart Money).
   - Estación de Gas EIP-1559 en tiempo real (Lento, Estándar, Rápido, Instantáneo).

4. **🏛️ Gobernanza Descentralizada (DAO)**:
   - Sistema de votación on-chain ponderado por saldo de tokens $NEURA.
   - Barras de progreso de quórum en vivo y creación de nuevas propuestas.

5. **⚡ Conexión de Billetera Híbrida Web3**:
   - Detección y conexión automática con **MetaMask** (EIP-1193).
   - Billetera HD Neural autónoma integrada (`ethers.Wallet.createRandom()`) para pruebas inmediatas sin extensiones.
   - Grifo (Faucet) de prueba (`+25 NEURA / +0.5 ETH`), selector de redes (Neura3 AI Chain, Ethereum, Sepolia, Arbitrum, Polygon) y exportación de llave privada.

6. **🤖 Agente Autónomo Conversacional Web3**:
   - Chat interactivo con respuestas sobre Solidity, optimización de gas, zk-SNARKs y arquitectura Web 3.0.

7. **🌌 Entorno Visual Cyberpunk 3D**:
   - Fondo interactivo con **Three.js** con constelación de partículas neuronales, sinapsis dinámicas y poliedros de blockchain flotantes con respuesta al cursor.
   - Efectos de sonido procedurales mediante la **Web Audio API** (conmutables desde el encabezado).

---

## 🛠️ Tecnologías Utilizadas

- **Vite 6** (Empaquetador y dev server ultrarrápido)
- **Ethers.js v6** (Interacción con blockchain y billeteras Web3)
- **Three.js** (Visualización espacial 3D interactiva)
- **Canvas-Confetti** (Animaciones de celebración en acuñación)
- **Web Audio API** (Sintetizador de sonido UI)
- **Vanilla CSS3** (Tokens de diseño, glassmorphism y microanimaciones)

---

## 💻 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor local de desarrollo
npm start
# o también:
npm run dev

# 3. Compilar para producción
npm run build
```
El servidor se iniciará en `http://localhost:5173/`.
