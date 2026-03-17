import { Box, Paper, Skeleton, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { VenueCard } from '../../types/venue';
import { formatRsd } from '../../utils/format';
import { geocode } from '../../utils/geocode';

// Fix default marker icons in webpack/vite
const defaultIcon = L.icon({
	iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
	iconRetinaUrl:
		'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

type VenueWithCoords = VenueCard & { lat: number; lng: number };

function MapBounds({ venues }: { venues: VenueWithCoords[] }) {
	const map = useMap();
	useEffect(() => {
		if (venues.length === 0) return;
		if (venues.length === 1) {
			map.setView([venues[0].lat, venues[0].lng], 14);
			return;
		}
		const bounds = L.latLngBounds(venues.map((v) => [v.lat, v.lng]));
		map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
	}, [map, venues]);
	return null;
}

export function VenueMap({
	venues,
	onVenueClick,
}: {
	venues: VenueCard[];
	onVenueClick?: (v: VenueCard) => void;
}) {
	const [geocoded, setGeocoded] = useState<VenueWithCoords[]>([]);
	const [loading, setLoading] = useState(true);
	const [failed, setFailed] = useState<string[]>([]);

	const geocodeVenues = useCallback(async () => {
		setLoading(true);
		setFailed([]);
		const results: VenueWithCoords[] = [];
		const failedIds: string[] = [];

		for (const v of venues) {
			const addr = [v.address, v.city].filter(Boolean).join(', ') || v.city;
			const coords = await geocode(addr);
			if (coords) {
				results.push({ ...v, lat: coords.lat, lng: coords.lng });
			} else {
				failedIds.push(v.id);
			}
		}

		setGeocoded(results);
		setFailed(failedIds);
		setLoading(false);
	}, [venues]);

	useEffect(() => {
		if (venues.length === 0) {
			setGeocoded([]);
			setLoading(false);
			return;
		}
		geocodeVenues();
	}, [venues, geocodeVenues]);

	const defaultCenter = useMemo(
		() => (geocoded[0] ? [geocoded[0].lat, geocoded[0].lng] : [44.8, 20.47]),
		[geocoded],
	);

	if (loading) {
		return (
			<Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
				<Skeleton variant="rectangular" height={400} />
			</Paper>
		);
	}

	if (geocoded.length === 0) {
		return (
			<Paper
				variant="outlined"
				sx={{
					p: 3,
					borderRadius: 2,
					textAlign: 'center',
					color: 'text.secondary',
				}}
			>
				<Typography>
					{venues.length === 0
						? 'No venues to show on map'
						: 'Could not geocode venue addresses'}
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper variant="outlined" sx={{ borderRadius: 2 }}>
			<Box sx={{ height: 400, width: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
				<MapContainer
					center={defaultCenter as [number, number]}
					zoom={12}
					style={{ height: '100%', width: '100%' }}
					scrollWheelZoom
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					<MapBounds venues={geocoded} />
					{geocoded.map((v) => (
						<Marker
							key={v.id}
							position={[v.lat, v.lng]}
							icon={defaultIcon}
						>
							<Popup>
								<div
									style={{
										minWidth: 200,
										padding: '12px 4px 4px',
										fontFamily: 'inherit',
									}}
								>
									<div
										style={{
											fontWeight: 700,
											fontSize: '1rem',
											marginBottom: 6,
											color: '#1a1a1a',
										}}
									>
										{v.name}
									</div>
									<div
										style={{
											fontSize: '0.8rem',
											color: '#555',
											marginBottom: 8,
											lineHeight: 1.4,
										}}
									>
										{v.address || v.city}
									</div>
									{v.priceFrom != null && (
										<div
											style={{
												fontSize: '0.85rem',
												fontWeight: 600,
												color: '#2e7d32',
												marginBottom: 12,
											}}
										>
											From {formatRsd(v.priceFrom)}/h
										</div>
									)}
									<button
										type="button"
										onClick={() => onVenueClick?.(v)}
										style={{
											width: '100%',
											padding: '10px 16px',
											background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
											color: 'white',
											border: 'none',
											borderRadius: 8,
											cursor: 'pointer',
											fontSize: '0.875rem',
											fontWeight: 600,
											boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
											transition: 'transform 0.1s, box-shadow 0.1s',
										}}
										onMouseOver={(e) => {
											e.currentTarget.style.transform = 'translateY(-1px)';
											e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
										}}
										onMouseOut={(e) => {
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
										}}
									>
										View More →
									</button>
								</div>
							</Popup>
						</Marker>
					))}
				</MapContainer>
			</Box>
			{failed.length > 0 && (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: 'block', p: 1 }}
				>
					{failed.length} venue(s) could not be placed on map (missing/invalid
					address)
				</Typography>
			)}
		</Paper>
	);
}
