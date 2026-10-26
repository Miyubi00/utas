import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSiteSettings } from '../lib/siteSettingsContext';

interface BookMeshProps {
  isOpen: boolean;
  onToggle: () => void;
  siteName: string;
  tagline: string;
}

function BookMesh({ isOpen, onToggle, siteName, tagline }: BookMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const frontCoverPivotRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  // Smooth rotation and opening interpolation in useFrame
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating tilt
      const t = state.clock.getElapsedTime();
      const targetRotY = (isOpen || hovered) ? 0.35 : Math.sin(t * 0.8) * 0.15;
      const targetRotX = Math.cos(t * 0.6) * 0.08;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 3);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, delta * 3);
    }

    if (frontCoverPivotRef.current) {
      // Open cover angle (-0.75 rad when open or hovered)
      const targetOpen = (isOpen || hovered) ? -0.75 : 0;
      frontCoverPivotRef.current.rotation.y = THREE.MathUtils.lerp(
        frontCoverPivotRef.current.rotation.y,
        targetOpen,
        delta * 4
      );
    }
  });

  const brownCoverMaterial = new THREE.MeshStandardMaterial({
    color: '#4A3426',
    roughness: 0.65,
    metalness: 0.1,
  });

  const spineMaterial = new THREE.MeshStandardMaterial({
    color: '#322015',
    roughness: 0.7,
  });

  const pageMaterial = new THREE.MeshStandardMaterial({
    color: '#F5ECD7',
    roughness: 0.85,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: '#D9C7A3',
    roughness: 0.3,
    metalness: 0.7,
  });

  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: '#B5651D',
    roughness: 0.5,
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {/* 1. BACK COVER */}
      <mesh position={[0, 0, -0.18]} material={brownCoverMaterial} castShadow receiveShadow>
        <boxGeometry args={[2.2, 3.2, 0.06]} />
      </mesh>

      {/* 2. INNER PAGES BLOCK */}
      <mesh position={[0.04, 0, 0]} material={pageMaterial} receiveShadow>
        <boxGeometry args={[2.04, 3.06, 0.3]} />
      </mesh>

      {/* 3. BOOK SPINE (Left curved hinge) */}
      <mesh position={[-1.08, 0, 0]} material={spineMaterial} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 3.2, 16]} />
      </mesh>

      {/* 4. RIBBON BOOKMARK */}
      <mesh position={[0.3, -0.6, 0.05]} material={ribbonMaterial} castShadow>
        <boxGeometry args={[0.15, 2.2, 0.01]} />
      </mesh>

      {/* 5. FRONT COVER (With Pivot on Spine Hinge) */}
      <group ref={frontCoverPivotRef} position={[-1.08, 0, 0.18]}>
        {/* Cover plane shifted right from pivot */}
        <mesh position={[1.08, 0, 0]} material={brownCoverMaterial} castShadow receiveShadow>
          <boxGeometry args={[2.16, 3.2, 0.06]} />
        </mesh>

        {/* Golden frame inlay */}
        <mesh position={[1.08, 0, 0.035]} material={goldMaterial}>
          <boxGeometry args={[1.85, 2.85, 0.005]} />
        </mesh>

        {/* Center Leather Medallion */}
        <mesh position={[1.08, 0, 0.038]} material={brownCoverMaterial}>
          <boxGeometry args={[1.75, 2.75, 0.005]} />
        </mesh>

        {/* 3D Title on Front */}
        <Text
          position={[1.08, 0.45, 0.042]}
          fontSize={0.21}
          color="#F5ECD7"
          font="https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.woff"
          anchorX="center"
          anchorY="middle"
        >
          {siteName}
        </Text>

        <Text
          position={[1.08, 0.05, 0.042]}
          fontSize={0.12}
          color="#D9C7A3"
          anchorX="center"
          anchorY="middle"
        >
          {tagline.length > 42 ? `${tagline.slice(0, 39)}…` : tagline}
        </Text>

        <Text
          position={[1.08, -0.85, 0.042]}
          fontSize={0.09}
          color="#D9C7A3"
          letterSpacing={0.1}
          anchorX="center"
          anchorY="middle"
        >
          BUKU & UTAS
        </Text>
      </group>
    </group>
  );
}

export default function BookCover3D() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSiteSettings();

  return (
    <div className="w-full h-80 sm:h-96 md:h-[420px] relative select-none">
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 45 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow color="#FFF4DE" />
        <directionalLight position={[-4, 2, 2]} intensity={0.6} color="#FFE8C2" />
        <pointLight position={[0, -2, 2]} intensity={0.4} color="#D9C7A3" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
          <BookMesh isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)} siteName={settings.site_name} tagline={settings.tagline} />
        </Float>
      </Canvas>

      {/* Subtle interaction hint */}
      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-garis/25 backdrop-blur-xs text-coklat-tua font-elite text-xs tracking-wider border border-garis/40 shadow-xs">
          <span>✨</span>
          <span>Ketuk atau arahkan kursor untuk membuka</span>
        </span>
      </div>
    </div>
  );
}
