import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
	Alert,
	Box,
	Button,
	Chip,
	Divider,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Stack,
	Typography,
} from '@mui/material';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
	fetchBlocks,
	fetchBookings,
	fetchVenue,
} from '../api/venue.api';
import type { BookingSlot } from '../types/booking';
import type { BlockSlot } from '../types/venue';

export function VenueCalendarPage() {
	const { venueId } = useParams({ from: '/venues/$venueId/calendar' });
	const navigate = useNavigate();
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(
		dayjs(),
	);
	const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
	const [selectedUnitId, setSelectedUnitId] = useState('');

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

	const dateParam = (selectedDate ?? dayjs()).format('YYYY-MM-DD');
	const { data: bookings = [] } = useQuery({
		queryKey: ['venue-bookings', venueId, dateParam],
		queryFn: () => fetchBookings(venueId, dateParam),
		staleTime: 30_000,
	});
	const { data: blocks = [] } = useQuery({
		queryKey: ['venue-blocks', venueId, dateParam],
		queryFn: () => fetchBlocks(venueId, dateParam),
		staleTime: 30_000,
	});

	const weekBase = selectedDate ?? dayjs();
	const weekStart = weekBase.subtract((weekBase.day() + 6) % 7, 'day');
	const weekDates = useMemo(
		() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')),
		[weekStart],
	);
	const weekQueries = useQueries({
		queries: weekDates.map((date) => ({
			queryKey: ['venue-bookings', venueId, date.format('YYYY-MM-DD')],
			queryFn: () => fetchBookings(venueId, date.format('YYYY-MM-DD')),
			enabled: viewMode === 'week',
			staleTime: 30_000,
		})),
	});
	const weekBlockQueries = useQueries({
		queries: weekDates.map((date) => ({
			queryKey: ['venue-blocks', venueId, date.format('YYYY-MM-DD')],
			queryFn: () => fetchBlocks(venueId, date.format('YYYY-MM-DD')),
			enabled: viewMode === 'week',
			staleTime: 30_000,
		})),
	});
	const weekBookingsByDate = useMemo(() => {
		const map = new Map<string, BookingSlot[]>();
		weekDates.forEach((date, index) => {
			const key = date.format('YYYY-MM-DD');
			map.set(key, weekQueries[index]?.data ?? []);
		});
		return map;
	}, [weekDates, weekQueries]);
	const weekBlocksByDate = useMemo(() => {
		const map = new Map<string, BlockSlot[]>();
		weekDates.forEach((date, index) => {
			const key = date.format('YYYY-MM-DD');
			map.set(key, weekBlockQueries[index]?.data ?? []);
		});
		return map;
	}, [weekDates, weekBlockQueries]);

	const dayOfWeek = selectedDate?.day() ?? dayjs().day();
	const daySchedule = venue?.schedules?.filter(
		(entry) => entry.dayOfWeek === dayOfWeek,
	);
	const slotStepMin = venue?.slotStepMin ?? 30;
	const slots = useMemo(
		() => generateSlots(daySchedule ?? [], slotStepMin),
		[daySchedule, slotStepMin],
	);

	const bookingsByUnit = useMemo(() => {
		const map = new Map<string, BookingSlot[]>();
		for (const booking of bookings) {
			if (!map.has(booking.unitId)) map.set(booking.unitId, []);
			map.get(booking.unitId)!.push(booking);
		}
		return map;
	}, [bookings]);
	const blocksByUnit = useMemo(() => {
		const map = new Map<string, BlockSlot[]>();
		for (const block of blocks) {
			if (!map.has(block.unitId)) map.set(block.unitId, []);
			map.get(block.unitId)!.push(block);
		}
		return map;
	}, [blocks]);

	useEffect(() => {
		if (!selectedUnitId && venue?.units?.length) {
			setSelectedUnitId(venue.units[0].id);
		}
	}, [selectedUnitId, venue?.units]);

	if (isLoading) {
		return (
			<Typography variant="body2" color="text.secondary">
				Loading calendar...
			</Typography>
		);
	}

	if (isError || !venue) {
		return (
			<Alert severity="error">
				Failed to load calendar.
				{error instanceof Error ? ` ${error.message}` : ''}
			</Alert>
		);
	}

	return (
		<Box sx={{ width: '100%', maxWidth: 1200 }}>
			<Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ md: 'center' }}
					spacing={1}
				>
					<Stack direction="row" spacing={1} alignItems="center">
						<CalendarMonthIcon />
						<Typography variant="h5" fontWeight={900}>
							{venue.name} calendar
						</Typography>
					</Stack>

					<Button
						onClick={() =>
							navigate({
								to: '/venues/$venueId',
								params: { venueId },
							})
						}
					>
						Back to venue
					</Button>
				</Stack>
			</Paper>

			<Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ md: 'center' }}
					spacing={2}
				>
						<Stack
							direction={{ xs: 'column', sm: 'row' }}
							spacing={1}
							alignItems={{ sm: 'center' }}
						>
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<IconButton
									size="small"
									onClick={() => {
										const base = selectedDate ?? dayjs();
										if (viewMode === 'day') {
											setSelectedDate(base.subtract(1, 'day'));
										} else {
											setSelectedDate(weekStart.subtract(7, 'day'));
										}
									}}
									aria-label={
										viewMode === 'day' ? 'Previous day' : 'Previous week'
									}
								>
									<ChevronLeftIcon />
								</IconButton>
								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<DatePicker
										label="Date"
										value={selectedDate}
										onChange={(value) => setSelectedDate(value)}
										slotProps={{ textField: { size: 'small' } }}
									/>
								</LocalizationProvider>
								<IconButton
									size="small"
									onClick={() => {
										const base = selectedDate ?? dayjs();
										if (viewMode === 'day') {
											setSelectedDate(base.add(1, 'day'));
										} else {
											setSelectedDate(weekStart.add(7, 'day'));
										}
									}}
									aria-label={
										viewMode === 'day' ? 'Next day' : 'Next week'
									}
								>
									<ChevronRightIcon />
								</IconButton>
							</Stack>
							{viewMode === 'week' && (
								<Select
									value={selectedUnitId}
									onChange={(e) =>
										setSelectedUnitId(String(e.target.value))
									}
									size="small"
									sx={{ minWidth: 200 }}
									displayEmpty
								>
									{venue.units.map((unit) => (
										<MenuItem key={unit.id} value={unit.id}>
											{unit.name}
										</MenuItem>
									))}
								</Select>
							)}
							<Stack direction="row" spacing={1}>
								<Button
									size="small"
									variant={viewMode === 'day' ? 'contained' : 'outlined'}
									onClick={() => setViewMode('day')}
								>
									Day
								</Button>
								<Button
									size="small"
									variant={viewMode === 'week' ? 'contained' : 'outlined'}
									onClick={() => setViewMode('week')}
								>
									Week
								</Button>
							</Stack>
						</Stack>

					<Stack spacing={0.5}>
						<Typography variant="body2" color="text.secondary">
							Working hours for this day:
						</Typography>
						{daySchedule?.length ? (
							daySchedule.map((entry) => (
								<Typography key={entry.id} fontWeight={700}>
									{entry.startTime} - {entry.endTime}
								</Typography>
							))
						) : (
							<Typography variant="body2" color="text.secondary">
								No schedule set.
							</Typography>
						)}
					</Stack>
				</Stack>
			</Paper>

			<Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
				<Stack spacing={2}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
						spacing={1}
					>
						<Typography fontWeight={800}>
							{viewMode === 'day' ? 'Daily view' : 'Weekly view'}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Slot step: {slotStepMin} min
						</Typography>
					</Stack>

					{viewMode === 'day' ? (
						!daySchedule?.length ? (
							<Typography variant="body2" color="text.secondary">
								Set working hours to see available slots.
							</Typography>
						) : (
							<Stack spacing={2}>
								{venue.units.map((unit) => (
									<Paper key={unit.id} variant="outlined" sx={{ p: 2 }}>
										<Stack spacing={1}>
											<Stack
												direction={{ xs: 'column', md: 'row' }}
												justifyContent="space-between"
												alignItems={{ md: 'center' }}
												spacing={1}
											>
												<Typography fontWeight={700}>
													{unit.name}
												</Typography>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													{unit.unitType}
												</Typography>
											</Stack>

											<Divider />

											<Box
												sx={{
													display: 'flex',
													flexWrap: 'wrap',
													gap: 1,
												}}
											>
												{slots.length === 0 ? (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														No slots for this day.
													</Typography>
												) : (
													slots.map((slot) => {
													const isBusy = isSlotBooked(
														bookingsByUnit.get(unit.id) ?? [],
														dateParam,
														slot,
														slotStepMin,
													);
													const isBlocked = isSlotBlocked(
														blocksByUnit.get(unit.id) ?? [],
														dateParam,
														slot,
														slotStepMin,
													);

														return (
															<Chip
																key={`${unit.id}-${slot}`}
																label={slot}
																size="small"
															color={
																isBlocked
																	? 'error'
																	: isBusy
																		? 'default'
																		: 'success'
															}
															variant={
																isBlocked || isBusy ? 'outlined' : 'filled'
															}
															/>
														);
													})
												)}
											</Box>
										</Stack>
									</Paper>
								))}
							</Stack>
						)
					) : (
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: {
									xs: '1fr',
									md: 'repeat(7, minmax(0, 1fr))',
								},
								gap: 1,
							}}
						>
							{weekDates.map((date) => {
								const dayKey = date.format('YYYY-MM-DD');
								const dayBookings = weekBookingsByDate.get(dayKey) ?? [];
								const dayBlocks = weekBlocksByDate.get(dayKey) ?? [];
								const scheduleForDay =
									venue.schedules?.filter(
										(entry) => entry.dayOfWeek === date.day(),
									) ?? [];
								const daySlots = generateSlots(
									scheduleForDay,
									slotStepMin,
								);
								return (
									<Paper
										key={dayKey}
										variant="outlined"
										sx={{ p: 1.5 }}
									>
										<Stack spacing={1}>
											<Box>
												<Typography fontWeight={700}>
													{date.format('ddd')}
												</Typography>
												<Typography
													variant="caption"
													color="text.secondary"
												>
													{date.format('DD MMM')}
												</Typography>
											</Box>
											<Typography variant="caption" color="text.secondary">
												{daySlots.length ? 'Schedule set' : 'No schedule'}
											</Typography>
											<Box
												sx={{
													display: 'flex',
													flexWrap: 'wrap',
													gap: 0.5,
												}}
											>
												{daySlots.length === 0 ? (
													<Typography
														variant="caption"
														color="text.secondary"
													>
														—
													</Typography>
												) : (
													daySlots.map((slot) => {
														const unitBookings = selectedUnitId
															? dayBookings.filter(
																	(booking) =>
																		booking.unitId === selectedUnitId,
															  )
															: dayBookings;
														const unitBlocks = selectedUnitId
															? dayBlocks.filter(
																	(block) =>
																		block.unitId === selectedUnitId,
															  )
															: dayBlocks;
														const isBusy = isSlotBooked(
															unitBookings,
															dayKey,
															slot,
															slotStepMin,
														);
														const isBlocked = isSlotBlocked(
															unitBlocks,
															dayKey,
															slot,
															slotStepMin,
														);
														return (
															<Chip
																key={`${dayKey}-${slot}`}
																label={slot}
																size="small"
																color={
																	isBlocked
																		? 'error'
																		: isBusy
																			? 'default'
																			: 'success'
																}
																variant={
																	isBlocked || isBusy
																		? 'outlined'
																		: 'filled'
																}
																sx={{ minWidth: 64 }}
															/>
														);
													})
												)}
											</Box>
										</Stack>
									</Paper>
								);
							})}
						</Box>
					)}
				</Stack>
			</Paper>
		</Box>
	);
}

function generateSlots(
	schedule: { startTime: string; endTime: string }[],
	stepMin: number,
) {
	if (!schedule.length || stepMin <= 0) return [];

	const slots = new Set<string>();

	for (const entry of schedule) {
		const start = toMinutes(entry.startTime);
		const end = toMinutes(entry.endTime);
		if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;

		for (let t = start; t + stepMin <= end; t += stepMin) {
			slots.add(fromMinutes(t));
		}
	}

	return Array.from(slots).sort((a, b) => a.localeCompare(b));
}

function isSlotBooked(
	bookings: BookingSlot[],
	date: string,
	slot: string,
	stepMin: number,
) {
	const slotStart = new Date(`${date}T${slot}:00`);
	const slotEnd = new Date(slotStart.getTime() + stepMin * 60000);

	return bookings.some((booking) => {
		const start = new Date(booking.startAt);
		const end = new Date(booking.endAt);
		return start < slotEnd && end > slotStart;
	});
}

function isSlotBlocked(
	blocks: BlockSlot[],
	date: string,
	slot: string,
	stepMin: number,
) {
	const slotStart = new Date(`${date}T${slot}:00`);
	const slotEnd = new Date(slotStart.getTime() + stepMin * 60000);

	return blocks.some((block) => {
		const start = new Date(block.startAt);
		const end = new Date(block.endAt);
		return start < slotEnd && end > slotStart;
	});
}


function toMinutes(time: string) {
	const [h, m] = time.split(':').map((v) => Number(v));
	if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
	return h * 60 + m;
}

function fromMinutes(total: number) {
	const h = Math.floor(total / 60)
		.toString()
		.padStart(2, '0');
	const m = (total % 60).toString().padStart(2, '0');
	return `${h}:${m}`;
}
