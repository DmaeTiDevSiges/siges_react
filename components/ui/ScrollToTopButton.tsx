import React from 'react';
import { FiChevronUp } from 'react-icons/fi';

interface ScrollToTopButtonProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ scrollContainerRef }) => {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setVisible(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 md:bottom-8 md:right-6"
      aria-label="Voltar ao topo"
    >
      <FiChevronUp className="w-5 h-5" />
    </button>
  );
};
