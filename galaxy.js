// Space Travel with Moving Galaxies
class SpaceTravel {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.galaxies = [];
        this.stars = [];
        this.mouse = { x: 0, y: 0 };
        this.time = 0;
        
        this.init();
        this.createSpaceBackground();
        this.createMovingGalaxies();
        this.createDistantStars();
        this.addEventListeners();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020208); // Very dark space
        
        // Camera setup for space travel
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 0, 0); // We are at the center
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('galaxy-canvas'),
            antialias: window.innerWidth > 768,
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Minimal fog for deep space
        this.scene.fog = new THREE.Fog(0x020208, 100, 1500);
        
        // Dim ambient light for space
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        this.scene.add(ambientLight);
    }

    createSpaceBackground() {
        // Create starfield background
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 3000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            // Distribute stars in a large sphere around us
            const radius = 500 + Math.random() * 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            transparent: true,
            opacity: 0.8
        });
        
        const starField = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(starField);
        this.stars.push(starField);
    }

    createMovingGalaxies() {
        // Create 8-12 small galaxies that move through space
        const galaxyCount = 10;
        
        for (let i = 0; i < galaxyCount; i++) {
            this.createSingleGalaxy(i);
        }
    }

    createSingleGalaxy(index) {
        const galaxyGroup = new THREE.Group();
        
        // Random position in a large sphere around camera
        const distance = 200 + Math.random() * 800;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        galaxyGroup.position.x = distance * Math.sin(phi) * Math.cos(theta);
        galaxyGroup.position.y = distance * Math.sin(phi) * Math.sin(theta);
        galaxyGroup.position.z = distance * Math.cos(phi);
        
        // Galaxy size (small and distant)
        const size = 0.5 + Math.random() * 1.5;
        galaxyGroup.scale.setScalar(size);
        
        // Galaxy colors (dark, muted colors)
        const colors = [
            0x8B4513, // Dark brown
            0xFF4500, // Dark orange  
            0x800080, // Purple
            0x2F4F4F, // Dark slate gray
            0x556B2F, // Dark olive
            0x8B0000, // Dark red
            0x191970, // Midnight blue
            0x483D8B  // Dark slate blue
        ];
        
        const galaxyColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Create spiral arms
        this.createGalaxySpiral(galaxyGroup, galaxyColor, size);
        
        // Create galaxy core
        this.createGalaxyCenter(galaxyGroup, galaxyColor, size);
        
        // Movement properties
        galaxyGroup.userData = {
            originalPosition: galaxyGroup.position.clone(),
            moveSpeed: 0.5 + Math.random() * 1.5,
            rotationSpeed: 0.001 + Math.random() * 0.003,
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize(),
            index: index
        };
        
        this.scene.add(galaxyGroup);
        this.galaxies.push(galaxyGroup);
    }

    createGalaxySpiral(group, color, size) {
        const spiralGeometry = new THREE.BufferGeometry();
        const particleCount = 200 + Math.floor(Math.random() * 300);
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        const colorObj = new THREE.Color(color);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const t = i / particleCount;
            const radius = t * 15; // Small spiral
            const angle = t * Math.PI * 4; // 2 spiral arms
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = (Math.random() - 0.5) * 2; // Flatten
            positions[i3 + 2] = Math.sin(angle) * radius;
            
            // Darken colors for distant look
            colors[i3] = colorObj.r * (0.3 + Math.random() * 0.4);
            colors[i3 + 1] = colorObj.g * (0.3 + Math.random() * 0.4);
            colors[i3 + 2] = colorObj.b * (0.3 + Math.random() * 0.4);
        }
        
        spiralGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        spiralGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const spiralMaterial = new THREE.PointsMaterial({
            size: 0.5 * size,
            transparent: true,
            opacity: 0.6,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        const spiral = new THREE.Points(spiralGeometry, spiralMaterial);
        group.add(spiral);
    }

    createGalaxyCenter(group, color, size) {
        const coreGeometry = new THREE.SphereGeometry(1 * size, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);
    }

    createDistantStars() {
        // Create some individual bright distant stars
        for (let i = 0; i < 50; i++) {
            const starGeometry = new THREE.SphereGeometry(0.5, 6, 6);
            const starMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.7 ? 0xffffff : 0xffffaa,
                transparent: true,
                opacity: 0.8
            });
            
            const star = new THREE.Mesh(starGeometry, starMaterial);
            
            // Position far away
            const distance = 300 + Math.random() * 1200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            star.position.x = distance * Math.sin(phi) * Math.cos(theta);
            star.position.y = distance * Math.sin(phi) * Math.sin(theta);
            star.position.z = distance * Math.cos(phi);
            
            this.scene.add(star);
            this.stars.push(star);
        }
    }







    addEventListeners() {
        // Mouse movement for camera rotation
        document.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Scroll for space travel effect
        window.addEventListener('scroll', () => {
            const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
            // Rotate camera to look around as we scroll
            this.camera.rotation.x = scrollPercent * 0.2;
            this.camera.rotation.y = scrollPercent * 0.1;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01;

        // Subtle mouse-based camera rotation
        const targetRotationX = this.mouse.y * 0.2;
        const targetRotationY = this.mouse.x * 0.2;
        
        this.camera.rotation.x += (targetRotationX - this.camera.rotation.x) * 0.05;
        this.camera.rotation.y += (targetRotationY - this.camera.rotation.y) * 0.05;

        // Animate galaxies - make them move and rotate
        this.galaxies.forEach((galaxy, index) => {
            const userData = galaxy.userData;
            
            // Move galaxies through space
            galaxy.position.add(userData.direction.clone().multiplyScalar(userData.moveSpeed));
            
            // Rotate galaxies
            galaxy.rotation.y += userData.rotationSpeed;
            galaxy.rotation.z += userData.rotationSpeed * 0.5;
            
            // Reset position if galaxy moves too far
            const distanceFromCenter = galaxy.position.length();
            if (distanceFromCenter > 1200) {
                // Reset to opposite side
                galaxy.position.copy(userData.direction.clone().multiplyScalar(-600));
                // Add some randomness
                galaxy.position.x += (Math.random() - 0.5) * 200;
                galaxy.position.y += (Math.random() - 0.5) * 200;
                galaxy.position.z += (Math.random() - 0.5) * 200;
            }
        });

        // Slowly rotate the starfield
        this.stars.forEach(star => {
            if (star.rotation) {
                star.rotation.y += 0.0005;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize galaxy when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check WebGL support
    function checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }

    // Hide loading screen after a delay
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }, 2000);

    // Initialize space travel or fallback
    if (checkWebGLSupport()) {
        try {
            new SpaceTravel();
        } catch (error) {
            console.warn('Space travel initialization failed, using fallback:', error);
            createFallbackBackground();
        }
    } else {
        console.warn('WebGL not supported, using fallback background');
        createFallbackBackground();
    }
});

// Fallback animated background for devices that can't handle Three.js
function createFallbackBackground() {
    const canvas = document.getElementById('galaxy-canvas');
    canvas.style.display = 'none';
    
    // Create CSS-based animated background
    const fallbackBg = document.createElement('div');
    fallbackBg.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        background: 
            radial-gradient(circle at 20% 30%, rgba(255, 107, 157, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(100, 255, 218, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(155, 89, 182, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #2d1b69 100%);
        animation: galaxyPulse 8s ease-in-out infinite;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes galaxyPulse {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.insertBefore(fallbackBg, document.body.firstChild);
}