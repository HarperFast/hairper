import { useStepperInput } from 'ink-stepper';
import { render } from 'ink-testing-library';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderStep } from './ProviderStep';

vi.mock('ink-stepper', () => ({
	useStepperInput: vi.fn(),
}));

describe('ProviderStep', () => {
	const mockDisableNavigation = vi.fn();
	const mockEnableNavigation = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		(useStepperInput as any).mockReturnValue({
			disableNavigation: mockDisableNavigation,
			enableNavigation: mockEnableNavigation,
		});
	});

	it('renders provider selection message', () => {
		const onConfirm = vi.fn();
		const { lastFrame } = render(<ProviderStep onConfirm={onConfirm} />);

		expect(lastFrame()).toContain('What model provider would you like to use today?');
	});

	it('disables stepper navigation on mount and enables on unmount', () => {
		const onConfirm = vi.fn();
		const { unmount } = render(<ProviderStep onConfirm={onConfirm} />);

		expect(mockDisableNavigation).toHaveBeenCalled();
		unmount();
		expect(mockEnableNavigation).toHaveBeenCalled();
	});
});
