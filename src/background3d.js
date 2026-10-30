import * as THREE from 'three';

export function initModernBackground(containerId = 'dynamic-bg') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0c16, 0.0018);

    const camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 180;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Subtle Ambient Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const lightIndigo = new THREE.PointLight(0x6366f1, 3, 350);
    lightIndigo.position.set(120, 80, 60);
    scene.add(lightIndigo);

    const lightCyan = new THREE.PointLight(0x06b6d4, 2.5, 350);
    lightCyan.position.set(-120, -60, 40);
    scene.add(lightCyan);

    const lightViolet = new THREE.PointLight(0xa855f7, 2, 300);
    lightViolet.position.set(0, 100, -40);
    scene.add(lightViolet);

    // Glowing Floating Soft Spheres (Glassmorphism orbs)
    const orbsGroup = new THREE.Group();
    const orbGeometry = new THREE.SphereGeometry(18, 32, 32);
    const orbColors = [0x6366f1, 0x06b6d4, 0x8b5cf6, 0x3b82f6];

    const orbs = [];
    for (let i = 0; i < 7; i++) {
        const material = new THREE.MeshPhysicalMaterial({
            color: orbColors[i % orbColors.length],
            emissive: orbColors[i % orbColors.length],
            emissiveIntensity: 0.25,
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.28,
            wireframe: false
        });

        const mesh = new THREE.Mesh(orbGeometry, material);
        mesh.scale.setScalar(0.6 + Math.random() * 0.8);
        mesh.position.set(
            (Math.random() - 0.5) * 260,
            (Math.random() - 0.5) * 160,
            (Math.random() - 0.5) * 90 - 30
        );

        mesh.userData = {
            speedX: (Math.random() - 0.5) * 0.08,
            speedY: (Math.random() - 0.5) * 0.08,
            phase: Math.random() * Math.PI * 2
        };

        orbsGroup.add(mesh);
        orbs.push(mesh);
    }
    scene.add(orbsGroup);

    // Soft Bokeh Particle Constellation
    const particleCount = 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const col1 = new THREE.Color(0x6366f1);
    const col2 = new THREE.Color(0x06b6d4);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 320;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 220;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 150;

        const mixed = col1.clone().lerp(col2, Math.random());
        colors[i * 3] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle sprite
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    pGrad.addColorStop(0, 'rgba(255,255,255,1)');
    pGrad.addColorStop(0.4, 'rgba(99,102,241,0.6)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    pCtx.fillStyle = pGrad;
    pCtx.beginPath();
    pCtx.arc(16, 16, 16, 0, Math.PI * 2);
    pCtx.fill();

    const pTexture = new THREE.CanvasTexture(pCanvas);
    const pMaterial = new THREE.PointsMaterial({
        size: 4,
        map: pTexture,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, pMaterial);
    scene.add(particles);

    // Mouse movement parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        camera.position.x = targetX;
        camera.position.y = -targetY;
        camera.lookAt(scene.position);

        // Animate floating orbs
        orbs.forEach((orb, i) => {
            orb.position.y += Math.sin(elapsedTime * 0.8 + orb.userData.phase) * 0.12;
            orb.position.x += Math.cos(elapsedTime * 0.5 + orb.userData.phase) * 0.08;
            orb.rotation.y += 0.003;
        });

        // Rotate particles slowly
        particles.rotation.y = elapsedTime * 0.02;

        renderer.render(scene, camera);
    }

    animate();
}
