import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import CollectionsIcon from '@mui/icons-material/Collections';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import {
	Alert,
	Box,
	Button,
	Chip,
	Paper,
	Skeleton,
	Snackbar,
	Stack,
	Tab,
	Tabs,
	Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import {
	BlockManager,
	BookingDialog,
	GalleryLightbox,
	getImageUrl,
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
	const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(0);
	const [shareSnackbar, setShareSnackbar] = useState<'copied' | 'shared' | false>(false);
	const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
	const [bookingInitialUnitId, setBookingInitialUnitId] = useState<string | undefined>();
	const [bookingToast, setBookingToast] = useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);
	const [activeTab, setActiveTab] = useState(0);

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
			<Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 0 }}>
				<Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2, mb: 2 }} />
				<Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
					<Box sx={{ p: 2 }}>
						<Skeleton width="40%" height={40} sx={{ mb: 1 }} />
						<Skeleton width="60%" height={24} sx={{ mb: 2 }} />
						<Stack direction="row" spacing={1}>
							<Skeleton variant="rounded" width={120} height={36} />
							<Skeleton variant="rounded" width={80} height={36} />
							<Skeleton variant="rounded" width={140} height={36} />
						</Stack>
					</Box>
				</Paper>
			</Box>
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
						onGalleryClick={() => {
							setGalleryLightboxIndex(0);
							setGalleryLightboxOpen(true);
						}}
					/>
					<GalleryLightbox
						images={venue.images ?? []}
						legacyImageUrl={venue.imageUrl}
						imageBaseUrl={imageBaseUrl}
						venueName={venue.name}
						open={galleryLightboxOpen}
						initialIndex={galleryLightboxIndex}
						onClose={() => setGalleryLightboxOpen(false)}
					/>
				</>
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

				<Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
					<Tabs
						value={activeTab}
						onChange={(_, v) => setActiveTab(v)}
						variant="scrollable"
						scrollButtons="auto"
						sx={{
							borderBottom: 1,
							borderColor: 'divider',
							px: 1,
							'& .MuiTab-root:focus, & .MuiTab-root:focus-visible': {
								outline: 'none',
								boxShadow: 'none',
							},
						}}
					>
						<Tab icon={<InfoIcon />} iconPosition="start" label="Info" />
						<Tab icon={<MeetingRoomIcon />} iconPosition="start" label="Units" />
						<Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Schedule" />
						<Tab icon={<CollectionsIcon />} iconPosition="start" label="Gallery" />
						<Tab
							icon={<StarIcon />}
							iconPosition="start"
							label={
								venue.reviewsCount != null && venue.reviewsCount > 0
									? `Reviews (${venue.reviewsCount})`
									: 'Reviews'
							}
						/>
					</Tabs>

					<Box sx={{ p: 2 }}>
						{activeTab === 0 && (
							<Stack spacing={2}>
								<Stack spacing={1}>
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
													onClick={() => setActiveTab(4)}
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
								<Stack direction="row" spacing={1} flexWrap="wrap">
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
							</Stack>
						)}

						{activeTab === 3 && (() => {
							const displayImages =
								(venue.images?.length ?? 0) > 0
									? venue.images!
									: venue.imageUrl
										? [{ id: 'legacy', path: venue.imageUrl, order: 0 }]
										: [];
							if (displayImages.length === 0) {
								return (
									<Typography variant="body2" color="text.secondary">
										No images yet.
									</Typography>
								);
							}
							return (
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: {
											xs: 'repeat(2, 1fr)',
											sm: 'repeat(3, 1fr)',
											md: 'repeat(4, 1fr)',
											lg: 'repeat(6, 1fr)',
										},
										gap: 1.5,
									}}
								>
									{displayImages
										.slice()
										.sort((a, b) => a.order - b.order)
										.map((img, idx) => {
											const url = getImageUrl(imageBaseUrl, img.path);
											return (
												<Box
													key={img.id}
													component="button"
													onClick={() => {
														setGalleryLightboxIndex(idx);
														setGalleryLightboxOpen(true);
													}}
													sx={{
														aspectRatio: '1',
														borderRadius: 2,
														overflow: 'hidden',
														border: 'none',
														padding: 0,
														cursor: 'pointer',
														backgroundImage: url ? `url(${url})` : 'none',
														backgroundSize: 'cover',
														backgroundPosition: 'center',
														bgcolor: 'action.hover',
														'&:hover': { opacity: 0.9 },
													}}
												/>
											);
										})}
								</Box>
							);
						})()}

						{activeTab === 1 && (
							<Stack spacing={2}>
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
							</Stack>
						)}

						{activeTab === 2 && (
							<Stack spacing={2}>
								<VenueScheduleManager
									venueId={venueId}
									token={token}
									schedules={venue.schedules ?? []}
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
						)}

						{activeTab === 4 && (
							<>
								{venue.reviewsCount != null && venue.reviewsCount > 0 ? (
									<VenueReviewsSection
										reviews={venue.reviews ?? []}
										avgRating={venue.avgRating}
										reviewsCount={venue.reviewsCount}
									/>
								) : (
									<Typography variant="body2" color="text.secondary">
										No reviews yet.
									</Typography>
								)}
							</>
						)}
					</Box>
				</Paper>
			</Stack>
		</Box>
	);
}
