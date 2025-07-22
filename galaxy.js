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
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('galaxy-canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Enable fog for depth
        this.scene.fog = new THREE.Fog(0x000000, 1, 100);
    }

    createStars() {
        // Create multiple star systems
        this.createStarField(5000, 50, 0xffffff); // Distant stars
        this.createStarField(2000, 30, 0x64ffda); // Galaxy core stars
        this.createStarField(1000, 20, 0x00bcd4); // Accent stars
        this.createMovingStars(500, 15); // Animated stars
    }

    createStarField(count, range, color) {
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

            // Size variation
            sizes[i] = Math.random() * 3 + 1;
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
                    float strength = 0.05 / distanceToCenter - 0.1;
                    
                    gl_FragColor = vec4(vColor, strength);
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

            // Bright colors for moving stars
            colors[i3] = 0.8 + Math.random() * 0.2;     // R
            colors[i3 + 1] = 0.9 + Math.random() * 0.1; // G
            colors[i3 + 2] = 1.0;                       // B

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

            // Nebula colors (purple/blue/cyan)
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                colors[i3] = 0.4;     // Purple
                colors[i3 + 1] = 0.0;
                colors[i3 + 2] = 0.8;
            } else if (colorChoice < 0.66) {
                colors[i3] = 0.0;     // Blue
                colors[i3 + 1] = 0.4;
                colors[i3 + 2] = 1.0;
            } else {
                colors[i3] = 0.0;     // Cyan
                colors[i3 + 1] = 0.8;
                colors[i3 + 2] = 1.0;
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
                    float strength = 0.15 / distanceToCenter - 0.3;
                    
                    gl_FragColor = vec4(vColor, strength * 0.3);
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

        // Scroll effect
        window.addEventListener('scroll', () => {
            const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
            this.camera.position.z = 5 + scrollPercent * 10;
            this.camera.rotation.x = scrollPercent * 0.5;
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
    // Hide loading screen after a delay
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 1000);
    }, 2000);

    // Initialize galaxy
    new Galaxy();
});