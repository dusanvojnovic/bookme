import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import {
	Box,
	Button,
	Chip,
	Divider,
	InputAdornment,
	MenuItem,
	Paper,
	Select,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { api } from '../../api/api';
import { useAuthStore } from '../../store/auth.store';
import { VenueCardItem } from '../venues/VenueCardItem';
import { type VenueCard } from '../../types/venue';

async function fetchVenues(params: {
	q: string;
	city: string;
	category: string;
}) {
	const res = await api.get<VenueCard[]>('/venues', {
		params: {
			q: params.q || undefined,
			city: params.city === 'all' ? undefined : params.city,
			category: params.category === 'all' ? undefined : params.category,
		},
	});
	return res.data;
}

async function fetchFavorites(token: string) {
	const res = await api.get<string[]>('/customer/favorites', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function addFavorite(token: string, venueId: string) {
	await api.post(`/customer/favorites/${venueId}`, {}, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

async function removeFavorite(token: string, venueId: string) {
	await api.delete(`/customer/favorites/${venueId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export function CustomerDashboard() {
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);
	const [q, setQ] = React.useState('');
	const [city, setCity] = React.useState('all');
	const [category, setCategory] = React.useState('all');
	const [sortBy, setSortBy] = React.useState('none');
	const [minRating, setMinRating] = React.useState<string>('all');
	const [favoritesOnly, setFavoritesOnly] = React.useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['venues', q, city, category],
		queryFn: () => fetchVenues({ q, city, category }),
		staleTime: 30_000,
	});

	const { data: favoriteIds = [] } = useQuery({
		queryKey: ['favorites', token],
		queryFn: () => fetchFavorites(token!),
		enabled: !!token && user?.role === 'CUSTOMER',
		staleTime: 30_000,
	});

	const addFavoriteMutation = useMutation({
		mutationFn: (venueId: string) => addFavorite(token!, venueId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['favorites', token] });
		},
	});

	const removeFavoriteMutation = useMutation({
		mutationFn: (venueId: string) => removeFavorite(token!, venueId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['favorites', token] });
		},
	});

	// Cities from data (after load)
	const cities = React.useMemo(() => {
		const set = new Set(data.map((x) => x.city).filter(Boolean));
		return ['all', ...Array.from(set)];
	}, [data]);

	const categories = React.useMemo(() => {
		const set = new Set(data.map((x) => x.category).filter(Boolean));
		return ['all', ...Array.from(set)];
	}, [data]);

	const filteredAndSortedData = React.useMemo(() => {
		const minRatingNum =
			minRating === 'all' ? null : parseFloat(minRating);
		let items = data;
		if (favoritesOnly && favoriteIds.length > 0) {
			items = items.filter((v) => favoriteIds.includes(v.id));
		}
		if (minRatingNum != null && !Number.isNaN(minRatingNum)) {
			items = items.filter(
				(v) => v.avgRating != null && v.avgRating >= minRatingNum,
			);
		}
		if (sortBy === 'none') return items;
		items = [...items];
		if (sortBy === 'price-asc') {
			items.sort((a, b) => {
				const priceA = a.priceFrom ?? Number.POSITIVE_INFINITY;
				const priceB = b.priceFrom ?? Number.POSITIVE_INFINITY;
				return priceA - priceB;
			});
		}
		if (sortBy === 'price-desc') {
			items.sort((a, b) => {
				const priceA = a.priceFrom ?? Number.NEGATIVE_INFINITY;
				const priceB = b.priceFrom ?? Number.NEGATIVE_INFINITY;
				return priceB - priceA;
			});
		}
		if (sortBy === 'rating-desc') {
			items.sort((a, b) => {
				const rA = a.avgRating ?? Number.NEGATIVE_INFINITY;
				const rB = b.avgRating ?? Number.NEGATIVE_INFINITY;
				return rB - rA;
			});
		}
		if (sortBy === 'rating-asc') {
			items.sort((a, b) => {
				const rA = a.avgRating ?? Number.POSITIVE_INFINITY;
				const rB = b.avgRating ?? Number.POSITIVE_INFINITY;
				return rA - rB;
			});
		}
		return items;
	}, [data, sortBy, minRating, favoritesOnly, favoriteIds]);

	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
				gap: 2,
			}}
		>
			{/* Filter panel */}
			<Paper
				variant="outlined"
				sx={{
					p: 2,
					borderRadius: 2,
					position: { lg: 'sticky' },
					top: { lg: 88 },
					height: { lg: 'fit-content' },
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					mb={1.5}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<TuneIcon fontSize="small" />
						<Typography fontWeight={800}>Filters</Typography>
					</Stack>

					<Button
						size="small"
						onClick={() => {
							setQ('');
							setCity('all');
							setCategory('all');
							setSortBy('none');
							setMinRating('all');
							setFavoritesOnly(false);
						}}
					>
						Reset
					</Button>
				</Stack>

				<Stack spacing={2}>
					<TextField
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search (name, city, address)…"
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" />
									</InputAdornment>
								),
							},
						}}
					/>

					<Box>
						<Typography
							variant="body2"
							sx={{ mb: 0.75, color: 'text.secondary' }}
						>
							Category
						</Typography>
						<Select
							fullWidth
							value={category}
							onChange={(e) =>
								setCategory(String(e.target.value))
							}
						>
							{categories.map((c) => (
								<MenuItem key={c} value={c}>
									{c === 'all' ? 'All' : c}
								</MenuItem>
							))}
						</Select>
					</Box>

					<Box>
						<Typography
							variant="body2"
							sx={{ mb: 0.75, color: 'text.secondary' }}
						>
							City
						</Typography>
						<Select
							fullWidth
							value={city}
							onChange={(e) => setCity(String(e.target.value))}
						>
							{cities.map((c) => (
								<MenuItem key={c} value={c}>
									{c === 'all' ? 'All cities' : c}
								</MenuItem>
							))}
						</Select>
					</Box>

					{user?.role === 'CUSTOMER' && (
						<Box>
							<Typography
								variant="body2"
								sx={{ mb: 0.75, color: 'text.secondary' }}
							>
								Show
							</Typography>
							<Select
								fullWidth
								value={favoritesOnly ? 'favorites' : 'all'}
								onChange={(e) =>
									setFavoritesOnly(e.target.value === 'favorites')
								}
							>
								<MenuItem value="all">All venues</MenuItem>
								<MenuItem value="favorites">Favorites only</MenuItem>
							</Select>
						</Box>
					)}

					<Box>
						<Typography
							variant="body2"
							sx={{ mb: 0.75, color: 'text.secondary' }}
						>
							Min. rating
						</Typography>
						<Select
							fullWidth
							value={minRating}
							onChange={(e) => setMinRating(String(e.target.value))}
						>
							<MenuItem value="all">Any</MenuItem>
							<MenuItem value="4">4+ stars</MenuItem>
							<MenuItem value="3.5">3.5+ stars</MenuItem>
							<MenuItem value="3">3+ stars</MenuItem>
						</Select>
					</Box>

					<Box>
						<Typography
							variant="body2"
							sx={{ mb: 0.75, color: 'text.secondary' }}
						>
							Sort by
						</Typography>
						<Select
							fullWidth
							value={sortBy}
							onChange={(e) => setSortBy(String(e.target.value))}
						>
							<MenuItem value="none">Default</MenuItem>
							<MenuItem value="price-asc">Price: low to high</MenuItem>
							<MenuItem value="price-desc">Price: high to low</MenuItem>
							<MenuItem value="rating-desc">Rating: high to low</MenuItem>
							<MenuItem value="rating-asc">Rating: low to high</MenuItem>
						</Select>
					</Box>

					<Divider />

					<Stack spacing={1}>
						<Typography
							variant="body2"
							sx={{ color: 'text.secondary' }}
						>
							Quick filters (example)
						</Typography>
						<Stack direction="row" flexWrap="wrap" gap={1}>
							{['Belgrade', 'SPORT'].map((t) => (
								<Chip
									key={t}
									label={t}
									clickable
									variant="outlined"
									onClick={() => {
										if (t === 'SPORT') setCategory('SPORT');
										if (t === 'Belgrade')
											setCity('Belgrade');
									}}
								/>
							))}
						</Stack>
					</Stack>
					<Button variant="outlined" fullWidth sx={{ mt: 2 }}>
						Map (soon)
					</Button>
				</Stack>
			</Paper>

			{/* Content */}
			<Box>
				<Paper
					variant="outlined"
					sx={{
						p: 2,
						borderRadius: 2,
						mb: 2,
						background:
							'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0))',
					}}
				>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={1}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
					>
						<Box>
							<Typography variant="h5" fontWeight={900}>
								Venues and services
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Choose a venue, view offerings, and book a slot.
							</Typography>
						</Box>

						<Stack direction="row" spacing={1}>
							<Button
								variant="contained"
								onClick={() => navigate({ to: '/my-bookings' })}
							>
								My bookings
							</Button>
						</Stack>
					</Stack>
				</Paper>

				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ mb: 1.5 }}
				>
					<Typography variant="body2" color="text.secondary">
						Showing: <b>{isLoading ? '...' : filteredAndSortedData.length}</b>
					</Typography>
					{isError && (
						<Typography variant="body2" color="error">
							Failed to load.
						</Typography>
					)}
				</Stack>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: {
							xs: '1fr',
							sm: '1fr 1fr',
							xl: '1fr 1fr',
						},
						gap: 2.5,
					}}
				>
					{isLoading
						? Array.from({ length: 6 }).map((_, i) => (
								<Paper
									key={i}
									variant="outlined"
									sx={{ borderRadius: 2.5, overflow: 'hidden' }}
								>
									<Skeleton
										variant="rectangular"
										height={180}
									/>
									<Box sx={{ p: 2.5 }}>
										<Skeleton width="70%" />
										<Skeleton width="45%" />
										<Skeleton width="90%" />
									</Box>
								</Paper>
							))
						: filteredAndSortedData.map((v) => (
								<VenueCardItem
									key={v.id}
									v={v}
									onOpen={() =>
										navigate({
											to: '/venues/$venueId',
											params: { venueId: v.id },
										})
									}
									isFavorite={
										user?.role === 'CUSTOMER'
											? favoriteIds.includes(v.id)
											: undefined
									}
									onToggleFavorite={
										user?.role === 'CUSTOMER'
											? (e) => {
													e.stopPropagation();
													if (favoriteIds.includes(v.id)) {
														removeFavoriteMutation.mutate(v.id);
													} else {
														addFavoriteMutation.mutate(v.id);
													}
												}
											: undefined
									}
								/>
							))}
				</Box>
			</Box>
		</Box>
	);
}

