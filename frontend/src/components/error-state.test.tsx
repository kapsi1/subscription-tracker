import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ErrorState } from './error-state';

afterEach(() => {
  cleanup();
});

describe('ErrorState', () => {
  it('should render default title and message', () => {
    render(<ErrorState message="Network error" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should render custom title', () => {
    render(<ErrorState title="Server Error" message="500 Internal Server Error" />);

    expect(screen.getByText('Server Error')).toBeInTheDocument();
    expect(screen.getByText('500 Internal Server Error')).toBeInTheDocument();
  });

  it('should render retry button and fire callback on click', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Something failed" onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: 'Try Again' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorState message="Something failed" />);

    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });
});
