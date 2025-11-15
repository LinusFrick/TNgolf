'use client';

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
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
  SECTION3_ROLL_X: 2.5,  // X position when rolling right in section 3 (stops here, visible)
  SECTION4_ROLL_OUT_X: 8, // X position when rolling out to the right in section 4 (off-screen)
  SECTION4_START_X: -8,  // Starting X position for section 4 (off-screen left)
  SECTION4_ROLL_X: 0,    // Final X position when rolling in from left in section 4 (center)
  ROLL_LERP_SPEED: 0.03,  // Speed of rolling animation (even slower for smoother movement)
  ROLL_ROTATION_SPEED: 0.8, // Rotation speed when rolling (adjusted for proper angle)
  FADE_OUT_START: 4,     // Start fading out when X > this value
  FADE_IN_START: -4,     // Start fading in when X > this value
};

function GolfBallModel({ scrollY, currentSection = 1, scale = CONFIG.SCALE, rollDistance = { right: CONFIG.SECTION3_ROLL_X, rollOut: CONFIG.SECTION4_ROLL_OUT_X, left: CONFIG.SECTION4_ROLL_X, startLeft: CONFIG.SECTION4_START_X } }) {
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
  const opacityRef = useRef(1); // Opacity for fade in/out
  const section4PhaseRef = useRef('rollOut'); // Phase for section 4: 'rollOut' or 'rollIn'
  const hasTransitionedRef = useRef(false); // Track if we've already transitioned phases
  const previousSectionRef = useRef(currentSection); // Track previous section to prevent re-triggering
  const section4InitializedRef = useRef(false); // Track if section 4 has been initialized
  const rollInTeleportedRef = useRef(false); // Track if we've already teleported in roll-in phase
  const scrollDirectionRef = useRef('forward'); // Track scroll direction: 'forward' or 'backward'
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
    // Only update if section actually changed
    if (previousSectionRef.current === currentSection) {
      return; // Section hasn't changed, don't re-trigger
    }
    
    const previousSection = previousSectionRef.current;
    // Determine scroll direction
    scrollDirectionRef.current = currentSection > previousSection ? 'forward' : 'backward';
    previousSectionRef.current = currentSection;
    
    if (currentSection === 3) {
      // Section 3: Roll to the right and stop (visible)
      targetXRef.current = rollDistance.right;
      opacityRef.current = 1; // Fully visible
      hasTransitionedRef.current = false; // Reset transition flag
      section4InitializedRef.current = false; // Reset section 4 initialization
      rollInTeleportedRef.current = false; // Reset roll-in teleport flag
      console.log('Section 3 detected! Setting target X to:', rollDistance.right);
    } else if (currentSection === 4) {
      // Handle section 4 based on scroll direction
      const isScrollingBack = scrollDirectionRef.current === 'backward' && previousSection > 4;
      
      // Only initialize section 4 animation when scrolling forward or first time
      if (!section4InitializedRef.current) {
        section4InitializedRef.current = true;
        
        // If scrolling back from section 5, check if ball is already at left side position
        if (isScrollingBack) {
          const leftSideTarget = rollDistance.startLeft + 5; // -3
          // If ball is already at or near left side position, just keep it there
          if (Math.abs(currentXRef.current - leftSideTarget) < 1.0) {
            section4PhaseRef.current = 'rollIn';
            rollInTeleportedRef.current = true;
            hasTransitionedRef.current = true;
            targetXRef.current = leftSideTarget;
            opacityRef.current = 1;
            console.log('Section 4 detected (scroll back)! Ball already at left side, keeping position at X:', currentXRef.current);
          } else {
            // Ball is not at left side, smoothly move it there
            section4PhaseRef.current = 'rollIn';
            rollInTeleportedRef.current = true;
            hasTransitionedRef.current = true;
            targetXRef.current = leftSideTarget;
            opacityRef.current = 1;
            console.log('Section 4 detected (scroll back)! Moving ball to left side at X:', leftSideTarget);
          }
        } else {
          // Scrolling forward - normal initialization
          // Section 4: First roll out to the right, then roll in from the left
          // Check if we're already past the roll-out point (coming from section 3)
          if (currentXRef.current >= rollDistance.rollOut - 0.5) {
            // Already rolled out, go directly to roll-in phase
            section4PhaseRef.current = 'rollIn';
            rollInTeleportedRef.current = true; // Mark that we've teleported
            // Start from a position closer to center so ball is visible immediately
            currentXRef.current = rollDistance.startLeft + 3; // Start at -5 instead of -8 (more visible)
            if (meshRef.current) {
              meshRef.current.position.x = currentXRef.current;
            }
            targetXRef.current = rollDistance.startLeft + 5; // Roll to left side (-3), not center
            opacityRef.current = 1; // Start fully visible
            hasTransitionedRef.current = true;
            previousXRef.current = currentXRef.current;
            console.log('Section 4 detected! Already rolled out, teleporting to left side at X:', currentXRef.current, 'rolling to left side position');
          } else if (currentXRef.current >= rollDistance.right - 0.5) {
            // Ball is at section 3 position (2.5), start rolling out further to the right
            section4PhaseRef.current = 'rollOut';
            targetXRef.current = rollDistance.rollOut; // Roll further right to 8
            hasTransitionedRef.current = false;
            opacityRef.current = 1; // Keep visible during roll-out
            console.log('Section 4 detected! Starting from section 3 position (2.5), rolling out further to the right to X:', rollDistance.rollOut);
          } else {
            // Ball is somewhere else (likely at center or left), determine what to do
            if (Math.abs(currentXRef.current) < 0.5) {
              // Ball is at center, start rolling out
              section4PhaseRef.current = 'rollOut';
              targetXRef.current = rollDistance.rollOut;
              hasTransitionedRef.current = false;
              opacityRef.current = 1; // Ensure visible when starting roll-out
              console.log('Section 4 detected! Ball at center, starting roll-out to the right from X:', currentXRef.current);
            } else {
              // Ball is somewhere unexpected, go directly to roll-in
              section4PhaseRef.current = 'rollIn';
              rollInTeleportedRef.current = true;
              hasTransitionedRef.current = true;
              targetXRef.current = rollDistance.startLeft + 5; // Left side position
              opacityRef.current = 1;
              console.log('Section 4 detected! Ball at unexpected position X:', currentXRef.current, ', going to left side');
            }
          }
        }
      } else if (isScrollingBack) {
        // Already initialized, but scrolling back - ensure ball stays at left side
        const leftSideTarget = rollDistance.startLeft + 5; // -3
        if (section4PhaseRef.current !== 'rollIn') {
          section4PhaseRef.current = 'rollIn';
        }
        if (Math.abs(targetXRef.current - leftSideTarget) > 0.5) {
          targetXRef.current = leftSideTarget;
        }
        opacityRef.current = 1;
      }
      // If already initialized and scrolling forward, don't change anything - let the animation continue
    } else {
      // Other sections: Return to center
      // Only reset section 4 initialization if going to section 3 or earlier (not section 5)
      if (currentSection < 4) {
        section4InitializedRef.current = false; // Reset section 4 initialization
        rollInTeleportedRef.current = false; // Reset roll-in teleport flag
      }
      
      targetXRef.current = 0;
      opacityRef.current = 1; // Make sure it's visible
      section4PhaseRef.current = 'rollOut'; // Reset phase
      hasTransitionedRef.current = false; // Reset transition flag
      console.log('Section changed to:', currentSection, 'Setting target X to 0');
    }
  }, [currentSection, rollDistance]);

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
    
    // Opacity control and section 4 phase management
    if (currentSection === 3) {
      // Section 3: Fully visible, no fade
      opacityRef.current = 1;
    } else if (currentSection === 4) {
      // Section 4: Two-phase animation
      // CRITICAL: Always ensure ball is visible in section 4 - set opacity first
      let targetOpacity = 1;
      
      if (section4PhaseRef.current === 'rollOut') {
        // Phase 1: Roll out to the right - keep visible until very end
        // Only fade out in the last 0.5 units before roll-out position
        const fadeStart = rollDistance.rollOut - 0.5;
        if (currentXRef.current > fadeStart) {
          // Fade out only in the last 0.5 units
          const fadeRange = rollDistance.rollOut - fadeStart;
          const fadeProgress = (currentXRef.current - fadeStart) / fadeRange;
          targetOpacity = THREE.MathUtils.clamp(1 - fadeProgress, 0, 1);
        } else {
          // Keep fully visible during most of roll-out
          targetOpacity = 1;
        }
        
        // Check if we've reached the roll-out position, then switch to roll-in phase (only once)
        // Transition when ball is close to roll-out position (within 1.0 units for smoother transition)
        // Use a tighter threshold to prevent repeated transitions
        if (!hasTransitionedRef.current && currentXRef.current >= rollDistance.rollOut - 0.8) {
          hasTransitionedRef.current = true;
          rollInTeleportedRef.current = true; // Mark that we've teleported
          section4PhaseRef.current = 'rollIn';
          // Teleport to left side but closer to center so ball is visible immediately
          const rollInStartX = rollDistance.startLeft + 3; // Start at -5 instead of -8 (more visible)
          currentXRef.current = rollInStartX;
          if (meshRef.current) {
            meshRef.current.position.x = rollInStartX;
          }
          targetXRef.current = rollDistance.startLeft + 5; // Roll to left side (-3), not center
          opacityRef.current = 1; // Start fully visible
          previousXRef.current = rollInStartX; // Update previous position
          console.log('Section 4 Phase 2: Transitioning to roll-in, ball at X:', rollInStartX, 'rolling to left side');
        }
      } else {
        // Phase 2: Roll in from the left and stay on left side
        // Use -5 instead of -8 so ball is visible
        const rollInStartX = rollDistance.startLeft + 3; // -5 instead of -8
        const leftSideTarget = rollDistance.startLeft + 5; // -3 (left side position, more visible and closer to center)
        
        // CRITICAL: Only teleport once when entering roll-in phase, not every frame
        // Use a flag to prevent repeated teleporting
        if (!rollInTeleportedRef.current && currentXRef.current > rollInStartX + 1.5) {
          // Ball is way off left side, teleport it there (but closer to center) - only once
          rollInTeleportedRef.current = true;
          currentXRef.current = rollInStartX;
          if (meshRef.current) {
            meshRef.current.position.x = rollInStartX;
          }
          targetOpacity = 1; // Start fully visible
          previousXRef.current = rollInStartX;
          console.log('Section 4 Roll-in: Teleporting ball to start position X:', rollInStartX);
        }
        
        // Ball should roll to left side position and stay there (not center)
        // Set target to left side position
        if (Math.abs(targetXRef.current - leftSideTarget) > 1.0) {
          targetXRef.current = leftSideTarget;
        }
        
        // Ball is always fully visible when rolling in from left
        targetOpacity = 1;
        
        // Debug: log position and opacity in roll-in phase (less frequently)
        if (Math.abs(currentXRef.current - previousXRef.current) > 0.1) {
          console.log('Section 4 Roll-in: X =', currentXRef.current.toFixed(2), 'Target =', targetXRef.current.toFixed(2), 'Opacity =', targetOpacity.toFixed(2), 'Phase =', section4PhaseRef.current);
        }
      }
      
      // CRITICAL: Force visibility - ball should ALWAYS be visible in section 4
      // Never allow opacity to be 0 or very low
      if (targetOpacity < 0.5) {
        console.warn('Section 4: Opacity too low, forcing to 1. Calculated:', targetOpacity, 'Phase:', section4PhaseRef.current, 'X:', currentXRef.current);
        targetOpacity = 1;
      }
      
      // Apply the calculated opacity
      opacityRef.current = targetOpacity;
    } else {
      // Other sections: fully visible
      opacityRef.current = 1;
    }
    
    // Apply opacity to all materials in the scene
    if (clonedScene) {
      clonedScene.traverse((child) => {
        if (child.isMesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.opacity = opacityRef.current;
              mat.transparent = opacityRef.current < 1;
            });
          } else {
            child.material.opacity = opacityRef.current;
            child.material.transparent = opacityRef.current < 1;
          }
        }
      });
    }
    
    // Debug: log when position changes significantly
    if (Math.abs(oldX - currentXRef.current) > 0.01) {
      console.log('Ball X position:', currentXRef.current.toFixed(2), 'Target:', targetXRef.current.toFixed(2), 'Section:', currentSection, 'Opacity:', opacityRef.current.toFixed(2));
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
        scale={scale}
        position={[0, CONFIG.INITIAL_Y, 0]}
        onPointerDown={handlePointerDown}
      />
      {/* Invisible larger hitbox for easier interaction - follows ball position */}
      <mesh 
        ref={hitboxRef}
        position={[0, CONFIG.INITIAL_Y, 0]} 
        scale={[scale * 2.5, scale * 2.5, scale * 2.5]}
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
  // Responsive configuration based on viewport
  const [config, setConfig] = useState({
    scale: CONFIG.SCALE,
    cameraZ: 6.5, // Further back to reduce perspective distortion
    fov: 40, // Wider FOV to reduce zoom effect
    rollRight: CONFIG.SECTION3_ROLL_X,
    rollOut: CONFIG.SECTION4_ROLL_OUT_X,
    rollLeft: CONFIG.SECTION4_ROLL_X,
    startLeft: CONFIG.SECTION4_START_X,
    isMobile: false,
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        // Mobile - disable horizontal rolling
        setConfig({
          scale: CONFIG.SCALE * 0.6,
          cameraZ: 6.5, // Further back to reduce perspective distortion
          fov: 40, // Wider FOV to reduce zoom effect
          rollRight: CONFIG.SECTION3_ROLL_X * 0.7,
          rollOut: CONFIG.SECTION4_ROLL_OUT_X * 0.7,
          rollLeft: CONFIG.SECTION4_ROLL_X,
          startLeft: CONFIG.SECTION4_START_X * 0.7,
          isMobile: true,
        });
      } else if (width < 1024) {
        // Tablet
        setConfig({
          scale: CONFIG.SCALE * 0.8,
          cameraZ: 6.3, // Further back to reduce perspective distortion
          fov: 42, // Wider FOV to reduce zoom effect
          rollRight: CONFIG.SECTION3_ROLL_X * 0.85,
          rollOut: CONFIG.SECTION4_ROLL_OUT_X * 0.85,
          rollLeft: CONFIG.SECTION4_ROLL_X,
          startLeft: CONFIG.SECTION4_START_X * 0.85,
          isMobile: false,
        });
      } else {
        // Desktop
        setConfig({
          scale: CONFIG.SCALE,
          cameraZ: 6.5, // Further back to reduce perspective distortion
          fov: 40, // Wider FOV to reduce zoom effect
          rollRight: CONFIG.SECTION3_ROLL_X,
          rollOut: CONFIG.SECTION4_ROLL_OUT_X,
          rollLeft: CONFIG.SECTION4_ROLL_X,
          startLeft: CONFIG.SECTION4_START_X,
          isMobile: false,
        });
      }
    };

    updateConfig();
    window.addEventListener('resize', updateConfig);
    return () => window.removeEventListener('resize', updateConfig);
  }, []);

  // On mobile, override currentSection to always be 1 or 2 (no horizontal movement)
  const effectiveSection = config.isMobile 
    ? (currentSection <= 2 ? currentSection : 2)
    : currentSection;

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, config.cameraZ], fov: config.fov }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ camera }) => {
          // Ensure camera maintains consistent view regardless of ball position
          camera.lookAt(0, 0, 0);
        }}
      >
        {/* Theme-aware lighting setup */}
        <ThemeAwareLighting theme={theme} />
        
        {/* Golf ball model with scroll-based position and drag support */}
        <GolfBallModel 
          scrollY={scrollY} 
          currentSection={effectiveSection}
          scale={config.scale}
          rollDistance={{ right: config.rollRight, rollOut: config.rollOut, left: config.rollLeft, startLeft: config.startLeft }}
        />
      </Canvas>
    </div>
  );
}