/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollPan } from './useScrollPan';

// Mock container element
const createMockContainer = (
  scrollWidth = 1200,
  scrollHeight = 800,
  clientWidth = 800,
  clientHeight = 600
) => ({
  scrollLeft: 0,
  scrollTop: 0,
  scrollWidth,
  scrollHeight,
  clientWidth,
  clientHeight,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  getBoundingClientRect: vi.fn(() => ({
    left: 100,
    top: 100,
    width: clientWidth,
    height: clientHeight,
  })),
});

describe('useScrollPan', () => {
  let mockContainer: ReturnType<typeof createMockContainer>;

  beforeEach(() => {
    mockContainer = createMockContainer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useScrollPan());

      expect(result.current.isPanning).toBe(false);
      expect(result.current.scrollPosition).toEqual({ x: 0, y: 0 });
      expect(typeof result.current.attachContainer).toBe('function');
      expect(typeof result.current.scrollTo).toBe('function');
      expect(typeof result.current.centerContent).toBe('function');
    });

    it('should accept optional onPageBoundary callback', () => {
      const mockPageBoundary = vi.fn();
      const { result } = renderHook(() => useScrollPan(mockPageBoundary));

      expect(result.current.isPanning).toBe(false);
      expect(typeof result.current.attachContainer).toBe('function');
    });
  });

  describe('container attachment', () => {
    it('should attach event listeners to container', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      expect(mockContainer.addEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('wheel', expect.any(Function), {
        passive: false,
      });
      expect(mockContainer.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should clean up event listeners on detach', () => {
      const { result, unmount } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      unmount();

      expect(mockContainer.removeEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
      expect(mockContainer.removeEventListener).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(mockContainer.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });
  });

  describe('programmatic scrolling', () => {
    it('should scroll to specific coordinates', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      act(() => {
        result.current.scrollTo(100, 50);
      });

      expect(mockContainer.scrollLeft).toBe(100);
      expect(mockContainer.scrollTop).toBe(50);
    });

    it('should center content in viewport', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      act(() => {
        result.current.centerContent();
      });

      // Expected: (scrollWidth - clientWidth) / 2, (scrollHeight - clientHeight) / 2
      expect(mockContainer.scrollLeft).toBe(200); // (1200 - 800) / 2
      expect(mockContainer.scrollTop).toBe(100); // (800 - 600) / 2
    });

    it('should not center if content fits in viewport', () => {
      mockContainer = createMockContainer(600, 400, 800, 600); // Content smaller than viewport
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      act(() => {
        result.current.centerContent();
      });

      expect(mockContainer.scrollLeft).toBe(0);
      expect(mockContainer.scrollTop).toBe(0);
    });
  });

  describe('mouse panning', () => {
    it('should start panning on mousedown', () => {
      const { result } = renderHook(() => useScrollPan());
      let mouseDownHandler: (event: MouseEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'mousedown') mouseDownHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 150,
        button: 0,
      });

      act(() => {
        mouseDownHandler!(mouseEvent);
      });

      expect(result.current.isPanning).toBe(true);
    });

    it('should not start panning on right-click', () => {
      const { result } = renderHook(() => useScrollPan());
      let mouseDownHandler: (event: MouseEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'mousedown') mouseDownHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      const mouseEvent = new MouseEvent('mousedown', {
        clientX: 200,
        clientY: 150,
        button: 2, // Right button
      });

      act(() => {
        mouseDownHandler!(mouseEvent);
      });

      expect(result.current.isPanning).toBe(false);
    });
  });

  describe('wheel scrolling', () => {
    it('should handle vertical wheel scrolling', () => {
      const { result } = renderHook(() => useScrollPan());
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
        deltaX: 0,
      });

      act(() => {
        wheelHandler!(wheelEvent);
      });

      expect(mockContainer.scrollTop).toBe(100);
    });

    it('should handle horizontal wheel scrolling', () => {
      const { result } = renderHook(() => useScrollPan());
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 0,
        deltaX: 50,
      });

      act(() => {
        wheelHandler!(wheelEvent);
      });

      expect(mockContainer.scrollLeft).toBe(50);
    });

    it('should prevent default wheel behavior', () => {
      const { result } = renderHook(() => useScrollPan());
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 100,
      });
      const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');

      act(() => {
        wheelHandler!(wheelEvent);
      });

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('scroll position tracking', () => {
    it('should update scroll position on scroll events', () => {
      const { result } = renderHook(() => useScrollPan());
      let scrollHandler: (event: Event) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'scroll') scrollHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Simulate scroll position change
      mockContainer.scrollLeft = 150;
      mockContainer.scrollTop = 75;

      act(() => {
        scrollHandler!(new Event('scroll'));
      });

      expect(result.current.scrollPosition).toEqual({ x: 150, y: 75 });
    });
  });

  describe('keyboard navigation', () => {
    it('should scroll with arrow keys', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Simulate arrow key presses
      act(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
        document.dispatchEvent(keyEvent);
      });

      expect(mockContainer.scrollLeft).toBeGreaterThan(0);
    });

    it('should scroll with page up/down keys', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      act(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: 'PageDown' });
        document.dispatchEvent(keyEvent);
      });

      expect(mockContainer.scrollTop).toBeGreaterThan(0);
    });

    it('should scroll to home/end positions', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // First scroll somewhere
      mockContainer.scrollLeft = 100;
      mockContainer.scrollTop = 100;

      act(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: 'Home' });
        document.dispatchEvent(keyEvent);
      });

      expect(mockContainer.scrollLeft).toBe(0);
      expect(mockContainer.scrollTop).toBe(0);
    });
  });

  describe('boundary checks', () => {
    it('should not scroll beyond boundaries', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Try to scroll beyond maximum
      act(() => {
        result.current.scrollTo(2000, 1500); // Beyond scrollWidth/Height
      });

      expect(mockContainer.scrollLeft).toBeLessThanOrEqual(
        mockContainer.scrollWidth - mockContainer.clientWidth
      );
      expect(mockContainer.scrollTop).toBeLessThanOrEqual(
        mockContainer.scrollHeight - mockContainer.clientHeight
      );
    });

    it('should not scroll to negative values', () => {
      const { result } = renderHook(() => useScrollPan());

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      act(() => {
        result.current.scrollTo(-100, -50);
      });

      expect(mockContainer.scrollLeft).toBe(0);
      expect(mockContainer.scrollTop).toBe(0);
    });
  });

  describe('page boundary detection', () => {
    it('should call onPageBoundary when scrolling past bottom', () => {
      const mockPageBoundary = vi.fn();
      const { result } = renderHook(() => useScrollPan(mockPageBoundary));
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Set container to bottom position
      mockContainer.scrollTop = mockContainer.scrollHeight - mockContainer.clientHeight; // 200 (max scroll)

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 50, // Trying to scroll down further
      });

      act(() => {
        wheelHandler!(wheelEvent);
      });

      expect(mockPageBoundary).toHaveBeenCalledWith('next');
    });

    it('should call onPageBoundary when scrolling past top', () => {
      const mockPageBoundary = vi.fn();
      const { result } = renderHook(() => useScrollPan(mockPageBoundary));
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Set container to top position
      mockContainer.scrollTop = 0;

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -50, // Trying to scroll up further
      });

      act(() => {
        wheelHandler!(wheelEvent);
      });

      expect(mockPageBoundary).toHaveBeenCalledWith('prev');
    });

    it('should not call onPageBoundary for normal scrolling', () => {
      const mockPageBoundary = vi.fn();
      const { result } = renderHook(() => useScrollPan(mockPageBoundary));
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Set container to middle position
      mockContainer.scrollTop = 100;

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 50, // Normal scroll down
      });

      act(() => {
        wheelHandler!(wheelEvent);
      });

      expect(mockPageBoundary).not.toHaveBeenCalled();
      expect(mockContainer.scrollTop).toBe(150); // Should scroll normally
    });

    it('should handle keyboard arrow keys with page boundaries', () => {
      const mockPageBoundary = vi.fn();
      const { result } = renderHook(() => useScrollPan(mockPageBoundary));

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      // Set container to bottom position
      mockContainer.scrollTop = mockContainer.scrollHeight - mockContainer.clientHeight;

      act(() => {
        const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
        document.dispatchEvent(keyEvent);
      });

      expect(mockPageBoundary).toHaveBeenCalledWith('next');
    });

    it('should not call onPageBoundary if callback is not provided', () => {
      const { result } = renderHook(() => useScrollPan()); // No callback
      let wheelHandler: (event: WheelEvent) => void;

      mockContainer.addEventListener = vi.fn((event, handler) => {
        if (event === 'wheel') wheelHandler = handler as any;
      });

      act(() => {
        result.current.attachContainer(mockContainer as unknown as HTMLElement);
      });

      mockContainer.scrollTop = mockContainer.scrollHeight - mockContainer.clientHeight;

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: 50,
      });

      act(() => {
        wheelHandler!(wheelEvent);
      });

      // Should not throw error and should scroll normally
      expect(mockContainer.scrollTop).toBe(200); // Clamped to max
    });
  });
});
