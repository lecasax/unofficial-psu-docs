export const REPO_URL = 'https://github.com/lecasax/unofficial-psu-docs';

/** New GitHub issue with a drop report form filled in. */
export function dropReportUrl(item?: string): string {
	const body = [
		`**Item:** ${item ?? ''}`,
		'**Where it dropped** (enemy, mission or area):',
		'**Difficulty:** Ultimate',
		'**When** (date):',
		'**Screenshot or notes:**'
	].join('\n\n');
	const params = new URLSearchParams({ title: item ? `Drop report: ${item}` : 'Drop report', body });
	return `${REPO_URL}/issues/new?${params}`;
}
