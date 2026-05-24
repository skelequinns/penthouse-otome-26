import { useState, useEffect } from 'react';

export interface WindowSize {
    width: number;
    height: number;
}

/**
 * Returns live viewport dimensions, re-rendering the consumer on every resize.
 * Initialises synchronously from window so there's no layout flash on first paint.
 */
export function useWindowSize(): WindowSize {
    const [size, setSize] = useState<WindowSize>(() => ({
        width:  typeof window !== 'undefined' ? window.innerWidth  : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    }));

    useEffect(() => {
        const handle = () =>
            setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handle);
        return () => window.removeEventListener('resize', handle);
    }, []);

    return size;
}

/**
 * Breakpoint constants.
 *
 * TABLET  — viewport width < 1024px  (three-column layout collapses)
 *
 * Narrow / mobile is post-launch; only TABLET is active in this build.
 */
export const BP = {
    TABLET: 1024,
} as const;
