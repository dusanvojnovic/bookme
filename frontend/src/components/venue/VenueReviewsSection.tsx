import StarIcon from '@mui/icons-material/Star';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import { type VenueReview } from '../../types/venue';

function formatRelativeDate(dateStr: string) {
	const d = dayjs(dateStr);
	const now = dayjs();
	const days = now.diff(d, 'day');
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	if (days < 365) return `${Math.floor(days / 30)} months ago`;
	return d.format('MMM YYYY');
}

function ReviewItem({ review }: { review: VenueReview }) {
	return (
		<Box
			sx={{
				p: 1.5,
				borderRadius: 1,
				bgcolor: 'action.hover',
			}}
		>
			<Stack spacing={0.5}>
				<Stack direction="row" alignItems="center" spacing={0.5}>
					{Array.from({ length: 5 }).map((_, i) => (
						<StarIcon
							key={i}
							sx={{
								fontSize: 18,
								color: i < review.rating ? 'warning.main' : 'action.disabled',
							}}
						/>
					))}
					<Typography variant="caption" color="text.secondary">
						{formatRelativeDate(review.createdAt)}
					</Typography>
				</Stack>
				{review.comment?.trim() && (
					<Typography variant="body2">{review.comment.trim()}</Typography>
				)}
			</Stack>
		</Box>
	);
}

export function VenueReviewsSection({
	reviews,
	avgRating,
	reviewsCount,
}: {
	reviews: VenueReview[];
	avgRating?: number | null;
	reviewsCount?: number;
}) {
	const [dialogOpen, setDialogOpen] = useState(false);

	if (reviewsCount == null || reviewsCount === 0) return null;

	return (
		<>
			<Paper id="reviews" variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
				<Stack spacing={1.5}>
					<Stack
						direction="row"
						justifyContent="space-between"
						alignItems="center"
					>
						<Typography fontWeight={800}>
							Reviews
							{avgRating != null && (
								<>
									{' '}
									<StarIcon sx={{ color: 'warning.main', fontSize: 18, verticalAlign: 'middle' }} />
									{' '}
									{avgRating} ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
								</>
							)}
						</Typography>
						<Button
							size="small"
							variant="outlined"
							onClick={() => setDialogOpen(true)}
						>
							See all reviews
						</Button>
					</Stack>
					<Stack spacing={1.5}>
						{reviews.slice(0, 3).map((review) => (
							<ReviewItem key={review.id} review={review} />
						))}
					</Stack>
				</Stack>
			</Paper>

			<Dialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					Reviews
					{avgRating != null && (
						<>
							{' '}
							<StarIcon sx={{ color: 'warning.main', fontSize: 20, verticalAlign: 'middle' }} />
							{' '}
							{avgRating} ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
						</>
					)}
				</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2}>
						{reviews.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								No reviews yet.
							</Typography>
						) : (
							reviews.map((review) => (
								<ReviewItem key={review.id} review={review} />
							))
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDialogOpen(false)}>Close</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
