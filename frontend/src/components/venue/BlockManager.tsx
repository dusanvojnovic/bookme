import {
	Button,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { createBlock, fetchBlocks } from '../../api/venue.api';
import type { CreateBlockPayload } from '../../types/venue';
import { type Unit } from '../../types/venue';

export function BlockManager({
	venueId,
	token,
	units,
}: {
	venueId: string;
	token: string | null;
	units: Unit[];
}) {
	const queryClient = useQueryClient();

	const [blockUnitId, setBlockUnitId] = useState('');
	const [blockDate, setBlockDate] = useState<Dayjs | null>(dayjs());
	const [blockStart, setBlockStart] = useState<Dayjs | null>(null);
	const [blockEnd, setBlockEnd] = useState<Dayjs | null>(null);
	const [blockReason, setBlockReason] = useState('');
	const [blockError, setBlockError] = useState<string | null>(null);

	useEffect(() => {
		if (units.length > 0 && !blockUnitId) {
			setBlockUnitId('all');
		}
	}, [units, blockUnitId]);

	useEffect(() => {
		if (blockError) setBlockError(null);
	}, [blockUnitId, blockDate, blockStart, blockEnd, blockReason, blockError]);

	const blockDateParam = (blockDate ?? dayjs()).format('YYYY-MM-DD');
	const { data: blocksForDay = [] } = useQuery({
		queryKey: ['venue-blocks', venueId, blockDateParam],
		queryFn: () => fetchBlocks(venueId, blockDateParam),
		enabled: !!blockDate,
		staleTime: 30_000,
	});

	const createBlocksMutation = useMutation({
		mutationFn: async (payloads: CreateBlockPayload[]) => {
			await Promise.all(
				payloads.map((payload) => createBlock(token!, venueId, payload)),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['venue-blocks', venueId],
			});
			setBlockStart(null);
			setBlockEnd(null);
			setBlockReason('');
			setBlockError(null);
		},
		onError: (error) => {
			const message = axios.isAxiosError(error)
				? Array.isArray(error.response?.data?.message)
					? error.response?.data?.message.join(', ')
					: error.response?.data?.message || error.message
				: error instanceof Error
					? error.message
					: 'Failed to add block';
			setBlockError(message);
		},
	});

	const canCreateBlock =
		units.length > 0 &&
		(blockUnitId === 'all' || !!blockUnitId) &&
		!!blockDate &&
		!!blockStart &&
		!!blockEnd &&
		blockEnd.isAfter(blockStart);

	const handleAddBlock = () => {
		if (!blockDate || !blockStart || !blockEnd) return;
		const date = blockDate.format('YYYY-MM-DD');
		const targets =
			blockUnitId === 'all'
				? units.map((unit) => unit.id)
				: blockUnitId ? [blockUnitId] : [];
		if (targets.length === 0) return;
		createBlocksMutation.mutate(
			targets.map((unitId) => ({
				unitId,
				startAt: `${date}T${blockStart.format('HH:mm')}:00`,
				endAt: `${date}T${blockEnd.format('HH:mm')}:00`,
				reason: blockReason.trim() || undefined,
			})),
		);
	};

	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
			<Stack spacing={2}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ md: 'center' }}
					spacing={1}
				>
					<Typography fontWeight={800}>Blocks</Typography>
					<Typography variant="body2" color="text.secondary">
						Temporarily block units for maintenance or outages.
					</Typography>
				</Stack>

				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					alignItems={{ md: 'center' }}
				>
					<Select
						value={units.length ? blockUnitId : ''}
						onChange={(e) => setBlockUnitId(String(e.target.value))}
						sx={{ minWidth: 220 }}
						displayEmpty
						disabled={!units.length}
					>
						<MenuItem value="all">All units</MenuItem>
						{units.map((unit) => (
							<MenuItem key={unit.id} value={unit.id}>
								{unit.name}
							</MenuItem>
						))}
					</Select>

					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label="Date"
							value={blockDate}
							onChange={(value) => setBlockDate(value)}
							slotProps={{ textField: { size: 'small' } }}
						/>
						<TimePicker
							label="Start"
							ampm={false}
							value={blockStart}
							onChange={(value) => setBlockStart(value)}
							slotProps={{
								textField: { size: 'small', sx: { width: 140 } },
							}}
						/>
						<TimePicker
							label="End"
							ampm={false}
							value={blockEnd}
							onChange={(value) => setBlockEnd(value)}
							slotProps={{
								textField: { size: 'small', sx: { width: 140 } },
							}}
						/>
					</LocalizationProvider>
				</Stack>

				<TextField
					label="Reason (optional)"
					value={blockReason}
					onChange={(e) => setBlockReason(e.target.value)}
					fullWidth
				/>

				<Stack direction="row" spacing={1} alignItems="center">
					<Button
						variant="contained"
						disabled={!canCreateBlock || createBlocksMutation.isPending}
						onClick={handleAddBlock}
					>
						Add block
					</Button>
					{blockError && (
						<Typography variant="body2" color="error">
							{blockError}
						</Typography>
					)}
				</Stack>

				<Stack spacing={1}>
					<Typography fontWeight={700}>
						Blocks for {blockDateParam}
					</Typography>
					{!blocksForDay.length ? (
						<Typography variant="body2" color="text.secondary">
							No blocks for this day.
						</Typography>
					) : (
						blocksForDay.map((block) => {
							const unitName =
								units.find((u) => u.id === block.unitId)?.name ??
								'Unit';
							return (
								<Stack
									key={block.id}
									direction="row"
									justifyContent="space-between"
									alignItems="center"
									spacing={1}
								>
									<Typography variant="body2">
										{unitName} •{' '}
										{dayjs(block.startAt).format('HH:mm')}-
										{dayjs(block.endAt).format('HH:mm')}
										{block.reason ? ` • ${block.reason}` : ''}
									</Typography>
								</Stack>
							);
						})
					)}
				</Stack>
			</Stack>
		</Paper>
	);
}
