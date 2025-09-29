import React from 'react'
import PropTypes from 'prop-types'
import { Heading, Text } from '@chakra-ui/react'
import { motion, useReducedMotion } from 'framer-motion'

const MotionSection = motion.section

const AuthShell = ({
  backgroundColor,
  title,
  subtitle,
  description,
  textColor,
  subtitleColor,
  children,
}) => {
  const prefersReducedMotion = useReducedMotion()

  const panelMotion = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
      }

  return (
    <div className="min-h-screen bg-background-page flex flex-col lg:flex-row font-sans">
      <aside
        className="hidden lg:flex lg:w-2/5 xl:w-5/12 relative overflow-hidden"
        style={{ backgroundColor }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/10 mix-blend-soft-light" />
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 space-y-6">
          <Heading as="h1" className="text-3xl font-semibold tracking-tight" style={{ color: textColor }}>
            {title}
          </Heading>
          {subtitle ? (
            <Text className="text-base leading-relaxed" style={{ color: subtitleColor }}>
              {subtitle}
            </Text>
          ) : null}
          {description ? (
            <Text className="text-sm leading-relaxed" style={{ color: subtitleColor }}>
              {description}
            </Text>
          ) : null}
        </div>
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-16 -left-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      </aside>

      <div className="flex-1 flex items-center justify-center px-6 py-12 sm:px-10">
        <MotionSection
          className="w-full max-w-xl bg-white/80 backdrop-blur shadow-lg rounded-3xl border border-white/60"
          {...panelMotion}
        >
          <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
        </MotionSection>
      </div>
    </div>
  )
}

AuthShell.propTypes = {
  backgroundColor: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  textColor: PropTypes.string,
  subtitleColor: PropTypes.string,
  children: PropTypes.node.isRequired,
}

AuthShell.defaultProps = {
  backgroundColor: '#0e1446',
  title: '',
  subtitle: '',
  description: '',
  textColor: '#f8fafc',
  subtitleColor: 'rgba(255, 255, 255, 0.72)',
}

export default AuthShell
