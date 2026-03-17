export function formatRsd(value: number): string {
	return new Intl.NumberFormat('sr-RS', {
		style: 'currency',
		currency: 'RSD',
		maximumFractionDigits: 0,
	}).format(value);
}
