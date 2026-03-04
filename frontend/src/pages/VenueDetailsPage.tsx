import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
	Alert,
	Box,
	Button,
	Snackbar,
	Divider,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../store/auth.store';
import { type Unit, type VenueDetails } from '../types/venue';

type UpdateVenuePayload = {
	category?: string;
	name?: string;
	city?: string;
	description?: string;
	address?: string;
	slotStepMin?: number;
};

type CreateUnitPayload = {
	name: string;
	unitType: string;
	capacity?: number;
	minDurationMin?: number;
	maxDurationMin?: number;
	slotStepMin?: number;
};

type ScheduleEntryPayload = {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
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

async function createUnit(
	token: string,
	venueId: string,
	payload: CreateUnitPayload,
) {
	const res = await api.post<Unit>(`/provider/venues/${venueId}/units`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function updateSchedule(
	token: string,
	venueId: string,
	entries: ScheduleEntryPayload[],
) {
	const res = await api.patch(
		`/provider/venues/${venueId}/schedule`,
		{ entries },
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

export function VenueDetailsPage() {
	const { venueId } = useParams({ from: '/venues/$venueId' });
	const navigate = useNavigate();
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
		slotStepMin: undefined,
	});

	const [unitForm, setUnitForm] = React.useState({
		name: '',
		unitType: '',
		capacity: '',
		minDurationMin: '',
		maxDurationMin: '',
		slotStepMin: '',
	});

	const [repeatType, setRepeatType] = React.useState<
		'everyday' | 'weekdays' | 'weekends' | 'custom'
	>('everyday');
	const [selectedDays, setSelectedDays] = React.useState<number[]>([
		0, 1, 2, 3, 4, 5, 6,
	]);
	const [scheduleStart, setScheduleStart] = React.useState<Dayjs | null>(
		dayjs('09:00', 'HH:mm'),
	);
	const [scheduleEnd, setScheduleEnd] = React.useState<Dayjs | null>(
		dayjs('21:00', 'HH:mm'),
	);
	const [scheduleEntries, setScheduleEntries] = React.useState<
		ScheduleEntryPayload[]
	>([]);

	React.useEffect(() => {
		if (!venue) return;
		setForm({
			name: venue.name,
			city: venue.city,
			address: venue.address ?? '',
			description: venue.description ?? '',
			category: venue.category,
			slotStepMin: venue.slotStepMin ?? undefined,
		});

		if (venue.schedules?.length) {
			setScheduleEntries(
				venue.schedules.map((entry) => ({
					dayOfWeek: entry.dayOfWeek,
					startTime: entry.startTime,
					endTime: entry.endTime,
				})),
			);
			setScheduleStart(dayjs(venue.schedules[0].startTime, 'HH:mm'));
			setScheduleEnd(dayjs(venue.schedules[0].endTime, 'HH:mm'));
		} else {
			setScheduleEntries([]);
		}
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

	const createUnitMutation = useMutation({
		mutationFn: (payload: CreateUnitPayload) =>
			createUnit(token!, venueId, payload),
		onSuccess: () => {
			setUnitForm({
				name: '',
				unitType: '',
				capacity: '',
				minDurationMin: '',
				maxDurationMin: '',
				slotStepMin: '',
			});
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	const updateScheduleMutation = useMutation({
		mutationFn: (entries: ScheduleEntryPayload[]) =>
			updateSchedule(token!, venueId, entries),
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

	const canAddUnit =
		isOwner && unitForm.name.trim() && unitForm.unitType.trim();

	const canAddScheduleEntry =
		isOwner && !!scheduleStart && !!scheduleEnd && selectedDays.length > 0;

	const canSaveSchedule = isOwner && scheduleEntries.length > 0;

	return (
		<Box sx={{ width: '100%', maxWidth: 1200, mt: 2 }}>
			<Snackbar
				open={updateScheduleMutation.isSuccess}
				autoHideDuration={2500}
				onClose={() => updateScheduleMutation.reset()}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert
					severity="success"
					icon={<CheckCircleIcon />}
					onClose={() => updateScheduleMutation.reset()}
					sx={{ alignItems: 'center' }}
				>
					Schedule saved successfully
				</Alert>
			</Snackbar>
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
						<Button
							variant="contained"
							onClick={() =>
								navigate({
									to: '/venues/$venueId/calendar',
									params: { venueId },
								})
							}
						>
							Open calendar
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

							<TextField
								select
								label="Slot step (min)"
								value={form.slotStepMin ?? ''}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										slotStepMin: e.target.value
											? Number(e.target.value)
											: undefined,
									}))
								}
								fullWidth
								disabled={!isOwner}
							>
								{[15, 30, 45, 60].map((step) => (
									<MenuItem key={step} value={step}>
										{step}
									</MenuItem>
								))}
								<MenuItem value="">No step</MenuItem>
							</TextField>
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
											slotStepMin: form.slotStepMin,
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
					<Stack spacing={2}>
						<Typography fontWeight={800}>Opening hours</Typography>

						{isOwner ? (
							<>
								<Stack
									direction={{ xs: 'column', md: 'row' }}
									spacing={1.5}
									alignItems={{ md: 'center' }}
								>
									<TextField
										select
										label="Repeat"
										value={repeatType}
										onChange={(e) => {
											const value = String(e.target.value) as
												| 'everyday'
												| 'weekdays'
												| 'weekends'
												| 'custom';
											setRepeatType(value);
											if (value === 'everyday')
												setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
											if (value === 'weekdays')
												setSelectedDays([1, 2, 3, 4, 5]);
											if (value === 'weekends')
												setSelectedDays([0, 6]);
										}}
										size="small"
										sx={{ minWidth: 180 }}
									>
										<MenuItem value="everyday">Every day</MenuItem>
										<MenuItem value="weekdays">Weekdays</MenuItem>
										<MenuItem value="weekends">Weekends</MenuItem>
										<MenuItem value="custom">Custom</MenuItem>
									</TextField>

									<LocalizationProvider dateAdapter={AdapterDayjs}>
										<TimePicker
											label="Start"
											ampm={false}
											value={scheduleStart}
											onChange={(value) => setScheduleStart(value)}
											slotProps={{
												textField: {
													size: 'small',
													sx: { width: 140 },
												},
											}}
										/>
										<TimePicker
											label="End"
											ampm={false}
											value={scheduleEnd}
											onChange={(value) => setScheduleEnd(value)}
											slotProps={{
												textField: {
													size: 'small',
													sx: { width: 140 },
												},
											}}
										/>
									</LocalizationProvider>
									<Button
										variant="contained"
										disabled={!canAddScheduleEntry}
										size="small"
										onClick={() => {
											const newEntries = selectedDays.map((day) => ({
												dayOfWeek: day,
												startTime: scheduleStart!.format('HH:mm'),
												endTime: scheduleEnd!.format('HH:mm'),
											}));
											setScheduleEntries((prev) => {
												const filtered = prev.filter(
													(entry) =>
														!selectedDays.includes(entry.dayOfWeek),
												);
												return [...filtered, ...newEntries];
											});
										}}
									>
										Add working hours
									</Button>
								</Stack>

								{repeatType === 'custom' && (
									<Stack direction="row" spacing={1} flexWrap="wrap">
										{[
											{ label: 'Sun', value: 0 },
											{ label: 'Mon', value: 1 },
											{ label: 'Tue', value: 2 },
											{ label: 'Wed', value: 3 },
											{ label: 'Thu', value: 4 },
											{ label: 'Fri', value: 5 },
											{ label: 'Sat', value: 6 },
										].map((day) => (
											<Button
												key={day.value}
												variant={
													selectedDays.includes(day.value)
														? 'contained'
														: 'outlined'
												}
												size="small"
												onClick={() => {
													setSelectedDays((prev) =>
														prev.includes(day.value)
															? prev.filter((d) => d !== day.value)
															: [...prev, day.value],
													);
												}}
											>
												{day.label}
											</Button>
										))}
									</Stack>
								)}

								<Divider />
							</>
						) : null}

						{scheduleEntries.length ? (
							<Stack spacing={1}>
								{scheduleEntries
									.slice()
									.sort((a, b) => {
										const order = [1, 2, 3, 4, 5, 6, 0];
										const dayDiff =
											order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
										if (dayDiff !== 0) return dayDiff;
										return a.startTime.localeCompare(b.startTime);
									})
									.map((entry, idx) => (
									<Stack
										key={`${entry.dayOfWeek}-${entry.startTime}-${idx}`}
										direction="row"
										justifyContent="space-between"
										alignItems="center"
										spacing={1}
									>
										<Typography variant="body2">
											{formatDay(entry.dayOfWeek)}: {entry.startTime} -{' '}
											{entry.endTime}
										</Typography>
										{isOwner && (
											<Button
												size="small"
												onClick={() =>
													setScheduleEntries((prev) =>
														prev.filter((_, i) => i !== idx),
													)
												}
											>
												Remove
											</Button>
										)}
									</Stack>
								))}
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary">
								{isOwner
									? 'Add working hours.'
									: 'No schedule set yet.'}
							</Typography>
						)}

						{isOwner && (
							<Stack direction="row" spacing={1} alignItems="center">
								<Button
									variant="contained"
									disabled={!canSaveSchedule || updateScheduleMutation.isPending}
									onClick={() => updateScheduleMutation.mutate(scheduleEntries)}
								>
									Save schedule
								</Button>

								{updateScheduleMutation.isError && (
									<Typography variant="body2" color="error">
										Failed to save schedule.
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

					{isOwner && (
						<Stack spacing={2} sx={{ mb: 2 }}>
							<Typography fontWeight={700}>Add unit</Typography>
							<Stack
								direction={{ xs: 'column', md: 'row' }}
								spacing={2}
							>
								<TextField
									label="Name"
									value={unitForm.name}
									onChange={(e) =>
										setUnitForm((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									fullWidth
								/>
								<TextField
									label="Type"
									value={unitForm.unitType}
									onChange={(e) =>
										setUnitForm((prev) => ({
											...prev,
											unitType: e.target.value,
										}))
									}
									fullWidth
								/>
								<TextField
									label="Capacity"
									type="number"
									value={unitForm.capacity}
									onChange={(e) =>
										setUnitForm((prev) => ({
											...prev,
											capacity: e.target.value,
										}))
									}
									fullWidth
								/>
							</Stack>
							<Stack
								direction={{ xs: 'column', md: 'row' }}
								spacing={2}
							>
								<TextField
									select
									label="Min duration (min)"
									value={unitForm.minDurationMin}
									onChange={(e) =>
										setUnitForm((prev) => ({
											...prev,
											minDurationMin: e.target.value,
										}))
									}
									fullWidth
								>
									{[30, 45, 60, 90, 120, 150, 180].map((val) => (
										<MenuItem key={val} value={val}>
											{val}
										</MenuItem>
									))}
									<MenuItem value="">No min</MenuItem>
								</TextField>
								<TextField
									select
									label="Max duration (min)"
									value={unitForm.maxDurationMin}
									onChange={(e) =>
										setUnitForm((prev) => ({
											...prev,
											maxDurationMin: e.target.value,
										}))
									}
									fullWidth
								>
									{[30, 45, 60, 90, 120, 150, 180].map((val) => (
										<MenuItem key={val} value={val}>
											{val}
										</MenuItem>
									))}
									<MenuItem value="">No max</MenuItem>
								</TextField>
								<TextField
									select
									label="Slot step (min)"
									value={unitForm.slotStepMin}
									onChange={(e) =>
										setUnitForm((prev) => ({
											...prev,
											slotStepMin: e.target.value,
										}))
									}
									fullWidth
								>
									{[15, 30, 45, 60].map((val) => (
										<MenuItem key={val} value={val}>
											{val}
										</MenuItem>
									))}
									<MenuItem value="">No step</MenuItem>
								</TextField>
							</Stack>
							<Stack direction="row" spacing={1} alignItems="center">
								<Button
									variant="contained"
									disabled={!canAddUnit || createUnitMutation.isPending}
									onClick={() => {
										const capacity = unitForm.capacity.trim()
											? Number(unitForm.capacity)
											: undefined;
										const minDurationMin = unitForm.minDurationMin.trim()
											? Number(unitForm.minDurationMin)
											: undefined;
										const maxDurationMin = unitForm.maxDurationMin.trim()
											? Number(unitForm.maxDurationMin)
											: undefined;
										const slotStepMin = unitForm.slotStepMin.trim()
											? Number(unitForm.slotStepMin)
											: undefined;

										createUnitMutation.mutate({
											name: unitForm.name.trim(),
											unitType: unitForm.unitType.trim(),
											capacity: Number.isNaN(capacity)
												? undefined
												: capacity,
											minDurationMin: Number.isNaN(minDurationMin)
												? undefined
												: minDurationMin,
											maxDurationMin: Number.isNaN(maxDurationMin)
												? undefined
												: maxDurationMin,
											slotStepMin: Number.isNaN(slotStepMin)
												? undefined
												: slotStepMin,
										});
									}}
								>
									Add unit
								</Button>

								{createUnitMutation.isError && (
									<Typography variant="body2" color="error">
										Failed to add unit. Try again.
									</Typography>
								)}
							</Stack>
							<Divider />
						</Stack>
					)}

					{venue.units.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							No units yet.
						</Typography>
					) : (
						<Stack spacing={1}>
							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: '1.2fr 0.8fr 0.6fr 0.9fr 0.9fr',
									gap: 1,
									px: 1,
									color: 'text.secondary',
								}}
							>
								<Typography variant="caption">Name</Typography>
								<Typography variant="caption">Type</Typography>
								<Typography variant="caption">Capacity</Typography>
								<Typography variant="caption">Min duration</Typography>
								<Typography variant="caption">Max duration</Typography>
							</Box>

							{venue.units.map((unit) => (
								<Paper key={unit.id} variant="outlined" sx={{ p: 1.5 }}>
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns:
												'1.2fr 0.8fr 0.6fr 0.9fr 0.9fr',
											gap: 1,
											alignItems: 'center',
										}}
									>
										<Typography fontWeight={700}>{unit.name}</Typography>
										<Typography variant="body2" color="text.secondary">
											{unit.unitType}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{unit.capacity ?? '—'}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{unit.minDurationMin ?? '—'}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{unit.maxDurationMin ?? '—'}
										</Typography>
									</Box>
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

function formatDay(day: number) {
	const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return map[day] ?? String(day);
}
