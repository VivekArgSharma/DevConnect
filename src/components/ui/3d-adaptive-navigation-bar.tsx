import React, { useState, useRef, useEffect } from 'react'
import { motion, useSpring, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavItem {
  label: string
  id: string
  path: string
}

export const PillBase: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeSection, setActiveSection] = useState('home')
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSectionRef = useRef('home')

  // ✅ CHATS ADDED HERE
  const navItems: NavItem[] = [
    { label: 'Home', id: 'home', path: '/' },
    { label: 'Projects', id: 'projects', path: '/projects' },
    { label: 'Blogs', id: 'blogs', path: '/blogs' },
    { label: 'Post', id: 'post', path: '/post' },
    { label: 'Profile', id: 'profile', path: '/profile' },
    { label: 'Chats', id: 'chats', path: '/chats' }, // ✅ NEW
  ]

  // smooth animation
  const pillWidth = useSpring(140, { stiffness: 220, damping: 25 })
  const pillShift = useSpring(0, { stiffness: 220, damping: 25 })

  // update active section when route changes
  useEffect(() => {
    const path = location.pathname
    const match = navItems.find(n => n.path === path)
    if (match) setActiveSection(match.id)
  }, [location.pathname])

  // expand when hovered
  useEffect(() => {
    if (hovering) {
      setExpanded(true)
      pillWidth.set(620) // ✅ slightly wider to fit Chats nicely
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false)
        pillWidth.set(140)
      }, 500)
    }
  }, [hovering])

  const handleClick = (item: NavItem) => {
    if (item.id === activeSection) return

    const currentIndex = navItems.findIndex(n => n.id === activeSection)
    const targetIndex = navItems.findIndex(n => n.id === item.id)
    const dir = targetIndex > currentIndex ? 1 : -1

    setIsTransitioning(true)
    prevSectionRef.current = activeSection
    setActiveSection(item.id)

    pillShift.set(dir * 12)
    setTimeout(() => pillShift.set(0), 260)

    navigate(item.path)
    setTimeout(() => setIsTransitioning(false), 390)
  }

  const activeItem = navItems.find(n => n.id === activeSection)

  return (
    <motion.nav
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative rounded-full"
      ref={containerRef}
      style={{
        width: pillWidth,
        height: "56px",
        background: `
          linear-gradient(135deg,
            #fcfcfd 0%,
            #f8f8fa 15%,
            #f3f4f6 35%,
            #eeeff2 55%,
            #e9eaed 70%,
            #e2e3e6 100%
          )
        `,
        boxShadow: expanded
          ? `0 6px 14px rgba(0,0,0,0.18), inset 0 2px 2px rgba(255,255,255,0.8)`
          : `0 4px 10px rgba(0,0,0,0.12), inset 0 2px 1px rgba(255,255,255,0.65)`,
        x: pillShift,
        overflow: "hidden",
        transition: "box-shadow 0.25s ease",
      }}
    >

      {/* ------------------------------
          ACTIVE LABEL (when NOT hovered)
      ------------------------------ */}
      {!expanded && activeItem && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.span
              key={activeItem.id}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#1a1a1a",
                letterSpacing: "0.4px",
                whiteSpace: "nowrap",
              }}
            >
              {activeItem.label}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      {/* ------------------------------
         EXPANDED MENU (on hover)
      ------------------------------ */}
      {expanded && (
        <div className="relative z-10 flex items-center justify-evenly w-full h-full px-5">
          {navItems.map((item, index) => {
            const isActive = item.id === activeSection

            return (
              <motion.button
                key={item.id}
                onClick={() => handleClick(item)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: index * 0.06, duration: 0.2 }}
                className="cursor-pointer bg-transparent border-none outline-none"
                style={{
                  fontSize: isActive ? "16px" : "15px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#1a1a1a" : "#777",
                }}
              >
                {item.label}
              </motion.button>
            )
          })}
        </div>
      )}

    </motion.nav>
  )
}
