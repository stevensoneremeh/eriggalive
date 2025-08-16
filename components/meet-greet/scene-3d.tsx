"use client"

import { Suspense, useRef, useEffect, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text, Environment, ContactShadows, Float } from "@react-three/drei"
import type * as THREE from "three"

interface Scene3DProps {
  onLoaded: () => void
  phoneBooted: boolean
}

function Phone({ phoneBooted }: { phoneBooted: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const screenRef = useRef<THREE.Mesh>(null)
  const [bootProgress, setBootProgress] = useState(0)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  useEffect(() => {
    if (phoneBooted) {
      const interval = setInterval(() => {
        setBootProgress((prev) => Math.min(prev + 0.02, 1))
      }, 50)
      return () => clearInterval(interval)
    }
  }, [phoneBooted])

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.1}>
      <group position={[0, 0, 0]}>
        {/* Phone Body */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 2.4, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Screen */}
        <mesh ref={screenRef} position={[0, 0, 0.051]}>
          <planeGeometry args={[1, 2]} />
          <meshStandardMaterial color={phoneBooted ? "#000" : "#333"} emissive={phoneBooted ? "#111" : "#000"} />
        </mesh>

        {/* Screen Content */}
        {phoneBooted && (
          <>
            <Text
              position={[0, 0.3, 0.052]}
              fontSize={0.15}
              color="#FFD700"
              anchorX="center"
              anchorY="middle"
              font="/fonts/bold.woff"
            >
              ERIGGA LIVE
            </Text>
            <Text position={[0, 0, 0.052]} fontSize={0.08} color="#FFFFFF" anchorX="center" anchorY="middle">
              Meet & Greet
            </Text>

            {/* Loading Bar */}
            <mesh position={[0, -0.3, 0.052]}>
              <planeGeometry args={[0.8 * bootProgress, 0.02]} />
              <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
            </mesh>
          </>
        )}

        {/* Glowing Base */}
        <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.3} transparent opacity={0.8} />
        </mesh>
      </group>
    </Float>
  )
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null)

  const particleCount = 100
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#FFD700" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

export default function Scene3D({ onLoaded, phoneBooted }: Scene3DProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onLoaded()
    }, 1000)
    return () => clearTimeout(timer)
  }, [onLoaded])

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ background: "linear-gradient(135deg, #1a0033 0%, #000066 50%, #000000 100%)" }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[0, 0, 10]} intensity={0.5} color="#FFD700" />

        {/* Environment */}
        <Environment preset="night" />

        {/* Main Phone */}
        <Phone phoneBooted={phoneBooted} />

        {/* Particles */}
        <Particles />

        {/* Contact Shadows */}
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />

        {/* Controls */}
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
      </Suspense>
    </Canvas>
  )
}
