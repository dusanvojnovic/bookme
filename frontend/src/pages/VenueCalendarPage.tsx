import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {
	Alert,
	Box,
	Button,
	Chip,
	Divider,
	Paper,
	Stack,
	Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { api } from '../api/api';
import { type VenueDetails } from '../types/venue';

type BookingSlot = {
	id: string;
	unitId: string;
	startAt: string;
	endAt: string;
};

async function fetchVenue(venueId: string) {
	const res = await api.get<VenueDetails>(`/venues/${venueId}`);
	return res.data;
}

async function fetchBookings(venueId: string, date: string) {
	const res = await api.get<BookingSlot[]>(`/venues/${venueId}/bookings`, {
		params: { date },
	});
	return res.data;
}

export function VenueCalendarPage() {
	const { venueId } = useParams({ from: '/venues/$venueId/calendar' });
	const navigate = useNavigate();
	const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(
		dayjs(),
	);

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

	const dayOfWeek = selectedDate?.day() ?? dayjs().day();
	const daySchedule = venue?.schedules?.filter(
		(entry) => entry.dayOfWeek === dayOfWeek,
	);
	const slotStepMin = venue?.slotStepMin ?? 30;
	const slots = React.useMemo(
		() => generateSlots(daySchedule ?? [], slotStepMin),
		[daySchedule, slotStepMin],
	);

	const bookingsByUnit = React.useMemo(() => {
		const map = new Map<string, BookingSlot[]>();
		for (const booking of bookings) {
			if (!map.has(booking.unitId)) map.set(booking.unitId, []);
			map.get(booking.unitId)!.push(booking);
		}
		return map;
	}, [bookings]);

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
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label="Date"
							value={selectedDate}
							onChange={(value) => setSelectedDate(value)}
							slotProps={{ textField: { size: 'small' } }}
						/>
					</LocalizationProvider>

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
						<Typography fontWeight={800}>Daily view</Typography>
						<Typography variant="body2" color="text.secondary">
							Slot step: {slotStepMin} min
						</Typography>
					</Stack>

					{!daySchedule?.length ? (
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

													return (
														<Chip
															key={`${unit.id}-${slot}`}
															label={slot}
															size="small"
															color={isBusy ? 'default' : 'success'}
															variant={isBusy ? 'outlined' : 'filled'}
														/>
													);
												})
											)}
										</Box>
									</Stack>
								</Paper>
							))}
						</Stack>
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
