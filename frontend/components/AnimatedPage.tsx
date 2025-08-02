import React from 'react';
import { motion, Transition } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    x: '100vw',
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: '-100vw',
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  variants?: typeof pageVariants;
}

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className, variants = pageVariants }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={variants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;