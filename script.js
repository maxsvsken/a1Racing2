// ============================================================
// Smooth Scrolling (Lenis) + GSAP Sync
// ============================================================
let lenis;
function initSmoothScroll() {
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.5,
            smoothTouch: false,
        });
        window.lenis = lenis;

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });

        gsap.ticker.lagSmoothing(0);
    }
}

// ============================================================
// Burger Menu Logic
// ============================================================
function initBurgerMenu() {
    const burger = document.getElementById('burger');
    const navLinks = document.querySelector('.nav-links');
    const navBtns = document.querySelectorAll('.nav-btn');

    if (burger && navLinks) {
        burger.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('nav-active');
            burger.classList.toggle('open');
            // Анимация бургер-линий
            const spans = burger.querySelectorAll('span');
            if (navLinks.classList.contains('nav-active')) {
                spans[0].style.transform = 'translateY(8px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
                document.body.style.overflow = 'hidden';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.body.style.overflow = '';
            }
        });

        // Закрытие при клике на ссылки
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                navLinks.classList.remove('nav-active');
                const spans = burger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.body.style.overflow = '';
            });
        });

        // Закрытие при клике снаружи
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('nav-active') && !navLinks.contains(e.target) && !burger.contains(e.target)) {
                navLinks.classList.remove('nav-active');
                const spans = burger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

// ============================================================
// Three.js Liquid Chrome Sphere
// ============================================================
function initThreeSphere() {
    const container = document.querySelector('.hero-3d-wrapper');
    const canvas = document.getElementById('canvas-3d');
    if (!container || !canvas) return;

    // Сцена, камера, рендерер
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Шейдеры для жидкого хрома
    const vertexShader = `
        uniform float uTime;
        uniform float uNoiseFreq;
        uniform float uNoiseAmp;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vPosition;

        // Плавный волновой шум на тригонометрических функциях
        float getNoise(vec3 p) {
            float t = uTime * 0.9;
            float n = sin(p.x * uNoiseFreq + t) * cos(p.y * uNoiseFreq + t) * sin(p.z * uNoiseFreq + t);
            n += 0.5 * sin(p.y * uNoiseFreq * 2.2 - t * 1.3) * cos(p.z * uNoiseFreq * 1.7 + t);
            return n;
        }

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            float noise = getNoise(position);
            vec3 newPosition = position + normal * noise * uNoiseAmp;
            
            vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform vec3 uColorRed;
        uniform vec3 uColorBlue;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vPosition;

        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            
            // Вектор отражения взгляда от нормали поверхности
            vec3 reflectDir = reflect(-viewDir, normal);
            
            // Расчет фейкового хромированного окружения
            float chromeVal = sin(reflectDir.z * 6.0 + sin(reflectDir.x * 3.0) * 1.5 + uTime * 0.4) * 0.5 + 0.5;
            chromeVal = pow(chromeVal, 2.2);
            
            // Металлический серебряный цвет
            vec3 silver = vec3(0.92, 0.94, 0.96);
            vec3 darkMetal = vec3(0.08, 0.09, 0.12);
            vec3 baseColor = mix(darkMetal, silver, chromeVal);
            
            // Световые блики (красный и синий неон)
            float redGlow = max(0.0, dot(reflectDir, vec3(1.0, -1.0, 0.5))) * 0.5 + 0.5;
            redGlow = pow(redGlow, 10.0);
            
            float blueGlow = max(0.0, dot(reflectDir, vec3(-1.0, 1.0, -0.5))) * 0.5 + 0.5;
            blueGlow = pow(blueGlow, 10.0);
            
            // Итоговое смешивание хрома с неоном
            vec3 finalColor = baseColor + uColorRed * redGlow * 1.8 + uColorBlue * blueGlow * 1.8;
            
            // Эффект Френеля для краев сферы
            float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
            finalColor += vec3(0.8, 0.95, 1.0) * fresnel * 0.5;
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `;

    // Создаем геометрию
    const geometry = new THREE.IcosahedronGeometry(2.1, 64);
    
    // Материал
    const material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
            uTime: { value: 0 },
            uNoiseFreq: { value: 1.3 },
            uNoiseAmp: { value: 0.18 },
            uColorRed: { value: new THREE.Color('#ff1f44') },
            uColorBlue: { value: new THREE.Color('#00f0ff') }
        },
        transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Добавим мягкий свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Обработка мыши для интерактивности
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        const elapsedTime = clock.getElapsedTime();
        material.uniforms.uTime.value = elapsedTime;
        
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;
        
        mesh.rotation.y = elapsedTime * 0.15 + targetX * 0.5;
        mesh.rotation.x = elapsedTime * 0.1 + targetY * 0.5;
        
        material.uniforms.uNoiseAmp.value = 0.18 + Math.sin(elapsedTime * 0.5) * 0.04;
        
        renderer.render(scene, camera);
    }
    
    animate();

    // Ресайз
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// ============================================================
// Interactive Performance Chart (HTML5 Canvas)
// ============================================================
function initPerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    const container = canvas ? canvas.parentElement : null;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawChart();
    }

    // Русские месяцы
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const dataA1 = [10000, 11500, 13200, 12800, 14900, 17200, 19500, 21800, 24500, 23800, 28900, 34830];
    const dataSP = [10000, 10400, 10900, 10700, 11200, 11900, 12500, 13100, 14200, 13900, 15500, 18410];

    let pointsA1 = [];
    let pointsSP = [];
    let animationProgress = 0;
    
    let mouseX = -1;
    let mouseY = -1;
    let isHovering = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                gsap.to({ val: 0 }, {
                    val: 1,
                    duration: 2.0,
                    ease: "power3.out",
                    onUpdate: function() {
                        animationProgress = this.targets()[0].val;
                        drawChart();
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(canvas);

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        isHovering = true;
        drawChart();
    });

    canvas.addEventListener('mouseleave', () => {
        isHovering = false;
        drawChart();
    });

    function drawChart() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const paddingLeft = 65;
        const paddingRight = 40;
        const paddingTop = 40;
        const paddingBottom = 40;

        const w = canvas.width - paddingLeft - paddingRight;
        const h = canvas.height - paddingTop - paddingBottom;

        // Рисуем сетку
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        
        const gridLines = 5;
        for (let i = 0; i <= gridLines; i++) {
            const y = paddingTop + (h / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(canvas.width - paddingRight, y);
            ctx.stroke();

            const val = Math.round(35000 - (35000 - 5000) / gridLines * i);
            ctx.fillStyle = '#64748b';
            ctx.font = '10px Geist, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('$' + val.toLocaleString(), paddingLeft - 15, y + 4);
        }

        pointsA1 = [];
        pointsSP = [];

        const stepX = w / (months.length - 1);
        months.forEach((month, idx) => {
            const x = paddingLeft + stepX * idx;
            
            ctx.fillStyle = '#64748b';
            ctx.font = '11px Space Grotesk, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(month, x, canvas.height - 15);

            const yA1 = paddingTop + h - (h * ((dataA1[idx] - 5000) / 30000));
            const ySP = paddingTop + h - (h * ((dataSP[idx] - 5000) / 30000));

            pointsA1.push({ x, y: yA1 });
            pointsSP.push({ x, y: ySP });
        });

        function drawCurve(points, strokeStyle, shadowColor, progress) {
            if (points.length === 0) return;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);

            const count = Math.ceil(points.length * progress);
            for (let i = 0; i < count - 1; i++) {
                const p0 = points[i];
                const p1 = points[i + 1];
                const xc = (p0.x + p1.x) / 2;
                const yc = (p0.y + p1.y) / 2;
                ctx.quadraticCurveTo(p0.x, p0.y, xc, yc);
            }
            
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = 3;
            ctx.shadowBlur = shadowColor ? 15 : 0;
            ctx.shadowColor = shadowColor || 'transparent';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        drawCurve(pointsSP, 'rgba(255, 255, 255, 0.25)', null, animationProgress);
        drawCurve(pointsA1, '#00f0ff', 'rgba(0, 240, 255, 0.4)', animationProgress);

        if (isHovering && animationProgress > 0.9) {
            let closestIdx = 0;
            let minDist = Infinity;
            
            pointsA1.forEach((pt, idx) => {
                const dist = Math.abs(mouseX - pt.x);
                if (dist < minDist) {
                    minDist = dist;
                    closestIdx = idx;
                }
            });

            const activePtA1 = pointsA1[closestIdx];
            const activePtSP = pointsSP[closestIdx];

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(activePtA1.x, paddingTop);
            ctx.lineTo(activePtA1.x, canvas.height - paddingBottom);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(activePtSP.x, activePtSP.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f0ff';
            ctx.beginPath();
            ctx.arc(activePtA1.x, activePtA1.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            const tooltipW = 180;
            const tooltipH = 75;
            let tooltipX = activePtA1.x + 20;
            let tooltipY = activePtA1.y - tooltipH / 2;

            if (tooltipX + tooltipW > canvas.width) {
                tooltipX = activePtA1.x - tooltipW - 20;
            }
            if (tooltipY < paddingTop) {
                tooltipY = paddingTop;
            }
            if (tooltipY + tooltipH > canvas.height - paddingBottom) {
                tooltipY = canvas.height - paddingBottom - tooltipH;
            }

            ctx.fillStyle = 'rgba(10, 11, 16, 0.9)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(tooltipX, tooltipY, tooltipW, tooltipH, 12);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 12px Space Grotesk, sans-serif';
            ctx.fillText(months[closestIdx] + ' 2026', tooltipX + 16, tooltipY + 22);

            ctx.fillStyle = '#00f0ff';
            ctx.font = '11px Geist, sans-serif';
            ctx.fillText('Портфель А1: $' + dataA1[closestIdx].toLocaleString(), tooltipX + 16, tooltipY + 42);

            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Индекс S&P 500: $' + dataSP[closestIdx].toLocaleString(), tooltipX + 16, tooltipY + 58);
        }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// ============================================================
// GSAP Reveal Animations
// ============================================================
function initRevealAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Анимация Hero секции
    const heroTl = gsap.timeline();
    heroTl.from('.hero-title', {
        y: 40,
        opacity: 0,
        filter: 'blur(10px)',
        duration: 1.2,
        ease: 'power4.out',
    })
    .from('.hero-subtitle', {
        y: 20,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out'
    }, '-=0.8')
    .from('.hero-btns', {
        y: 20,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out'
    }, '-=0.8')
    .from('.hero-3d-wrapper', {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out'
    }, '-=1.2');

    // Плавное появление секций
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => {
        if (sec.id === 'hero') return;

        const title = sec.querySelector('.section-title');
        const desc = sec.querySelector('.section-desc');
        const elements = sec.querySelectorAll('.glass-panel, .solutions-grid > div, .why-grid > div, .testimonials-grid > div');

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: sec,
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        });

        if (title) {
            tl.from(title, {
                y: 30,
                opacity: 0,
                filter: 'blur(5px)',
                duration: 0.8,
                ease: 'power3.out'
            });
        }

        if (desc) {
            tl.from(desc, {
                y: 20,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.6');
        }

        if (elements.length > 0) {
            tl.from(elements, {
                y: 40,
                opacity: 0,
                stagger: 0.15,
                duration: 1.0,
                ease: 'power3.out'
            }, '-=0.5');
        }
    });

    // Синхронизация точек dot-navigation с прокруткой
    const dotLinks = document.querySelectorAll('.dot-nav a');
    const sectionsForDots = document.querySelectorAll('section, footer');

    sectionsForDots.forEach((sec, idx) => {
        ScrollTrigger.create({
            trigger: sec,
            start: 'top 50%',
            end: 'bottom 50%',
            onEnter: () => updateDotNav(idx),
            onEnterBack: () => updateDotNav(idx)
        });
    });

    function updateDotNav(activeIdx) {
        dotLinks.forEach((link, idx) => {
            if (idx === activeIdx) link.classList.add('active');
            else link.classList.remove('active');
        });
    }

    // Плавный скролл при клике на точки и ссылки меню
    const allLinks = document.querySelectorAll('.dot-nav a, .nav-links a, .hero-btns a, .cta-content a');
    allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSec = document.querySelector(targetId);
                if (targetSec) {
                    if (lenis) {
                        lenis.scrollTo(targetSec, { offset: -80, duration: 1.2 });
                    } else {
                        window.scrollTo({
                            top: targetSec.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    });
}

// ============================================================
// Contact Form & Modal Window Logic
// ============================================================
function initContactFormAndModals() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }

    const modal = document.getElementById('policyModal');
    const policyLink = document.getElementById('policyLink');
    const closeBtn = document.querySelector('.close-modal');

    if (modal && policyLink && closeBtn) {
        policyLink.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const btn = this.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'ОТПРАВЛЕНО';
            btn.style.background = '#28a745';
            btn.style.color = '#fff';
            btn.disabled = true;
            alert('Спасибо! Ваш запрос успешно отправлен.');
            this.reset();
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 3000);
        });
    }
}

// ============================================================
// Initialization on DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initBurgerMenu();
    initThreeSphere();
    initPerformanceChart();
    initRevealAnimations();
    initContactFormAndModals();
});
