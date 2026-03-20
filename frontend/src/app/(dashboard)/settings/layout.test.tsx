import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsLayout from './layout';

const usePathnameMock = vi.fn(() => '/settings/profile');

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.PropsWithChildren<{ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

describe('SettingsLayout', () => {
  it('gives the active settings tab an explicit selected state', () => {
    render(
      <SettingsLayout>
        <div>Content</div>
      </SettingsLayout>,
    );

    const activeTab = screen.getByRole('link', { name: 'Profile' });
    const inactiveTab = screen.getByRole('link', { name: 'Preferences' });

    expect(activeTab).toHaveAttribute('aria-current', 'page');
    expect(activeTab.className).toContain('bg-background');
    expect(activeTab.className).toContain('shadow-sm');
    expect(inactiveTab).not.toHaveAttribute('aria-current');
  });
});
