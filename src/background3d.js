import * as THREE from 'three';

export function init3DBackground(containerId = 'dynamic-bg') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous elements inside container
    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060713, 0.002);

    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Ambient & Point Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(0x00f3ff, 3, 400);
    light1.position.set(100, 100, 100);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xbc13fe, 3, 400);
    light2.position.set(-100, -100, 50);
    scene.add(light2);

    // Neural Particles Group
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    const cyan = new THREE.Color(0x00f3ff);
    const purple = new THREE.Color(0xbc13fe);
    const lime = new THREE.Color(0x00ff88);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 350;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

        velocities.push({
            x: (Math.random() - 0.5) * 0.35,
            y: (Math.random() - 0.5) * 0.35,
            z: (Math.random() - 0.5) * 0.35
        });

        // Dynamic gradient colors
        const mixed = Math.random() > 0.5 ? cyan : (Math.random() > 0.5 ? purple : lime);
        colors[i * 3] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Circle texture for particles
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(0,243,255,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
        size: 5,
        map: texture,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Synaptic Neural Connections
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    let linesMesh;

    // Floating Web3 Blockchain Nodes (Crystalline Polyhedra)
    const blocksGroup = new THREE.Group();
    const geometries = [
        new THREE.IcosahedronGeometry(12, 0),
        new THREE.OctahedronGeometry(10, 0),
        new THREE.BoxGeometry(14, 14, 14),
        new THREE.TetrahedronGeometry(11, 0)
    ];

    const blockMeshes = [];
    for (let i = 0; i < 8; i++) {
        const geom = geometries[i % geometries.length];
        const mat = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0x00f3ff : 0xbc13fe,
            wireframe: true,
            emissive: i % 2 === 0 ? 0x005577 : 0x440066,
            roughness: 0.2,
            metalness: 0.9
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 180,
            (Math.random() - 0.5) * 100 - 40
        );
        mesh.userData = {
            rotSpeedX: (Math.random() - 0.5) * 0.02,
            rotSpeedY: (Math.random() - 0.5) * 0.02,
            floatSpeed: 0.001 + Math.random() * 0.002,
            offset: Math.random() * Math.PI * 2
        };
        blocksGroup.add(mesh);
        blockMeshes.push(mesh);
    }
    scene.add(blocksGroup);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    window.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX) * 0.1;
        mouseY = (event.clientY - windowHalfY) * 0.1;
    });

    // Resize listener
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const elapsedTime = clock.getElapsedTime();
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        camera.position.x = targetX * 0.3;
        camera.position.y = -targetY * 0.3;
        camera.lookAt(scene.position);

        // Update neural particles
        const posAttr = particles.geometry.attributes.position;
        const linePositions = [];

        for (let i = 0; i < particleCount; i++) {
            let px = posAttr.getX(i) + velocities[i].x;
            let py = posAttr.getY(i) + velocities[i].y;
            let pz = posAttr.getZ(i) + velocities[i].z;

            // Boundaries bounce
            if (px < -180 || px > 180) velocities[i].x *= -1;
            if (py < -140 || py > 140) velocities[i].y *= -1;
            if (pz < -120 || pz > 120) velocities[i].z *= -1;

            posAttr.setXYZ(i, px, py, pz);

            // Connect nearby particles
            for (let j = i + 1; j < particleCount; j++) {
                const dx = px - posAttr.getX(j);
                const dy = py - posAttr.getY(j);
                const dz = pz - posAttr.getZ(j);
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 42) {
                    linePositions.push(px, py, pz);
                    linePositions.push(posAttr.getX(j), posAttr.getY(j), posAttr.getZ(j));
                }
            }
        }
        posAttr.needsUpdate = true;

        // Update synaptic lines
        if (linesMesh) scene.remove(linesMesh);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(linePositions, 3)
        );
        linesMesh = new THREE.LineSegments(lineGeometry, linesMaterial);
        scene.add(linesMesh);

        // Update floating blockchain blocks
        blockMeshes.forEach(mesh => {
            mesh.rotation.x += mesh.userData.rotSpeedX;
            mesh.rotation.y += mesh.userData.rotSpeedY;
            mesh.position.y += Math.sin(elapsedTime * 2 + mesh.userData.offset) * 0.15;
        });

        renderer.render(scene, camera);
    }

    animate();
}
