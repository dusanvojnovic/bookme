import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ScheduleIcon from '@mui/icons-material/Schedule';
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

import { api } from '../../api/api';
import { type VenueCard } from '../../types/venue';

function getImageUrl(imageUrl: string | null | undefined): string | null {
	if (!imageUrl) return null;
	if (imageUrl.startsWith('http')) return imageUrl;
	const base = api.defaults.baseURL ?? '';
	return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

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
			<Box
				sx={{
					height: 160,
					bgcolor: 'action.hover',
					backgroundImage: getImageUrl(v.imageUrl)
						? `url(${getImageUrl(v.imageUrl)})`
						: 'none',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
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
							sx={{ bgcolor: 'background.paper' }}
						/>
						{onToggleFavorite && (
							<Tooltip
								title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
							>
								<IconButton
									size="small"
									onClick={onToggleFavorite}
									sx={{
										color: isFavorite ? 'error.main' : 'action.active',
										bgcolor: 'background.paper',
										'&:hover': { bgcolor: 'background.paper' },
									}}
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
						<Typography
							fontWeight={900}
							variant="h5"
							noWrap
							sx={{ textShadow: getImageUrl(v.imageUrl) ? '0 1px 2px rgba(0,0,0,0.5)' : 'none' }}
						>
							{v.name}
						</Typography>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
						<LocationOnIcon fontSize="medium" />
							<Typography
								variant="body1"
								color="text.secondary"
								noWrap
								sx={{ textShadow: getImageUrl(v.imageUrl) ? '0 1px 2px rgba(0,0,0,0.4)' : 'none' }}
							>
								{v.address ? `${v.city} • ${v.address}` : v.city}
							</Typography>
						<Button
							size="small"
							variant="text"
							onClick={(e) => {
								e.stopPropagation();
								const q = encodeURIComponent(
									v.address ? `${v.address}, ${v.city}` : v.city,
								);
								window.open(
									`https://www.google.com/maps/search/?api=1&query=${q}`,
									'_blank',
								);
							}}
							sx={{ textTransform: 'none', minWidth: 'auto', py: 0 }}
						>
							Show on map
						</Button>
						</Stack>
					</Box>
				</Box>

			<Box sx={{ p: 2.5 }}>
				<Stack direction="row" gap={1.25} flexWrap="wrap" alignItems="center">
					{v.availableToday ? (
						<Chip
							icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
							label="Available today"
							size="medium"
							variant="outlined"
							color="success"
						/>
					) : v.nextAvailableDay ? (
						<Chip
							icon={<ScheduleIcon sx={{ fontSize: 18 }} />}
							label={`Next: ${v.nextAvailableDay}`}
							size="medium"
							variant="outlined"
						/>
					) : null}
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
