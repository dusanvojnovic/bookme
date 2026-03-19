import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Paper,
	Rating,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
	approveBooking,
	cancelBooking,
	createReview,
	fetchMyBookings,
	fetchProviderBookings,
	rejectBooking,
} from '../api/customer.api';
import { useAuthStore } from '../store/auth.store';
import { type BookingItem, type ProviderBooking } from '../types/booking';

export function MyBookingsPage() {
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const isProvider = user?.role === 'PROVIDER';
	const [reviewBooking, setReviewBooking] = useState<BookingItem | null>(
		null,
	);
	const [reviewRating, setReviewRating] = useState<number | null>(5);
	const [reviewComment, setReviewComment] = useState('');
	const [reviewError, setReviewError] = useState<string | null>(null);
	const [cancelConfirmBooking, setCancelConfirmBooking] =
		useState<BookingItem | null>(null);
	const [filter, setFilter] = useState<'active' | 'done'>('active');

	const {
		data = [],
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['my-bookings', token, isProvider],
		queryFn: async (): Promise<(BookingItem | ProviderBooking)[]> => {
			if (isProvider) return fetchProviderBookings(token!);
			return fetchMyBookings(token!);
		},
		enabled: !!token,
		staleTime: 30_000,
	});

	const approveMutation = useMutation({
		mutationFn: (bookingId: string) => approveBooking(token!, bookingId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['my-bookings', token, true] });
			queryClient.invalidateQueries({ queryKey: ['provider-pending-bookings', token] });
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
		},
	});
	const rejectMutation = useMutation({
		mutationFn: (bookingId: string) => rejectBooking(token!, bookingId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['my-bookings', token, true] });
			queryClient.invalidateQueries({ queryKey: ['provider-pending-bookings', token] });
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
		},
	});

	const createReviewMutation = useMutation({
		mutationFn: (payload: { bookingId: string; rating: number; comment?: string }) =>
			createReview(token!, payload.bookingId, {
				rating: payload.rating,
				comment: payload.comment,
			}),
		onSuccess: () => {
			setReviewBooking(null);
			setReviewComment('');
			setReviewRating(5);
			setReviewError(null);
			queryClient.invalidateQueries({ queryKey: ['my-bookings', token, false] });
		},
		onError: (e: unknown) => {
			const message =
				typeof e === 'object' && e !== null && 'response' in e
					? (e as { response?: { data?: { message?: string } } })
							.response?.data?.message
					: undefined;
			setReviewError(message ?? 'Failed to submit review');
		},
	});

	const [cancelError, setCancelError] = useState<string | null>(null);

	const cancelBookingMutation = useMutation({
		mutationFn: (bookingId: string) => cancelBooking(token!, bookingId),
		onSuccess: () => {
			setCancelConfirmBooking(null);
			setCancelError(null);
			queryClient.invalidateQueries({ queryKey: ['my-bookings', token, false] });
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
		},
		onError: (e: unknown) => {
			const msg =
				typeof e === 'object' && e !== null && 'response' in e
					? (e as { response?: { data?: { message?: string } } })
							.response?.data?.message
					: undefined;
			setCancelError(msg ?? 'Failed to cancel booking');
		},
	});

	if (isLoading) {
		return (
			<Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
				<Skeleton width={180} height={40} sx={{ mb: 2 }} />
				<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
					<Skeleton variant="rounded" width={80} height={36} />
					<Skeleton variant="rounded" width={80} height={36} />
				</Stack>
				<Stack spacing={1.5}>
					{[1, 2, 3].map((i) => (
						<Paper key={i} variant="outlined" sx={{ p: 2 }}>
							<Stack direction="row" justifyContent="space-between" spacing={1}>
								<Box>
									<Skeleton width="60%" height={28} sx={{ mb: 0.5 }} />
									<Skeleton width="40%" height={20} />
								</Box>
								<Box sx={{ textAlign: 'right' }}>
									<Skeleton width={100} height={24} sx={{ mb: 0.5 }} />
									<Skeleton width={80} height={20} />
								</Box>
							</Stack>
						</Paper>
					))}
				</Stack>
			</Box>
		);
	}

	if (isError) {
		return (
			<Alert severity="error">
				Failed to load bookings.
				{error instanceof Error ? ` ${error.message}` : ''}
			</Alert>
		);
	}

	const now = dayjs();
	const activeBookings = data.filter(
		(booking) =>
			booking.status !== 'CANCELLED' && dayjs(booking.endAt).isAfter(now),
	);
	const doneBookings = data.filter(
		(booking) =>
			booking.status === 'CANCELLED' ||
			dayjs(booking.endAt).isBefore(now),
	);
	const filteredBookings = filter === 'active' ? activeBookings : doneBookings;

	const hasReviewedVenue = (venueId: string) =>
		!isProvider &&
		(data as BookingItem[]).some(
			(b) => b.unit.venue.id === venueId && b.review != null,
		);

	return (
		<Box sx={{ width: '100%', maxWidth: 1000, mt: 2 }}>
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				spacing={1}
				alignItems={{ sm: 'center' }}
				justifyContent={{ sm: 'space-between' }}
				sx={{ mb: 2 }}
			>
				<Typography variant="h5" fontWeight={900}>
					My bookings
				</Typography>
				<Button variant="outlined" onClick={() => navigate({ to: '/dashboard' })}>
					Back to dashboard
				</Button>
			</Stack>

			<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
				<Button
					variant={filter === 'active' ? 'contained' : 'outlined'}
					onClick={() => setFilter('active')}
				>
					Active
				</Button>
				<Button
					variant={filter === 'done' ? 'contained' : 'outlined'}
					onClick={() => setFilter('done')}
				>
					Done
				</Button>
			</Stack>

			{filteredBookings.length === 0 ? (
				<Paper
					variant="outlined"
					sx={{
						p: 4,
						borderRadius: 2,
						textAlign: 'center',
						bgcolor: 'action.hover',
					}}
				>
					<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
						{filter === 'active'
							? 'No active bookings. Browse venues and make your first reservation.'
							: 'No completed bookings yet.'}
					</Typography>
					{filter === 'active' && (
						<Button
							variant="contained"
							size="large"
							onClick={() => navigate({ to: '/dashboard' })}
						>
							Browse venues
						</Button>
					)}
				</Paper>
			) : (
				<Stack spacing={1.5}>
					{filteredBookings.map((booking) => {
						const start = dayjs(booking.startAt);
						const end = dayjs(booking.endAt);
						const isPast = end.isBefore(dayjs());
						const canReview =
							!isProvider &&
							isPast &&
							!(booking as BookingItem).review &&
							!hasReviewedVenue(booking.unit.venue.id);
						const providerBooking = isProvider
							? (booking as ProviderBooking)
							: null;

						return (
							<Paper key={booking.id} variant="outlined" sx={{ p: 2 }}>
								<Stack
									direction={{ xs: 'column', sm: 'row' }}
									justifyContent="space-between"
									spacing={1}
								>
									<Box>
										<Typography fontWeight={800}>
											{booking.unit.venue.name}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{booking.unit.name} • {booking.offering.name}
										</Typography>
										{providerBooking && (
											<Typography variant="body2" color="text.secondary">
												Customer: {providerBooking.customer.email}
											</Typography>
										)}
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography variant="body2" color="text.secondary">
												{formatVenueAddress(booking.unit.venue)}
											</Typography>
											<Button
												size="small"
												variant="text"
												onClick={() => {
													const query = encodeURIComponent(
														formatVenueAddress(booking.unit.venue),
													);
													window.open(
														`https://www.google.com/maps/search/?api=1&query=${query}`,
														'_blank',
													);
												}}
											>
												Show on map
											</Button>
										</Stack>
									</Box>
									<Box textAlign={{ sm: 'right' }}>
										<Typography fontWeight={700}>
											{start.format('DD MMM YYYY')}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{start.format('HH:mm')}–{end.format('HH:mm')}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{booking.offering.durationMin} min
											{booking.offering.price != null
												? ` • ${booking.offering.price} RSD`
												: ''}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{formatStatus(booking.status)}
										</Typography>
									</Box>
								</Stack>
								{filter === 'active' && !isProvider && (
									<Stack
										direction="row"
										justifyContent="flex-start"
										sx={{ mt: 1 }}
									>
										<Button
											size="small"
											color="error"
											variant="outlined"
											onClick={() => {
												setCancelError(null);
												setCancelConfirmBooking(booking as BookingItem);
											}}
											sx={{
												'&:hover': {
													borderColor: 'error.main',
													backgroundColor: 'rgba(211, 47, 47, 0.08)',
												},
											}}
										>
											Cancel reservation
										</Button>
									</Stack>
								)}
								{filter === 'active' &&
									isProvider &&
									providerBooking?.status === 'PENDING' && (
										<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
											<Button
												size="small"
												variant="contained"
												color="success"
												disabled={
													approveMutation.isPending ||
													rejectMutation.isPending
												}
												onClick={() => approveMutation.mutate(booking.id)}
											>
												Approve
											</Button>
											<Button
												size="small"
												variant="outlined"
												color="error"
												disabled={
													approveMutation.isPending ||
													rejectMutation.isPending
												}
												onClick={() => rejectMutation.mutate(booking.id)}
											>
												Reject
											</Button>
										</Stack>
									)}
								{filter === 'done' && !isProvider && (
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										justifyContent="space-between"
										alignItems={{ sm: 'center' }}
										spacing={1}
										sx={{ mt: 1 }}
									>
										{(booking as BookingItem).review ? (
											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
											>
												<Rating
													size="small"
													readOnly
													value={(booking as BookingItem).review!.rating}
												/>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													{(booking as BookingItem).review!.comment ?? ''}
												</Typography>
											</Stack>
										) : null}
										{canReview && (
											<Button
												size="small"
												variant="outlined"
												onClick={() => {
													setReviewBooking(booking as BookingItem);
													setReviewRating(5);
													setReviewComment('');
													setReviewError(null);
												}}
											>
												Leave review
											</Button>
										)}
									</Stack>
								)}
							</Paper>
						);
					})}
				</Stack>
			)}
			<Dialog
				open={!!cancelConfirmBooking}
				onClose={() => {
					setCancelConfirmBooking(null);
					setCancelError(null);
				}}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>Cancel reservation?</DialogTitle>
				<DialogContent>
					<Stack spacing={1}>
						<Typography variant="body2" color="text.secondary">
							Are you sure? This action cannot be undone.
						</Typography>
						{cancelError && (
							<Alert severity="error">{cancelError}</Alert>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCancelConfirmBooking(null)}>
						No
					</Button>
					<Button
						color="error"
						variant="contained"
						disabled={cancelBookingMutation.isPending}
						onClick={() => {
							if (!cancelConfirmBooking) return;
							cancelBookingMutation.mutate(cancelConfirmBooking.id);
						}}
					>
						Yes
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={!!reviewBooking}
				onClose={() => setReviewBooking(null)}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle>Leave a review</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<Stack spacing={2}>
						{reviewError && <Alert severity="error">{reviewError}</Alert>}
						<Rating
							value={reviewRating}
							onChange={(_, value) => setReviewRating(value)}
						/>
						<TextField
							label="Comment (optional)"
							value={reviewComment}
							onChange={(e) => setReviewComment(e.target.value)}
							fullWidth
							multiline
							minRows={3}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setReviewBooking(null)}>Cancel</Button>
					<Button
						variant="contained"
						disabled={!reviewRating || createReviewMutation.isPending}
						onClick={() => {
							if (!reviewBooking || !reviewRating) return;
							createReviewMutation.mutate({
								bookingId: reviewBooking.id,
								rating: reviewRating,
								comment: reviewComment.trim() || undefined,
							});
						}}
					>
						Submit
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

function formatStatus(status: string) {
	switch (status) {
		case 'CONFIRMED':
			return 'Confirmed';
		case 'PENDING':
			return 'Pending approval';
		case 'CANCELLED':
			return 'Cancelled';
		case 'COMPLETED':
			return 'Completed';
		default:
			return status;
	}
}

function formatVenueAddress(venue: {
	city: string;
	address?: string | null;
}) {
	return venue.address ? `${venue.address}, ${venue.city}` : venue.city;
}
