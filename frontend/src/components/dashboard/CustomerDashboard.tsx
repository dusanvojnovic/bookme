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
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { api } from '../../api/api';
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

export function CustomerDashboard() {
	const [q, setQ] = React.useState('');
	const [city, setCity] = React.useState('all');
	const [category, setCategory] = React.useState('all');
	const navigate = useNavigate();

	const {
		data = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['venues', q, city, category],
		queryFn: () => fetchVenues({ q, city, category }),
		staleTime: 30_000,
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
						Showing: <b>{isLoading ? '...' : data.length}</b>
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
							xl: '1fr 1fr 1fr',
						},
						gap: 2,
					}}
				>
					{isLoading
						? Array.from({ length: 6 }).map((_, i) => (
								<Paper
									key={i}
									variant="outlined"
									sx={{ borderRadius: 2, overflow: 'hidden' }}
								>
									<Skeleton
										variant="rectangular"
										height={140}
									/>
									<Box sx={{ p: 2 }}>
										<Skeleton width="70%" />
										<Skeleton width="45%" />
										<Skeleton width="90%" />
									</Box>
								</Paper>
							))
						: data.map((v) => (
								<VenueCardItem
									key={v.id}
									v={v}
									onOpen={() =>
										navigate({
											to: '/venues/$venueId',
											params: { venueId: v.id },
										})
									}
								/>
							))}
				</Box>
			</Box>
		</Box>
	);
}

