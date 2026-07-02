import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Шейдер для жидкого хрома
const LiquidChromeShader = {
    uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uMouse: { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;
        varying vec2 vUv;

        // Вспомогательные функции шума
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                               -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx) ;
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0) )
                + i.x + vec3(0.0, i1.x, 1.0) );
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 a0 = x - floor(x + 0.5);
            vec3 my3 = m * ( a0*x0.x + h*x0.y );
            vec3 my12 = m * ( a0*x12.xz + h*x12.yw );
            return 130.0 * (my3.x + my12.x + my12.y);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / uResolution.xy;
            vec2 p = -1.0 + 2.0 * uv;
            p.x *= uResolution.x / uResolution.y;

            // Интерактивность мыши
            float mDist = length(p - uMouse);
            float mInfluence = smoothstep(0.8, 0.0, mDist) * 0.15;

            // Несколько слоев шума для плавного течения
            float t = uTime * 0.25;
            
            float n1 = snoise(p * 1.2 + vec2(t * 0.5, t * 0.3) + uMouse * 0.1);
            float n2 = snoise(p * 2.5 - vec2(t * 0.4, -t * 0.6) + n1 * 0.2);
            
            // Итоговая деформация координат
            vec2 deformedP = p + vec2(n2 * 0.35 + mInfluence, n1 * 0.25 - mInfluence);
            
            // Хромированный расчет (высокий контраст и синусоидальные отражения)
            float chrome = sin(deformedP.x * 3.5 + sin(deformedP.y * 2.8 + t)) * 0.5 + 0.5;
            chrome += cos(deformedP.y * 4.2 - cos(deformedP.x * 3.0 - t)) * 0.5 + 0.5;
            chrome *= 0.5;
            chrome = pow(chrome, 1.8);
            
            // Базовый цвет металла (серебряный)
            vec3 silver = vec3(0.95, 0.96, 0.98);
            vec3 darkMetal = vec3(0.04, 0.04, 0.06);
            vec3 baseColor = mix(darkMetal, silver, chrome);
            
            // Добавляем фирменное неоновое свечение A1 (красный и синий)
            float redWave = sin(deformedP.x * 2.0 - t * 0.8) * 0.5 + 0.5;
            float blueWave = cos(deformedP.y * 2.0 + t * 0.6) * 0.5 + 0.5;
            
            vec3 neonRed = vec3(1.0, 0.12, 0.27) * redWave * 0.35;
            vec3 neonBlue = vec3(0.0, 0.94, 1.0) * blueWave * 0.4;
            
            // Эффект металлического блика по краям (Френель)
            float edge = 1.0 - abs(deformedP.x * deformedP.y) * 0.18;
            edge = clamp(edge, 0.0, 1.0);
            
            vec3 finalColor = baseColor * edge + neonRed + neonBlue;
            
            // Мягкое виньетирование
            float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
            vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
            finalColor *= vignette;

            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

function ShaderPlane() {
    const meshRef = useRef();
    const { size } = useThree();
    const uniforms = useRef({
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
        uMouse: { value: new THREE.Vector2(0, 0) }
    });

    useFrame((state) => {
        const { clock, mouse } = state;
        uniforms.current.uTime.value = clock.getElapsedTime();
        // Плавное следование за курсором
        uniforms.current.uMouse.value.x += (mouse.x - uniforms.current.uMouse.value.x) * 0.05;
        uniforms.current.uMouse.value.y += (mouse.y - uniforms.current.uMouse.value.y) * 0.05;
        uniforms.current.uResolution.value.set(size.width, size.height);
    });

    return (
        <mesh ref={meshRef}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={LiquidChromeShader.vertexShader}
                fragmentShader={LiquidChromeShader.fragmentShader}
                uniforms={uniforms.current}
                depthWrite={false}
                depthTest={false}
            />
        </mesh>
    );
}

export default function ChromeBackground() {
    return (
        <div className="canvas-bg-container">
            <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
                <ShaderPlane />
            </Canvas>
        </div>
    );
}
