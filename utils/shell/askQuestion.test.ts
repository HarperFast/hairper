import { PassThrough } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { askQuestion } from './askQuestion';

vi.mock('../../lifecycle/handleExit', () => ({
	handleExit: vi.fn(),
}));

describe('askQuestion', () => {
	let input: PassThrough;
	let output: PassThrough;

	beforeEach(() => {
		input = new PassThrough();
		output = new PassThrough();

		// Mock process.stdin and process.stdout
		vi.stubGlobal('process', {
			...process,
			stdin: input,
			stdout: output,
		});
	});

	it('should read a single line of input', async () => {
		const promise = askQuestion('What is your name? ');

		input.write('John Doe\n');

		const result = await promise;
		expect(result).toBe('John Doe');
	});

	it('should handle multi-line pasted input as a single input', async () => {
		const promise = askQuestion('Prompt: ');

		const multiLineInput = 'Line 1\nLine 2\nLine 3\n';
		input.write(multiLineInput);

		const result = await promise;
		// Currently this will probably fail and only return "Line 1"
		expect(result).toBe('Line 1\nLine 2\nLine 3');
	});
});
