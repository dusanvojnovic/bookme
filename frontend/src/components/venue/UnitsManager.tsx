import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	MenuItem,
	Paper,
	Stack,
	Snackbar,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createUnit, deleteUnit, updateUnit } from '../../api/venue.api';
import type { CreateUnitPayload, UpdateUnitPayload } from '../../types/venue';
import { type Unit } from '../../types/venue';

export function UnitsManager({
	venueId,
	token,
	units,
	isOwner,
	onReserveClick,
}: {
	venueId: string;
	token: string | null;
	units: Unit[];
	isOwner: boolean;
	onReserveClick?: (unitId: string) => void;
}) {
	const queryClient = useQueryClient();

	const [unitForm, setUnitForm] = useState({
		name: '',
		unitType: '',
		capacity: '',
		minDurationMin: '',
		maxDurationMin: '',
		slotStepMin: '',
	});
	const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
	const [editingUnitForm, setEditingUnitForm] = useState({
		name: '',
		unitType: '',
		capacity: '',
		minDurationMin: '',
		maxDurationMin: '',
		slotStepMin: '',
	});
	const [unitToast, setUnitToast] = useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);
	const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);

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

	const updateUnitMutation = useMutation({
		mutationFn: (payload: { unitId: string; data: UpdateUnitPayload }) =>
			updateUnit(token!, venueId, payload.unitId, payload.data),
		onSuccess: () => {
			setEditingUnitId(null);
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	const deleteUnitMutation = useMutation({
		mutationFn: (unitId: string) => deleteUnit(token!, venueId, unitId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setUnitToast({ message: 'Unit deleted', severity: 'success' });
			setDeleteUnitId(null);
		},
		onError: () => {
			setUnitToast({
				message: 'Failed to delete unit',
				severity: 'error',
			});
		},
	});

	const canAddUnit = isOwner && unitForm.name.trim() && unitForm.unitType.trim();

	const handleAddUnit = () => {
		const capacity = String(unitForm.capacity).trim()
			? Number(unitForm.capacity)
			: undefined;
		const minDurationMin = String(unitForm.minDurationMin).trim()
			? Number(unitForm.minDurationMin)
			: undefined;
		const maxDurationMin = String(unitForm.maxDurationMin).trim()
			? Number(unitForm.maxDurationMin)
			: undefined;
		const slotStepMin = String(unitForm.slotStepMin).trim()
			? Number(unitForm.slotStepMin)
			: undefined;

		createUnitMutation.mutate({
			name: unitForm.name.trim(),
			unitType: unitForm.unitType.trim(),
			capacity: Number.isNaN(capacity ?? NaN) ? undefined : capacity,
			minDurationMin: Number.isNaN(minDurationMin ?? NaN) ? undefined : minDurationMin,
			maxDurationMin: Number.isNaN(maxDurationMin ?? NaN) ? undefined : maxDurationMin,
			slotStepMin: Number.isNaN(slotStepMin ?? NaN) ? undefined : slotStepMin,
		});
	};

	const handleSaveUnit = (unit: Unit) => {
		const capacity = editingUnitForm.capacity.trim()
			? Number(editingUnitForm.capacity)
			: undefined;
		const minDurationMin = editingUnitForm.minDurationMin.trim()
			? Number(editingUnitForm.minDurationMin)
			: undefined;
		const maxDurationMin = editingUnitForm.maxDurationMin.trim()
			? Number(editingUnitForm.maxDurationMin)
			: undefined;
		const slotStepMin = editingUnitForm.slotStepMin.trim()
			? Number(editingUnitForm.slotStepMin)
			: undefined;

		updateUnitMutation.mutate({
			unitId: unit.id,
			data: {
				name: editingUnitForm.name.trim(),
				unitType: editingUnitForm.unitType.trim(),
				capacity: Number.isNaN(capacity ?? NaN) ? undefined : capacity,
				minDurationMin: Number.isNaN(minDurationMin ?? NaN) ? undefined : minDurationMin,
				maxDurationMin: Number.isNaN(maxDurationMin ?? NaN) ? undefined : maxDurationMin,
				slotStepMin: Number.isNaN(slotStepMin ?? NaN) ? undefined : slotStepMin,
			},
		});
	};

	return (
		<>
			{unitToast && (
				<Snackbar
					open
					autoHideDuration={2500}
					onClose={() => setUnitToast(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				>
					<Alert
						severity={unitToast.severity}
						onClose={() => setUnitToast(null)}
						sx={{ alignItems: 'center' }}
					>
						{unitToast.message}
					</Alert>
				</Snackbar>
			)}
			<Dialog
				open={!!deleteUnitId}
				onClose={() => setDeleteUnitId(null)}
			>
				<DialogTitle>Delete unit?</DialogTitle>
				<DialogContent>
					This action cannot be undone.
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteUnitId(null)}>Cancel</Button>
					<Button
						color="error"
						variant="contained"
						disabled={deleteUnitMutation.isPending}
						onClick={() => {
							if (!deleteUnitId) return;
							deleteUnitMutation.mutate(deleteUnitId);
							setDeleteUnitId(null);
						}}
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
			<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ md: 'center' }}
					spacing={1}
				>
					<Typography fontWeight={800}>Units</Typography>
					<Typography variant="body2" color="text.secondary">
						{units.length} total
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
									setUnitForm((prev) => ({ ...prev, name: e.target.value }))
								}
								fullWidth
							/>
							<TextField
								label="Type"
								value={unitForm.unitType}
								onChange={(e) =>
									setUnitForm((prev) => ({ ...prev, unitType: e.target.value }))
								}
								fullWidth
							/>
							<TextField
								label="Capacity"
								type="number"
								value={unitForm.capacity}
								onChange={(e) =>
									setUnitForm((prev) => ({ ...prev, capacity: e.target.value }))
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
									setUnitForm((prev) => ({ ...prev, minDurationMin: e.target.value }))
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
									setUnitForm((prev) => ({ ...prev, maxDurationMin: e.target.value }))
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
									setUnitForm((prev) => ({ ...prev, slotStepMin: e.target.value }))
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
								onClick={handleAddUnit}
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

				{units.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						No units yet.
					</Typography>
				) : (
					<Stack spacing={1}>
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns:
									'minmax(160px, 1.4fr) minmax(120px, 0.8fr) minmax(80px, 0.6fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(140px, 1fr)',
								gap: 1,
								px: 1,
								color: 'text.secondary',
							}}
						>
							<Typography variant="caption" noWrap>Name</Typography>
							<Typography variant="caption" noWrap>Type</Typography>
							<Typography variant="caption" noWrap align="right">Capacity</Typography>
							<Typography variant="caption" noWrap align="right">Min duration</Typography>
							<Typography variant="caption" noWrap align="right">Max duration</Typography>
							<Typography variant="caption" noWrap align="right">Slot step</Typography>
							<Typography variant="caption" noWrap align="right">Actions</Typography>
						</Box>

						{units.map((unit) => (
							<Paper key={unit.id} variant="outlined" sx={{ p: 1.5 }}>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns:
											'minmax(160px, 1.4fr) minmax(120px, 0.8fr) minmax(80px, 0.6fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(140px, 1fr)',
										gap: 1,
										alignItems: 'center',
									}}
								>
									{editingUnitId === unit.id ? (
										<>
											<TextField
												size="small"
												value={editingUnitForm.name}
												onChange={(e) =>
													setEditingUnitForm((prev) => ({ ...prev, name: e.target.value }))
												}
											/>
											<TextField
												size="small"
												value={editingUnitForm.unitType}
												onChange={(e) =>
													setEditingUnitForm((prev) => ({ ...prev, unitType: e.target.value }))
												}
											/>
											<TextField
												size="small"
												value={editingUnitForm.capacity}
												onChange={(e) =>
													setEditingUnitForm((prev) => ({ ...prev, capacity: e.target.value }))
												}
											/>
											<TextField
												size="small"
												select
												value={editingUnitForm.minDurationMin}
												onChange={(e) =>
													setEditingUnitForm((prev) => ({ ...prev, minDurationMin: e.target.value }))
												}
											>
												{[30, 45, 60, 90, 120, 150, 180].map((val) => (
													<MenuItem key={val} value={val}>{val}</MenuItem>
												))}
												<MenuItem value="">No min</MenuItem>
											</TextField>
											<TextField
												size="small"
												select
												value={editingUnitForm.maxDurationMin}
												onChange={(e) =>
													setEditingUnitForm((prev) => ({ ...prev, maxDurationMin: e.target.value }))
												}
											>
												{[30, 45, 60, 90, 120, 150, 180].map((val) => (
													<MenuItem key={val} value={val}>{val}</MenuItem>
												))}
												<MenuItem value="">No max</MenuItem>
											</TextField>
											<TextField
												size="small"
												select
												value={editingUnitForm.slotStepMin}
												onChange={(e) =>
													setEditingUnitForm((prev) => ({ ...prev, slotStepMin: e.target.value }))
												}
											>
												{[15, 30, 45, 60].map((val) => (
													<MenuItem key={val} value={val}>{val}</MenuItem>
												))}
												<MenuItem value="">No step</MenuItem>
											</TextField>
										</>
									) : (
										<>
											<Typography fontWeight={700} noWrap>{unit.name}</Typography>
											<Typography variant="body2" color="text.secondary" noWrap>
												{unit.unitType}
											</Typography>
											<Typography variant="body2" color="text.secondary" align="right">
												{unit.capacity ?? '—'}
											</Typography>
											<Typography variant="body2" color="text.secondary" align="right">
												{unit.minDurationMin ?? '—'}
											</Typography>
											<Typography variant="body2" color="text.secondary" align="right">
												{unit.maxDurationMin ?? '—'}
											</Typography>
											<Typography variant="body2" color="text.secondary" align="right">
												{unit.slotStepMin ?? '—'}
											</Typography>
										</>
									)}
									<Stack direction="row" spacing={1} justifyContent="flex-end">
										{isOwner && editingUnitId === unit.id && (
											<>
												<Button
													size="small"
													variant="contained"
													disabled={updateUnitMutation.isPending}
													onClick={() => handleSaveUnit(unit)}
												>
													Save
												</Button>
												<Button size="small" onClick={() => setEditingUnitId(null)}>
													Cancel
												</Button>
											</>
										)}
										{isOwner && editingUnitId !== unit.id && (
											<>
												<Button
													size="small"
													onClick={() => {
														setEditingUnitId(unit.id);
														setEditingUnitForm({
															name: unit.name,
															unitType: unit.unitType,
															capacity: String(unit.capacity ?? ''),
															minDurationMin: String(unit.minDurationMin ?? ''),
															maxDurationMin: String(unit.maxDurationMin ?? ''),
															slotStepMin: String(unit.slotStepMin ?? ''),
														});
													}}
												>
													Edit
												</Button>
												<Button
													size="small"
													color="error"
													disabled={deleteUnitMutation.isPending}
													onClick={() => setDeleteUnitId(unit.id)}
												>
													Delete
												</Button>
											</>
										)}
										{!isOwner && onReserveClick && (
											<Button
												size="small"
												variant="contained"
												onClick={() => onReserveClick(unit.id)}
											>
												Reserve
											</Button>
										)}
									</Stack>
								</Box>
							</Paper>
						))}
					</Stack>
				)}
			</Paper>
		</>
	);
}
