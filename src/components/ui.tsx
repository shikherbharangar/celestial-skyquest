import { useEffect, useId, useRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { playSound } from '../services/audio';

export function Button({ children, className = '', onClick, ...props }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      type="button"
      className={`button ${className}`}
      whileTap={{ scale: 0.965, y: 1 }}
      transition={{ type: 'spring', stiffness: 460, damping: 18 }}
      onClick={(event) => {
        playSound('tap');
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
export function BackButton({
  onClick,
  label = 'Back to tonight',
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="back-button" onClick={onClick}>
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex="0"]',
        ) ?? [],
      ).filter((el) => !el.hasAttribute('disabled'));
    focusable()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key === 'Tab') {
        const items = focusable();
        if (event.shiftKey && document.activeElement === items[0]) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
          event.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={ref}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: 16, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25 }}
      >
        <div className="modal-top">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
export function Tag({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`tag ${className}`}>{children}</span>;
}
