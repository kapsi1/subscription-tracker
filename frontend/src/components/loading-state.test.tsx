import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './loading-state';

describe('LoadingState', () => {
  it('should render default loading message', () => {
    render(<LoadingState />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render custom message', () => {
    render(<LoadingState message="Fetching subscriptions..." />);

    expect(screen.getByText('Fetching subscriptions...')).toBeInTheDocument();
  });
});
