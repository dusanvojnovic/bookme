type GeocodeResult = { lat: number; lng: number; displayName: string };

const geocodeCache = new Map<string, GeocodeResult>();

function normalizeQuery(q: string): string {
	return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Geocode address/city to lat,lng using Nominatim (OpenStreetMap) - free, no API key */
export async function geocode(
	query: string,
): Promise<GeocodeResult | null> {
	if (!query?.trim()) return null;
	const key = normalizeQuery(query);
	const cached = geocodeCache.get(key);
	if (cached) return cached;

	const res = await fetch(
		`https://nominatim.openstreetmap.org/search?` +
			new URLSearchParams({
				q: query.trim(),
				format: 'json',
				limit: '1',
			}),
		{ headers: { 'User-Agent': 'BookMe/1.0' } },
	);
	const data = await res.json();
	if (!Array.isArray(data) || data.length === 0) return null;
	const r = data[0];
	const result: GeocodeResult = {
		lat: parseFloat(r.lat),
		lng: parseFloat(r.lon),
		displayName: r.display_name ?? query,
	};
	geocodeCache.set(key, result);
	return result;
}

/** Search addresses for autocomplete */
export async function searchAddresses(
	query: string,
): Promise<Array<{ displayName: string; lat: number; lng: number }>> {
	if (!query?.trim() || query.length < 2) return [];
	const res = await fetch(
		`https://nominatim.openstreetmap.org/search?` +
			new URLSearchParams({
				q: query.trim(),
				format: 'json',
				limit: '8',
				addressdetails: '1',
			}),
		{ headers: { 'User-Agent': 'BookMe/1.0' } },
	);
	const data = await res.json();
	if (!Array.isArray(data)) return [];
	return data.map((r: { lat: string; lon: string; display_name: string }) => ({
		displayName: r.display_name,
		lat: parseFloat(r.lat),
		lng: parseFloat(r.lon),
	}));
}
