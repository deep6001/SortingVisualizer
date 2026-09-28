import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Grid, Lightformer, OrbitControls } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { palette } from '../theme';

export { palette };

/**
 * Standard 3D stage: blueprint floor grid, studio lighting (no network HDRs),
 * soft bloom so "hot" emissive elements glow, and orbit controls.
 */
export default function Scene({
  children,
  camera = { position: [0, 8, 16], fov: 45 },
  target = [0, 0, 0],
  grid = true,
  effects = true,
  controls = true,
  autoRotate = false,
  floorY = 0,
  shadows = true,
  fitWidth,
}) {
  return (
    <Canvas shadows={shadows} dpr={[1, 2]} camera={camera} gl={{ antialias: true }}>
      <color attach="background" args={[palette.deep]} />
      <fog attach="fog" args={[palette.deep, 30, 80]} />
      <hemisphereLight args={['#BCC2FF', '#09090B', 0.5]} />
      <directionalLight
        position={[8, 16, 10]}
        intensity={1.6}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[-12, 6, -6]} color={palette.sky} intensity={60} distance={40} />
      <pointLight position={[12, 4, 8]} color={palette.amber} intensity={25} distance={30} />

      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 6, -8]} scale={[20, 4, 1]} color="#9CA4FF" />
          <Lightformer intensity={1} position={[-10, 2, 4]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
          <Lightformer intensity={0.6} position={[10, 2, 4]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} color="#ffd9a0" />
        </Environment>
        {children}
      </Suspense>

      {grid && (
        <>
          <mesh rotation-x={-Math.PI / 2} position-y={floorY - 0.001} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <shadowMaterial opacity={0.35} />
          </mesh>
          <Grid
            position={[0, floorY, 0]}
            infiniteGrid
            cellSize={0.5}
            cellThickness={0.6}
            cellColor="#2C2C41"
            sectionSize={2.5}
            sectionThickness={1}
            sectionColor="#4B4B6E"
            fadeDistance={60}
            fadeStrength={1.5}
          />
        </>
      )}

      {controls && (
        <OrbitControls
          makeDefault
          target={target}
          enableDamping
          maxPolarAngle={Math.PI / 2.05}
          minDistance={3}
          maxDistance={70}
          autoRotate={autoRotate}
          autoRotateSpeed={0.4}
        />
      )}

      {fitWidth && <FitCamera width={fitWidth} target={target} />}

      {effects && (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
          <Vignette offset={0.3} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

/** Pull the camera back until a row `width` units wide fits the viewport, keeping the current viewing angle. */
function FitCamera({ width, target }) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    const vfov = (camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const dist = Math.max(10, (width / 2 + 1.5) / Math.tan(hfov / 2) + 2);
    const dir = camera.position.clone().sub({ x: target[0], y: target[1], z: target[2] }).normalize();
    camera.position.set(target[0] + dir.x * dist, target[1] + dir.y * dist, target[2] + dir.z * dist);
    camera.updateProjectionMatrix();
    controls?.update?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, aspect, camera, controls]);
  return null;
}
