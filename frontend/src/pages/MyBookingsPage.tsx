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
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import dayjs from 'dayjs';
import * as React from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../store/auth.store';
import { type BookingItem } from '../types/booking';

async function fetchMyBookings(token: string) {
	const res = await api.get<BookingItem[]>('/customer/bookings', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function createReview(
	token: string,
	bookingId: string,
	payload: { rating: number; comment?: string },
) {
	const res = await api.post(`/customer/bookings/${bookingId}/review`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function cancelBooking(token: string, bookingId: string) {
	const res = await api.patch(`/customer/bookings/${bookingId}/cancel`, {}, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export function MyBookingsPage() {
	const token = useAuthStore((s) => s.token);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [reviewBooking, setReviewBooking] = React.useState<BookingItem | null>(
		null,
	);
	const [reviewRating, setReviewRating] = React.useState<number | null>(5);
	const [reviewComment, setReviewComment] = React.useState('');
	const [reviewError, setReviewError] = React.useState<string | null>(null);
	const [cancelConfirmBooking, setCancelConfirmBooking] =
		React.useState<BookingItem | null>(null);
	const [filter, setFilter] = React.useState<'active' | 'done'>('active');

	const {
		data = [],
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: ['my-bookings', token],
		queryFn: () => fetchMyBookings(token!),
		enabled: !!token,
		staleTime: 30_000,
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
			queryClient.invalidateQueries({ queryKey: ['my-bookings', token] });
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

	const [cancelError, setCancelError] = React.useState<string | null>(null);

	const cancelBookingMutation = useMutation({
		mutationFn: (bookingId: string) => cancelBooking(token!, bookingId),
		onSuccess: () => {
			setCancelConfirmBooking(null);
			setCancelError(null);
			queryClient.invalidateQueries({ queryKey: ['my-bookings', token] });
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
			<Typography variant="body2" color="text.secondary">
				Loading bookings...
			</Typography>
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
	const doneBookings = data.filter((booking) =>
		dayjs(booking.endAt).isBefore(now),
	);
	const filteredBookings = filter === 'active' ? activeBookings : doneBookings;

	const hasReviewedVenue = (venueId: string) =>
		data.some(
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
				<Typography variant="body2" color="text.secondary">
					{filter === 'active'
						? 'No active bookings.'
						: 'No completed bookings.'}
				</Typography>
			) : (
				<Stack spacing={1.5}>
					{filteredBookings.map((booking) => {
						const start = dayjs(booking.startAt);
						const end = dayjs(booking.endAt);
						const isPast = end.isBefore(dayjs());
						const canReview =
							isPast &&
							!booking.review &&
							!hasReviewedVenue(booking.unit.venue.id);

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
								{filter === 'active' && (
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
												setCancelConfirmBooking(booking);
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
								{filter === 'done' && (
									<Stack
										direction={{ xs: 'column', sm: 'row' }}
										justifyContent="space-between"
										alignItems={{ sm: 'center' }}
										spacing={1}
										sx={{ mt: 1 }}
									>
										{booking.review ? (
											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
											>
												<Rating
													size="small"
													readOnly
													value={booking.review.rating}
												/>
												<Typography
													variant="body2"
													color="text.secondary"
												>
													{booking.review.comment ?? ''}
												</Typography>
											</Stack>
										) : null}
										{canReview && (
											<Button
												size="small"
												variant="outlined"
												onClick={() => {
													setReviewBooking(booking);
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
			return 'Pending';
		case 'CANCELLED':
			return 'Cancelled';
		case 'COMPLETED':
			return 'Completed';
		default:
			return status;
	}
}

function formatVenueAddress(venue: { city: string; address: string | null }) {
	return venue.address ? `${venue.address}, ${venue.city}` : venue.city;
}
