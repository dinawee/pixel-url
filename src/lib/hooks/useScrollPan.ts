import { useState, useEffect, useRef, useCallback } from 'react';

export interface ScrollPosition {
  x: number;
  y: number;
}

export interface UseScrollPanReturn {
  isPanning: boolean;
  scrollPosition: ScrollPosition;
  attachContainer: (container: HTMLElement | null) => void;
  scrollTo: (x: number, y: number) => void;
  centerContent: () => void;
  onPageBoundary?: (direction: 'next' | 'prev') => void;
}

const SCROLL_STEP = 50;
const PAGE_SCROLL_FACTOR = 0.8;

export const useScrollPan = (onPageBoundary?: (direction: 'next' | 'prev') => void): UseScrollPanReturn => {
  const [isPanning, setIsPanning] = useState(false);
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollX: number; scrollY: number } | null>(null);

  const checkPageBoundaries = useCallback((newY: number, currentY: number) => {
    const container = containerRef.current;
    if (!container || !onPageBoundary) return false;

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const isAtBottom = currentY >= maxScrollTop && newY > currentY;
    const isAtTop = currentY <= 0 && newY < currentY;

    if (isAtBottom) {
      onPageBoundary('next');
      return true;
    } else if (isAtTop) {
      onPageBoundary('prev');
      return true;
    }

    return false;
  }, [onPageBoundary]);

  const scrollTo = useCallback((x: number, y: number) => {
    const container = containerRef.current;
    if (!container) return;

    // Clamp values to valid scroll range
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const maxScrollTop = container.scrollHeight - container.clientHeight;

    const clampedX = Math.max(0, Math.min(x, maxScrollLeft));
    const clampedY = Math.max(0, Math.min(y, maxScrollTop));

    container.scrollLeft = clampedX;
    container.scrollTop = clampedY;

    setScrollPosition({ x: clampedX, y: clampedY });
  }, []);

  const centerContent = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const centerX = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
    const centerY = Math.max(0, (container.scrollHeight - container.clientHeight) / 2);

    scrollTo(centerX, centerY);
  }, [scrollTo]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    // Only handle left mouse button
    if (event.button !== 0) return;

    const container = containerRef.current;
    if (!container) return;

    event.preventDefault();
    setIsPanning(true);

    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollX: container.scrollLeft,
      scrollY: container.scrollTop,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!panStartRef.current) return;

      const deltaX = panStartRef.current.x - moveEvent.clientX;
      const deltaY = panStartRef.current.y - moveEvent.clientY;

      scrollTo(
        panStartRef.current.scrollX + deltaX,
        panStartRef.current.scrollY + deltaY
      );
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      panStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [scrollTo]);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const deltaX = event.deltaX;
    const deltaY = event.deltaY;
    const newY = container.scrollTop + deltaY;

    // Check if we're trying to scroll beyond page boundaries
    if (checkPageBoundaries(newY, container.scrollTop)) {
      return; // Page boundary handler will manage the transition
    }

    scrollTo(
      container.scrollLeft + deltaX,
      newY
    );
  }, [scrollTo, checkPageBoundaries]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    setScrollPosition({
      x: container.scrollLeft,
      y: container.scrollTop,
    });
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const container = containerRef.current;
    if (!container) return;

    let deltaX = 0;
    let deltaY = 0;

    switch (event.key) {
      case 'ArrowLeft':
        deltaX = -SCROLL_STEP;
        break;
      case 'ArrowRight':
        deltaX = SCROLL_STEP;
        break;
      case 'ArrowUp':
        deltaY = -SCROLL_STEP;
        // Check if we're trying to scroll beyond page boundaries
        if (checkPageBoundaries(container.scrollTop + deltaY, container.scrollTop)) {
          return; // Page boundary handler will manage the transition
        }
        break;
      case 'ArrowDown':
        deltaY = SCROLL_STEP;
        // Check if we're trying to scroll beyond page boundaries
        if (checkPageBoundaries(container.scrollTop + deltaY, container.scrollTop)) {
          return; // Page boundary handler will manage the transition
        }
        break;
      case 'PageUp':
        deltaY = -container.clientHeight * PAGE_SCROLL_FACTOR;
        break;
      case 'PageDown':
        deltaY = container.clientHeight * PAGE_SCROLL_FACTOR;
        break;
      case 'Home':
        scrollTo(0, 0);
        return;
      case 'End':
        scrollTo(
          container.scrollWidth - container.clientWidth,
          container.scrollHeight - container.clientHeight
        );
        return;
      default:
        return;
    }

    if (deltaX !== 0 || deltaY !== 0) {
      event.preventDefault();
      scrollTo(
        container.scrollLeft + deltaX,
        container.scrollTop + deltaY
      );
    }
  }, [scrollTo, checkPageBoundaries]);

  const attachContainer = useCallback((container: HTMLElement | null) => {
    // Clean up previous container
    if (containerRef.current) {
      containerRef.current.removeEventListener('mousedown', handleMouseDown);
      containerRef.current.removeEventListener('wheel', handleWheel);
      containerRef.current.removeEventListener('scroll', handleScroll);
      document.removeEventListener('keydown', handleKeyDown);
    }

    containerRef.current = container;

    // Attach to new container
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('scroll', handleScroll);
      document.addEventListener('keydown', handleKeyDown);

      // Update initial scroll position
      setScrollPosition({
        x: container.scrollLeft,
        y: container.scrollTop,
      });
    }
  }, [handleMouseDown, handleWheel, handleScroll, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
        containerRef.current.removeEventListener('wheel', handleWheel);
        containerRef.current.removeEventListener('scroll', handleScroll);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handleMouseDown, handleWheel, handleScroll, handleKeyDown]);

  return {
    isPanning,
    scrollPosition,
    attachContainer,
    scrollTo,
    centerContent,
  };
};