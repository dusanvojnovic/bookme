import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {
	Box,
	Button,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { removeVenueImage, updateVenue, uploadVenueImage } from '../../api/venue.api';
import type { UpdateVenuePayload } from '../../types/venue';
import { getImageUrl } from './VenueGallery';
import { type VenueDetails } from '../../types/venue';

const CATEGORY_OPTIONS = ['SPORT', 'BUSINESS', 'EVENTS', 'FOOD', 'WELLNESS'];

export function VenueEditForm({
	venue,
	venueId,
	token,
	imageBaseUrl,
	isOwner,
	onSaveSuccess,
}: {
	venue: VenueDetails;
	venueId: string;
	token: string | null;
	imageBaseUrl: string;
	isOwner: boolean;
	onSaveSuccess?: () => void;
}) {
	const queryClient = useQueryClient();

	const [form, setForm] = useState<UpdateVenuePayload>({
		name: venue.name,
		city: venue.city,
		address: venue.address ?? '',
		description: venue.description ?? '',
		category: venue.category,
		slotStepMin: venue.slotStepMin ?? undefined,
	});

	useEffect(() => {
		setForm({
			name: venue.name,
			city: venue.city,
			address: venue.address ?? '',
			description: venue.description ?? '',
			category: venue.category,
			slotStepMin: venue.slotStepMin ?? undefined,
		});
	}, [venue]);

	const updateMutation = useMutation({
		mutationFn: (payload: UpdateVenuePayload) =>
			updateVenue(token!, venueId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
			onSaveSuccess?.();
		},
	});

	const uploadImageMutation = useMutation({
		mutationFn: (file: File) => uploadVenueImage(token!, venueId, file),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
		},
	});

	const removeImageMutation = useMutation({
		mutationFn: (imageId: string) => removeVenueImage(token!, venueId, imageId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
		},
	});

	const canSave =
		isOwner &&
		form.name?.trim() &&
		form.city?.trim() &&
		form.category?.trim();

	const images = venue.images ?? [];
	const hasImages = images.length > 0 || !!venue.imageUrl;

	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
			<Stack spacing={2}>
				<Typography fontWeight={800}>Edit venue</Typography>
				<Stack spacing={1}>
					<Typography variant="subtitle2" color="text.secondary">
						Venue gallery
					</Typography>
					<Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
						{hasImages
							? images.map((img) => (
									<Box
										key={img.id}
										sx={{
											position: 'relative',
											width: 120,
											height: 80,
											borderRadius: 1,
											overflow: 'hidden',
											bgcolor: 'action.hover',
										}}
									>
										<img
											src={getImageUrl(imageBaseUrl, img.path) ?? ''}
											alt=""
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
										<IconButton
											size="small"
											sx={{
												position: 'absolute',
												top: 4,
												right: 4,
												bgcolor: 'rgba(0,0,0,0.5)',
												color: 'white',
												'&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
											}}
											onClick={() => removeImageMutation.mutate(img.id)}
											disabled={removeImageMutation.isPending}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</Box>
							  ))
							: venue.imageUrl && (
									<Box
										sx={{
											position: 'relative',
											width: 120,
											height: 80,
											borderRadius: 1,
											overflow: 'hidden',
											bgcolor: 'action.hover',
										}}
									>
										<img
											src={getImageUrl(imageBaseUrl, venue.imageUrl) ?? ''}
											alt=""
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
									</Box>
							  )}
						<Button
							component="label"
							variant="outlined"
							size="small"
							startIcon={<PhotoCameraIcon />}
							disabled={uploadImageMutation.isPending}
						>
							Add image
							<input
								type="file"
								hidden
								accept="image/jpeg,image/png,image/webp,image/gif"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										uploadImageMutation.mutate(file);
										e.target.value = '';
									}
								}}
							/>
						</Button>
					</Stack>
				</Stack>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
				>
					<TextField
						label="Name"
						value={form.name ?? ''}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, name: e.target.value }))
						}
						fullWidth
						disabled={!isOwner}
						required
					/>
					<TextField
						label="City"
						value={form.city ?? ''}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, city: e.target.value }))
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
							setForm((prev) => ({ ...prev, address: e.target.value }))
						}
						fullWidth
						disabled={!isOwner}
					/>
					<TextField
						label="Description"
						value={form.description ?? ''}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, description: e.target.value }))
						}
						fullWidth
						disabled={!isOwner}
						multiline
						minRows={2}
					/>
				</Stack>
				<Stack direction="row" spacing={1} alignItems="center">
					<Button
						variant="contained"
						disabled={!canSave || updateMutation.isPending}
						onClick={() =>
							updateMutation.mutate({
								name: form.name?.trim(),
								city: form.city?.trim(),
								address: form.address?.trim() || undefined,
								description: form.description?.trim() || undefined,
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
			</Stack>
		</Paper>
	);
}
