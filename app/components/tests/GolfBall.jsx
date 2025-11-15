'use client';

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

// Constants for better maintainability
const CONFIG = {
  INITIAL_Y: 0.8,        // Lower initial position
  DROP_THRESHOLD: 300,   // Scroll threshold to trigger drop
  BOTTOM_Y: -1.5,        // Final position (within viewport)
  GRAVITY: 12,           // Gravity constant
  ROTATION_SPEED_X: 0.5,
  ROTATION_SPEED_Y: 0.2,
  SCALE: 0.7,
  RESET_THRESHOLD: 50,   // Scroll back to top threshold
  RETURN_LERP_SPEED: 0.1,
  DRAG_SENSITIVITY: 0.02,
  SECTION3_ROLL_X: 2.5, // X position when rolling right in section 3
  SECTION4_ROLL_X: -2.5, // X position when rolling left in section 4
  ROLL_LERP_SPEED: 0.03,  // Speed of rolling animation (even slower for smoother movement)
  ROLL_ROTATION_SPEED: 0.8, // Rotation speed when rolling (adjusted for proper angle)
};

function GolfBallModel({ scrollY, currentSection = 1 }) {
  const { scene } = useGLTF('/images/uploads_files_4209240_Golf+Ball+Generic.glb');
  const meshRef = useRef();
  const scrollYRef = useRef(scrollY);
  const velocityRef = useRef(0);
  const hasDroppedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const targetXRef = useRef(0); // Target X position for horizontal movement
  const currentXRef = useRef(0); // Current X position
  const previousXRef = useRef(0); // Previous X position for delta calculation
  const rollRotationRef = useRef(0); // Rotation for rolling effect
  const { viewport } = useThree();

  // Update scrollY ref when prop changes
  useEffect(() => {
    scrollYRef.current = scrollY;
    
    // Reset if scrolled back to top
    if (scrollY < CONFIG.RESET_THRESHOLD) {
      hasDroppedRef.current = false;
      velocityRef.current = 0;
      dragOffsetRef.current = 0;
    }
  }, [scrollY]);

  // Update target X position based on current section
  useEffect(() => {
    if (currentSection === 3) {
      // Section 3: Roll to the right
      targetXRef.current = CONFIG.SECTION3_ROLL_X;
      console.log('Section 3 detected! Setting target X to:', CONFIG.SECTION3_ROLL_X);
    } else if (currentSection === 4) {
      // Section 4: Roll to the left
      targetXRef.current = CONFIG.SECTION4_ROLL_X;
      console.log('Section 4 detected! Setting target X to:', CONFIG.SECTION4_ROLL_X);
    } else {
      // Other sections: Return to center
      targetXRef.current = 0;
      console.log('Section changed to:', currentSection, 'Setting target X to 0');
    }
  }, [currentSection]);

  // Memoize the cloned scene for better performance
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    return scene.clone();
  }, [scene]);

  // Handle pointer events for dragging (screen-space to 3D conversion)
  const handlePointerDown = (e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    // Support both mouse and touch events
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    dragStartYRef.current = clientY;
    dragOffsetRef.current = meshRef.current.position.y;
    
    // Add global listeners for smooth dragging
    const handleGlobalMove = (e) => {
      if (isDraggingRef.current && meshRef.current) {
        // Prevent scrolling while dragging on touch devices
        if (e.touches) {
          e.preventDefault();
        }
        const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || dragStartYRef.current;
        const screenDeltaY = (clientY - dragStartYRef.current) * CONFIG.DRAG_SENSITIVITY;
        const newY = dragOffsetRef.current - screenDeltaY;
        const maxY = CONFIG.INITIAL_Y;
        const minY = CONFIG.BOTTOM_Y;
        meshRef.current.position.y = THREE.MathUtils.clamp(newY, minY, maxY);
      }
    };

    const handleGlobalUp = () => {
      if (isDraggingRef.current && meshRef.current) {
        isDraggingRef.current = false;
        if (meshRef.current.position.y < CONFIG.INITIAL_Y - 0.3) {
          hasDroppedRef.current = true;
          velocityRef.current = 0;
        }
      }
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove, { passive: false });
      window.removeEventListener('touchend', handleGlobalUp);
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('touchend', handleGlobalUp);
  };

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Skip physics if dragging
    if (isDraggingRef.current) return;
    
    const currentScrollY = scrollYRef.current;
    
    // Horizontal movement (rolling left/right)
    previousXRef.current = currentXRef.current;
    const oldX = currentXRef.current;
    currentXRef.current = THREE.MathUtils.lerp(
      currentXRef.current,
      targetXRef.current,
      CONFIG.ROLL_LERP_SPEED
    );
    meshRef.current.position.x = currentXRef.current;
    
    // Debug: log when position changes significantly
    if (Math.abs(oldX - currentXRef.current) > 0.01) {
      console.log('Ball X position:', currentXRef.current.toFixed(2), 'Target:', targetXRef.current.toFixed(2), 'Section:', currentSection);
    }

    // Rolling rotation effect when moving horizontally
    // Calculate delta movement
    const xDelta = currentXRef.current - previousXRef.current;
    
    // Calculate target rolling rotation based on horizontal position
    // When rolling right (positive X), rotate around Y axis in one direction
    // When at center, no rolling rotation
    const targetRollRotation = currentXRef.current * CONFIG.ROLL_ROTATION_SPEED;
    
    // Smoothly interpolate to target rolling rotation
    rollRotationRef.current = THREE.MathUtils.lerp(
      rollRotationRef.current,
      targetRollRotation,
      CONFIG.ROLL_LERP_SPEED * 2 // Faster interpolation for rotation
    );

    // Apply base rotation and rolling rotation smoothly
    // X rotation continues normally (vertical spin) - consistent speed
    meshRef.current.rotation.x += delta * CONFIG.ROTATION_SPEED_X;
    
    // Y rotation: maintain consistent overall speed
    // When rolling, use rolling rotation direction but keep the same speed as base rotation
    const baseYRotationSpeed = CONFIG.ROTATION_SPEED_Y;
    
    if (Math.abs(rollRotationRef.current) > 0.001) {
      // When rolling, use the rolling direction but maintain base rotation speed
      // Normalize the rolling rotation direction and apply base speed
      const rollingDirection = rollRotationRef.current > 0 ? 1 : -1;
      meshRef.current.rotation.y += delta * baseYRotationSpeed * rollingDirection;
    } else {
      // No rolling, use normal base rotation
      meshRef.current.rotation.y += delta * baseYRotationSpeed;
    }
    
    // Check if we've scrolled past the threshold
    if (currentScrollY > CONFIG.DROP_THRESHOLD && !hasDroppedRef.current) {
      hasDroppedRef.current = true;
      velocityRef.current = 0;
    }
    
    if (hasDroppedRef.current) {
      // Ball is dropping - apply gravity-like animation
      velocityRef.current += CONFIG.GRAVITY * delta;
      
      // Calculate new position with physics
      const newY = meshRef.current.position.y - (velocityRef.current * delta);
      
      // Stop at bottom (within viewport)
      if (newY <= CONFIG.BOTTOM_Y) {
        meshRef.current.position.y = CONFIG.BOTTOM_Y;
        velocityRef.current = 0;
      } else {
        meshRef.current.position.y = newY;
      }
    } else {
      // Ball is at top - smoothly return to initial position
      velocityRef.current = 0;
      
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        CONFIG.INITIAL_Y,
        CONFIG.RETURN_LERP_SPEED
      );
    }
  });

  if (!clonedScene) {
    return null;
  }

  // Enable pointer events on all meshes in the scene
  useEffect(() => {
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.userData.isGolfBall = true;
        }
      });
    }
  }, [clonedScene]);

  const hitboxRef = useRef();

  // Update hitbox position to follow ball
  useFrame(() => {
    if (hitboxRef.current && meshRef.current) {
      hitboxRef.current.position.y = meshRef.current.position.y;
      hitboxRef.current.position.x = meshRef.current.position.x;
    }
  });

  return (
    <group>
      <primitive
        object={clonedScene}
        ref={meshRef}
        scale={CONFIG.SCALE}
        position={[0, CONFIG.INITIAL_Y, 0]}
        onPointerDown={handlePointerDown}
      />
      {/* Invisible larger hitbox for easier interaction - follows ball position */}
      <mesh 
        ref={hitboxRef}
        position={[0, CONFIG.INITIAL_Y, 0]} 
        scale={[CONFIG.SCALE * 2.5, CONFIG.SCALE * 2.5, CONFIG.SCALE * 2.5]}
        visible={false}
        onPointerDown={handlePointerDown}
      >
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>
    </group>
  );
}

// Lighting component that adapts to theme
function ThemeAwareLighting({ theme = 'dark' }) {
  const isLight = theme === 'light';

  // In light mode, dramatically increase ambient light and overall brightness
  // In dark mode, slightly reduce lighting for more contrast
  const ambientIntensity = isLight ? 3.5 : 0.7;
  const directionalIntensity1 = isLight ? 6.0 : 1.8;
  const directionalIntensity2 = isLight ? 3.5 : 0.6;
  const pointIntensity1 = isLight ? 5.5 : 1.2;
  const pointIntensity2 = isLight ? 3.0 : 0.6;
  const spotIntensity = isLight ? 4.0 : 1.0;

  return (
    <>
      {/* Enhanced lighting setup - brighter in light mode */}
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={directionalIntensity1}
        color="#ffffff"
      />
      <directionalLight position={[-5, 2, -5]} intensity={directionalIntensity2} color="#e0e0ff" />
      <pointLight position={[0, 10, 0]} intensity={pointIntensity1} color="#ffffff" />
      <pointLight position={[-3, 5, -3]} intensity={pointIntensity2} color="#fff8e0" />
      <spotLight 
        position={[3, 5, 3]} 
        angle={0.35} 
        penumbra={0.7} 
        intensity={spotIntensity}
        color="#ffffff"
      />
    </>
  );
}

export default function GolfBall({ scrollY = 0, theme = 'dark', currentSection = 1 }) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Theme-aware lighting setup */}
        <ThemeAwareLighting theme={theme} />
        
        {/* Golf ball model with scroll-based position and drag support */}
        <GolfBallModel scrollY={scrollY} currentSection={currentSection} />
      </Canvas>
    </div>
  );
}