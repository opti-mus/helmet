import './style.css'
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { gsap } from 'gsap'

// Debug
const gui = new dat.GUI()
const debugObject = {}
/**
 * Loaders
 */
const loadingBarElement = document.querySelector('.loading-bar')

let sceneReady = false
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () => {
    // Wait a little
    window.setTimeout(() => {
      // Animate overlay
      gsap.to(overlayMaterial.uniforms.uAlpha, {
        duration: 3,
        value: 0,
        delay: 1,
      })

      // Update loadingBarElement
      loadingBarElement.classList.add('ended')
      loadingBarElement.style.transform = ''
    }, 500)

    window.setTimeout(() => {
      sceneReady = true
    }, 2000)
  },

  // Progress
  (itemUrl, itemsLoaded, itemsTotal) => {
    // Calculate the progress and update the loadingBarElement
    const progressRatio = itemsLoaded / itemsTotal
    loadingBarElement.style.transform = `scaleX(${progressRatio})`
  }
)
const gltfLoader = new GLTFLoader(loadingManager)
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)

/**
 * Base
 */
// Debug


// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform float uAlpha;

        void main()
        {
            gl_FragColor = vec4(0.01, 0.01, 0.01, uAlpha);
        }
    `,
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
  
      child.material.envMapIntensity = debugObject.envMapIntensity
      child.material.needsUpdate = true
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  './textures/environmentMaps/0/px.jpg',
  './textures/environmentMaps/0/nx.jpg',
  './textures/environmentMaps/0/py.jpg',
  './textures/environmentMaps/0/ny.jpg',
  './textures/environmentMaps/0/pz.jpg',
  './textures/environmentMaps/0/nz.jpg',
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

debugObject.envMapIntensity = 5

/**
 * Models
 */
gltfLoader.load('./models/DamagedHelmet/glTF/DamagedHelmet.gltf', (gltf) => {
  gltf.scene.scale.set(2.5, 2.5, 2.5)
  gltf.scene.rotation.y = Math.PI * 0.5
  scene.add(gltf.scene)

  updateAllMaterials()
})

/**
 * Points of interest
 */
const raycaster = new THREE.Raycaster()
const points = [
  {
    position: new THREE.Vector3(1.55, 0.3, -0.6),
    element: document.querySelector('.point-0'),
  },
  {
    position: new THREE.Vector3(0.5, 0.8, -1.6),
    element: document.querySelector('.point-1'),
  },
  {
    position: new THREE.Vector3(1.6, -1.3, -0.7),
    element: document.querySelector('.point-2'),
  },
]

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, -2.25)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.set(4, 1, -4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Post processing
// Post processing

// Render target
const renderTarget = new THREE.WebGLRenderTarget(800, 600, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  encoding: THREE.sRGBEncoding,
})
// Effect composer
const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

// Render pass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

debugObject.uBrightness = { value: 0.4 }

// Освещаем сцену, кроме черных фрагментов
const BrightShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBrightness: { value: debugObject.uBrightness.value },
  },
  vertexShader: `
      varying vec2 vUv;

      void main()
      {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

          vUv = uv;
      }
  `,
  fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uBrightness;
      varying vec2 vUv;

      void main()
      {
        vec4 color = texture2D(tDiffuse,vUv);
        float strengh = distance(color, vec4(.0,0.0,0.0,1.0));
        
        if(color != vec4(0.0,0.0,0.0,1.0)) {
          color.rgb += uBrightness;
        }
        
        gl_FragColor =  color;
      }
  `,
}
const brightShader = new ShaderPass(BrightShader)
effectComposer.addPass(brightShader)

// Изменяем пиксели на кастомные
const TintShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBrightColor: { value: new THREE.Color(0xffffff) },
    uBrightColorChange: { value: new THREE.Color(0x00ff00) },
    uDarkColor: { value: new THREE.Color(0x000000) },
    uDarkColorChange: { value: new THREE.Color(0xff00ff) },
  },
  vertexShader: `
      varying vec2 vUv;

      void main()
      {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

          vUv = uv;
      }
  `,
  fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec3 uBrightColor;
      uniform vec3 uBrightColorChange;
      uniform vec3 uDarkColor;
      uniform vec3 uDarkColorChange;

      varying vec2 vUv;

      void main()
      {
        vec4 color = texture2D(tDiffuse,vUv);
        
        if(color == vec4(uDarkColor,1.0)) {
          color = vec4(uDarkColorChange,1.0);
        }
        if(color == vec4(uBrightColor,1.0)) {
          color = vec4(uBrightColorChange,1.0);
        }
        gl_FragColor = color;
      }
  `,
}
const tintShader = new ShaderPass(TintShader)
effectComposer.addPass(tintShader)

// Затемняем сцену, кроме измененных фрагментов
const RoughShader = {
  uniforms: {
    tDiffuse: { value: null },
    uBrightness: { value: debugObject.uBrightness.value },
    uBrightColorChange: { value: new THREE.Color(0x00ff00) },
    uDarkColorChange: { value: new THREE.Color(0xff00ff) },
  },
  vertexShader: `
      varying vec2 vUv;

      void main()
      {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

          vUv = uv;
      }
  `,
  fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uBrightness;
      uniform vec3 uBrightColorChange;
      uniform vec3 uDarkColorChange;

      varying vec2 vUv;

      void main()
      {
        vec4 color = texture2D(tDiffuse,vUv);
        if(color == vec4(uBrightColorChange,1.0)) {
          color = vec4(uBrightColorChange,1.0);
          gl_FragColor = color;
          return;
        }
        if(color == vec4(uDarkColorChange,1.0)) {
          color = vec4(uDarkColorChange,1.0);
          gl_FragColor = color;
          return;
        }
        color.rgb -= uBrightness;
        gl_FragColor = color;
      }
  `,
}
const roughShader = new ShaderPass(RoughShader)
effectComposer.addPass(roughShader)
debugObject.uBrightColor = 0xffffff
debugObject.uBrightColorChange = 0x00ff00
debugObject.uDarkColor = 0x000000
debugObject.uDarkColorChange = 0xff00ff
gui
  .add(debugObject.uBrightness, 'value')
  .min(0)
  .max(1)
  .step(0.001)
  .name('Brightness')
  .onChange(() => {
    roughShader.uniforms.uBrightness.value = debugObject.uBrightness.value
    brightShader.uniforms.uBrightness.value = debugObject.uBrightness.value
    roughShader.uniforms.uBrightColorChange.value.set(debugObject.uBrightColorChange)
    roughShader.uniforms.uDarkColorChange.value.set(debugObject.uDarkColorChange)
  })
gui.addColor(debugObject, 'uBrightColor').onChange(() => {
  tintShader.uniforms.uBrightColor.value.set(debugObject.uBrightColor)
})
gui.addColor(debugObject, 'uBrightColorChange').onChange(() => {
  tintShader.uniforms.uBrightColorChange.value.set(
    debugObject.uBrightColorChange
  )
})
gui.addColor(debugObject, 'uDarkColor').onChange(() => {
  tintShader.uniforms.uDarkColor.value.set(debugObject.uDarkColor)
})
gui.addColor(debugObject, 'uDarkColorChange').onChange(() => {
  tintShader.uniforms.uDarkColorChange.value.set(debugObject.uDarkColorChange)
})
/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update()

  // Update points only when the scene is ready
  if (sceneReady) {
    // Go through each point
    for (const point of points) {
      // Get 2D screen position
      const screenPosition = point.position.clone()
      screenPosition.project(camera)

      // Set the raycaster
      raycaster.setFromCamera(screenPosition, camera)
      const intersects = raycaster.intersectObjects(scene.children, true)

      // No intersect found
      if (intersects.length === 0) {
        // Show
        point.element.classList.add('visible')
      }

      // Intersect found
      else {
        // Get the distance of the intersection and the distance of the point
        const intersectionDistance = intersects[0].distance
        const pointDistance = point.position.distanceTo(camera.position)

        // Intersection is close than the point
        if (intersectionDistance < pointDistance) {
          // Hide
          point.element.classList.remove('visible')
        }
        // Intersection is further than the point
        else {
          // Show
          point.element.classList.add('visible')
        }
      }

      const translateX = screenPosition.x * sizes.width * 0.5
      const translateY = -screenPosition.y * sizes.height * 0.5
      point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
    }
  }

  // Render
  // renderer.render(scene, camera)
  effectComposer.render()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
