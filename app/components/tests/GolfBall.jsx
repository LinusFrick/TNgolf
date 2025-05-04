'use client';

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef } from "react";

function GolfBallModel() {
  const { scene } = useGLTF('/images/uploads_files_4209240_Golf+Ball+Generic.glb');
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += 0.005;
      ref.current.rotation.y += 0.001;
    }
  });

  return <primitive object={scene} ref={ref} scale={2.5} />;
}

export default function GolfBall() {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[5, 5, 5]} intensity={100} />
      <pointLight position={[-3, -3, 2]} />
      <GolfBallModel />
    </Canvas>
  );
}