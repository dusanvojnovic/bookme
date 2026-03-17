import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CloseIcon from '@mui/icons-material/Close';
import CollectionsIcon from '@mui/icons-material/Collections';
import { Box, Button, Dialog, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { type VenueImage } from '../../types/venue';

export function getImageUrl(
	apiBaseUrl: string,
	imageUrl: string | null | undefined,
): string | null {
	if (!imageUrl) return null;
	if (imageUrl.startsWith('http')) return imageUrl;
	const base = apiBaseUrl ?? '';
	return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export function VenueGallery({
	images,
	legacyImageUrl,
	imageBaseUrl,
	selectedIndex,
	onGalleryClick,
}: {
	images: VenueImage[];
	legacyImageUrl?: string | null;
	imageBaseUrl: string;
	selectedIndex: number;
	onGalleryClick?: () => void;
}) {
	const displayImages =
		images.length > 0
			? images
			: legacyImageUrl
				? [{ id: 'legacy', path: legacyImageUrl, order: 0 }]
				: [];
	const selectedPath = displayImages[selectedIndex]?.path;
	const hasMultiple = displayImages.length > 1;
	const resolvedUrl = selectedPath ? getImageUrl(imageBaseUrl, selectedPath) : null;

	if (displayImages.length === 0) return null;

	return (
		<Box sx={{ mb: 2, position: 'relative' }}>
			<Box
				sx={{
					height: 220,
					borderRadius: 2,
					overflow: 'hidden',
					backgroundImage: resolvedUrl ? `url(${resolvedUrl})` : 'none',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					bgcolor: 'action.hover',
				}}
			/>
			{hasMultiple && onGalleryClick && (
				<Button
					startIcon={<CollectionsIcon />}
					onClick={onGalleryClick}
					sx={{
						position: 'absolute',
						bottom: 12,
						right: 12,
						bgcolor: 'rgba(0,0,0,0.6)',
						color: 'white',
						'&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
					}}
				>
					Gallery
				</Button>
			)}
		</Box>
	);
}

export function GalleryLightbox({
	images,
	legacyImageUrl,
	imageBaseUrl,
	venueName,
	open,
	initialIndex,
	onClose,
}: {
	images: VenueImage[];
	legacyImageUrl?: string | null;
	imageBaseUrl: string;
	venueName: string;
	open: boolean;
	initialIndex: number;
	onClose: () => void;
}) {
	const displayImages =
		images.length > 0
			? images
			: legacyImageUrl
				? [{ id: 'legacy', path: legacyImageUrl, order: 0 }]
				: [];
	const [index, setIndex] = useState(initialIndex);

	useEffect(() => {
		if (open) setIndex(initialIndex);
	}, [open, initialIndex]);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			else if (e.key === 'ArrowLeft') setIndex((i) => (i <= 0 ? displayImages.length - 1 : i - 1));
			else if (e.key === 'ArrowRight') setIndex((i) => (i >= displayImages.length - 1 ? 0 : i + 1));
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open, onClose, displayImages.length]);

	if (displayImages.length === 0) return null;

	const prev = () => setIndex((i) => (i <= 0 ? displayImages.length - 1 : i - 1));
	const next = () => setIndex((i) => (i >= displayImages.length - 1 ? 0 : i + 1));
	const currentPath = displayImages[index]?.path;
	const resolvedUrl = currentPath ? getImageUrl(imageBaseUrl, currentPath) : null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen
			slotProps={{
				paper: {
					sx: {
						bgcolor: '#0a0a0a',
						backgroundImage: 'none',
					},
				},
			}}
			sx={{
				'& .MuiDialog-container': { alignItems: 'stretch' },
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					position: 'relative',
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					justifyContent="space-between"
					sx={{ p: 2, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}
				>
					<Typography variant="h6" color="white" fontWeight={700}>
						{venueName}
					</Typography>
					<IconButton onClick={onClose} sx={{ color: 'white' }} size="large">
						<CloseIcon />
					</IconButton>
				</Stack>

				<Box
					sx={{
						flex: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						position: 'relative',
						py: 8,
					}}
				>
					<IconButton
						onClick={prev}
						sx={{
							position: 'absolute',
							left: 16,
							top: '50%',
							transform: 'translateY(-50%)',
							color: 'white',
							bgcolor: 'rgba(255,255,255,0.15)',
							'&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
						}}
						size="large"
					>
						<ArrowBackIosNewIcon />
					</IconButton>
					<Box
						component="img"
						src={resolvedUrl ?? ''}
						alt=""
						sx={{
							maxWidth: '100%',
							maxHeight: '100%',
							objectFit: 'contain',
						}}
					/>
					<IconButton
						onClick={next}
						sx={{
							position: 'absolute',
							right: 16,
							top: '50%',
							transform: 'translateY(-50%)',
							color: 'white',
							bgcolor: 'rgba(255,255,255,0.15)',
							'&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
						}}
						size="large"
					>
						<ArrowForwardIosIcon />
					</IconButton>
				</Box>

				<Typography
					color="white"
					sx={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
				>
					{index + 1} od {displayImages.length}
				</Typography>
			</Box>
		</Dialog>
	);
}
