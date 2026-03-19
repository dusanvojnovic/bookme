import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
	Alert,
	Button,
	Divider,
	MenuItem,
	Paper,
	Snackbar,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { updateSchedule } from '../../api/venue.api';
import type { ScheduleEntryPayload } from '../../types/venue';
import { type VenueSchedule } from '../../types/venue';

function formatDay(day: number) {
	const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return map[day] ?? String(day);
}

export function VenueScheduleManager({
	venueId,
	token,
	schedules,
	isOwner,
}: {
	venueId: string;
	token: string | null;
	schedules: VenueSchedule[];
	isOwner: boolean;
}) {
	const queryClient = useQueryClient();

	const [repeatType, setRepeatType] = useState<
		'everyday' | 'weekdays' | 'weekends' | 'custom'
	>('everyday');
	const [selectedDays, setSelectedDays] = useState<number[]>([
		0, 1, 2, 3, 4, 5, 6,
	]);
	const [scheduleStart, setScheduleStart] = useState<Dayjs | null>(
		dayjs('09:00', 'HH:mm'),
	);
	const [scheduleEnd, setScheduleEnd] = useState<Dayjs | null>(
		dayjs('21:00', 'HH:mm'),
	);
	const [scheduleEntries, setScheduleEntries] = useState<
		ScheduleEntryPayload[]
	>([]);

	useEffect(() => {
		if (schedules.length) {
			setScheduleEntries(
				schedules.map((entry) => ({
					dayOfWeek: entry.dayOfWeek,
					startTime: entry.startTime,
					endTime: entry.endTime,
				})),
			);
			setScheduleStart(dayjs(schedules[0].startTime, 'HH:mm'));
			setScheduleEnd(dayjs(schedules[0].endTime, 'HH:mm'));
		} else {
			setScheduleEntries([]);
		}
	}, [schedules]);

	const updateScheduleMutation = useMutation({
		mutationFn: (entries: ScheduleEntryPayload[]) =>
			updateSchedule(token!, venueId, entries),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	const canAddScheduleEntry =
		isOwner && !!scheduleStart && !!scheduleEnd && selectedDays.length > 0;

	const canSaveSchedule = isOwner && scheduleEntries.length > 0;

	const displaySchedules = isOwner ? scheduleEntries : schedules;

	return (
		<>
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
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
			<Stack spacing={2}>
				<Typography fontWeight={800}>Opening hours</Typography>

				{isOwner ? (
					<>
						<Stack spacing={1.5}>
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
							</Stack>
							<Button
								variant="contained"
								disabled={!canAddScheduleEntry}
								size="small"
								sx={{ alignSelf: 'flex-start' }}
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

				{displaySchedules.length ? (
					<Stack spacing={1} sx={{ maxWidth: 360, alignSelf: 'flex-start' }}>
								{displaySchedules
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
											onClick={() => {
												const sorted = displaySchedules
													.slice()
													.sort((a, b) => {
														const order = [1, 2, 3, 4, 5, 6, 0];
														const dayDiff =
															order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
														if (dayDiff !== 0) return dayDiff;
														return a.startTime.localeCompare(b.startTime);
													});
												const toRemove = sorted[idx];
												if (!toRemove) return;
												setScheduleEntries((prev) => {
													const removeIdx = prev.findIndex(
														(e) =>
															e.dayOfWeek === toRemove.dayOfWeek &&
															e.startTime === toRemove.startTime &&
															e.endTime === toRemove.endTime,
													);
													if (removeIdx < 0) return prev;
													return prev.filter((_, i) => i !== removeIdx);
												});
											}}
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
		</>
	);
}
