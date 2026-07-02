import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Шейдер для ColorBends
const ColorBendsShader = {
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
    uniform float uRotation;
    uniform float uSpeed;
    uniform float uScale;
    uniform float uFrequency;
    uniform float uWarpStrength;
    uniform float uMouseInfluence;
    uniform float uParallax;
    uniform float uNoise;
    uniform float uIntensity;
    uniform float uBandWidth;
    
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;

    varying vec2 vUv;

    // Простой 2D Шум
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                 mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uResolution.xy;
      vec2 p = -1.0 + 2.0 * uv;
      p.x *= uResolution.x / uResolution.y;

      // Поворот координат
      float cosRot = cos(uRotation);
      float sinRot = sin(uRotation);
      vec2 rotatedP = vec2(
        p.x * cosRot - p.y * sinRot,
        p.x * sinRot + p.y * cosRot
      );

      // Интерактивность мыши
      float distToMouse = length(p - uMouse);
      float mouseEffect = smoothstep(1.5, 0.0, distToMouse) * uMouseInfluence * 0.35;

      // Время с учетом скорости
      float t = uTime * uSpeed;

      // Генерация цветных искривленных полос (ColorBends)
      // Применяем двойное искажение (warp)
      float noiseVal = noise(rotatedP * uFrequency * 2.0 + vec2(t, -t * 0.5));
      
      vec2 warp = vec2(
        sin(rotatedP.y * uBandWidth + t + noiseVal * uNoise) * uWarpStrength,
        cos(rotatedP.x * uBandWidth - t + noiseVal * uNoise) * uWarpStrength
      );

      vec2 deformedP = rotatedP * uScale + warp * 0.15 + uMouse * uParallax * 0.1 + mouseEffect;

      // Рассчитываем линии смешивания цветов
      float value = sin(deformedP.x * uBandWidth + sin(deformedP.y * 3.0 + t)) * 0.5 + 0.5;
      value += cos(deformedP.y * uBandWidth - cos(deformedP.x * 2.0 - t)) * 0.5 + 0.5;
      value *= 0.5;

      // Смешивание трех переданных цветов
      vec3 finalColor = vec3(0.0);
      if (value < 0.5) {
        finalColor = mix(uColor1, uColor2, value * 2.0);
      } else {
        finalColor = mix(uColor2, uColor3, (value - 0.5) * 2.0);
      }

      // Применяем интенсивность
      finalColor *= uIntensity;

      // Мягкое виньетирование для глубины
      float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
      vignette = clamp(pow(16.0 * vignette, 0.35), 0.0, 1.0);
      finalColor *= vignette;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

function ShaderPlane({
  rotation,
  speed,
  colors,
  scale,
  frequency,
  warpStrength,
  mouseInfluence,
  parallax,
  noise,
  intensity,
  bandWidth
}) {
  const meshRef = useRef();
  const { size } = useThree();

  const threeColors = colors.map(c => new THREE.Color(c));

  const uniforms = useRef({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uRotation: { value: (rotation * Math.PI) / 180 },
    uSpeed: { value: speed },
    uScale: { value: scale },
    uFrequency: { value: frequency },
    uWarpStrength: { value: warpStrength },
    uMouseInfluence: { value: mouseInfluence },
    uParallax: { value: parallax },
    uNoise: { value: noise },
    uIntensity: { value: intensity },
    uBandWidth: { value: bandWidth },
    uColor1: { value: threeColors[0] || new THREE.Color('#ff042e') },
    uColor2: { value: threeColors[1] || new THREE.Color('#3e05e0') },
    uColor3: { value: threeColors[2] || new THREE.Color('#ffffff') }
  });

  useFrame((state) => {
    const { clock, mouse } = state;
    uniforms.current.uTime.value = clock.getElapsedTime();
    
    // Плавное следование за курсором
    uniforms.current.uMouse.value.x += (mouse.x * (size.width / size.height) - uniforms.current.uMouse.value.x) * 0.05;
    uniforms.current.uMouse.value.y += (mouse.y - uniforms.current.uMouse.value.y) * 0.05;
    
    uniforms.current.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={ColorBendsShader.vertexShader}
        fragmentShader={ColorBendsShader.fragmentShader}
        uniforms={uniforms.current}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function ColorBends(props) {
  return (
    <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
      <ShaderPlane {...props} />
    </Canvas>
  );
}
