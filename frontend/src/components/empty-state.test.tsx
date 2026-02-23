import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EmptyState } from './empty-state';

afterEach(() => {
  cleanup();
});

describe('EmptyState', () => {
  it('should render title and description', () => {
    render(<EmptyState title="No items" description="Try adding something" />);

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Try adding something')).toBeInTheDocument();
  });

  it('should render action button when actionLabel and onAction provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No items"
        description="Try adding something"
        actionLabel="Add Item"
        onAction={onAction}
      />,
    );

    const button = screen.getByRole('button', { name: 'Add Item' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when actionLabel is missing', () => {
    render(<EmptyState title="No items" description="Nothing here" />);

    expect(screen.queryByText('Add Item')).not.toBeInTheDocument();
  });
});
