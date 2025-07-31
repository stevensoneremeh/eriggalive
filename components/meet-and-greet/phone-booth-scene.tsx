"use client"

import { Suspense, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Environment, Text3D, Center } from "@react-three/drei"
import type * as THREE from "three"

function PhoneBooth() {
  const boothRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (boothRef.current) {
      boothRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
    }
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  return (
    <group ref={boothRef} position={[0, -1, 0]}>
      {/* Phone Booth Structure */}
      <group>
        {/* Base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>

        {/* Main Body */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[1.8, 3, 1.8]} />
          <meshStandardMaterial color="#3b82f6" />
        </mesh>

        {/* Glass Panels */}
        <mesh position={[0.85, 1.5, 0]}>
          <boxGeometry args={[0.1, 2.5, 1.6]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} />
        </mesh>
        <mesh position={[-0.85, 1.5, 0]}>
          <boxGeometry args={[0.1, 2.5, 1.6]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 1.5, 0.85]}>
          <boxGeometry args={[1.6, 2.5, 0.1]} />
          <meshStandardMaterial color="#e0f2fe" transparent opacity={0.3} />
        </mesh>

        {/* Door */}
        <mesh position={[0, 1.5, -0.85]}>
          <boxGeometry args={[1.2, 2.5, 0.1]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>

        {/* Door Handle */}
        <mesh position={[0.4, 1.5, -0.9]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>

        {/* Roof */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[2, 0.4, 2]} />
          <meshStandardMaterial color="#1e40af" />
        </mesh>

        {/* Phone Inside */}
        <mesh position={[0.6, 2, 0.6]}>
          <boxGeometry args={[0.1, 0.3, 0.05]} />
          <meshStandardMaterial color="#374151" />
        </mesh>

        {/* Handset */}
        <mesh position={[0.6, 2.2, 0.6]} rotation={[0, 0, Math.PI / 6]}>
          <capsuleGeometry args={[0.03, 0.2]} />
          <meshStandardMaterial color="#374151" />
        </mesh>
      </group>

      {/* Mystical Glow */}
      <mesh ref={glowRef} position={[0, 1.5, 0]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.1} />
      </mesh>

      {/* Floating Text */}
      <Center position={[0, 4, 0]}>
        <Text3D font="/fonts/Inter_Bold.json" size={0.3} height={0.05} curveSegments={12}>
          Spiritual Connection
          <meshStandardMaterial color="#ffffff" />
        </Text3D>
      </Center>
    </group>
  )
}

function DesertFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#d4a574" />
    </mesh>
  )
}

export function PhoneBoothScene() {
  return (
    <Canvas
      camera={{ position: [5, 3, 5], fov: 60 }}
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
    >
      <Suspense fallback={null}>
        <Environment preset="sunset" />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#3b82f6" />

        <DesertFloor />
        <PhoneBooth />

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
