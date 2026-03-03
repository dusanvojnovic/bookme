import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
	Alert,
	Box,
	Button,
	Divider,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import * as React from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../store/auth.store';

type Unit = {
	id: string;
	name: string;
	unitType: string;
	capacity?: number | null;
};

type Offering = {
	id: string;
	name: string;
	durationMin: number;
	price?: number | null;
	bufferMin?: number | null;
	isActive: boolean;
};

type VenueDetails = {
	id: string;
	providerId: string;
	category: string;
	name: string;
	description?: string | null;
	city: string;
	address?: string | null;
	units: Unit[];
	offerings: Offering[];
};

type UpdateVenuePayload = {
	category?: string;
	name?: string;
	city?: string;
	description?: string;
	address?: string;
};

const CATEGORY_OPTIONS = [
	'SPORT',
	'BUSINESS',
	'EVENTS',
	'FOOD',
	'WELLNESS',
];

async function fetchVenue(venueId: string) {
	const res = await api.get<VenueDetails>(`/venues/${venueId}`);
	return res.data;
}

async function updateVenue(
	token: string,
	venueId: string,
	payload: UpdateVenuePayload,
) {
	const res = await api.patch<VenueDetails>(
		`/provider/venues/${venueId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

export function VenueDetailsPage() {
	const { venueId } = useParams({ from: '/venues/$venueId' });
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);
	const queryClient = useQueryClient();

	const {
		data: venue,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['venue', venueId],
		queryFn: () => fetchVenue(venueId),
		staleTime: 30_000,
	});

	const [form, setForm] = React.useState<UpdateVenuePayload>({
		name: '',
		city: '',
		address: '',
		description: '',
		category: '',
	});

	React.useEffect(() => {
		if (!venue) return;
		setForm({
			name: venue.name,
			city: venue.city,
			address: venue.address ?? '',
			description: venue.description ?? '',
			category: venue.category,
		});
	}, [venue]);

	const isOwner =
		!!venue && user?.role === 'PROVIDER' && user.id === venue.providerId;

	const updateMutation = useMutation({
		mutationFn: (payload: UpdateVenuePayload) =>
			updateVenue(token!, venueId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	if (isLoading) {
		return (
			<Typography variant="body2" color="text.secondary">
				Loading venue...
			</Typography>
		);
	}

	if (isError || !venue) {
		return (
			<Alert severity="error">
				Failed to load venue.
				{error instanceof Error ? ` ${error.message}` : ''}
			</Alert>
		);
	}

	const canSave =
		isOwner &&
		form.name?.trim() &&
		form.city?.trim() &&
		form.category?.trim();

	return (
		<Box sx={{ width: '100%', maxWidth: 1200 }}>
			<Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ md: 'center' }}
					spacing={1}
				>
					<Box>
						<Typography variant="h5" fontWeight={900}>
							{venue.name}
						</Typography>
						<Stack direction="row" spacing={0.75} alignItems="center">
							<LocationOnIcon fontSize="small" />
							<Typography variant="body2" color="text.secondary">
								{venue.city}
								{venue.address ? ` • ${venue.address}` : ''}
							</Typography>
						</Stack>
					</Box>

					<Stack direction="row" spacing={1}>
						<Button component={Link} to="/dashboard" variant="outlined">
							Back to dashboard
						</Button>
					</Stack>
				</Stack>
			</Paper>

			<Stack spacing={2}>
				<Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
					<Stack spacing={2}>
						<Typography fontWeight={800}>
							{isOwner ? 'Edit venue' : 'Venue details'}
						</Typography>

						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
						>
							<TextField
								label="Name"
								value={form.name ?? ''}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								fullWidth
								disabled={!isOwner}
								required
							/>

							<TextField
								label="City"
								value={form.city ?? ''}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										city: e.target.value,
									}))
								}
								fullWidth
								disabled={!isOwner}
								required
							/>

							<Select
								value={form.category ?? ''}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										category: String(e.target.value),
									}))
								}
								fullWidth
								disabled={!isOwner}
								displayEmpty
							>
								{CATEGORY_OPTIONS.map((option) => (
									<MenuItem key={option} value={option}>
										{option}
									</MenuItem>
								))}
							</Select>
						</Stack>

						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
						>
							<TextField
								label="Address"
								value={form.address ?? ''}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										address: e.target.value,
									}))
								}
								fullWidth
								disabled={!isOwner}
							/>

							<TextField
								label="Description"
								value={form.description ?? ''}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								fullWidth
								disabled={!isOwner}
								multiline
								minRows={2}
							/>
						</Stack>

						{isOwner && (
							<Stack direction="row" spacing={1} alignItems="center">
								<Button
									variant="contained"
									disabled={!canSave || updateMutation.isPending}
									onClick={() =>
										updateMutation.mutate({
											name: form.name?.trim(),
											city: form.city?.trim(),
											address: form.address?.trim() || undefined,
											description:
												form.description?.trim() || undefined,
											category: form.category?.trim(),
										})
									}
								>
									Save changes
								</Button>

								{updateMutation.isError && (
									<Typography variant="body2" color="error">
										Failed to update. Try again.
									</Typography>
								)}
							</Stack>
						)}
					</Stack>
				</Paper>

				<Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
						spacing={1}
					>
						<Typography fontWeight={800}>Units</Typography>
						<Typography variant="body2" color="text.secondary">
							{venue.units.length} total
						</Typography>
					</Stack>

					<Divider sx={{ my: 2 }} />

					{venue.units.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							No units yet.
						</Typography>
					) : (
						<Stack spacing={1.5}>
							{venue.units.map((unit) => (
								<Paper key={unit.id} variant="outlined" sx={{ p: 1.5 }}>
									<Stack
										direction={{ xs: 'column', md: 'row' }}
										justifyContent="space-between"
										alignItems={{ md: 'center' }}
										spacing={1}
									>
										<Typography fontWeight={700}>{unit.name}</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{unit.unitType}
											{unit.capacity ? ` • ${unit.capacity} people` : ''}
										</Typography>
									</Stack>
								</Paper>
							))}
						</Stack>
					)}
				</Paper>

				<Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
						spacing={1}
					>
						<Typography fontWeight={800}>Offerings</Typography>
						<Typography variant="body2" color="text.secondary">
							{venue.offerings.length} total
						</Typography>
					</Stack>

					<Divider sx={{ my: 2 }} />

					{venue.offerings.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							No offerings yet.
						</Typography>
					) : (
						<Stack spacing={1.5}>
							{venue.offerings.map((offering) => (
								<Paper
									key={offering.id}
									variant="outlined"
									sx={{ p: 1.5 }}
								>
									<Stack
										direction={{ xs: 'column', md: 'row' }}
										justifyContent="space-between"
										alignItems={{ md: 'center' }}
										spacing={1}
									>
										<Typography fontWeight={700}>
											{offering.name}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{offering.durationMin} min
											{offering.price != null
												? ` • €${offering.price}`
												: ''}
										</Typography>
									</Stack>
								</Paper>
							))}
						</Stack>
					)}
				</Paper>
			</Stack>
		</Box>
	);
}
