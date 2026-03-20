import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toaster } from './sonner';

const sonnerMock = vi.fn((_props: { style?: Record<string, string> }) => (
  <div data-testid="sonner-root" />
));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', resolvedTheme: 'light' }),
}));

vi.mock('sonner', () => ({
  Toaster: (props: { style?: Record<string, string> }) => sonnerMock(props),
}));

describe('Toaster', () => {
  it('uses darker light-mode toast colors with dark text', () => {
    render(<Toaster />);

    expect(sonnerMock).toHaveBeenCalledTimes(1);

    const props = sonnerMock.mock.calls[0][0];

    expect(props?.style?.['--normal-text']).toBe('var(--foreground)');
    expect(props?.style?.['--success-text']).toBe('var(--foreground)');
    expect(props?.style?.['--info-text']).toBe('var(--foreground)');
    expect(props?.style?.['--warning-text']).toBe('var(--foreground)');
    expect(props?.style?.['--error-text']).toBe('var(--foreground)');
    expect(props?.style?.['--success-bg']).toBeDefined();
    expect(props?.style?.['--error-bg']).toBeDefined();
    expect(props?.style?.['--warning-bg']).toBeDefined();
    expect(props?.style?.['--info-bg']).toBeDefined();
  });
});
