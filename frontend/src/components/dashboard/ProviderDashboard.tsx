import AddIcon from '@mui/icons-material/Add';
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
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { api } from '../../api/api';
import { useAuthStore } from '../../store/auth.store';

type ProviderVenue = {
	id: string;
	name: string;
	category: string;
	city: string;
	address?: string | null;
	description?: string | null;
};

type CreateVenuePayload = {
	category: string;
	name: string;
	city: string;
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

async function fetchProviderVenues(token: string) {
	const res = await api.get<ProviderVenue[]>('/provider/venues', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function createVenue(token: string, payload: CreateVenuePayload) {
	const res = await api.post<ProviderVenue>('/provider/venue', payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

const EMPTY_FORM: CreateVenuePayload = {
	category: 'SPORT',
	name: '',
	city: '',
	description: '',
	address: '',
};

export function ProviderDashboard() {
	const token = useAuthStore((s) => s.token);
	const queryClient = useQueryClient();
	const [form, setForm] = React.useState<CreateVenuePayload>(EMPTY_FORM);
	const navigate = useNavigate();

	const {
		data = [],
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['provider-venues', token],
		enabled: !!token,
		queryFn: () => fetchProviderVenues(token!),
		staleTime: 15_000,
	});

	const createMutation = useMutation({
		mutationFn: (payload: CreateVenuePayload) => createVenue(token!, payload),
		onSuccess: () => {
			setForm(EMPTY_FORM);
			queryClient.invalidateQueries({
				queryKey: ['provider-venues', token],
			});
		},
	});

	const isValid =
		form.name.trim().length > 0 &&
		form.city.trim().length > 0 &&
		form.category.trim().length > 0;

	return (
		<Box sx={{ width: '100%', maxWidth: 1200 }}>
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
							Provider dashboard
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Create a venue, add units and offerings, then open
							time slots.
						</Typography>
					</Box>

					<Stack direction="row" spacing={1}>
						<Button variant="outlined">Blocks (soon)</Button>
						<Button variant="contained">Bookings (soon)</Button>
					</Stack>
				</Stack>
			</Paper>

			<Stack spacing={2}>
				<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
					<Stack spacing={2}>
						<Typography fontWeight={800}>New venue</Typography>

						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
						>
							<TextField
								label="Name"
								value={form.name}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										name: e.target.value,
									}))
								}
								fullWidth
								required
							/>

							<TextField
								label="City"
								value={form.city}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										city: e.target.value,
									}))
								}
								fullWidth
								required
							/>

							<Select
								value={form.category}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										category: String(e.target.value),
									}))
								}
								fullWidth
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
								value={form.address}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										address: e.target.value,
									}))
								}
								fullWidth
							/>

							<TextField
								label="Description"
								value={form.description}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										description: e.target.value,
									}))
								}
								fullWidth
								multiline
								minRows={2}
							/>
						</Stack>

						<Stack direction="row" spacing={1} alignItems="center">
							<Button
								variant="contained"
								startIcon={<AddIcon />}
								disabled={!isValid || createMutation.isPending}
								onClick={() =>
									createMutation.mutate({
										category: form.category.trim(),
										name: form.name.trim(),
										city: form.city.trim(),
										address: form.address?.trim() || undefined,
										description:
											form.description?.trim() || undefined,
									})
								}
							>
								Create venue
							</Button>

							{createMutation.isError && (
								<Typography
									variant="body2"
									color="error"
									sx={{ ml: 1 }}
								>
									Failed. Try again.
								</Typography>
							)}
						</Stack>
					</Stack>
				</Paper>

				<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
						spacing={1}
					>
						<Typography fontWeight={800}>My venues</Typography>
						<Typography variant="body2" color="text.secondary">
							Showing: {isLoading ? '...' : data.length}
						</Typography>
					</Stack>

					<Divider sx={{ my: 2 }} />

					{isError && (
						<Alert severity="error" sx={{ mb: 2 }}>
							Could not load venues.
							{error instanceof Error ? ` ${error.message}` : ''}
						</Alert>
					)}

					{!isLoading && data.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							No venues yet. Add your first venue above.
						</Typography>
					) : (
						<Stack spacing={2}>
							{data.map((venue) => (
								<Paper
									key={venue.id}
									variant="outlined"
									sx={{ p: 2, borderRadius: 2 }}
								>
									<Stack spacing={1}>
										<Stack
											direction="row"
											justifyContent="space-between"
											alignItems="center"
										>
											<Typography fontWeight={800}>
												{venue.name}
											</Typography>
											<Typography
												variant="body2"
												color="text.secondary"
											>
												{venue.category}
											</Typography>
										</Stack>

										<Stack
											direction="row"
											spacing={0.5}
											alignItems="center"
										>
											<LocationOnIcon fontSize="small" />
											<Typography
												variant="body2"
												color="text.secondary"
											>
												{venue.city}
												{venue.address
													? ` • ${venue.address}`
													: ''}
											</Typography>
										</Stack>

										{venue.description && (
											<Typography variant="body2">
												{venue.description}
											</Typography>
										)}

										<Stack direction="row" spacing={1}>
											<Button
												variant="contained"
												size="small"
												onClick={() =>
													navigate({
														to: '/venues/$venueId',
														params: { venueId: venue.id },
													})
												}
											>
												Details
											</Button>
											<Button variant="outlined" size="small">
												Units (soon)
											</Button>
											<Button variant="outlined" size="small">
												Offerings (soon)
											</Button>
										</Stack>
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
