import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	MenuItem,
	Paper,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { createOffering, deleteOffering, updateOffering } from '../../api/venue.api';
import type { CreateOfferingPayload, UpdateOfferingPayload } from '../../types/venue';
import { type Offering, type Unit } from '../../types/venue';

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180];

function getDurationOptionsForUnit(unit: Unit | undefined) {
	if (!unit) return DURATION_OPTIONS;
	const min = unit.minDurationMin ?? 0;
	const max = unit.maxDurationMin ?? Infinity;
	return DURATION_OPTIONS.filter((val) => val >= min && val <= max);
}

export function OfferingsManager({
	venueId,
	token,
	units,
	offerings,
	isOwner,
}: {
	venueId: string;
	token: string | null;
	units: Unit[];
	offerings: Offering[];
	isOwner: boolean;
}) {
	const queryClient = useQueryClient();

	const [offeringForm, setOfferingForm] = useState({
		unitId: '',
		name: '',
		durationMin: '',
		price: '',
	});
	const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
	const [editingOfferingForm, setEditingOfferingForm] = useState({
		unitId: '',
		name: '',
		durationMin: '',
		price: '',
	});
	const [offeringToast, setOfferingToast] = useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);
	const [deleteOfferingId, setDeleteOfferingId] = useState<string | null>(null);

	useEffect(() => {
		if (!offeringForm.unitId || !units.length) return;
		const unit = units.find((u) => u.id === offeringForm.unitId);
		const opts = getDurationOptionsForUnit(unit);
		const current = Number(offeringForm.durationMin);
		const valid = !Number.isNaN(current) && opts.includes(current);
		if (!valid && offeringForm.durationMin !== '') {
			setOfferingForm((prev) => ({ ...prev, durationMin: '' }));
		}
	}, [offeringForm.unitId, offeringForm.durationMin, units]);

	const createOfferingMutation = useMutation({
		mutationFn: (payload: CreateOfferingPayload) =>
			createOffering(token!, venueId, payload),
		onSuccess: () => {
			setOfferingForm({
				unitId: '',
				name: '',
				durationMin: '',
				price: '',
			});
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setOfferingToast({ message: 'Offering added', severity: 'success' });
		},
		onError: () => {
			setOfferingToast({
				message: 'Failed to add offering',
				severity: 'error',
			});
		},
	});

	const updateOfferingMutation = useMutation({
		mutationFn: (payload: { offeringId: string; data: UpdateOfferingPayload }) =>
			updateOffering(token!, venueId, payload.offeringId, payload.data),
		onSuccess: () => {
			setEditingOfferingId(null);
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setOfferingToast({ message: 'Offering updated', severity: 'success' });
		},
		onError: () => {
			setOfferingToast({
				message: 'Failed to update offering',
				severity: 'error',
			});
		},
	});

	const deleteOfferingMutation = useMutation({
		mutationFn: (offeringId: string) =>
			deleteOffering(token!, venueId, offeringId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setOfferingToast({ message: 'Offering deleted', severity: 'success' });
			setDeleteOfferingId(null);
		},
		onError: () => {
			setOfferingToast({
				message: 'Failed to delete offering',
				severity: 'error',
			});
		},
	});

	const canAddOffering =
		isOwner &&
		offeringForm.unitId &&
		offeringForm.name.trim() &&
		String(offeringForm.durationMin).trim();

	const handleAddOffering = () => {
		const durationMin = String(offeringForm.durationMin).trim()
			? Number(offeringForm.durationMin)
			: NaN;
		const price = String(offeringForm.price).trim()
			? Number(offeringForm.price)
			: undefined;

		if (
			!offeringForm.unitId ||
			!offeringForm.name.trim() ||
			Number.isNaN(durationMin)
		) {
			setOfferingToast({
				message: 'Please select unit, name and duration',
				severity: 'error',
			});
			return;
		}

		createOfferingMutation.mutate({
			unitId: offeringForm.unitId,
			name: offeringForm.name.trim(),
			durationMin,
			price: Number.isNaN(price ?? NaN) ? undefined : price,
		});
	};

	const handleSaveOffering = (offering: Offering) => {
		const durationMin = String(editingOfferingForm.durationMin).trim()
			? Number(editingOfferingForm.durationMin)
			: NaN;
		const price = String(editingOfferingForm.price).trim()
			? Number(editingOfferingForm.price)
			: undefined;

		if (
			!editingOfferingForm.name.trim() ||
			Number.isNaN(durationMin)
		) {
			setOfferingToast({
				message: 'Please fill name and duration',
				severity: 'error',
			});
			return;
		}

		updateOfferingMutation.mutate({
			offeringId: offering.id,
			data: {
				name: editingOfferingForm.name.trim(),
				durationMin,
				price: Number.isNaN(price ?? NaN) ? undefined : price,
			},
		});
	};

	return (
		<>
			{offeringToast && (
				<Snackbar
					open
					autoHideDuration={2500}
					onClose={() => setOfferingToast(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				>
					<Alert
						severity={offeringToast.severity}
						onClose={() => setOfferingToast(null)}
						sx={{ alignItems: 'center' }}
					>
						{offeringToast.message}
					</Alert>
				</Snackbar>
			)}
			<Dialog
				open={!!deleteOfferingId}
				onClose={() => setDeleteOfferingId(null)}
			>
				<DialogTitle>Delete offering?</DialogTitle>
				<DialogContent>
					This action cannot be undone.
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteOfferingId(null)}>Cancel</Button>
					<Button
						color="error"
						variant="contained"
						disabled={deleteOfferingMutation.isPending}
						onClick={() => {
							if (!deleteOfferingId) return;
							deleteOfferingMutation.mutate(deleteOfferingId);
							setDeleteOfferingId(null);
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
					<Typography fontWeight={800}>Offerings</Typography>
					<Typography variant="body2" color="text.secondary">
						{offerings.length} total
					</Typography>
				</Stack>

				<Divider sx={{ my: 2 }} />

				{isOwner && (
					<Stack spacing={2} sx={{ mb: 2 }}>
						<Typography fontWeight={700}>Add offering</Typography>
						<Stack
							direction={{ xs: 'column', md: 'row' }}
							spacing={2}
						>
							<TextField
								select
								label="Unit"
								value={offeringForm.unitId}
								onChange={(e) =>
									setOfferingForm((prev) => ({
										...prev,
										unitId: e.target.value,
									}))
								}
								size="small"
								sx={{ minWidth: 140 }}
							>
								{units.map((u) => (
									<MenuItem key={u.id} value={u.id}>
										{u.name}
									</MenuItem>
								))}
							</TextField>
							<TextField
								label="Name"
								value={offeringForm.name}
								onChange={(e) =>
									setOfferingForm((prev) => ({ ...prev, name: e.target.value }))
								}
								fullWidth
							/>
							<TextField
								select
								label="Duration (min)"
								value={offeringForm.durationMin}
								onChange={(e) =>
									setOfferingForm((prev) => ({ ...prev, durationMin: e.target.value }))
								}
								fullWidth
							>
								{getDurationOptionsForUnit(
									units.find((u) => u.id === offeringForm.unitId),
								).map((val) => (
									<MenuItem key={val} value={val}>
										{val}
									</MenuItem>
								))}
							</TextField>
							<TextField
								label="Price (RSD)"
								type="number"
								value={offeringForm.price}
								onChange={(e) =>
									setOfferingForm((prev) => ({ ...prev, price: e.target.value }))
								}
								fullWidth
							/>
						</Stack>
						<Stack direction="row" spacing={1} alignItems="center">
							<Button
								variant="contained"
								disabled={!canAddOffering || createOfferingMutation.isPending}
								onClick={handleAddOffering}
							>
								Add offering
							</Button>
						</Stack>
						<Divider />
					</Stack>
				)}

				{offerings.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						No offerings yet.
					</Typography>
				) : (
					<TableContainer
						sx={{
							'& .MuiTableCell-root': { border: 'none' },
						}}
					>
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>Duration</TableCell>
									<TableCell align="right" sx={{ fontWeight: 700 }}>Price</TableCell>
									{isOwner && (
										<TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
									)}
								</TableRow>
							</TableHead>
							<TableBody>
								{offerings.map((offering) => (
									<TableRow key={offering.id}>
										{editingOfferingId === offering.id ? (
											<>
												<TableCell>
													<TextField
														size="small"
														value={editingOfferingForm.name}
														onChange={(e) =>
															setEditingOfferingForm((prev) => ({
																...prev,
																name: e.target.value,
															}))
														}
													/>
												</TableCell>
												<TableCell align="right">
													<TextField
														size="small"
														select
														value={editingOfferingForm.durationMin}
														onChange={(e) =>
															setEditingOfferingForm((prev) => ({
																...prev,
																durationMin: e.target.value,
															}))
														}
														sx={{ minWidth: 80 }}
													>
														{getDurationOptionsForUnit(
															units.find(
																(u) => u.id === editingOfferingForm.unitId,
															),
														).map((val) => (
															<MenuItem key={val} value={val}>
																{val}
															</MenuItem>
														))}
													</TextField>
												</TableCell>
												<TableCell align="right">
													<TextField
														size="small"
														type="number"
														value={editingOfferingForm.price}
														onChange={(e) =>
															setEditingOfferingForm((prev) => ({
																...prev,
																price: e.target.value,
															}))
														}
														sx={{ width: 100 }}
													/>
												</TableCell>
												{isOwner && (
													<TableCell align="right">
														<Stack direction="row" spacing={1} justifyContent="flex-end">
															<Button
																size="small"
																variant="contained"
																disabled={updateOfferingMutation.isPending}
																onClick={() => handleSaveOffering(offering)}
															>
																Save
															</Button>
															<Button
																size="small"
																onClick={() => setEditingOfferingId(null)}
															>
																Cancel
															</Button>
														</Stack>
													</TableCell>
												)}
											</>
										) : (
											<>
												<TableCell>
													<Typography fontWeight={700} noWrap>
														{offering.name}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2" color="text.secondary">
														{offering.durationMin} min
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2" color="text.secondary">
														{offering.price != null ? `${offering.price} RSD` : '—'}
													</Typography>
												</TableCell>
												{isOwner && (
													<TableCell align="right">
														<Stack direction="row" spacing={1} justifyContent="flex-end">
															<Button
																size="small"
																onClick={() => {
																	setEditingOfferingId(offering.id);
																	setEditingOfferingForm({
																		unitId: offering.unitId ?? '',
																		name: offering.name,
																		durationMin: String(offering.durationMin),
																		price:
																			offering.price != null
																				? String(offering.price)
																				: '',
																	});
																}}
															>
																Edit
															</Button>
															<Button
																size="small"
																color="error"
																disabled={deleteOfferingMutation.isPending}
																onClick={() => setDeleteOfferingId(offering.id)}
															>
																Delete
															</Button>
														</Stack>
													</TableCell>
												)}
											</>
										)}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Paper>
		</>
	);
}
