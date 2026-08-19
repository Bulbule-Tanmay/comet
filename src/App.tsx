import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import cometLogo from '@/imports/comet_logo.png'

gsap.registerPlugin(ScrollTrigger)

const ORANGE = '#e8390e'
const ORANGE_N = 0xe8390e

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ─── Three.js helpers ─────────────────────────────────────────────────────────

function makeRing(radius: number, segments: number, color: number, opacity: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0))
  }
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), mat)
}

function makeCrosshair3D(size: number, opacity = 0.55): THREE.Group {
  const g = new THREE.Group()
  const mat = new THREE.LineBasicMaterial({ color: ORANGE_N, transparent: true, opacity })
  const gap = size * 0.3
  const segs: [[number, number, number], [number, number, number]][] = [
    [[-size, 0, 0], [-gap, 0, 0]],
    [[gap, 0, 0], [size, 0, 0]],
    [[0, -size, 0], [0, -gap, 0]],
    [[0, gap, 0], [0, size, 0]],
  ]
  for (const [a, b] of segs) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...a),
      new THREE.Vector3(...b),
    ])
    g.add(new THREE.Line(geo, mat.clone()))
  }
  const dm = new THREE.MeshBasicMaterial({ color: ORANGE_N, transparent: true, opacity })
  const dg = new THREE.SphereGeometry(size * 0.1, 5, 5)
  for (const p of [[-size, 0, 0], [size, 0, 0], [0, -size, 0], [0, size, 0]] as [number, number, number][]) {
    const dot = new THREE.Mesh(dg, dm.clone())
    dot.position.set(...p)
    g.add(dot)
  }
  return g
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ACTIVITIES = [
  { icon: '⚡', label: 'Hackathons', desc: 'Build fast, ship real. Multi-day intense events where teams create working products from scratch under pressure.' },
  { icon: '🏆', label: 'Coding Competitions', desc: 'Algorithm challenges, competitive programming, and inter-college battles to sharpen your edge.' },
  { icon: '🛠', label: 'Workshops', desc: 'Hands-on sessions by peers and professionals — tools, frameworks, and emerging tech, practically taught.' },
  { icon: '🚀', label: 'Real-World Projects', desc: 'Ship products that actually matter. Build software used by real people, not just your professor.' },
  { icon: '🧩', label: 'Technical Challenges', desc: 'Weekly and monthly challenges that keep your skills sharp and your portfolio growing continuously.' },
  { icon: '🏢', label: 'Industry Activities', desc: 'Connect with companies, attend engineer talks, and build relationships that open real career doors.' },
]

const STATS = [
  { value: '200+', label: 'Active Members' },
  { value: '30+', label: 'Events Yearly' },
  { value: '15+', label: 'Industry Partners' },
  { value: '5', label: 'Years Running' },
]

const PRIZES = [
  { title: 'Grand Prize', desc: 'Biggest audience traction and growth momentum — cash and a Times Square billboard', tag: 'Cash + Billboard' },
  { title: '#BuildInPublic Award', desc: 'For the builder who documents and shares their journey publicly throughout the event', tag: 'Recognition' },
  { title: 'Next Gen Award', desc: 'Exclusive prize category for student builders — no developer account required', tag: 'Students Only' },
  { title: 'Best Game Award', desc: 'Top game app with the biggest positive player impact and most creative mechanics', tag: 'Gaming' },
  { title: 'Conflict of Interest', desc: 'Most creative revenue model — for student submissions that surprise the judges', tag: 'Business' },
]

// ─── Scramble text ────────────────────────────────────────────────────────────

const SCRAMBLE_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!$%&*<>?/'

function ScrambleLetter({
  char,
  delay,
  duration = 320,
  targetColor,
}: {
  char: string
  delay: number
  duration?: number
  targetColor: string
}) {
  const [display, setDisplay] = useState(' ')
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    let rafId: number
    let start: number | null = null

    const tid = setTimeout(() => {
      if (char === '.') {
        setDisplay(char)
        setLocked(true)
        return
      }
      const tick = (now: number) => {
        if (!start) start = now
        const elapsed = now - start
        if (elapsed >= duration) {
          setDisplay(char)
          setLocked(true)
          return
        }
        setDisplay(SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)])
        rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(tid)
      cancelAnimationFrame(rafId)
    }
  }, [char, delay, duration])

  return (
    <span
      style={{
        display: 'inline-block',
        color: locked ? targetColor : ORANGE,
        transition: locked ? 'color 0.12s ease' : 'none',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {display}
    </span>
  )
}

function ScrambleWord({
  word,
  startDelay,
  color,
}: {
  word: string
  startDelay: number
  color: string
}) {
  return (
    <>
      {word.split('').map((char, i) => (
        <ScrambleLetter
          key={i}
          char={char}
          delay={startDelay + i * 52}
          duration={char === '.' ? 0 : 300}
          targetColor={color}
        />
      ))}
    </>
  )
}

// ─── SVG Crosshair (HTML) ─────────────────────────────────────────────────────

function CrosshairSVG({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <line x1="20" y1="2" x2="20" y2="15" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="25" x2="20" y2="38" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="2" y1="20" x2="15" y2="20" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="25" y1="20" x2="38" y2="20" stroke={ORANGE} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="2" r="2" fill={ORANGE} />
      <circle cx="20" cy="38" r="2" fill={ORANGE} />
      <circle cx="2" cy="20" r="2" fill={ORANGE} />
      <circle cx="38" cy="20" r="2" fill={ORANGE} />
      <circle cx="9" cy="9" r="1.5" fill={ORANGE} opacity="0.45" />
      <circle cx="31" cy="9" r="1.5" fill={ORANGE} opacity="0.45" />
      <circle cx="9" cy="31" r="1.5" fill={ORANGE} opacity="0.45" />
      <circle cx="31" cy="31" r="1.5" fill={ORANGE} opacity="0.45" />
    </svg>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [navSolid, setNavSolid] = useState(false)
  const isMobile = window.innerWidth < 768

  // Nav transparency: stays invisible over the 3D hero, solidifies over content
  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > window.innerHeight * 2.5)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── Three.js + GSAP scroll engine ──────────────────────────────────────────
  useEffect(() => {
    if (isMobile || !canvasRef.current || !heroRef.current) return

    const canvas = canvasRef.current
    let W = window.innerWidth, H = window.innerHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))

    // Scene + Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200)
    camera.position.set(0, 0, 10)

    // ── Particles ──────────────────────────────────────────────────────────
    const N = 2600
    const pPos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 80
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 45
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 80
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({ size: 0.04, color: 0xffffff, transparent: true, opacity: 0.4, sizeAttenuation: true })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    // ── Rings ──────────────────────────────────────────────────────────────
    // Camera starts at z=10 and flies to z=-2.
    // ring1 sits at z=5 → camera flies THROUGH it at scroll progress ≈ 0.42
    // ring2 sits at z=-1 → camera approaches but doesn't reach it
    const ring1 = makeRing(3.5, 120, 0xffffff, 0.07)
    ring1.position.z = 5

    const ring2 = makeRing(5.5, 120, ORANGE_N, 0.12)
    ring2.rotation.x = Math.PI * 0.28
    ring2.position.z = -1

    const ring3 = makeRing(9.5, 120, 0x1a1a1a, 0.7)
    ring3.rotation.x = Math.PI / 2
    ring3.position.z = -10

    scene.add(ring1, ring2, ring3)

    // ── Floating crosshairs ────────────────────────────────────────────────
    const chDefs: [number, number, number][] = [
      [4.5, 2, 1], [-3.5, -1.5, 0], [5.5, -3, -4], [-4.5, 3.5, -3],
      [2.5, 4, -8], [-2, -4.5, -7], [6.5, -0.5, -13], [-5.5, 2.5, -16],
    ]
    const crosshairs = chDefs.map(([x, y, z], i) => {
      const size = 0.28 + (i % 3) * 0.18
      const ch = makeCrosshair3D(size, 0.3 + Math.random() * 0.35)
      ch.position.set(x, y, z)
      ch.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      scene.add(ch)
      return { mesh: ch, speed: 0.4 + Math.random() * 0.7 }
    })

    // ── Scroll state ───────────────────────────────────────────────────────
    let targetP = 0, currentP = 0

    ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => { targetP = self.progress },
    })

    // ── Hero HTML — label/tagline/cta on load; scramble handles the words ────
    gsap.set('.hero-label', { opacity: 0, y: -14 })
    gsap.set('.hero-tagline', { opacity: 0, y: 18 })
    gsap.set('.hero-cta-group', { opacity: 0, y: 12 })
    gsap.set('.hero-hint', { opacity: 0 })

    // INNOVATE. ends at ~950 + 8*52 + 300 = ~1666ms → tagline at ~1.8s
    const entranceTl = gsap.timeline({ delay: 0.15 })
    entranceTl
      .to('.hero-label', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
      .to('.hero-tagline', { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 1.65)
      .to('.hero-cta-group', { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }, '-=0.35')
      .to('.hero-hint', { opacity: 0.3, duration: 0.5 }, '-=0.2')

    // ── Section reveals ────────────────────────────────────────────────────
    gsap.set('.about-text-block', { opacity: 0, x: -55 })
    gsap.set('.about-image-wrap', { opacity: 0, x: 55 })
    ScrollTrigger.create({
      trigger: '#about',
      start: 'top 74%',
      onEnter: () => {
        gsap.to('.about-text-block', { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out' })
        gsap.to('.about-image-wrap', { opacity: 1, x: 0, duration: 1.1, delay: 0.15, ease: 'power3.out' })
      },
    })

    gsap.set('.activity-card', { opacity: 0, y: 50, clipPath: 'inset(100% 0 0 0)' })
    ScrollTrigger.create({
      trigger: '#activities',
      start: 'top 66%',
      onEnter: () =>
        gsap.to('.activity-card', {
          opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)',
          duration: 0.75, stagger: 0.09, ease: 'power3.out',
        }),
    })

    gsap.set('.shipaton-left', { opacity: 0, x: -55 })
    gsap.set('.shipaton-right', { opacity: 0, x: 55 })
    ScrollTrigger.create({
      trigger: '#shipaton',
      start: 'top 72%',
      onEnter: () => {
        gsap.to('.shipaton-left', { opacity: 1, x: 0, duration: 1.1, ease: 'power3.out' })
        gsap.to('.shipaton-right', { opacity: 1, x: 0, duration: 1.1, delay: 0.18, ease: 'power3.out' })
      },
    })

    gsap.set('.join-inner', { opacity: 0, y: 40 })
    ScrollTrigger.create({
      trigger: '#join',
      start: 'top 75%',
      onEnter: () => gsap.to('.join-inner', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }),
    })

    // ── RAF loop ───────────────────────────────────────────────────────────
    let rafId: number
    let t0: number | null = null

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick)
      if (document.hidden) return
      if (!t0) t0 = now
      const elapsed = (now - t0) * 0.001

      currentP = lerp(currentP, targetP, 0.05)
      const p = currentP

      // Camera: z=10 → z=-2. Passes through ring1.z=5 at p≈0.42
      camera.position.z = lerp(10, -2, p)
      camera.position.x = Math.sin(elapsed * 0.22) * 0.2 * (1 - p * 0.75)
      camera.position.y = Math.cos(elapsed * 0.17) * 0.13 * (1 - p * 0.75)
      camera.rotation.z = Math.sin(elapsed * 0.14) * 0.012

      // ring1 opacity: builds up, peaks at p≈0.35, fades as camera flies through
      const r1Op = p < 0.38
        ? lerp(0, 0.22, p / 0.38)
        : Math.max(0, 0.22 - (p - 0.38) * 0.55)
      ;(ring1.material as THREE.LineBasicMaterial).opacity = r1Op
      ring1.rotation.z = elapsed * 0.042 + p * 0.9
      ring1.scale.setScalar(1 + p * 0.08)

      // ring2 brightens as we approach it
      ;(ring2.material as THREE.LineBasicMaterial).opacity = Math.min(0.8, p * 1.05)
      ring2.rotation.y = elapsed * 0.026 + p * 0.5
      ring2.rotation.x = Math.PI * 0.28 + Math.sin(elapsed * 0.15) * 0.05 + p * 0.2

      // ring3: barely moves, gives distant sense of scale
      ring3.rotation.z = elapsed * 0.012

      // Crosshairs: idle rotation at different speeds
      crosshairs.forEach(({ mesh, speed }, i) => {
        mesh.rotation.z += 0.0022 * speed * (i % 2 === 0 ? 1 : -1)
        mesh.rotation.y += 0.0014 * speed
        mesh.rotation.x += 0.0009 * speed * (i % 3 === 0 ? 1 : -0.5)
      })

      // Particles: very slow drift
      particles.rotation.y = elapsed * 0.008 + p * 0.055
      particles.rotation.x = p * 0.022

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(tick)

    // Resize
    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      camera.aspect = W / H
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      ScrollTrigger.getAll().forEach((t) => t.kill())
      pGeo.dispose()
      pMat.dispose()
      renderer.dispose()
      window.removeEventListener('resize', onResize)
    }
  }, [isMobile])

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Three.js canvas — fixed background, behind everything */}
      {!isMobile && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        />
      )}

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: navSolid ? 'rgba(10,10,10,0.96)' : 'rgba(10,10,10,0.92)',
          backdropFilter: navSolid ? 'blur(14px)' : 'none',
          borderBottom: navSolid ? '1px solid #1a1a1a' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between h-16">
          <a href="#" className="flex items-center">
            <img src={cometLogo} alt="COMET" className="h-8 w-auto" />
          </a>

          <div className="hidden md:flex items-center gap-8">
            {([['About', '#about'], ['Activities', '#activities'], ['Events', '#shipaton'], ['Join', '#join']] as const).map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-[#888] hover:text-white transition-colors duration-200"
              >
                {label}
              </a>
            ))}
          </div>

          <a
            href="#join"
            className="hidden md:block px-5 py-2 text-sm font-semibold rounded text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: ORANGE }}
          >
            Join COMET
          </a>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1">
              <span className={`block h-0.5 bg-white/60 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-white/60 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-white/60 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-5 py-4 flex flex-col gap-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
            {([['About', '#about'], ['Activities', '#activities'], ['Events', '#shipaton'], ['Join', '#join']] as const).map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm text-[#888]"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <a
              href="#join"
              className="px-5 py-2 text-sm font-semibold rounded text-white text-center"
              style={{ background: ORANGE }}
              onClick={() => setMenuOpen(false)}
            >
              Join COMET
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO — 300vh pinned, scroll drives the 3D scene ─────────────────── */}
      <div
        ref={heroRef}
        style={{ height: isMobile ? '100vh' : '300vh', position: 'relative', zIndex: 1 }}
      >
        <div
          className="sticky top-0 h-screen overflow-hidden"
          style={{ perspective: '1000px' }}
        >
          {/* Subtle scanline overlay */}
          {!isMobile && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
                zIndex: 2,
              }}
            />
          )}

          {/* Mobile: static bg gradient */}
          {isMobile && (
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,57,14,0.1) 0%, transparent 70%)' }}
            />
          )}

          {/*
            Centering zone starts strictly BELOW the nav (top: 64px).
            This guarantees no content can ever reach into the nav band
            regardless of viewport height or content height.
          */}
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center"
            style={{ top: 64, zIndex: 3 }}
          >
            {/* Label */}
            <div className="hero-label flex items-center gap-3 mb-7">
              <CrosshairSVG size={15} />
              <span
                className="text-xs uppercase tracking-widest"
                style={{ color: ORANGE, fontFamily: 'JetBrains Mono, monospace' }}
              >
                Computer Dept. — Technical Club
              </span>
            </div>

            {/* Words — letter-scramble reveal on load */}
            <div>
              <div
                className="font-black block leading-none"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 'clamp(3.8rem, 12vw, 10rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                <ScrambleWord word="LEARN." startDelay={250} color="#ffffff" />
              </div>
              <div
                className="font-black block leading-none"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 'clamp(3.8rem, 12vw, 10rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                <ScrambleWord word="BUILD." startDelay={620} color={ORANGE} />
              </div>
              <div
                className="font-black block leading-none"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 'clamp(3.8rem, 12vw, 10rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                <ScrambleWord word="INNOVATE." startDelay={980} color="#ffffff" />
              </div>
            </div>

            {/* Tagline */}
            <div className="hero-tagline mt-9 flex flex-wrap gap-x-8 gap-y-2 justify-center">
              {['Learn.', 'Build.', 'Compete.', 'Innovate.'].map((w, i) => (
                <span
                  key={w}
                  className="font-black text-xl md:text-2xl"
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    color: i === 3 ? ORANGE : '#282828',
                    letterSpacing: '0.04em',
                  }}
                >
                  {w}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="hero-cta-group mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#join"
                className="px-8 py-3.5 text-sm font-semibold rounded text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: ORANGE }}
              >
                Join COMET →
              </a>
              <a
                href="#about"
                className="px-8 py-3.5 text-sm font-semibold rounded transition-colors hover:text-white"
                style={{ border: '1px solid #252525', color: '#666', background: 'transparent' }}
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="hero-hint absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
            <span
              className="text-xs uppercase tracking-widest"
              style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
            >
              scroll
            </span>
            <div className="w-px h-9 bg-gradient-to-b from-[#2a2a2a] to-transparent" />
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <section
        className="py-14 border-y border-[#181818]"
        style={{ background: '#0d0d0d', position: 'relative', zIndex: 2 }}
      >
        <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="font-black mb-1"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
                  color: ORANGE,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                className="text-xs text-[#555] uppercase tracking-widest"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────────────────── */}
      <section
        id="about"
        className="py-28"
        style={{ background: '#0a0a0a', position: 'relative', zIndex: 2 }}
      >
        <div className="max-w-6xl mx-auto px-5 grid md:grid-cols-2 gap-16 items-center">
          <div className="about-text-block">
            <div className="flex items-center gap-2 mb-6">
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: ORANGE, fontFamily: 'JetBrains Mono, monospace' }}
              >
                // about
              </span>
            </div>
            <h2
              className="font-black mb-7 leading-none"
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                letterSpacing: '-0.01em',
              }}
            >
              A COMMUNITY WHERE
              <br />
              <span style={{ color: ORANGE }}>YOU GROW.</span>
            </h2>
            <p className="text-[#888] leading-relaxed mb-5">
              COMET is a student-driven technical club of the Computer Department, built by students who love technology, learning, and creating things that matter.
            </p>
            <p className="text-[#888] leading-relaxed mb-5">
              We believe technology is best learned by doing. Through hackathons, coding competitions, workshops, and projects, we create opportunities for students to turn classroom theory into practical experience.
            </p>
            <p className="text-[#888] leading-relaxed">
              Whether you're just starting your technical journey or already building and experimenting — there's a place for you in COMET.
            </p>
          </div>

          <div className="about-image-wrap relative">
            <div
              className="rounded-2xl overflow-hidden relative aspect-[4/3]"
              style={{ border: '1px solid #1f1f1f', background: '#0e0e0e' }}
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&auto=format"
                alt="COMET members collaborating on laptops"
                className="w-full h-full object-cover"
                style={{ opacity: 0.55 }}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(232,57,14,0.13) 0%, rgba(10,10,10,0.62) 100%)' }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <blockquote
                  className="font-black text-xl text-white leading-tight"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                >
                  "Explore new technologies. Work with like-minded people. Build real-world projects."
                </blockquote>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 opacity-25 pointer-events-none">
              <CrosshairSVG size={38} />
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVITIES ────────────────────────────────────────────────────────── */}
      <section
        id="activities"
        className="py-28"
        style={{ background: '#0d0d0d', position: 'relative', zIndex: 2 }}
      >
        <div className="max-w-6xl mx-auto px-5">
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-5">
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: ORANGE, fontFamily: 'JetBrains Mono, monospace' }}
              >
                // what we do
              </span>
            </div>
            <h2
              className="font-black leading-none"
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 'clamp(2.4rem, 6vw, 5rem)',
                letterSpacing: '-0.02em',
              }}
            >
              6 WAYS TO LEVEL
              <br />
              <span style={{ color: ORANGE }}>UP YOUR SKILLS.</span>
            </h2>
          </div>

          {/* gap-px with bg creates hairline grid borders without box-shadow noise */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: '#1c1c1c' }}>
            {ACTIVITIES.map((act) => (
              <div
                key={act.label}
                className="activity-card group p-8 relative transition-colors duration-300"
                style={{ background: '#0d0d0d' }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'rgba(232,57,14,0.03)' }}
                />
                <div className="text-3xl mb-5">{act.icon}</div>
                <h3
                  className="font-black text-[1.1rem] mb-3 text-white"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.02em' }}
                >
                  {act.label}
                </h3>
                <p className="text-sm text-[#5a5a5a] leading-relaxed group-hover:text-[#777] transition-colors">
                  {act.desc}
                </p>
                <div
                  className="mt-5 h-px transition-all duration-400 group-hover:w-16"
                  style={{ background: ORANGE, width: '2rem' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SHIPATON 2026 ──────────────────────────────────────────────────────── */}
      <section
        id="shipaton"
        className="py-28 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 30% 50%, rgba(232,57,14,0.065) 0%, transparent 70%), #0a0a0a',
          zIndex: 2,
        }}
      >
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: ORANGE, fontFamily: 'JetBrains Mono, monospace' }}
            >
              // featured event
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div className="shipaton-left">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded mb-7 text-xs font-medium uppercase tracking-widest"
                style={{
                  border: `1px solid ${ORANGE}28`,
                  color: ORANGE,
                  background: `${ORANGE}0d`,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ORANGE }} />
                Open for Registration
              </div>

              <h2
                className="font-black leading-none mb-6"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 'clamp(3rem, 7vw, 6.5rem)',
                  letterSpacing: '-0.02em',
                }}
              >
                SHIPATON
                <br />
                <span style={{ color: ORANGE }}>2026</span>
              </h2>

              <p className="text-[#888] leading-relaxed mb-9 text-lg max-w-lg">
                The world's biggest mobile hackathon for people who actually ship. Launch real apps to real stores, compete for big prizes, and show the world what you built.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10 max-w-sm">
                {[
                  { label: 'Prize Pool', value: '$70k+' },
                  { label: 'Categories', value: '21' },
                  { label: 'Grand Prize', value: 'Cash + Billboard' },
                  { label: 'Eligible', value: 'All Students' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-4 rounded-lg"
                    style={{ background: '#111', border: '1px solid #1d1d1d' }}
                  >
                    <div
                      className="text-xs text-[#484848] mb-1 uppercase tracking-wider"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {item.label}
                    </div>
                    <div
                      className="font-bold text-base text-white"
                      style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#join"
                  className="px-7 py-3.5 font-semibold rounded text-white text-sm transition-all hover:brightness-110 active:scale-95"
                  style={{ background: ORANGE }}
                >
                  Register for Shipaton →
                </a>
                <a
                  href="#"
                  className="px-7 py-3.5 font-semibold rounded text-sm transition-colors hover:text-white"
                  style={{ border: '1px solid #252525', color: '#666', background: 'transparent' }}
                >
                  Read the FAQ
                </a>
              </div>
            </div>

            {/* Right: prize categories */}
            <div className="shipaton-right flex flex-col gap-3">
              {PRIZES.map((cat) => (
                <div
                  key={cat.title}
                  className="flex items-start gap-4 p-5 rounded-xl transition-all duration-200 group"
                  style={{ background: '#0f0f0f', border: '1px solid #1a1a1a' }}
                >
                  <div className="mt-0.5 shrink-0">
                    <CrosshairSVG size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <span
                        className="font-bold text-white text-[0.95rem]"
                        style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
                      >
                        {cat.title}
                      </span>
                      <span
                        className="text-xs shrink-0 px-2 py-0.5 rounded"
                        style={{
                          background: `${ORANGE}12`,
                          color: ORANGE,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {cat.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#4e4e4e] leading-relaxed group-hover:text-[#666] transition-colors">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── JOIN ──────────────────────────────────────────────────────────────── */}
      <section
        id="join"
        className="py-32 relative overflow-hidden"
        style={{ background: '#0d0d0d', borderTop: '1px solid #181818', zIndex: 2 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 55% 45% at 50% 50%, ${ORANGE}07 0%, transparent 70%)`,
          }}
        />
        <div className="join-inner relative max-w-3xl mx-auto px-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-7">
            <CrosshairSVG size={18} />
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: ORANGE, fontFamily: 'JetBrains Mono, monospace' }}
            >
              // join the crew
            </span>
            <CrosshairSVG size={18} />
          </div>

          <h2
            className="font-black leading-none mb-7"
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              letterSpacing: '-0.02em',
            }}
          >
            READY TO
            <br />
            <span style={{ color: ORANGE }}>LAUNCH?</span>
          </h2>

          <p className="text-[#777] text-lg leading-relaxed mb-11 max-w-lg mx-auto">
            Be part of a community that learns by doing. Whether you're a first-semester student or a final-year builder — there's a place for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:comet@example.com"
              className="px-9 py-4 font-semibold rounded text-white text-sm transition-all hover:brightness-110 active:scale-95"
              style={{ background: ORANGE }}
            >
              Apply to Join →
            </a>
            <a
              href="#activities"
              className="px-9 py-4 font-semibold rounded text-sm transition-colors hover:text-white"
              style={{ border: '1px solid #242424', color: '#666', background: 'transparent' }}
            >
              See What We Do
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: '#080808',
          borderTop: '1px solid #181818',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <img src={cometLogo} alt="COMET" className="h-8 w-auto mb-5" />
              <p className="text-sm text-[#484848] leading-relaxed max-w-sm">
                Student-driven technical club of the Computer Department. Built by students who love technology, learning, and creating things that matter.
              </p>
              <div className="flex gap-5 mt-6">
                {['GitHub', 'Instagram', 'LinkedIn'].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="text-xs text-[#3a3a3a] hover:text-[#777] transition-colors"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4
                className="text-xs text-[#444] uppercase tracking-widest mb-5"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Club
              </h4>
              <ul className="flex flex-col gap-3">
                {['About', 'Activities', 'Events', 'Shipaton 2026', 'Join'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#444] hover:text-[#777] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                className="text-xs text-[#444] uppercase tracking-widest mb-5"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Contact
              </h4>
              <ul className="flex flex-col gap-3">
                {['Email Us', 'Instagram DM', 'Campus Office'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#444] hover:text-[#777] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#161616] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p
              className="text-xs text-[#2e2e2e]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              © 2026 COMET — Computer Department Technical Club.
            </p>
            <div className="flex items-center gap-2">
              <CrosshairSVG size={11} />
              <span
                className="text-xs font-black"
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  color: ORANGE,
                  letterSpacing: '0.1em',
                }}
              >
                LEARN. BUILD. COMPETE. INNOVATE.
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
