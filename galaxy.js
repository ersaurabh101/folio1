// Galaxy 3D Effect with Three.js
class Galaxy {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.stars = [];
        this.nebula = null;
        this.mouse = { x: 0, y: 0 };
        this.time = 0;
        
        this.init();
        this.createStars();
        this.createNebula();
        this.createSpiralArms();
        this.addEventListeners();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Create gradient background
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create radial gradient
        const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#2d1b69'); // Purple center
        gradient.addColorStop(0.3, '#1a1a2e'); // Dark purple
        gradient.addColorStop(0.7, '#16213e'); // Dark blue
        gradient.addColorStop(1, '#0f0f23'); // Very dark blue
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 8);
        
        // Renderer setup with better settings for mobile
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('galaxy-canvas'),
            antialias: window.innerWidth > 768, // Disable antialiasing on mobile for performance
            alpha: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Reduce fog distance for mobile visibility
        this.scene.fog = new THREE.Fog(0x1a1a3a, 20, 100);
        
        // Brighter ambient light
        const ambientLight = new THREE.AmbientLight(0x6a4c93, 0.6);
        this.scene.add(ambientLight);
        
        // Multiple bright point lights for galaxy glow
        const light1 = new THREE.PointLight(0xff6b9d, 2, 100); // Pink
        light1.position.set(0, 0, 0);
        this.scene.add(light1);
        
        const light2 = new THREE.PointLight(0x64ffda, 1.5, 80); // Cyan
        light2.position.set(20, 15, -15);
        this.scene.add(light2);
        
        const light3 = new THREE.PointLight(0x9b59b6, 1.2, 70); // Purple
        light3.position.set(-20, -15, 15);
        this.scene.add(light3);
        
        const light4 = new THREE.PointLight(0xf39c12, 1, 60); // Orange
        light4.position.set(15, -20, 10);
        this.scene.add(light4);
    }

    createStars() {
        // Optimize for mobile - fewer but more visible stars
        const isMobile = window.innerWidth <= 768;
        const starMultiplier = isMobile ? 0.6 : 1;
        
        // Create multiple colorful star systems with larger, brighter stars
        this.createStarField(Math.floor(2000 * starMultiplier), 40, 0xffffff, 3); // White distant stars
        this.createStarField(Math.floor(1500 * starMultiplier), 35, 0xff6b9d, 4); // Pink galaxy core stars
        this.createStarField(Math.floor(1200 * starMultiplier), 30, 0x64ffda, 4); // Cyan accent stars
        this.createStarField(Math.floor(1000 * starMultiplier), 25, 0x9b59b6, 3); // Purple stars
        this.createStarField(Math.floor(800 * starMultiplier), 20, 0xf39c12, 3);  // Orange stars
        this.createStarField(Math.floor(600 * starMultiplier), 15, 0xe74c3c, 2);  // Red stars
        this.createMovingStars(Math.floor(400 * starMultiplier), 12); // Animated colorful stars
        
        // Create a bright central galaxy core
        this.createGalaxyCore();
    }

    createStarField(count, range, color, sizeMultiplier = 1) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorObj = new THREE.Color(color);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Position stars in a galaxy-like distribution
            const radius = Math.random() * range;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI * 0.3; // Flatten the galaxy
            
            positions[i3] = radius * Math.cos(theta) * Math.cos(phi);
            positions[i3 + 1] = radius * Math.sin(phi) * 0.3; // Flatten Y axis
            positions[i3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

            // Color variation
            const variation = 0.3;
            colors[i3] = colorObj.r + (Math.random() - 0.5) * variation;
            colors[i3 + 1] = colorObj.g + (Math.random() - 0.5) * variation;
            colors[i3 + 2] = colorObj.b + (Math.random() - 0.5) * variation;

            // Size variation with multiplier for visibility
            sizes[i] = (Math.random() * 3 + 1) * sizeMultiplier;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Star material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Add slight movement
                    mvPosition.x += sin(time * 0.5 + position.x * 0.01) * 0.1;
                    mvPosition.y += cos(time * 0.3 + position.y * 0.01) * 0.1;
                    
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float strength = 0.1 / distanceToCenter - 0.05;
                    
                    // Add glow effect
                    float glow = 1.0 - distanceToCenter * 2.0;
                    glow = max(0.0, glow);
                    
                    gl_FragColor = vec4(vColor, strength + glow * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
        this.stars.push({ mesh: stars, material: material });
    }

    createGalaxyCore() {
        // Create a bright central core
        const coreGeometry = new THREE.SphereGeometry(2, 32, 32);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vPosition = position;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    float dist = length(vPosition);
                    float intensity = 1.0 - dist * 0.3;
                    
                    // Animated colors
                    vec3 color1 = vec3(1.0, 0.4, 0.7); // Pink
                    vec3 color2 = vec3(0.4, 1.0, 0.8); // Cyan
                    vec3 color3 = vec3(0.6, 0.3, 1.0); // Purple
                    
                    float t = sin(time * 0.5) * 0.5 + 0.5;
                    vec3 finalColor = mix(mix(color1, color2, t), color3, sin(time * 0.3) * 0.5 + 0.5);
                    
                    gl_FragColor = vec4(finalColor, intensity * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.scene.add(core);
        this.stars.push({ mesh: core, material: coreMaterial, core: true });
    }

    createMovingStars(count, range) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * range;
            positions[i3 + 1] = (Math.random() - 0.5) * range * 0.3;
            positions[i3 + 2] = (Math.random() - 0.5) * range;

            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

            // Bright rainbow colors for moving stars
            const colorChoice = Math.random();
            if (colorChoice < 0.2) {
                colors[i3] = 1.0; colors[i3 + 1] = 0.4; colors[i3 + 2] = 0.7; // Pink
            } else if (colorChoice < 0.4) {
                colors[i3] = 0.4; colors[i3 + 1] = 1.0; colors[i3 + 2] = 0.8; // Cyan
            } else if (colorChoice < 0.6) {
                colors[i3] = 0.6; colors[i3 + 1] = 0.3; colors[i3 + 2] = 1.0; // Purple
            } else if (colorChoice < 0.8) {
                colors[i3] = 1.0; colors[i3 + 1] = 0.6; colors[i3 + 2] = 0.2; // Orange
            } else {
                colors[i3] = 1.0; colors[i3 + 1] = 0.2; colors[i3 + 2] = 0.3; // Red
            }

            sizes[i] = Math.random() * 2 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                attribute vec3 velocity;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec3 pos = position + velocity * time;
                    
                    // Wrap around
                    pos.x = mod(pos.x + 25.0, 50.0) - 25.0;
                    pos.z = mod(pos.z + 25.0, 50.0) - 25.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float strength = 0.05 / distanceToCenter - 0.1;
                    
                    gl_FragColor = vec4(vColor, strength * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        const movingStars = new THREE.Points(geometry, material);
        this.scene.add(movingStars);
        this.stars.push({ mesh: movingStars, material: material, moving: true });
    }

    createNebula() {
        // Create nebula clouds
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaCount = 1000;
        const positions = new Float32Array(nebulaCount * 3);
        const colors = new Float32Array(nebulaCount * 3);
        const sizes = new Float32Array(nebulaCount);

        for (let i = 0; i < nebulaCount; i++) {
            const i3 = i * 3;
            
            // Create nebula in spiral pattern
            const angle = i * 0.01;
            const radius = Math.random() * 30;
            
            positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 10;
            positions[i3 + 1] = (Math.random() - 0.5) * 5;
            positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 10;

            // Vibrant nebula colors (rainbow spectrum)
            const colorChoice = Math.random();
            if (colorChoice < 0.16) {
                colors[i3] = 1.0; colors[i3 + 1] = 0.2; colors[i3 + 2] = 0.8; // Hot Pink
            } else if (colorChoice < 0.32) {
                colors[i3] = 0.6; colors[i3 + 1] = 0.2; colors[i3 + 2] = 1.0; // Purple
            } else if (colorChoice < 0.48) {
                colors[i3] = 0.2; colors[i3 + 1] = 0.6; colors[i3 + 2] = 1.0; // Blue
            } else if (colorChoice < 0.64) {
                colors[i3] = 0.2; colors[i3 + 1] = 1.0; colors[i3 + 2] = 0.8; // Cyan
            } else if (colorChoice < 0.80) {
                colors[i3] = 1.0; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.2; // Gold
            } else {
                colors[i3] = 1.0; colors[i3 + 1] = 0.4; colors[i3 + 2] = 0.2; // Orange
            }

            sizes[i] = Math.random() * 5 + 2;
        }

        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Slow drift
                    mvPosition.x += sin(time * 0.2 + position.x * 0.005) * 0.5;
                    mvPosition.z += cos(time * 0.15 + position.z * 0.005) * 0.5;
                    
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float strength = 0.2 / distanceToCenter - 0.2;
                    
                    gl_FragColor = vec4(vColor, strength * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        this.nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        this.scene.add(this.nebula);
    }

    createSpiralArms() {
        // Create spiral galaxy arms
        const armCount = 4;
        
        for (let arm = 0; arm < armCount; arm++) {
            const geometry = new THREE.BufferGeometry();
            const starCount = 800;
            const positions = new Float32Array(starCount * 3);
            const colors = new Float32Array(starCount * 3);
            const sizes = new Float32Array(starCount);

            const armOffset = (arm / armCount) * Math.PI * 2;

            for (let i = 0; i < starCount; i++) {
                const i3 = i * 3;
                const t = i / starCount;
                const radius = t * 40;
                const angle = armOffset + t * Math.PI * 4 + Math.sin(t * Math.PI * 8) * 0.3;

                positions[i3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 3;
                positions[i3 + 1] = (Math.random() - 0.5) * 2;
                positions[i3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 3;

                // Gradient from center to edge
                const intensity = 1 - t * 0.7;
                colors[i3] = intensity * (0.4 + Math.random() * 0.3);
                colors[i3 + 1] = intensity * (0.8 + Math.random() * 0.2);
                colors[i3 + 2] = intensity;

                sizes[i] = (1 - t) * 2 + 0.5;
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 }
                },
                vertexShader: `
                    attribute float size;
                    attribute vec3 color;
                    varying vec3 vColor;
                    uniform float time;
                    
                    void main() {
                        vColor = color;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        
                        // Rotation
                        float angle = time * 0.1;
                        float cosAngle = cos(angle);
                        float sinAngle = sin(angle);
                        
                        float x = mvPosition.x * cosAngle - mvPosition.z * sinAngle;
                        float z = mvPosition.x * sinAngle + mvPosition.z * cosAngle;
                        mvPosition.x = x;
                        mvPosition.z = z;
                        
                        gl_PointSize = size * (300.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    varying vec3 vColor;
                    
                    void main() {
                        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                        float strength = 0.05 / distanceToCenter - 0.1;
                        
                        gl_FragColor = vec4(vColor, strength);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                vertexColors: true
            });

            const spiralArm = new THREE.Points(geometry, material);
            this.scene.add(spiralArm);
            this.stars.push({ mesh: spiralArm, material: material, spiral: true });
        }
    }

    addEventListeners() {
        // Mouse movement
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

        // Gentle scroll effect for galaxy
        window.addEventListener('scroll', () => {
            const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
            // Much more subtle camera movement
            this.camera.position.z = 5 + scrollPercent * 2;
            this.camera.rotation.x = scrollPercent * 0.1;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01;

        // Update camera based on mouse
        this.camera.position.x += (this.mouse.x * 2 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouse.y * 2 - this.camera.position.y) * 0.02;
        this.camera.lookAt(0, 0, 0);

        // Update all star systems
        this.stars.forEach(starSystem => {
            if (starSystem.material.uniforms && starSystem.material.uniforms.time) {
                starSystem.material.uniforms.time.value = this.time;
            }
            
            if (starSystem.spiral) {
                starSystem.mesh.rotation.y = this.time * 0.1;
            }
        });

        // Update nebula
        if (this.nebula && this.nebula.material.uniforms) {
            this.nebula.material.uniforms.time.value = this.time;
            this.nebula.rotation.y = this.time * 0.05;
        }

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

    // Initialize galaxy or fallback
    if (checkWebGLSupport()) {
        try {
            new Galaxy();
        } catch (error) {
            console.warn('Galaxy initialization failed, using fallback:', error);
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