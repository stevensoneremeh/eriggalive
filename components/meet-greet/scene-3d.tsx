'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text } from '@react-three/drei'
import { Suspense, useState, useEffect } from 'react'

function PhoneBooth() {
  return (
    <group>
      {/* Simple phone booth representation */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#4f46e5" opacity={0.7} transparent />
      </mesh>

      {/* Phone */}
      <mesh position={[0, 0.5, 1.1]}>
        <boxGeometry args={[0.3, 0.6, 0.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Text */}
      <Text
        position={[0, 2, 1.1]}
        fontSize={0.2}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
      >
        Meet Erigga
      </Text>
    </group>
  )
}

function Scene3DContent() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} />
        <PhoneBooth />
        <OrbitControls enableZoom={false} enablePan={false} />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  )
}

export default function Scene3D() {
  const [isClient, setIsClient] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm">Loading 3D Scene...</p>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-2">📞</div>
          <p className="text-lg font-semibold">Virtual Phone Booth</p>
          <p className="text-sm opacity-80">3D Preview Unavailable</p>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="w-full h-full">
        <Scene3DContent />
      </div>
    )
  } catch (error) {
    console.error('3D Scene error:', error)
    setHasError(true)
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-2">📞</div>
          <p className="text-lg font-semibold">Virtual Phone Booth</p>
          <p className="text-sm opacity-80">3D Preview Unavailable</p>
        </div>
      </div>
    )
  }
}