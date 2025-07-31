"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Text } from "@react-three/drei"
import type * as THREE from "three"

function PhoneBooth() {
  const boothRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (boothRef.current) {
      boothRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group ref={boothRef} position={[0, -1, 0]}>
      {/* Phone Booth Structure */}
      <group>
        {/* Base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshStandardMaterial color="#1e40af" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Back Wall */}
        <mesh position={[0, 1.5, -0.9]}>
          <boxGeometry args={[1.8, 3, 0.2]} />
          <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Side Walls */}
        <mesh position={[-0.9, 1.5, 0]}>
          <boxGeometry args={[0.2, 3, 1.8]} />
          <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.9, 1.5, 0]}>
          <boxGeometry args={[0.2, 3, 1.8]} />
          <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Glass Panels */}
        <mesh position={[0, 1.5, 0.9]}>
          <boxGeometry args={[1.6, 2.8, 0.1]} />
          <meshPhysicalMaterial
            color="#87ceeb"
            transparent
            opacity={0.3}
            transmission={0.9}
            thickness={0.1}
            roughness={0}
            metalness={0}
          />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 3.1, 0]}>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshStandardMaterial color="#1e40af" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Phone Inside */}
        <mesh position={[-0.5, 1.2, -0.7]}>
          <boxGeometry args={[0.3, 0.6, 0.2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>

        {/* Mystical Glow */}
        <mesh ref={glowRef} position={[0, 1.5, 0]}>
          <sphereGeometry args={[1.5, 32, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Floating Text */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.3}
        color="#1e40af"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        Spiritual Connection
      </Text>
    </group>
  )
}

function DesertFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#d2b48c" roughness={0.8} />
    </mesh>
  )
}

export function PhoneBoothScene() {
  return (
    <Canvas
      camera={{ position: [5, 3, 5], fov: 60 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#60a5fa" />

        <PhoneBooth />
        <DesertFloor />

        <Environment preset="sunset" />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Suspense>
    </Canvas>
  )
}
