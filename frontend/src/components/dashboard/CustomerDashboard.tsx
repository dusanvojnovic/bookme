import ListIcon from '@mui/icons-material/List';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	Divider,
	InputAdornment,
	MenuItem,
	Pagination,
	Paper,
	Select,
	Skeleton,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	addFavorite,
	fetchFavorites,
	fetchVenues,
	removeFavorite,
} from '../../api/customer.api';
import { useAuthStore } from '../../store/auth.store';
import { searchAddresses } from '../../utils/geocode';
import { VenueMap } from './VenueMap';
import { VenueCardItem } from '../venues/VenueCardItem';

const ITEMS_PER_PAGE = 6;

export function CustomerDashboard() {
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);
	const [qInput, setQInput] = useState('');
	const [q, setQ] = useState('');
	const [city, setCity] = useState('all');
	const [category, setCategory] = useState('all');
	const [sortBy, setSortBy] = useState('none');
	const [minRating, setMinRating] = useState<string>('all');
	const [favoritesOnly, setFavoritesOnly] = useState(false);
	const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
	const [page, setPage] = useState(1);
	const [addressOptions, setAddressOptions] = useState<
		Array<{ displayName: string; lat: number; lng: number }>
	>([]);
	const [addressLoading, setAddressLoading] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	// Debounce search query for API (prevents UI jump on every keystroke)
	useEffect(() => {
		const t = setTimeout(() => setQ(qInput), 350);
		return () => clearTimeout(t);
	}, [qInput]);

	// Debounced address autocomplete
	useEffect(() => {
		if (qInput.length < 2) {
			setAddressOptions([]);
			return;
		}
		const t = setTimeout(async () => {
			setAddressLoading(true);
			const results = await searchAddresses(qInput);
			setAddressOptions(results);
			setAddressLoading(false);
		}, 400);
		return () => clearTimeout(t);
	}, [qInput]);

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['venues', q, city, category],
		queryFn: () => fetchVenues({ q, city, category }),
		staleTime: 30_000,
		placeholderData: (prev) => prev,
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
	const cities = useMemo(() => {
		const set = new Set(data.map((x) => x.city).filter(Boolean));
		return ['all', ...Array.from(set)];
	}, [data]);

	const categories = useMemo(() => {
		const set = new Set(data.map((x) => x.category).filter(Boolean));
		return ['all', ...Array.from(set)];
	}, [data]);

	const filteredAndSortedData = useMemo(() => {
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

	// Pagination
	const totalPages = Math.max(
		1,
		Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE),
	);
	const paginatedData = useMemo(() => {
		const start = (page - 1) * ITEMS_PER_PAGE;
		return filteredAndSortedData.slice(start, start + ITEMS_PER_PAGE);
	}, [filteredAndSortedData, page]);

	// Reset page when filters change
	useEffect(() => {
		setPage(1);
	}, [q, city, category, sortBy, minRating, favoritesOnly]);

	const handleVenueClick = useCallback(
		(v: { id: string }) => {
			navigate({ to: '/venues/$venueId', params: { venueId: v.id } });
		},
		[navigate],
	);

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
							setQInput('');
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
					<Autocomplete
						freeSolo
						options={addressOptions.map((o) => o.displayName)}
						loading={addressLoading}
						inputValue={qInput}
						onInputChange={(_, v) => setQInput(v)}
						onChange={(_, v) => {
							const str = typeof v === 'string' ? v : v ?? '';
							// Nominatim returns "Place, Region, Country" - use first part for venue search
							const searchTerm = str.split(',')[0].trim() || str;
							setQInput(searchTerm);
							setQ(searchTerm);
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Search by name, city, or address…"
								slotProps={{
									input: {
										...params.InputProps,
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon fontSize="small" />
											</InputAdornment>
										),
									},
								}}
							/>
						)}
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
					<ToggleButtonGroup
						value={viewMode}
						exclusive
						onChange={(_, v) => v != null && setViewMode(v)}
						fullWidth
						sx={{ mt: 2 }}
					>
						<ToggleButton value="list" aria-label="list view">
							<ListIcon sx={{ mr: 0.5 }} />
							List
						</ToggleButton>
						<ToggleButton value="map" aria-label="map view">
							<MapIcon sx={{ mr: 0.5 }} />
							Map
						</ToggleButton>
					</ToggleButtonGroup>
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
					flexWrap="wrap"
					gap={1}
					sx={{ mb: 1.5 }}
				>
					<Typography variant="body2" color="text.secondary">
						Showing: <b>{isLoading ? '...' : filteredAndSortedData.length}</b>
						{viewMode === 'list' &&
							` (page ${page}/${totalPages})`}
					</Typography>
					{isError && (
						<Typography variant="body2" color="error">
							Failed to load.
						</Typography>
					)}
				</Stack>

				{viewMode === 'map' ? (
					<VenueMap
						venues={filteredAndSortedData}
						onVenueClick={handleVenueClick}
					/>
				) : (
					<>
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
								: paginatedData.map((v) => (
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
						{totalPages > 1 && !isLoading && (
							<Stack alignItems="center" sx={{ mt: 3 }}>
								<Pagination
									count={totalPages}
									page={page}
									onChange={(_, p) => setPage(p)}
									color="primary"
									showFirstButton
									showLastButton
								/>
							</Stack>
						)}
					</>
				)}
			</Box>
		</Box>
	);
}

