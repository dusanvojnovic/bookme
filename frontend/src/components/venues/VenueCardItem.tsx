import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
	Box,
	Button,
	Chip,
	Paper,
	Stack,
	Typography,
} from '@mui/material';

import { type VenueCard } from '../../types/venue';

export function VenueCardItem({
	v,
	onOpen,
}: {
	v: VenueCard;
	onOpen: () => void;
}) {
	return (
		<Paper
			variant="outlined"
			sx={{
				borderRadius: 2,
				overflow: 'hidden',
				transition: 'transform .12s ease',
				'&:hover': { transform: 'translateY(-2px)' },
			}}
		>
			{/* “Hero” header (no images yet) */}
			<Box
				sx={{
					height: 140,
					bgcolor: 'action.hover',
					px: 2,
					pt: 1.25,
					pb: 2,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				<Chip
					label={v.category}
					size="small"
					variant="outlined"
					sx={{ alignSelf: 'flex-start' }}
				/>
				<Box sx={{ mt: 'auto' }}>
					<Typography fontWeight={900} variant="h6" noWrap>
						{v.name}
					</Typography>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<LocationOnIcon fontSize="small" />
						<Typography variant="body2" color="text.secondary" noWrap>
							{v.address ? `${v.city} • ${v.address}` : v.city}
						</Typography>
					</Stack>
				</Box>
			</Box>

			<Box sx={{ p: 2 }}>
				<Stack direction="row" gap={1} flexWrap="wrap">
					<Chip
						label={`${v.unitsCount ?? 0} units`}
						size="small"
						variant="outlined"
					/>
					<Chip
						label={`${v.offeringsCount ?? 0} offerings`}
						size="small"
						variant="outlined"
					/>
				</Stack>

				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ mt: 1.5 }}
				>
					<Typography fontWeight={900}>
						{v.priceFrom == null
							? 'Price on request'
							: `From ${formatRsd(v.priceFrom)}`}
					</Typography>

					<Button variant="contained" onClick={onOpen}>
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
