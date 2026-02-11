export async function getStdin(): Promise<string> {
	if (process.stdin.isTTY) {
		return '';
	}
	let result = '';
	process.stdin.setEncoding('utf8');
	for await (const chunk of process.stdin) {
		result += chunk;
	}
	return result.trim();
}
