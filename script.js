
const bg = document.getElementById('dynamic-bg');

document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth * 100;
    const y = e.clientY / window.innerHeight * 100;
    
    bg.style.background = `radial-gradient(circle at ${x}% ${y}%, #2a0845 0%, #050505 60%)`;
});
