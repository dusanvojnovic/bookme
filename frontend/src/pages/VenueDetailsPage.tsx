import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import {
	Alert,
	Box,
	Button,
	Chip,
	Paper,
	Snackbar,
	Stack,
	Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import {
	BlockManager,
	BookingDialog,
	GalleryLightbox,
	OfferingsManager,
	UnitsManager,
	VenueEditForm,
	VenueGallery,
	VenueReviewsSection,
	VenueScheduleManager,
} from '../components/venue';
import { api } from '../api/api';
import { fetchVenue } from '../api/venue.api';
import { useAuthStore } from '../store/auth.store';

export function VenueDetailsPage() {
	const { venueId } = useParams({ from: '/venues/$venueId' });
	const navigate = useNavigate();
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);

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

	const [isEditingVenue, setIsEditingVenue] = useState(false);
	const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
	const [shareSnackbar, setShareSnackbar] = useState<'copied' | 'shared' | false>(false);
	const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
	const [bookingInitialUnitId, setBookingInitialUnitId] = useState<string | undefined>();
	const [bookingToast, setBookingToast] = useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);

	const isOwner =
		!!venue && user?.role === 'PROVIDER' && user.id === venue.providerId;
	const showVenueForm = isOwner && isEditingVenue;

	const shareUrl = `${window.location.origin}/venues/${venueId}`;
	const handleShare = async () => {
		try {
			if (navigator.share && venue) {
				await navigator.share({
					title: venue.name,
					text: venue.description?.trim() || venue.name,
					url: shareUrl,
				});
				setShareSnackbar('shared');
			} else {
				await navigator.clipboard.writeText(shareUrl);
				setShareSnackbar('copied');
			}
		} catch {
			await navigator.clipboard.writeText(shareUrl);
			setShareSnackbar('copied');
		}
	};

	const imageBaseUrl = api.defaults.baseURL ?? '';

	const handleReserveClick = (unitId: string) => {
		setBookingInitialUnitId(unitId);
		setBookingDialogOpen(true);
	};

	const handleBookingSuccess = () => {
		setBookingToast({
			message: 'Booking successful.',
			severity: 'success',
		});
		navigate({ to: '/my-bookings' });
	};

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

	return (
		<Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 0 }}>
			{bookingToast && (
				<Snackbar
					open
					autoHideDuration={2500}
					onClose={() => setBookingToast(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				>
					<Alert
						severity={bookingToast.severity}
						onClose={() => setBookingToast(null)}
						sx={{ alignItems: 'center' }}
					>
						{bookingToast.message}
					</Alert>
				</Snackbar>
			)}
			<Snackbar
				open={!!shareSnackbar}
				autoHideDuration={2500}
				onClose={() => setShareSnackbar(false)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert
					severity="success"
					onClose={() => setShareSnackbar(false)}
					sx={{ alignItems: 'center' }}
				>
					{shareSnackbar === 'shared' ? 'Shared!' : 'Link copied to clipboard'}
				</Alert>
			</Snackbar>

			{((venue.images?.length ?? 0) > 0 || venue.imageUrl) && (
				<>
					<VenueGallery
						images={venue.images ?? []}
						legacyImageUrl={venue.imageUrl}
						imageBaseUrl={imageBaseUrl}
						selectedIndex={0}
						onGalleryClick={() => setGalleryLightboxOpen(true)}
					/>
					<GalleryLightbox
						images={venue.images ?? []}
						legacyImageUrl={venue.imageUrl}
						imageBaseUrl={imageBaseUrl}
						venueName={venue.name}
						open={galleryLightboxOpen}
						initialIndex={0}
						onClose={() => setGalleryLightboxOpen(false)}
					/>
				</>
			)}

			{venue.reviewsCount != null && venue.reviewsCount > 0 && (
				<VenueReviewsSection
					reviews={venue.reviews ?? []}
					avgRating={venue.avgRating}
					reviewsCount={venue.reviewsCount}
				/>
			)}

			<Stack spacing={2}>
				{showVenueForm && (
					<VenueEditForm
						venue={venue}
						venueId={venueId}
						token={token}
						imageBaseUrl={imageBaseUrl}
						isOwner={isOwner}
						onSaveSuccess={() => setIsEditingVenue(false)}
					/>
				)}

				{!isOwner && (
					<BookingDialog
						open={bookingDialogOpen}
						onClose={() => {
							setBookingDialogOpen(false);
							setBookingInitialUnitId(undefined);
						}}
						venueId={venueId}
						token={token}
						units={venue.units}
						offerings={venue.offerings}
						schedules={venue.schedules ?? []}
						slotStepMin={venue.slotStepMin}
						initialUnitId={bookingInitialUnitId}
						onBookingSuccess={handleBookingSuccess}
					/>
				)}

				<Stack
					direction={{ xs: 'column', md: 'row' }}
					spacing={2}
					alignItems="stretch"
				>
					<Paper
						variant="outlined"
						sx={{
							p: 2,
							borderRadius: 2,
							flex: { xs: 1, md: 1.5 },
							display: 'flex',
							flexDirection: 'column',
							minHeight: 0,
						}}
					>
						<Stack spacing={1} sx={{ flex: 1 }}>
							<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
								<Typography variant="h5" fontWeight={900}>
									{venue.name}
								</Typography>
								{venue.availableToday ? (
									<Chip
										icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
										label="Available today"
										size="small"
										color="success"
										variant="outlined"
									/>
								) : venue.nextAvailableDay ? (
									<Chip
										icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
										label={`Next: ${venue.nextAvailableDay}`}
										size="small"
										variant="outlined"
									/>
								) : null}
								{venue.avgRating != null && venue.reviewsCount != null && venue.reviewsCount > 0 && (
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<StarIcon sx={{ color: 'warning.main', fontSize: 22 }} />
										<Typography fontWeight={700}>{venue.avgRating}</Typography>
										<Button
											size="small"
											variant="text"
											component="a"
											href="#reviews"
											sx={{ textTransform: 'none', minWidth: 'auto', px: 0.5 }}
										>
											({venue.reviewsCount} {venue.reviewsCount === 1 ? 'review' : 'reviews'})
										</Button>
									</Stack>
								)}
							</Stack>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<LocationOnIcon fontSize="small" />
								<Typography variant="body2" color="text.secondary">
									{venue.city}
									{venue.address ? ` • ${venue.address}` : ''}
								</Typography>
							</Stack>
							{venue.description?.trim() && (
								<Typography variant="body2" color="text.secondary">
									{venue.description.trim()}
								</Typography>
							)}
						</Stack>
						<Stack
							direction="row"
							spacing={1}
							flexWrap="wrap"
							sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}
						>
							<Button component={Link} to="/dashboard" variant="outlined">
								Back to dashboard
							</Button>
							<Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShare}>
								Share
							</Button>
							{isOwner && (
								<Button
									variant={showVenueForm ? 'contained' : 'outlined'}
									onClick={() => setIsEditingVenue((prev) => !prev)}
								>
									{showVenueForm ? 'Close edit' : 'Edit venue'}
								</Button>
							)}
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
							{!isOwner && venue.units.length > 0 && (
								<Button
									variant="contained"
									onClick={() => {
										setBookingInitialUnitId(undefined);
										setBookingDialogOpen(true);
									}}
								>
									Reserve
								</Button>
							)}
						</Stack>
					</Paper>

					<VenueScheduleManager
						venueId={venueId}
						token={token}
						schedules={venue.schedules ?? []}
						isOwner={isOwner}
					/>
				</Stack>

				<UnitsManager
					venueId={venueId}
					token={token}
					units={venue.units}
					isOwner={isOwner}
					onReserveClick={!isOwner ? handleReserveClick : undefined}
				/>

				<OfferingsManager
					venueId={venueId}
					token={token}
					units={venue.units}
					offerings={venue.offerings}
					isOwner={isOwner}
				/>

				{isOwner && (
					<BlockManager
						venueId={venueId}
						token={token}
						units={venue.units}
					/>
				)}
			</Stack>
		</Box>
	);
}
