import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';

import { type VenueCard } from '../../types/venue';

export function VenueCardItem({
	v,
	onOpen,
	isFavorite,
	onToggleFavorite,
}: {
	v: VenueCard;
	onOpen: () => void;
	isFavorite?: boolean;
	onToggleFavorite?: (e: React.MouseEvent) => void;
}) {
	return (
		<Paper
			variant="outlined"
			sx={{
				borderRadius: 2.5,
				overflow: 'hidden',
				transition: 'transform .12s ease',
				'&:hover': { transform: 'translateY(-2px)' },
			}}
		>
			{/* “Hero” header (no images yet) */}
			<Box
				sx={{
					height: 160,
					bgcolor: 'action.hover',
					px: 2.5,
					pt: 1.5,
					pb: 2.5,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
					<Chip
						label={v.category}
						size="medium"
						variant="outlined"
					/>
					{onToggleFavorite && (
						<Tooltip
							title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
						>
							<IconButton
								size="small"
								onClick={onToggleFavorite}
								sx={{ color: isFavorite ? 'error.main' : 'action.active' }}
								aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
							>
								{isFavorite ? (
									<FavoriteIcon fontSize="small" />
								) : (
									<FavoriteBorderIcon fontSize="small" />
								)}
							</IconButton>
						</Tooltip>
					)}
				</Stack>
				<Box sx={{ mt: 'auto' }}>
					<Typography fontWeight={900} variant="h5" noWrap>
						{v.name}
					</Typography>
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
						<LocationOnIcon fontSize="medium" />
						<Typography variant="body1" color="text.secondary" noWrap>
							{v.address ? `${v.city} • ${v.address}` : v.city}
						</Typography>
					</Stack>
				</Box>
			</Box>

			<Box sx={{ p: 2.5 }}>
				<Stack direction="row" gap={1.25} flexWrap="wrap" alignItems="center">
					{v.avgRating != null && (
						<Chip
							icon={<StarIcon sx={{ fontSize: 18 }} />}
							label={`${v.avgRating} (${v.reviewsCount})`}
							size="medium"
							variant="outlined"
						/>
					)}
					<Chip
						label={`${v.unitsCount ?? 0} units`}
						size="medium"
						variant="outlined"
					/>
					<Chip
						label={`${v.offeringsCount ?? 0} offerings`}
						size="medium"
						variant="outlined"
					/>
				</Stack>

				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ mt: 2 }}
				>
					<Typography fontWeight={900} variant="h6">
						{v.priceFrom == null
							? 'Price on request'
							: `From ${formatRsd(v.priceFrom)}`}
					</Typography>

					<Button variant="contained" size="large" onClick={onOpen}>
						Details
					</Button>
				</Stack>
			</Box>
		</Paper>
	);
}

function formatRsd(value: number) {
	return new Intl.NumberFormat('sr-RS', {
		style: 'currency',
		currency: 'RSD',
		maximumFractionDigits: 0,
	}).format(value);
}
