"use client"

import { Suspense, useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Text3D, Center, useTexture } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import * as THREE from "three"

interface PhoneBootAnimationProps {
  onAnimationComplete: () => void
}

function Phone3D({ onComplete }: { onComplete: () => void }) {
  const phoneRef = useRef<THREE.Group>(null)
  const screenRef = useRef<THREE.Mesh>(null)
  const [animationStage, setAnimationStage] = useState(0)
  
  useFrame((state) => {
    if (!phoneRef.current || !screenRef.current) return
    
    const elapsed = state.clock.elapsedTime
    
    // Stage 0: Phone appears and rotates
    if (animationStage === 0) {
      phoneRef.current.rotation.y = elapsed * 0.5
      phoneRef.current.position.y = Math.sin(elapsed * 2) * 0.1
      
      if (elapsed > 2) {
        setAnimationStage(1)
      }
    }
    
    // Stage 1: Phone boots up (screen flickers)
    if (animationStage === 1) {
      const material = screenRef.current.material as THREE.MeshStandardMaterial
      material.emissive.setHex(elapsed % 0.5 < 0.25 ? 0x00ff00 : 0x000000)
      
      if (elapsed > 4) {
        setAnimationStage(2)
      }
    }
    
    // Stage 2: Boot complete, phone stabilizes
    if (animationStage === 2) {
      phoneRef.current.rotation.y = Math.sin(elapsed * 0.2) * 0.1
      const material = screenRef.current.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x00aa00)
      
      if (elapsed > 6) {
        onComplete()
      }
    }
  })

  return (
    <group ref={phoneRef} position={[0, 0, 0]}>
      {/* Phone Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 3, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0, 0.16]}>
        <boxGeometry args={[1.3, 2.6, 0.05]} />
        <meshStandardMaterial 
          color="#000000" 
          emissive="#000000"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Home Button */}
      <mesh position={[0, -1.2, 0.16]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Camera */}
      <mesh position={[0, 1.2, 0.16]}>
        <cylinderGeometry args={[0.08, 0.08, 0.03]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Volume Buttons */}
      <mesh position={[-0.75, 0.5, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[-0.75, 0, 0]}>
        <boxGeometry args={[0.05, 0.3, 0.1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  )
}

function LoadingText() {
  return (
    <Center>
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        ERIGGA LIVE
        <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} />
      </Text3D>
    </Center>
  )
}

export function PhoneBootAnimation({ onAnimationComplete }: PhoneBootAnimationProps) {
  const [isComplete, setIsComplete] = useState(false)
  
  const handleComplete = () => {
    setIsComplete(true)
    // Delay to show completion state before transitioning
    setTimeout(() => {
      onAnimationComplete()
    }, 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center"
    >
      {/* 3D Scene */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            {/* 3D Phone */}
            <Phone3D onComplete={handleComplete} />
            
            {/* Loading Text */}
            <group position={[0, -3, 0]}>
              <LoadingText />
            </group>
            
            {/* Subtle controls for better viewing */}
            <OrbitControls 
              enableZoom={false}
              enablePan={false}
              enableRotate={false}
              autoRotate={false}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Loading Overlay */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center">
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-white"
        >
          <div className="text-2xl font-bold mb-4">
            {isComplete ? "Ready to Connect" : "Initializing..."}
          </div>
          
          {!isComplete && (
            <div className="flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-yellow-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          )}
          
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-400 text-xl"
            >
              ✓ Connection Established
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}