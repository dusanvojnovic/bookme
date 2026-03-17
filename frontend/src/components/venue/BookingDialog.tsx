import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBooking } from '../../api/customer.api';
import type { CreateBookingPayload } from '../../types/booking';
import { type Offering, type Unit } from '../../types/venue';
import {
	fromMinutes,
	generateSlots,
	isSlotBlocked,
	isSlotBooked,
	toMinutes,
	type BlockSlot,
	type BookingSlot,
} from '../../utils/venueSlots';
import { fetchBlocks, fetchBookings } from '../../api/venue.api';

function SlotChip({
	slot,
	durationMin,
	dateParam,
	selectedUnitId,
	selectedOfferingId,
	selectedSlot,
	requestedSlot,
	bookingsForUnit,
	blocksForUnit,
	isSlotPast,
	onSelect,
}: {
	slot: string;
	durationMin: number;
	dateParam: string;
	selectedUnitId: string;
	selectedOfferingId: string;
	selectedSlot: string | null;
	requestedSlot: { slot: string; date: string; unitId: string; offeringId: string } | null;
	bookingsForUnit: BookingSlot[];
	blocksForUnit: BlockSlot[];
	isSlotPast: (s: string) => boolean;
	onSelect: (slot: string) => void;
}) {
	const label = `${slot}–${fromMinutes(toMinutes(slot) + durationMin)}`;
	const isSelected = selectedSlot === slot;
	const isRequested =
		requestedSlot?.slot === slot &&
		requestedSlot.date === dateParam &&
		requestedSlot.unitId === selectedUnitId &&
		requestedSlot.offeringId === selectedOfferingId;
	const isBusy = isSlotBooked(
		bookingsForUnit,
		dateParam,
		slot,
		durationMin,
	);
	const blocked = isSlotBlocked(
		blocksForUnit,
		dateParam,
		slot,
		durationMin,
	);
	const isBlocked = !!blocked;
	const isPast = isSlotPast(slot);

	return (
		<Chip
			key={slot}
			label={label}
			size="medium"
			color={
				isPast
					? 'default'
					: isBlocked
						? 'error'
						: isBusy
							? 'default'
							: 'success'
			}
			variant={
				isSelected
					? 'filled'
					: isPast || isBlocked || isBusy
						? 'outlined'
						: 'outlined'
			}
			onClick={() => {
				if (isRequested || isBusy || isBlocked || isPast) return;
				onSelect(slot);
			}}
			title={blocked?.reason ?? (isPast ? 'This slot has passed' : undefined)}
			sx={{
				maxWidth: 200,
				px: 1.5,
				py: 1.2,
				backgroundColor: isRequested
					? 'rgba(255, 193, 7, 0.18)'
					: isSelected
						? 'rgba(76, 175, 80, 0.9)'
						: isPast
							? 'rgba(158, 158, 158, 0.08)'
							: isBlocked
								? 'rgba(244, 67, 54, 0.16)'
								: isBusy
									? 'rgba(158, 158, 158, 0.15)'
									: 'rgba(76, 175, 80, 0.08)',
				color: isSelected
					? 'common.white'
					: isRequested
						? 'warning.main'
						: isPast || isBusy
							? 'text.secondary'
							: isBlocked
								? 'error.main'
								: 'inherit',
				cursor:
					isRequested || isBusy || isBlocked || isPast
						? 'default'
						: 'pointer',
				borderWidth: isSelected ? 2 : 1,
				opacity: isPast ? 0.6 : 1,
			}}
		/>
	);
}

export function BookingDialog({
	open,
	onClose,
	venueId,
	token,
	units,
	offerings,
	schedules,
	slotStepMin: venueSlotStepMin,
	initialUnitId,
	onBookingSuccess,
}: {
	open: boolean;
	onClose: () => void;
	venueId: string;
	token: string | null;
	units: Unit[];
	offerings: Offering[];
	schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
	slotStepMin?: number | null;
	initialUnitId?: string;
	onBookingSuccess?: () => void;
}) {
	const [selectedUnitId, setSelectedUnitId] = useState('');
	const [selectedOfferingId, setSelectedOfferingId] = useState('');
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
	const [bookingAttempted, setBookingAttempted] = useState(false);
	const [bookingError, setBookingError] = useState<string | null>(null);
	const [requestedSlot, setRequestedSlot] = useState<{
		slot: string;
		date: string;
		unitId: string;
		offeringId: string;
	} | null>(null);

	useEffect(() => {
		if (open && initialUnitId) {
			setSelectedUnitId(initialUnitId);
		}
	}, [open, initialUnitId]);

	useEffect(() => {
		if (!open) {
			setBookingAttempted(false);
			setBookingError(null);
		}
	}, [open]);

	useEffect(() => {
		if (bookingError) setBookingError(null);
	}, [selectedUnitId, selectedOfferingId, selectedDate, selectedSlot, bookingError]);

	const activeOfferings = offerings.filter((o) => o.isActive);
	const selectedUnit = units.find((u) => u.id === selectedUnitId);
	const selectedOffering = activeOfferings.find((o) => o.id === selectedOfferingId);
	const durationMin = selectedOffering?.durationMin ?? null;
	const slotStepMin =
		selectedUnit?.slotStepMin ?? venueSlotStepMin ?? 30;
	const dateParam = (selectedDate ?? dayjs()).format('YYYY-MM-DD');
	const { data: bookings = [] } = useQuery({
		queryKey: ['venue-bookings', venueId, dateParam],
		queryFn: () => fetchBookings(venueId, dateParam),
		enabled: open && !!selectedDate,
		staleTime: 30_000,
	});
	const { data: blocks = [] } = useQuery({
		queryKey: ['venue-blocks', venueId, dateParam],
		queryFn: () => fetchBlocks(venueId, dateParam),
		enabled: open && !!selectedDate,
		staleTime: 30_000,
	});

	const dayOfWeek = selectedDate?.day();
	const daySchedule = schedules.filter((entry) => entry.dayOfWeek === dayOfWeek);
	const bookingsForUnit = bookings.filter(
		(booking) => booking.unitId === selectedUnitId,
	);
	const blocksForUnit = blocks.filter(
		(block) => block.unitId === selectedUnitId,
	);

	const allSlots = useMemo(() => {
		if (!durationMin || !selectedDate || !selectedUnitId) return [];
		return generateSlots(daySchedule, slotStepMin, durationMin);
	}, [
		daySchedule,
		slotStepMin,
		durationMin,
		selectedDate,
		selectedUnitId,
	]);

	const isSlotPast = useCallback(
		(slot: string) => {
			if (!selectedDate) return false;
			const now = dayjs();
			if (!selectedDate.isSame(now, 'day')) return false;
			const slotStart = selectedDate
				.hour(Math.floor(toMinutes(slot) / 60))
				.minute(toMinutes(slot) % 60)
				.second(0)
				.millisecond(0);
			return slotStart.isBefore(now) || slotStart.isSame(now);
		},
		[selectedDate],
	);

	useEffect(() => {
		setSelectedSlot(null);
	}, [selectedUnitId, selectedOfferingId, selectedDate]);

	const queryClient = useQueryClient();
	const createBookingMutation = useMutation({
		mutationFn: (payload: CreateBookingPayload) =>
			createBooking(token!, venueId, payload),
		onSuccess: () => {
			if (selectedSlot) {
				setRequestedSlot({
					slot: selectedSlot,
					date: dateParam,
					unitId: selectedUnitId,
					offeringId: selectedOfferingId,
				});
			}
			setSelectedSlot(null);
			queryClient.invalidateQueries({
				queryKey: ['venue-bookings', venueId, dateParam],
			});
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
			onBookingSuccess?.();
		},
		onError: (error: unknown) => {
			const message = axios.isAxiosError(error)
				? Array.isArray(error.response?.data?.message)
					? error.response?.data?.message.join(', ')
					: error.response?.data?.message || error.message
				: error instanceof Error
					? error.message
					: 'Failed to create booking';
			setBookingError(message);
		},
	});

	const canSubmitBooking =
		!!token &&
		!!selectedDate &&
		!!selectedUnitId &&
		!!selectedOfferingId &&
		!!selectedSlot;

	const handleReserve = () => {
		setBookingAttempted(true);
		setBookingError(null);
		if (!token) {
			setBookingError('Please log in to book a slot');
			return;
		}
		if (
			!selectedDate ||
			!selectedUnitId ||
			!selectedOfferingId ||
			!selectedSlot
		) {
			return;
		}

		createBookingMutation.mutate({
			unitId: selectedUnitId,
			offeringId: selectedOfferingId,
			startAt: `${dateParam}T${selectedSlot}:00`,
		});
	};

	const resetForm = () => {
		setSelectedUnitId(initialUnitId ?? '');
		setSelectedOfferingId('');
		setSelectedDate(null);
		setSelectedSlot(null);
		setBookingAttempted(false);
		setBookingError(null);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const mid = Math.ceil(allSlots.length / 2);
	const leftSlots = allSlots.slice(0, mid);
	const rightSlots = allSlots.slice(mid);

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			fullWidth
			maxWidth="md"
		>
			<DialogTitle>Reserve a slot</DialogTitle>
			<DialogContent sx={{ pt: 2 }}>
				<Stack spacing={2}>
					{bookingError && (
						<Alert severity="error">{bookingError}</Alert>
					)}
					{!token && (
						<Alert severity="warning">
							Log in to reserve a slot.
						</Alert>
					)}
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={1.5}
						alignItems={{ md: 'center' }}
					>
						{selectedUnitId && selectedUnit ? (
							<Box
								sx={{
									minWidth: 200,
									height: 40,
									display: 'flex',
									alignItems: 'start',
								}}
							>
								<Typography fontWeight={700}>
									{selectedUnit.name}
								</Typography>
							</Box>
						) : (
							<TextField
								select
								label="Unit"
								value={selectedUnitId}
								onChange={(e) =>
									setSelectedUnitId(String(e.target.value))
								}
								size="small"
								sx={{ minWidth: 200 }}
								error={bookingAttempted && !selectedUnitId}
								helperText={
									bookingAttempted && !selectedUnitId
										? 'Select a unit'
										: ' '
								}
							>
								{units.map((unit) => (
									<MenuItem key={unit.id} value={unit.id}>
										{unit.name}
									</MenuItem>
								))}
							</TextField>
						)}

						<TextField
							select
							label="Duration"
							value={selectedOfferingId}
							onChange={(e) =>
								setSelectedOfferingId(String(e.target.value))
							}
							size="small"
							sx={{ minWidth: 220, marginTop: 2 }}
							disabled={!activeOfferings.length}
							error={bookingAttempted && !selectedOfferingId}
							helperText={
								!activeOfferings.length
									? 'No active offerings'
									: bookingAttempted && !selectedOfferingId
										? 'Select a duration'
										: ' '
							}
						>
							{activeOfferings.map((offering) => (
								<MenuItem key={offering.id} value={offering.id}>
									{offering.name} ({offering.durationMin} min)
								</MenuItem>
							))}
						</TextField>

						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DatePicker
								label="Date"
								value={selectedDate}
								onChange={(value) => setSelectedDate(value)}
								minDate={dayjs()}
								slotProps={{
									textField: {
										size: 'small',
										sx: { minWidth: 180 },
										error: bookingAttempted && !selectedDate,
										helperText:
											bookingAttempted && !selectedDate
												? 'Select a date'
												: ' ',
									},
								}}
							/>
						</LocalizationProvider>
					</Stack>

					{!offerings.length ? (
						<Typography variant="body2" color="text.secondary">
							No offerings yet.
						</Typography>
					) : !activeOfferings.length ? (
						<Typography variant="body2" color="text.secondary">
							No active offerings available.
						</Typography>
					) : !selectedDate ? (
						<Typography variant="body2" color="text.secondary">
							Select a date to see available slots.
						</Typography>
					) : !selectedUnitId ? (
						<Typography variant="body2" color="text.secondary">
							Select a unit to see available slots.
						</Typography>
					) : !selectedOfferingId ? (
						<Typography variant="body2" color="text.secondary">
							Select a duration to see available slots.
						</Typography>
					) : !daySchedule.length ? (
						<Typography variant="body2" color="text.secondary">
							No working hours for this day.
						</Typography>
					) : (
						<Stack spacing={1}>
							<Typography variant="body2" color="text.secondary">
								Time slots ({slotStepMin} min step)
							</Typography>
							{allSlots.length === 0 ? (
								<Typography
									variant="body2"
									color="text.secondary"
								>
									No slots for this day.
								</Typography>
							) : (
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									spacing={2}
									alignItems="flex-start"
								>
									<Stack spacing={1}>
										{leftSlots.map((slot) => (
											<SlotChip
												key={slot}
												slot={slot}
												durationMin={durationMin ?? 0}
												dateParam={dateParam}
												selectedUnitId={selectedUnitId}
												selectedOfferingId={selectedOfferingId}
												selectedSlot={selectedSlot}
												requestedSlot={requestedSlot}
												bookingsForUnit={bookingsForUnit}
												blocksForUnit={blocksForUnit}
												isSlotPast={isSlotPast}
												onSelect={setSelectedSlot}
											/>
										))}
									</Stack>
									<Stack spacing={1}>
										{rightSlots.map((slot) => (
											<SlotChip
												key={slot}
												slot={slot}
												durationMin={durationMin ?? 0}
												dateParam={dateParam}
												selectedUnitId={selectedUnitId}
												selectedOfferingId={selectedOfferingId}
												selectedSlot={selectedSlot}
												requestedSlot={requestedSlot}
												bookingsForUnit={bookingsForUnit}
												blocksForUnit={blocksForUnit}
												isSlotPast={isSlotPast}
												onSelect={setSelectedSlot}
											/>
										))}
									</Stack>
								</Stack>
							)}
							{bookingAttempted && !selectedSlot && (
								<Typography variant="body2" color="error">
									Select a time slot.
								</Typography>
							)}
						</Stack>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button
					variant="contained"
					disabled={!canSubmitBooking || createBookingMutation.isPending}
					onClick={handleReserve}
				>
					Reserve
				</Button>
				<Button variant="outlined" onClick={handleClose}>
					Cancel
				</Button>
			</DialogActions>
		</Dialog>
	);
}
