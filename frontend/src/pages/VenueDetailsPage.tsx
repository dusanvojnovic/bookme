import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import CollectionsIcon from '@mui/icons-material/Collections';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import axios from 'axios';
import dayjs, { type Dayjs } from 'dayjs';
import * as React from 'react';
import { api } from '../api/api';
import { useAuthStore } from '../store/auth.store';
import { type Unit, type VenueDetails, type VenueImage, type VenueReview } from '../types/venue';

type UpdateVenuePayload = {
	category?: string;
	name?: string;
	city?: string;
	description?: string;
	address?: string;
	slotStepMin?: number;
};

type CreateUnitPayload = {
	name: string;
	unitType: string;
	capacity?: number;
	minDurationMin?: number;
	maxDurationMin?: number;
	slotStepMin?: number;
};

type UpdateUnitPayload = Partial<CreateUnitPayload>;

type CreateOfferingPayload = {
	unitId: string;
	name: string;
	durationMin: number;
	price?: number;
	isActive?: boolean;
};

type UpdateOfferingPayload = Partial<CreateOfferingPayload>;

type CreateBookingPayload = {
	unitId: string;
	offeringId: string;
	startAt: string;
};

type ScheduleEntryPayload = {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
};

type BookingSlot = {
	id: string;
	unitId: string;
	startAt: string;
	endAt: string;
};

type BlockSlot = {
	id: string;
	unitId: string;
	startAt: string;
	endAt: string;
	reason?: string | null;
};

const CATEGORY_OPTIONS = [
	'SPORT',
	'BUSINESS',
	'EVENTS',
	'FOOD',
	'WELLNESS',
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 150, 180];

function getDurationOptionsForUnit(unit: Unit | undefined) {
	if (!unit) return DURATION_OPTIONS;
	const min = unit.minDurationMin ?? 0;
	const max = unit.maxDurationMin ?? Infinity;
	return DURATION_OPTIONS.filter((val) => val >= min && val <= max);
}

async function fetchVenue(venueId: string) {
	const res = await api.get<VenueDetails>(`/venues/${venueId}`);
	return res.data;
}

async function updateVenue(
	token: string,
	venueId: string,
	payload: UpdateVenuePayload,
) {
	const res = await api.patch<VenueDetails>(
		`/provider/venues/${venueId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

function getImageUrl(imageUrl: string | null | undefined): string | null {
	if (!imageUrl) return null;
	if (imageUrl.startsWith('http')) return imageUrl;
	const base = api.defaults.baseURL ?? '';
	return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

function VenueGallery({
	images,
	legacyImageUrl,
	getImageUrl,
	selectedIndex,
	onGalleryClick,
}: {
	images: VenueImage[];
	legacyImageUrl?: string | null;
	getImageUrl: (path: string | null | undefined) => string | null;
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

	if (displayImages.length === 0) return null;

	return (
		<Box sx={{ mb: 2, position: 'relative' }}>
			<Box
				sx={{
					height: 220,
					borderRadius: 2,
					overflow: 'hidden',
					backgroundImage: selectedPath ? `url(${getImageUrl(selectedPath)})` : 'none',
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

function GalleryLightbox({
	images,
	legacyImageUrl,
	getImageUrl,
	venueName,
	open,
	initialIndex,
	onClose,
}: {
	images: VenueImage[];
	legacyImageUrl?: string | null;
	getImageUrl: (path: string | null | undefined) => string | null;
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
	const [index, setIndex] = React.useState(initialIndex);

	React.useEffect(() => {
		if (open) setIndex(initialIndex);
	}, [open, initialIndex]);

	React.useEffect(() => {
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

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen
			PaperProps={{
				sx: {
					bgcolor: '#0a0a0a',
					backgroundImage: 'none',
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
						src={getImageUrl(currentPath) ?? ''}
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

async function uploadVenueImage(
	token: string,
	venueId: string,
	file: File,
) {
	const formData = new FormData();
	formData.append('file', file);
	await api.post(`/provider/venues/${venueId}/image`, formData, {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'multipart/form-data',
		},
	});
}

async function removeVenueImage(token: string, venueId: string, imageId: string) {
	await api.delete(`/provider/venues/${venueId}/images/${imageId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

async function createUnit(
	token: string,
	venueId: string,
	payload: CreateUnitPayload,
) {
	const res = await api.post<Unit>(`/provider/venues/${venueId}/units`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function updateUnit(
	token: string,
	venueId: string,
	unitId: string,
	payload: UpdateUnitPayload,
) {
	const res = await api.patch<Unit>(
		`/provider/venues/${venueId}/units/${unitId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

async function deleteUnit(token: string, venueId: string, unitId: string) {
	const res = await api.delete(`/provider/venues/${venueId}/units/${unitId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function createOffering(
	token: string,
	venueId: string,
	payload: CreateOfferingPayload,
) {
	const res = await api.post(`/provider/venues/${venueId}/offerings`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function updateOffering(
	token: string,
	venueId: string,
	offeringId: string,
	payload: UpdateOfferingPayload,
) {
	const res = await api.patch(
		`/provider/venues/${venueId}/offerings/${offeringId}`,
		payload,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

async function deleteOffering(
	token: string,
	venueId: string,
	offeringId: string,
) {
	const res = await api.delete(
		`/provider/venues/${venueId}/offerings/${offeringId}`,
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

async function updateSchedule(
	token: string,
	venueId: string,
	entries: ScheduleEntryPayload[],
) {
	const res = await api.patch(
		`/provider/venues/${venueId}/schedule`,
		{ entries },
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return res.data;
}

async function fetchBookings(venueId: string, date: string) {
	const res = await api.get<BookingSlot[]>(`/venues/${venueId}/bookings`, {
		params: { date },
	});
	return res.data;
}

async function fetchBlocks(venueId: string, date: string) {
	const res = await api.get<BlockSlot[]>(`/venues/${venueId}/blocks`, {
		params: { date },
	});
	return res.data;
}

type CreateBlockPayload = {
	unitId: string;
	startAt: string;
	endAt: string;
	reason?: string;
};

async function createBlock(
	token: string,
	venueId: string,
	payload: CreateBlockPayload,
) {
	const res = await api.post(`/provider/venues/${venueId}/blocks`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function createBooking(
	token: string,
	venueId: string,
	payload: CreateBookingPayload,
) {
	const res = await api.post(`/venues/${venueId}/bookings`, payload, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

export function VenueDetailsPage() {
	const { venueId } = useParams({ from: '/venues/$venueId' });
	const navigate = useNavigate();
	const token = useAuthStore((s) => s.token);
	const user = useAuthStore((s) => s.user);
	const queryClient = useQueryClient();

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

	const [form, setForm] = React.useState<UpdateVenuePayload>({
		name: '',
		city: '',
		address: '',
		description: '',
		category: '',
		slotStepMin: undefined,
	});
	const [isEditingVenue, setIsEditingVenue] = React.useState(false);

	const [unitForm, setUnitForm] = React.useState({
		name: '',
		unitType: '',
		capacity: '',
		minDurationMin: '',
		maxDurationMin: '',
		slotStepMin: '',
	});

	const [repeatType, setRepeatType] = React.useState<
		'everyday' | 'weekdays' | 'weekends' | 'custom'
	>('everyday');
	const [selectedDays, setSelectedDays] = React.useState<number[]>([
		0, 1, 2, 3, 4, 5, 6,
	]);
	const [scheduleStart, setScheduleStart] = React.useState<Dayjs | null>(
		dayjs('09:00', 'HH:mm'),
	);
	const [scheduleEnd, setScheduleEnd] = React.useState<Dayjs | null>(
		dayjs('21:00', 'HH:mm'),
	);
	const [scheduleEntries, setScheduleEntries] = React.useState<
		ScheduleEntryPayload[]
	>([]);

	const [selectedUnitId, setSelectedUnitId] = React.useState('');
	const [selectedOfferingId, setSelectedOfferingId] = React.useState('');
	const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(null);
	const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
	const [bookingDialogOpen, setBookingDialogOpen] = React.useState(false);
	const [bookingAttempted, setBookingAttempted] = React.useState(false);
	const [bookingError, setBookingError] = React.useState<string | null>(null);
	const [blockUnitId, setBlockUnitId] = React.useState('');
	const [blockDate, setBlockDate] = React.useState<Dayjs | null>(dayjs());
	const [blockStart, setBlockStart] = React.useState<Dayjs | null>(null);
	const [blockEnd, setBlockEnd] = React.useState<Dayjs | null>(null);
	const [blockReason, setBlockReason] = React.useState('');
	const [blockError, setBlockError] = React.useState<string | null>(null);
	const [requestedSlot, setRequestedSlot] = React.useState<{
		slot: string;
		date: string;
		unitId: string;
		offeringId: string;
	} | null>(null);
	const [editingUnitId, setEditingUnitId] = React.useState<string | null>(
		null,
	);
	const [editingUnitForm, setEditingUnitForm] = React.useState({
		name: '',
		unitType: '',
		capacity: '',
		minDurationMin: '',
		maxDurationMin: '',
		slotStepMin: '',
	});
	const [unitToast, setUnitToast] = React.useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);
	const [deleteUnitId, setDeleteUnitId] = React.useState<string | null>(null);
	const [offeringForm, setOfferingForm] = React.useState({
		unitId: '',
		name: '',
		durationMin: '',
		price: '',
	});
	const [editingOfferingId, setEditingOfferingId] = React.useState<
		string | null
	>(null);
	const [editingOfferingForm, setEditingOfferingForm] = React.useState({
		unitId: '',
		name: '',
		durationMin: '',
		price: '',
	});
	const [offeringToast, setOfferingToast] = React.useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);
	const [deleteOfferingId, setDeleteOfferingId] = React.useState<
		string | null
	>(null);
	const [bookingToast, setBookingToast] = React.useState<{
		message: string;
		severity: 'success' | 'error';
	} | null>(null);
	const [reviewsDialogOpen, setReviewsDialogOpen] = React.useState(false);
	const [galleryLightboxOpen, setGalleryLightboxOpen] = React.useState(false);
	const [shareSnackbar, setShareSnackbar] = React.useState<'copied' | 'shared' | false>(false);

	React.useEffect(() => {
		if (!venue) return;
		setForm({
			name: venue.name,
			city: venue.city,
			address: venue.address ?? '',
			description: venue.description ?? '',
			category: venue.category,
			slotStepMin: venue.slotStepMin ?? undefined,
		});

		if (venue.schedules?.length) {
			setScheduleEntries(
				venue.schedules.map((entry) => ({
					dayOfWeek: entry.dayOfWeek,
					startTime: entry.startTime,
					endTime: entry.endTime,
				})),
			);
			setScheduleStart(dayjs(venue.schedules[0].startTime, 'HH:mm'));
			setScheduleEnd(dayjs(venue.schedules[0].endTime, 'HH:mm'));
		} else {
			setScheduleEntries([]);
		}
	}, [venue]);

	React.useEffect(() => {
		if (!offeringForm.unitId || !venue) return;
		const unit = venue.units.find((u) => u.id === offeringForm.unitId);
		const opts = getDurationOptionsForUnit(unit);
		const current = Number(offeringForm.durationMin);
		const valid = !Number.isNaN(current) && opts.includes(current);
		if (!valid && offeringForm.durationMin !== '') {
			setOfferingForm((prev) => ({ ...prev, durationMin: '' }));
		}
	}, [offeringForm.unitId, offeringForm.durationMin, venue]);

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

	const updateMutation = useMutation({
		mutationFn: (payload: UpdateVenuePayload) =>
			updateVenue(token!, venueId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
			setIsEditingVenue(false);
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

	const createUnitMutation = useMutation({
		mutationFn: (payload: CreateUnitPayload) =>
			createUnit(token!, venueId, payload),
		onSuccess: () => {
			setUnitForm({
				name: '',
				unitType: '',
				capacity: '',
				minDurationMin: '',
				maxDurationMin: '',
				slotStepMin: '',
			});
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	const updateUnitMutation = useMutation({
		mutationFn: (payload: { unitId: string; data: UpdateUnitPayload }) =>
			updateUnit(token!, venueId, payload.unitId, payload.data),
		onSuccess: () => {
			setEditingUnitId(null);
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	const deleteUnitMutation = useMutation({
		mutationFn: (unitId: string) => deleteUnit(token!, venueId, unitId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setUnitToast({ message: 'Unit deleted', severity: 'success' });
		},
		onError: () => {
			setUnitToast({
				message: 'Failed to delete unit',
				severity: 'error',
			});
		},
	});

	const createOfferingMutation = useMutation({
		mutationFn: (payload: CreateOfferingPayload) =>
			createOffering(token!, venueId, payload),
		onSuccess: () => {
			setOfferingForm({
				unitId: '',
				name: '',
				durationMin: '',
				price: '',
			});
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setOfferingToast({ message: 'Offering added', severity: 'success' });
		},
		onError: () => {
			setOfferingToast({
				message: 'Failed to add offering',
				severity: 'error',
			});
		},
	});

	const updateOfferingMutation = useMutation({
		mutationFn: (payload: { offeringId: string; data: UpdateOfferingPayload }) =>
			updateOffering(token!, venueId, payload.offeringId, payload.data),
		onSuccess: () => {
			setEditingOfferingId(null);
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setOfferingToast({ message: 'Offering updated', severity: 'success' });
		},
		onError: () => {
			setOfferingToast({
				message: 'Failed to update offering',
				severity: 'error',
			});
		},
	});

	const deleteOfferingMutation = useMutation({
		mutationFn: (offeringId: string) =>
			deleteOffering(token!, venueId, offeringId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
			setOfferingToast({ message: 'Offering deleted', severity: 'success' });
		},
		onError: () => {
			setOfferingToast({
				message: 'Failed to delete offering',
				severity: 'error',
			});
		},
	});

	const createBookingMutation = useMutation({
		mutationFn: (payload: CreateBookingPayload) =>
			createBooking(token!, venueId, payload),
		onSuccess: () => {
			if (selectedSlot) {
				setRequestedSlot({
					slot: selectedSlot,
					date: dateParam,
					unitId: selectedUnitId,
					offeringId: selectedOfferingId,
				});
			}
			setSelectedSlot(null);
			queryClient.invalidateQueries({
				queryKey: ['venue-bookings', venueId, dateParam],
			});
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
			setBookingToast({
				message: 'Booking successful.',
				severity: 'success',
			});
			setBookingAttempted(false);
			setBookingError(null);
			navigate({ to: '/my-bookings' });
		},
		onError: (error) => {
			const message = axios.isAxiosError(error)
				? Array.isArray(error.response?.data?.message)
					? error.response?.data?.message.join(', ')
					: error.response?.data?.message || error.message
				: error instanceof Error
					? error.message
					: 'Failed to create booking';
			setBookingError(message);
			setBookingToast({ message, severity: 'error' });
		},
	});

	const createBlocksMutation = useMutation({
		mutationFn: async (payloads: CreateBlockPayload[]) => {
			await Promise.all(
				payloads.map((payload) => createBlock(token!, venueId, payload)),
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['venue-blocks', venueId],
			});
			setBlockStart(null);
			setBlockEnd(null);
			setBlockReason('');
			setBlockError(null);
		},
		onError: (error) => {
			const message = axios.isAxiosError(error)
				? Array.isArray(error.response?.data?.message)
					? error.response?.data?.message.join(', ')
					: error.response?.data?.message || error.message
				: error instanceof Error
					? error.message
					: 'Failed to add block';
			setBlockError(message);
		},
	});

	const updateScheduleMutation = useMutation({
		mutationFn: (entries: ScheduleEntryPayload[]) =>
			updateSchedule(token!, venueId, entries),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['venue', venueId] });
		},
	});

	const dateParam = (selectedDate ?? dayjs()).format('YYYY-MM-DD');
	const { data: bookings = [] } = useQuery({
		queryKey: ['venue-bookings', venueId, dateParam],
		queryFn: () => fetchBookings(venueId, dateParam),
		enabled: !!selectedDate,
		staleTime: 30_000,
	});
	const { data: blocks = [] } = useQuery({
		queryKey: ['venue-blocks', venueId, dateParam],
		queryFn: () => fetchBlocks(venueId, dateParam),
		enabled: !!selectedDate,
		staleTime: 30_000,
	});

	const blockDateParam = (blockDate ?? dayjs()).format('YYYY-MM-DD');
	const { data: blocksForDay = [] } = useQuery({
		queryKey: ['venue-blocks', venueId, blockDateParam],
		queryFn: () => fetchBlocks(venueId, blockDateParam),
		enabled: isOwner && !!blockDate,
		staleTime: 30_000,
	});

	const canSave =
		isOwner &&
		form.name?.trim() &&
		form.city?.trim() &&
		form.category?.trim();

	const canAddUnit =
		isOwner && unitForm.name.trim() && unitForm.unitType.trim();

	const canAddOffering =
		isOwner &&
		offeringForm.unitId &&
		offeringForm.name.trim() &&
		String(offeringForm.durationMin).trim();

	const canAddScheduleEntry =
		isOwner && !!scheduleStart && !!scheduleEnd && selectedDays.length > 0;

	const canSaveSchedule = isOwner && scheduleEntries.length > 0;

	const units = venue?.units ?? [];
	const offerings = venue?.offerings ?? [];
	const activeOfferings = offerings.filter((offering) => offering.isActive);
	const schedules = venue?.schedules ?? [];
	const displaySchedules = isOwner ? scheduleEntries : schedules;
	const selectedUnit = units.find((u) => u.id === selectedUnitId);
	const selectedOffering = activeOfferings.find(
		(o) => o.id === selectedOfferingId,
	);
	const durationMin = selectedOffering?.durationMin ?? null;
	const slotStepMin =
		selectedUnit?.slotStepMin ?? venue?.slotStepMin ?? 30;
	const dayOfWeek = selectedDate?.day();
	const daySchedule = schedules.filter(
		(entry) => entry.dayOfWeek === dayOfWeek,
	);
	const bookingsForUnit = bookings.filter(
		(booking) => booking.unitId === selectedUnitId,
	);
	const blocksForUnit = blocks.filter(
		(block) => block.unitId === selectedUnitId,
	);
	const allSlots = React.useMemo(() => {
		if (!durationMin || !selectedDate || !selectedUnitId) return [];
		return generateSlots(daySchedule, slotStepMin, durationMin);
	}, [
		daySchedule,
		slotStepMin,
		durationMin,
		selectedDate,
		selectedUnitId,
	]);

	const isSlotPast = React.useCallback(
		(slot: string) => {
			if (!selectedDate) return false;
			const now = dayjs();
			if (!selectedDate.isSame(now, 'day')) return false;
			const slotStart = selectedDate
				.hour(Math.floor(toMinutes(slot) / 60))
				.minute(toMinutes(slot) % 60)
				.second(0)
				.millisecond(0);
			return slotStart.isBefore(now) || slotStart.isSame(now);
		},
		[selectedDate],
	);

	React.useEffect(() => {
		setSelectedSlot(null);
	}, [selectedUnitId, selectedOfferingId, selectedDate]);

	React.useEffect(() => {
		if (!blockUnitId && units.length > 0) {
			setBlockUnitId(units[0].id);
		}
	}, [units, blockUnitId]);

	React.useEffect(() => {
		if (bookingError) setBookingError(null);
	}, [selectedUnitId, selectedOfferingId, selectedDate, selectedSlot, bookingError]);

	React.useEffect(() => {
		if (blockError) setBlockError(null);
	}, [blockUnitId, blockDate, blockStart, blockEnd, blockReason, blockError]);

	const resetBookingForm = () => {
		setSelectedUnitId('');
		setSelectedOfferingId('');
		setSelectedDate(null);
		setSelectedSlot(null);
		setBookingAttempted(false);
		setBookingError(null);
	};

	const canSubmitBooking =
		!!token &&
		!!selectedDate &&
		!!selectedUnitId &&
		!!selectedOfferingId &&
		!!selectedSlot;

	const canCreateBlock =
		isOwner &&
		(!!blockUnitId || venue?.units.length === 0) &&
		!!blockDate &&
		!!blockStart &&
		!!blockEnd &&
		blockEnd.isAfter(blockStart);

	const handleReserve = () => {
		setBookingAttempted(true);
		setBookingError(null);
		if (!token) {
			setBookingError('Please log in to book a slot');
			return;
		}
		if (
			!selectedDate ||
			!selectedUnitId ||
			!selectedOfferingId ||
			!selectedSlot
		) {
			return;
		}

		createBookingMutation.mutate({
			unitId: selectedUnitId,
			offeringId: selectedOfferingId,
			startAt: `${dateParam}T${selectedSlot}:00`,
		});
	};

	React.useEffect(() => {
		if (!bookingDialogOpen) {
			setBookingAttempted(false);
			setBookingError(null);
		}
	}, [bookingDialogOpen]);

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
			<Snackbar
				open={updateScheduleMutation.isSuccess}
				autoHideDuration={2500}
				onClose={() => updateScheduleMutation.reset()}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			>
				<Alert
					severity="success"
					icon={<CheckCircleIcon />}
					onClose={() => updateScheduleMutation.reset()}
					sx={{ alignItems: 'center' }}
				>
					Schedule saved successfully
				</Alert>
			</Snackbar>
			{unitToast && (
				<Snackbar
					open
					autoHideDuration={2500}
					onClose={() => setUnitToast(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				>
					<Alert
						severity={unitToast.severity}
						onClose={() => setUnitToast(null)}
						sx={{ alignItems: 'center' }}
					>
						{unitToast.message}
					</Alert>
				</Snackbar>
			)}
			{offeringToast && (
				<Snackbar
					open
					autoHideDuration={2500}
					onClose={() => setOfferingToast(null)}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				>
					<Alert
						severity={offeringToast.severity}
						onClose={() => setOfferingToast(null)}
						sx={{ alignItems: 'center' }}
					>
						{offeringToast.message}
					</Alert>
				</Snackbar>
			)}
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
			<Dialog
				open={!!deleteUnitId}
				onClose={() => setDeleteUnitId(null)}
			>
				<DialogTitle>Delete unit?</DialogTitle>
				<DialogContent>
					This action cannot be undone.
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteUnitId(null)}>Cancel</Button>
					<Button
						color="error"
						variant="contained"
						disabled={deleteUnitMutation.isPending}
						onClick={() => {
							if (!deleteUnitId) return;
							deleteUnitMutation.mutate(deleteUnitId);
							setDeleteUnitId(null);
						}}
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
			<Dialog
				open={!!deleteOfferingId}
				onClose={() => setDeleteOfferingId(null)}
			>
				<DialogTitle>Delete offering?</DialogTitle>
				<DialogContent>
					This action cannot be undone.
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteOfferingId(null)}>Cancel</Button>
					<Button
						color="error"
						variant="contained"
						disabled={deleteOfferingMutation.isPending}
						onClick={() => {
							if (!deleteOfferingId) return;
							deleteOfferingMutation.mutate(deleteOfferingId);
							setDeleteOfferingId(null);
						}}
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>
			{((venue.images?.length ?? 0) > 0 || venue.imageUrl) && (
				<>
					<VenueGallery
						images={venue.images ?? []}
						legacyImageUrl={venue.imageUrl}
						getImageUrl={getImageUrl}
						selectedIndex={0}
						onGalleryClick={() => setGalleryLightboxOpen(true)}
					/>
					<GalleryLightbox
						images={venue.images ?? []}
						legacyImageUrl={venue.imageUrl}
						getImageUrl={getImageUrl}
						venueName={venue.name}
						open={galleryLightboxOpen}
						initialIndex={0}
						onClose={() => setGalleryLightboxOpen(false)}
					/>
				</>
			)}
			<Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
				<Stack
					direction={{ xs: 'column', md: 'row' }}
					justifyContent="space-between"
					alignItems={{ md: 'center' }}
					spacing={1}
				>
					<Box>
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
									<Typography fontWeight={700}>
										{venue.avgRating}
									</Typography>
									<Button
										size="small"
										variant="text"
										onClick={() => setReviewsDialogOpen(true)}
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
							<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
								{venue.description.trim()}
							</Typography>
						)}
					</Box>

					<Stack direction="row" spacing={1} flexWrap="wrap">
						<Button component={Link} to="/dashboard" variant="outlined">
							Back to dashboard
						</Button>
						<Button
							variant="outlined"
							startIcon={<ShareIcon />}
							onClick={handleShare}
						>
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
					</Stack>
				</Stack>
			</Paper>

			{venue.reviewsCount != null && venue.reviewsCount > 0 && (
				<Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
					<Stack spacing={1.5}>
						<Stack
							direction="row"
							justifyContent="space-between"
							alignItems="center"
						>
							<Typography fontWeight={800}>
								Reviews
								{venue.avgRating != null && (
									<>
										{' '}
										<StarIcon sx={{ color: 'warning.main', fontSize: 18, verticalAlign: 'middle' }} />
										{' '}
										{venue.avgRating} ({venue.reviewsCount} {venue.reviewsCount === 1 ? 'review' : 'reviews'})
									</>
								)}
							</Typography>
							<Button
								size="small"
								variant="outlined"
								onClick={() => setReviewsDialogOpen(true)}
							>
								See all reviews
							</Button>
						</Stack>
						<Stack spacing={1.5}>
							{(venue.reviews ?? []).slice(0, 3).map((review) => (
								<ReviewItem key={review.id} review={review} />
							))}
						</Stack>
					</Stack>
				</Paper>
			)}

			<Dialog
				open={reviewsDialogOpen}
				onClose={() => setReviewsDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					Reviews
					{venue.avgRating != null && (
						<>
							{' '}
							<StarIcon sx={{ color: 'warning.main', fontSize: 20, verticalAlign: 'middle' }} />
							{' '}
							{venue.avgRating} ({venue.reviewsCount} {venue.reviewsCount === 1 ? 'review' : 'reviews'})
						</>
					)}
				</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={2}>
						{(venue.reviews ?? []).length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								No reviews yet.
							</Typography>
						) : (
							(venue.reviews ?? []).map((review) => (
								<ReviewItem key={review.id} review={review} />
							))
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setReviewsDialogOpen(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			<Stack spacing={2}>
				{showVenueForm && (
					<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
						<Stack spacing={2}>
							<Typography fontWeight={800}>Edit venue</Typography>
							{/* Image gallery */}
							<Stack spacing={1}>
								<Typography variant="subtitle2" color="text.secondary">
									Venue gallery
								</Typography>
								<Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
									{(venue.images ?? []).length > 0
										? venue.images!.map((img) => (
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
														src={getImageUrl(img.path) ?? ''}
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
														src={getImageUrl(venue.imageUrl) ?? ''}
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
										setForm((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									fullWidth
									disabled={!isOwner}
									required
								/>

								<TextField
									label="City"
									value={form.city ?? ''}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											city: e.target.value,
										}))
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
										setForm((prev) => ({
											...prev,
											address: e.target.value,
										}))
									}
									fullWidth
									disabled={!isOwner}
								/>

								<TextField
									label="Description"
									value={form.description ?? ''}
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											description: e.target.value,
										}))
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
											description:
												form.description?.trim() || undefined,
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
				)}

				{!isOwner && (
					<Dialog
						open={bookingDialogOpen}
						onClose={() => {
							resetBookingForm();
							setBookingDialogOpen(false);
						}}
						fullWidth
						maxWidth="md"
					>
						<DialogTitle>Reserve a slot</DialogTitle>
						<DialogContent sx={{ pt: 2 }}>
							<Stack spacing={2}>
								{bookingError && (
									<Alert severity="error">{bookingError}</Alert>
								)}
								{!token && (
									<Alert severity="warning">
										Log in to reserve a slot.
									</Alert>
								)}
								<Stack
									direction={{ xs: 'column', md: 'row' }}
									spacing={1.5}
									alignItems={{ md: 'center' }}
								>
									{selectedUnitId && selectedUnit ? (
										<Box
											sx={{
												minWidth: 200,
												height: 40,
												display: 'flex',
												alignItems: 'start',
											}}
										>
											<Typography fontWeight={700}>
												{selectedUnit.name}
											</Typography>
										</Box>
									) : (
										<TextField
											select
											label="Unit"
											value={selectedUnitId}
											onChange={(e) =>
												setSelectedUnitId(String(e.target.value))
											}
											size="small"
											sx={{ minWidth: 200 }}
											error={bookingAttempted && !selectedUnitId}
											helperText={
												bookingAttempted && !selectedUnitId
													? 'Select a unit'
													: ' '
											}
										>
											{venue.units.map((unit) => (
												<MenuItem key={unit.id} value={unit.id}>
													{unit.name}
												</MenuItem>
											))}
										</TextField>
									)}

									<TextField
										select
										label="Duration"
										value={selectedOfferingId}
										onChange={(e) =>
											setSelectedOfferingId(String(e.target.value))
										}
										size="small"
                                        sx={{ minWidth: 220, marginTop: 2 }}
										disabled={!activeOfferings.length}
										error={bookingAttempted && !selectedOfferingId}
										helperText={
											!activeOfferings.length
												? 'No active offerings'
												: bookingAttempted && !selectedOfferingId
													? 'Select a duration'
													: ' '
										}
									>
										{activeOfferings.map((offering) => (
											<MenuItem key={offering.id} value={offering.id}>
												{offering.name} ({offering.durationMin} min)
											</MenuItem>
										))}
									</TextField>

									<LocalizationProvider dateAdapter={AdapterDayjs}>
										<DatePicker
											label="Date"
											value={selectedDate}
											onChange={(value) => setSelectedDate(value)}
											minDate={dayjs()}
											slotProps={{
												textField: {
													size: 'small',
													sx: {
														minWidth: 180,
                                                    },
													error: bookingAttempted && !selectedDate,
													helperText:
														bookingAttempted && !selectedDate
															? 'Select a date'
															: ' ',
												},
											}}
										/>
									</LocalizationProvider>
								</Stack>

								{!venue.offerings.length ? (
									<Typography variant="body2" color="text.secondary">
										No offerings yet.
									</Typography>
								) : !activeOfferings.length ? (
									<Typography variant="body2" color="text.secondary">
										No active offerings available.
									</Typography>
								) : !selectedDate ? (
									<Typography variant="body2" color="text.secondary">
										Select a date to see available slots.
									</Typography>
								) : !selectedUnitId ? (
									<Typography variant="body2" color="text.secondary">
										Select a unit to see available slots.
									</Typography>
								) : !selectedOfferingId ? (
									<Typography variant="body2" color="text.secondary">
										Select a duration to see available slots.
									</Typography>
								) : !daySchedule.length ? (
									<Typography variant="body2" color="text.secondary">
										No working hours for this day.
									</Typography>
								) : (
									<Stack spacing={1}>
										<Typography variant="body2" color="text.secondary">
											Time slots ({slotStepMin} min step)
										</Typography>
										{allSlots.length === 0 ? (
											<Typography
												variant="body2"
												color="text.secondary"
											>
												No slots for this day.
											</Typography>
										) : (
											(() => {
												const duration = durationMin ?? 0;
												const mid = Math.ceil(allSlots.length / 2);
												const left = allSlots.slice(0, mid);
												const right = allSlots.slice(mid);

												return (
													<Stack
														direction={{ xs: 'column', sm: 'row' }}
														spacing={2}
														alignItems="flex-start"
													>
														<Stack spacing={1}>
															{left.map((slot) => {
																const label = `${slot}–${fromMinutes(
																	toMinutes(slot) + duration,
																)}`;
																const isSelected = selectedSlot === slot;
																const isRequested =
																	requestedSlot?.slot === slot &&
																	requestedSlot.date === dateParam &&
																	requestedSlot.unitId === selectedUnitId &&
																	requestedSlot.offeringId === selectedOfferingId;
															const isBusy = isSlotBooked(
																bookingsForUnit,
																dateParam,
																slot,
																duration,
															);
															const blocked = isSlotBlocked(
																blocksForUnit,
																dateParam,
																slot,
																duration,
															);
															const isBlocked = !!blocked;
															const isPast = isSlotPast(slot);

																return (
																<Chip
																		key={slot}
																		label={label}
																		size="medium"
																	color={
																		isPast
																			? 'default'
																			: isBlocked
																				? 'error'
																				: isBusy
																					? 'default'
																					: 'success'
																	}
																		variant={
																		isSelected
																			? 'filled'
																			: isPast || isBlocked || isBusy
																				? 'outlined'
																				: 'outlined'
																		}
																		onClick={() => {
																		if (isRequested || isBusy || isBlocked || isPast) return;
																			setSelectedSlot(slot);
																		}}
																	title={blocked?.reason ?? (isPast ? 'This slot has passed' : undefined)}
																		sx={{
																			maxWidth: 200,
																			px: 1.5,
																			py: 1.2,
																			backgroundColor: isRequested
																				? 'rgba(255, 193, 7, 0.18)'
																				: isSelected
																					? 'rgba(76, 175, 80, 0.9)'
																				: isPast
																					? 'rgba(158, 158, 158, 0.08)'
																				: isBlocked
																					? 'rgba(244, 67, 54, 0.16)'
																					: isBusy
																						? 'rgba(158, 158, 158, 0.15)'
																						: 'rgba(76, 175, 80, 0.08)',
																			color: isSelected
																				? 'common.white'
																				: isRequested
																					? 'warning.main'
																				: isPast || isBusy
																					? 'text.secondary'
																					: isBlocked
																						? 'error.main'
																						: 'inherit',
																			cursor:
																			isRequested || isBusy || isBlocked || isPast
																				? 'default'
																				: 'pointer',
																			borderWidth: isSelected ? 2 : 1,
																			opacity: isPast ? 0.6 : 1,
																		}}
																	/>
																);
															})}
														</Stack>
														<Stack spacing={1}>
															{right.map((slot) => {
																const label = `${slot}–${fromMinutes(
																	toMinutes(slot) + duration,
																)}`;
																const isSelected = selectedSlot === slot;
																const isRequested =
																	requestedSlot?.slot === slot &&
																	requestedSlot.date === dateParam &&
																	requestedSlot.unitId === selectedUnitId &&
																	requestedSlot.offeringId === selectedOfferingId;
															const isBusy = isSlotBooked(
																bookingsForUnit,
																dateParam,
																slot,
																duration,
															);
															const blocked = isSlotBlocked(
																blocksForUnit,
																dateParam,
																slot,
																duration,
															);
															const isBlocked = !!blocked;
															const isPast = isSlotPast(slot);

																return (
																<Chip
																		key={slot}
																		label={label}
																		size="medium"
																	color={
																		isPast
																			? 'default'
																			: isBlocked
																				? 'error'
																				: isBusy
																					? 'default'
																					: 'success'
																	}
																		variant={
																		isSelected
																			? 'filled'
																			: isPast || isBlocked || isBusy
																				? 'outlined'
																				: 'outlined'
																		}
																		onClick={() => {
																		if (isRequested || isBusy || isBlocked || isPast) return;
																			setSelectedSlot(slot);
																		}}
																	title={blocked?.reason ?? (isPast ? 'This slot has passed' : undefined)}
																		sx={{
																			maxWidth: 200,
																			px: 1.5,
																			py: 1.2,
																			backgroundColor: isRequested
																				? 'rgba(255, 193, 7, 0.18)'
																				: isSelected
																					? 'rgba(76, 175, 80, 0.9)'
																				: isPast
																					? 'rgba(158, 158, 158, 0.08)'
																				: isBlocked
																					? 'rgba(244, 67, 54, 0.16)'
																					: isBusy
																						? 'rgba(158, 158, 158, 0.15)'
																						: 'rgba(76, 175, 80, 0.08)',
																			color: isSelected
																				? 'common.white'
																				: isRequested
																					? 'warning.main'
																				: isPast || isBusy
																					? 'text.secondary'
																					: isBlocked
																						? 'error.main'
																						: 'inherit',
																			cursor:
																			isRequested || isBusy || isBlocked || isPast
																				? 'default'
																				: 'pointer',
																			borderWidth: isSelected ? 2 : 1,
																			opacity: isPast ? 0.6 : 1,
																		}}
																	/>
																);
															})}
														</Stack>
													</Stack>
												);
											})()
										)}
										{bookingAttempted && !selectedSlot && (
											<Typography variant="body2" color="error">
												Select a time slot.
											</Typography>
										)}
									</Stack>
								)}
							</Stack>
						</DialogContent>
						<DialogActions>
							<Button
								variant="contained"
								disabled={!canSubmitBooking || createBookingMutation.isPending}
								onClick={handleReserve}
							>
								Reserve
							</Button>
							<Button
								variant="outlined"
								onClick={() => {
									resetBookingForm();
									setBookingDialogOpen(false);
								}}
							>
								Cancel
							</Button>
						</DialogActions>
					</Dialog>
				)}

				<Box
					sx={{
						...(isOwner
							? {
									display: 'flex',
									flexDirection: 'column',
									gap: 2,
								}
							: {
									display: 'grid',
									gridTemplateColumns: {
										xs: '1fr',
										md: 'minmax(240px, 0.32fr) 1fr',
									},
									gap: 2,
									alignItems: 'start',
								}),
					}}
				>
					<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
						<Stack spacing={2}>
							<Typography fontWeight={800}>Opening hours</Typography>

						{isOwner ? (
							<>
								<Stack
									direction={{ xs: 'column', md: 'row' }}
									spacing={1.5}
									alignItems={{ md: 'center' }}
								>
									<TextField
										select
										label="Repeat"
										value={repeatType}
										onChange={(e) => {
											const value = String(e.target.value) as
												| 'everyday'
												| 'weekdays'
												| 'weekends'
												| 'custom';
											setRepeatType(value);
											if (value === 'everyday')
												setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
											if (value === 'weekdays')
												setSelectedDays([1, 2, 3, 4, 5]);
											if (value === 'weekends')
												setSelectedDays([0, 6]);
										}}
										size="small"
										sx={{ minWidth: 180 }}
									>
										<MenuItem value="everyday">Every day</MenuItem>
										<MenuItem value="weekdays">Weekdays</MenuItem>
										<MenuItem value="weekends">Weekends</MenuItem>
										<MenuItem value="custom">Custom</MenuItem>
									</TextField>

									<LocalizationProvider dateAdapter={AdapterDayjs}>
										<TimePicker
											label="Start"
											ampm={false}
											value={scheduleStart}
											onChange={(value) => setScheduleStart(value)}
											slotProps={{
												textField: {
													size: 'small',
													sx: { width: 140 },
												},
											}}
										/>
										<TimePicker
											label="End"
											ampm={false}
											value={scheduleEnd}
											onChange={(value) => setScheduleEnd(value)}
											slotProps={{
												textField: {
													size: 'small',
													sx: { width: 140 },
												},
											}}
										/>
									</LocalizationProvider>
									<Button
										variant="contained"
										disabled={!canAddScheduleEntry}
										size="small"
										onClick={() => {
											const newEntries = selectedDays.map((day) => ({
												dayOfWeek: day,
												startTime: scheduleStart!.format('HH:mm'),
												endTime: scheduleEnd!.format('HH:mm'),
											}));
											setScheduleEntries((prev) => {
												const filtered = prev.filter(
													(entry) =>
														!selectedDays.includes(entry.dayOfWeek),
												);
												return [...filtered, ...newEntries];
											});
										}}
									>
										Add working hours
									</Button>
								</Stack>

								{repeatType === 'custom' && (
									<Stack direction="row" spacing={1} flexWrap="wrap">
										{[
											{ label: 'Sun', value: 0 },
											{ label: 'Mon', value: 1 },
											{ label: 'Tue', value: 2 },
											{ label: 'Wed', value: 3 },
											{ label: 'Thu', value: 4 },
											{ label: 'Fri', value: 5 },
											{ label: 'Sat', value: 6 },
										].map((day) => (
											<Button
												key={day.value}
												variant={
													selectedDays.includes(day.value)
														? 'contained'
														: 'outlined'
												}
												size="small"
												onClick={() => {
													setSelectedDays((prev) =>
														prev.includes(day.value)
															? prev.filter((d) => d !== day.value)
															: [...prev, day.value],
													);
												}}
											>
												{day.label}
											</Button>
										))}
									</Stack>
								)}

								<Divider />
							</>
						) : null}

						{displaySchedules.length ? (
							<Stack spacing={1}>
								{displaySchedules
									.slice()
									.sort((a, b) => {
										const order = [1, 2, 3, 4, 5, 6, 0];
										const dayDiff =
											order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
										if (dayDiff !== 0) return dayDiff;
										return a.startTime.localeCompare(b.startTime);
									})
									.map((entry, idx) => (
									<Stack
										key={`${entry.dayOfWeek}-${entry.startTime}-${idx}`}
										direction="row"
										justifyContent="space-between"
										alignItems="center"
										spacing={1}
									>
										<Typography variant="body2">
											{formatDay(entry.dayOfWeek)}: {entry.startTime} -{' '}
											{entry.endTime}
										</Typography>
										{isOwner && (
											<Button
												size="small"
												onClick={() =>
													setScheduleEntries((prev) =>
														prev.filter((_, i) => i !== idx),
													)
												}
											>
												Remove
											</Button>
										)}
									</Stack>
								))}
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary">
								{isOwner
									? 'Add working hours.'
									: 'No schedule set yet.'}
							</Typography>
						)}

						{isOwner && (
							<Stack direction="row" spacing={1} alignItems="center">
								<Button
									variant="contained"
									disabled={!canSaveSchedule || updateScheduleMutation.isPending}
									onClick={() => updateScheduleMutation.mutate(scheduleEntries)}
								>
									Save schedule
								</Button>

								{updateScheduleMutation.isError && (
									<Typography variant="body2" color="error">
										Failed to save schedule.
									</Typography>
								)}
							</Stack>
						)}
					</Stack>
				</Paper>

				<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
						spacing={1}
					>
						<Typography fontWeight={800}>Units</Typography>
							<Typography variant="body2" color="text.secondary">
								{venue.units.length} total
							</Typography>
						</Stack>

						<Divider sx={{ my: 2 }} />

						{isOwner && (
							<Stack spacing={2} sx={{ mb: 2 }}>
								<Typography fontWeight={700}>Add unit</Typography>
								<Stack
									direction={{ xs: 'column', md: 'row' }}
									spacing={2}
								>
									<TextField
										label="Name"
										value={unitForm.name}
										onChange={(e) =>
											setUnitForm((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										fullWidth
									/>
									<TextField
										label="Type"
										value={unitForm.unitType}
										onChange={(e) =>
											setUnitForm((prev) => ({
												...prev,
												unitType: e.target.value,
											}))
										}
										fullWidth
									/>
									<TextField
										label="Capacity"
										type="number"
										value={unitForm.capacity}
										onChange={(e) =>
											setUnitForm((prev) => ({
												...prev,
												capacity: e.target.value,
											}))
										}
										fullWidth
									/>
								</Stack>
								<Stack
									direction={{ xs: 'column', md: 'row' }}
									spacing={2}
								>
									<TextField
										select
										label="Min duration (min)"
										value={unitForm.minDurationMin}
										onChange={(e) =>
											setUnitForm((prev) => ({
												...prev,
												minDurationMin: e.target.value,
											}))
										}
										fullWidth
									>
										{[30, 45, 60, 90, 120, 150, 180].map((val) => (
											<MenuItem key={val} value={val}>
												{val}
											</MenuItem>
										))}
										<MenuItem value="">No min</MenuItem>
									</TextField>
									<TextField
										select
										label="Max duration (min)"
										value={unitForm.maxDurationMin}
										onChange={(e) =>
											setUnitForm((prev) => ({
												...prev,
												maxDurationMin: e.target.value,
											}))
										}
										fullWidth
									>
										{[30, 45, 60, 90, 120, 150, 180].map((val) => (
											<MenuItem key={val} value={val}>
												{val}
											</MenuItem>
										))}
										<MenuItem value="">No max</MenuItem>
									</TextField>
									<TextField
										select
										label="Slot step (min)"
										value={unitForm.slotStepMin}
										onChange={(e) =>
											setUnitForm((prev) => ({
												...prev,
												slotStepMin: e.target.value,
											}))
										}
										fullWidth
									>
										{[15, 30, 45, 60].map((val) => (
											<MenuItem key={val} value={val}>
												{val}
											</MenuItem>
										))}
										<MenuItem value="">No step</MenuItem>
									</TextField>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="center">
									<Button
										variant="contained"
										disabled={!canAddUnit || createUnitMutation.isPending}
										onClick={() => {
											const capacity = String(unitForm.capacity).trim()
												? Number(unitForm.capacity)
												: undefined;
											const minDurationMin = String(unitForm.minDurationMin).trim()
												? Number(unitForm.minDurationMin)
												: undefined;
											const maxDurationMin = String(unitForm.maxDurationMin).trim()
												? Number(unitForm.maxDurationMin)
												: undefined;
											const slotStepMin = String(unitForm.slotStepMin).trim()
												? Number(unitForm.slotStepMin)
												: undefined;

											createUnitMutation.mutate({
												name: unitForm.name.trim(),
												unitType: unitForm.unitType.trim(),
												capacity: Number.isNaN(capacity)
													? undefined
													: capacity,
												minDurationMin: Number.isNaN(minDurationMin)
													? undefined
													: minDurationMin,
												maxDurationMin: Number.isNaN(maxDurationMin)
													? undefined
													: maxDurationMin,
												slotStepMin: Number.isNaN(slotStepMin)
													? undefined
													: slotStepMin,
											});
										}}
									>
										Add unit
									</Button>

									{createUnitMutation.isError && (
										<Typography variant="body2" color="error">
											Failed to add unit. Try again.
										</Typography>
									)}
								</Stack>
								<Divider />
							</Stack>
						)}

						{venue.units.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								No units yet.
							</Typography>
						) : (
							<Stack spacing={1}>
								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns:
											'minmax(160px, 1.4fr) minmax(120px, 0.8fr) minmax(80px, 0.6fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(140px, 1fr)',
										gap: 1,
										px: 1,
										color: 'text.secondary',
									}}
								>
									<Typography variant="caption" noWrap>
										Name
									</Typography>
									<Typography variant="caption" noWrap>
										Type
									</Typography>
									<Typography variant="caption" noWrap align="right">
										Capacity
									</Typography>
									<Typography variant="caption" noWrap align="right">
										Min duration
									</Typography>
									<Typography variant="caption" noWrap align="right">
										Max duration
									</Typography>
									<Typography variant="caption" noWrap align="right">
										Slot step
									</Typography>
									<Typography variant="caption" noWrap align="right">
										Actions
									</Typography>
								</Box>

								{venue.units.map((unit) => (
									<Paper key={unit.id} variant="outlined" sx={{ p: 1.5 }}>
										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns:
													'minmax(160px, 1.4fr) minmax(120px, 0.8fr) minmax(80px, 0.6fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr) minmax(90px, 0.6fr) minmax(140px, 1fr)',
												gap: 1,
												alignItems: 'center',
											}}
										>
											{editingUnitId === unit.id ? (
												<>
													<TextField
														size="small"
														value={editingUnitForm.name}
														onChange={(e) =>
															setEditingUnitForm((prev) => ({
																...prev,
																name: e.target.value,
															}))
														}
													/>
													<TextField
														size="small"
														value={editingUnitForm.unitType}
														onChange={(e) =>
															setEditingUnitForm((prev) => ({
																...prev,
																unitType: e.target.value,
															}))
														}
													/>
													<TextField
														size="small"
														value={editingUnitForm.capacity}
														onChange={(e) =>
															setEditingUnitForm((prev) => ({
																...prev,
																capacity: e.target.value,
															}))
														}
													/>
													<TextField
														size="small"
														select
														value={editingUnitForm.minDurationMin}
														onChange={(e) =>
															setEditingUnitForm((prev) => ({
																...prev,
																minDurationMin: e.target.value,
															}))
														}
													>
														{[30, 45, 60, 90, 120, 150, 180].map((val) => (
															<MenuItem key={val} value={val}>
																{val}
															</MenuItem>
														))}
														<MenuItem value="">No min</MenuItem>
													</TextField>
													<TextField
														size="small"
														select
														value={editingUnitForm.maxDurationMin}
														onChange={(e) =>
															setEditingUnitForm((prev) => ({
																...prev,
																maxDurationMin: e.target.value,
															}))
														}
													>
														{[30, 45, 60, 90, 120, 150, 180].map((val) => (
															<MenuItem key={val} value={val}>
																{val}
															</MenuItem>
														))}
														<MenuItem value="">No max</MenuItem>
													</TextField>
													<TextField
														size="small"
														select
														value={editingUnitForm.slotStepMin}
														onChange={(e) =>
															setEditingUnitForm((prev) => ({
																...prev,
																slotStepMin: e.target.value,
															}))
														}
													>
														{[15, 30, 45, 60].map((val) => (
															<MenuItem key={val} value={val}>
																{val}
															</MenuItem>
														))}
														<MenuItem value="">No step</MenuItem>
													</TextField>
												</>
											) : (
												<>
													<Typography fontWeight={700} noWrap>
														{unit.name}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
														noWrap
													>
														{unit.unitType}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
														align="right"
													>
														{unit.capacity ?? '—'}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
														align="right"
													>
														{unit.minDurationMin ?? '—'}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
														align="right"
													>
														{unit.maxDurationMin ?? '—'}
													</Typography>
													<Typography
														variant="body2"
														color="text.secondary"
														align="right"
													>
														{unit.slotStepMin ?? '—'}
													</Typography>
												</>
											)}
											<Stack direction="row" spacing={1} justifyContent="flex-end">
												{isOwner && editingUnitId === unit.id && (
													<>
														<Button
															size="small"
															variant="contained"
															disabled={updateUnitMutation.isPending}
															onClick={() => {
																const capacity = editingUnitForm.capacity.trim()
																	? Number(editingUnitForm.capacity)
																	: undefined;
																const minDurationMin =
																	editingUnitForm.minDurationMin.trim()
																		? Number(editingUnitForm.minDurationMin)
																		: undefined;
																const maxDurationMin =
																	editingUnitForm.maxDurationMin.trim()
																		? Number(editingUnitForm.maxDurationMin)
																		: undefined;
																const slotStepMin =
																	editingUnitForm.slotStepMin.trim()
																		? Number(editingUnitForm.slotStepMin)
																		: undefined;

																updateUnitMutation.mutate({
																	unitId: unit.id,
																	data: {
																		name: editingUnitForm.name.trim(),
																		unitType: editingUnitForm.unitType.trim(),
																		capacity: Number.isNaN(capacity)
																			? undefined
																			: capacity,
																		minDurationMin: Number.isNaN(minDurationMin)
																			? undefined
																			: minDurationMin,
																		maxDurationMin: Number.isNaN(maxDurationMin)
																			? undefined
																			: maxDurationMin,
																		slotStepMin: Number.isNaN(slotStepMin)
																			? undefined
																			: slotStepMin,
																	},
																});
															}}
														>
															Save
														</Button>
														<Button
															size="small"
															onClick={() => setEditingUnitId(null)}
														>
															Cancel
														</Button>
													</>
												)}
												{isOwner && editingUnitId !== unit.id && (
													<>
														<Button
															size="small"
															onClick={() => {
																setEditingUnitId(unit.id);
																setEditingUnitForm({
																	name: unit.name,
																	unitType: unit.unitType,
																	capacity: String(unit.capacity ?? ''),
																	minDurationMin: String(
																		unit.minDurationMin ?? '',
																	),
																	maxDurationMin: String(
																		unit.maxDurationMin ?? '',
																	),
																	slotStepMin: String(
																		unit.slotStepMin ?? '',
																	),
																});
															}}
														>
															Edit
														</Button>
														<Button
															size="small"
															color="error"
															disabled={deleteUnitMutation.isPending}
															onClick={() => setDeleteUnitId(unit.id)}
														>
															Delete
														</Button>
													</>
												)}
												{!isOwner && (
													<Button
														size="small"
														variant="contained"
														onClick={() => {
															setSelectedUnitId(unit.id);
															setBookingDialogOpen(true);
														}}
													>
														Reserve
													</Button>
												)}
											</Stack>
										</Box>
									</Paper>
								))}
							</Stack>
						)}
				</Paper>

				<Paper
					variant="outlined"
					sx={{
						p: 2,
						borderRadius: 2,
						...(isOwner ? {} : { gridColumn: '1 / -1' }),
					}}
				>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						justifyContent="space-between"
						alignItems={{ md: 'center' }}
						spacing={1}
					>
						<Typography fontWeight={800}>Offerings</Typography>
							<Typography variant="body2" color="text.secondary">
								{venue.offerings.length} total
							</Typography>
						</Stack>

						<Divider sx={{ my: 2 }} />

						{isOwner && (
							<Stack spacing={2} sx={{ mb: 2 }}>
								<Typography fontWeight={700}>Add offering</Typography>
								<Stack
									direction={{ xs: 'column', md: 'row' }}
									spacing={2}
								>
									<TextField
										select
										label="Unit"
										value={offeringForm.unitId}
										onChange={(e) =>
											setOfferingForm((prev) => ({
												...prev,
												unitId: e.target.value,
											}))
										}
										size="small"
										sx={{ minWidth: 140 }}
									>
										{units.map((u) => (
											<MenuItem key={u.id} value={u.id}>
												{u.name}
											</MenuItem>
										))}
									</TextField>
									<TextField
										label="Name"
										value={offeringForm.name}
										onChange={(e) =>
											setOfferingForm((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										fullWidth
									/>
									<TextField
										select
										label="Duration (min)"
										value={offeringForm.durationMin}
										onChange={(e) =>
											setOfferingForm((prev) => ({
												...prev,
												durationMin: e.target.value,
											}))
										}
										fullWidth
									>
										{getDurationOptionsForUnit(
											units.find((u) => u.id === offeringForm.unitId),
										).map((val) => (
											<MenuItem key={val} value={val}>
												{val}
											</MenuItem>
										))}
									</TextField>
									<TextField
										label="Price (RSD)"
										type="number"
										value={offeringForm.price}
										onChange={(e) =>
											setOfferingForm((prev) => ({
												...prev,
												price: e.target.value,
											}))
										}
										fullWidth
									/>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="center">
									<Button
										variant="contained"
										disabled={!canAddOffering || createOfferingMutation.isPending}
										onClick={() => {
											const durationMin = String(
												offeringForm.durationMin,
											).trim()
												? Number(offeringForm.durationMin)
												: NaN;
											const price = String(offeringForm.price).trim()
												? Number(offeringForm.price)
												: undefined;

											if (
												!offeringForm.unitId ||
												!offeringForm.name.trim() ||
												Number.isNaN(durationMin)
											) {
												setOfferingToast({
													message: 'Please select unit, name and duration',
													severity: 'error',
												});
												return;
											}

											createOfferingMutation.mutate({
												unitId: offeringForm.unitId,
												name: offeringForm.name.trim(),
												durationMin,
												price: Number.isNaN(price) ? undefined : price,
											});
										}}
									>
										Add offering
									</Button>
								</Stack>
								<Divider />
							</Stack>
						)}

						{venue.offerings.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								No offerings yet.
							</Typography>
						) : (
							<TableContainer
								sx={{
									'& .MuiTableCell-root': { border: 'none' },
								}}
							>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
											<TableCell align="right" sx={{ fontWeight: 700 }}>Duration</TableCell>
											<TableCell align="right" sx={{ fontWeight: 700 }}>Price</TableCell>
											{isOwner && (
												<TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
											)}
										</TableRow>
									</TableHead>
									<TableBody>
								{venue.offerings.map((offering) => (
									<TableRow key={offering.id}>
											{editingOfferingId === offering.id ? (
												<>
													<TableCell>
														<TextField
															size="small"
															value={editingOfferingForm.name}
															onChange={(e) =>
																setEditingOfferingForm((prev) => ({
																	...prev,
																	name: e.target.value,
																}))
															}
														/>
													</TableCell>
													<TableCell align="right">
														<TextField
															size="small"
															select
															value={editingOfferingForm.durationMin}
															onChange={(e) =>
																setEditingOfferingForm((prev) => ({
																	...prev,
																	durationMin: e.target.value,
																}))
															}
															sx={{ minWidth: 80 }}
														>
															{getDurationOptionsForUnit(
																units.find(
																	(u) => u.id === editingOfferingForm.unitId,
																),
															).map((val) => (
																<MenuItem key={val} value={val}>
																	{val}
																</MenuItem>
															))}
														</TextField>
													</TableCell>
													<TableCell align="right">
														<TextField
															size="small"
															type="number"
															value={editingOfferingForm.price}
															onChange={(e) =>
																setEditingOfferingForm((prev) => ({
																	...prev,
																	price: e.target.value,
																}))
															}
															sx={{ width: 100 }}
														/>
													</TableCell>
													{isOwner && (
														<TableCell align="right">
															<Stack direction="row" spacing={1} justifyContent="flex-end">
																<Button
																	size="small"
																	variant="contained"
																	disabled={updateOfferingMutation.isPending}
																	onClick={() => {
																		const durationMin = String(
																			editingOfferingForm.durationMin,
																		).trim()
																			? Number(editingOfferingForm.durationMin)
																			: NaN;
																		const price = String(
																			editingOfferingForm.price,
																		).trim()
																			? Number(editingOfferingForm.price)
																			: undefined;

																		if (
																			!editingOfferingForm.name.trim() ||
																			Number.isNaN(durationMin)
																		) {
																			setOfferingToast({
																				message: 'Please fill name and duration',
																				severity: 'error',
																			});
																			return;
																		}

																		updateOfferingMutation.mutate({
																			offeringId: offering.id,
																			data: {
																				name: editingOfferingForm.name.trim(),
																				durationMin,
																				price: Number.isNaN(price)
																					? undefined
																					: price,
																			},
																		});
																	}}
																>
																	Save
																</Button>
																<Button
																	size="small"
																	onClick={() => setEditingOfferingId(null)}
																>
																	Cancel
																</Button>
															</Stack>
														</TableCell>
													)}
												</>
											) : (
												<>
													<TableCell>
														<Typography fontWeight={700} noWrap>
															{offering.name}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" color="text.secondary">
															{offering.durationMin} min
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" color="text.secondary">
															{offering.price != null ? `${offering.price} RSD` : '—'}
														</Typography>
													</TableCell>
													{isOwner && (
														<TableCell align="right">
															<Stack direction="row" spacing={1} justifyContent="flex-end">
																<Button
																	size="small"
																	onClick={() => {
																		setEditingOfferingId(offering.id);
																		setEditingOfferingForm({
																			unitId: offering.unitId ?? '',
																			name: offering.name,
																			durationMin: String(offering.durationMin),
																			price:
																				offering.price != null
																					? String(offering.price)
																					: '',
																		});
																	}}
																>
																	Edit
																</Button>
																<Button
																	size="small"
																	color="error"
																	disabled={deleteOfferingMutation.isPending}
																	onClick={() => setDeleteOfferingId(offering.id)}
																>
																	Delete
																</Button>
															</Stack>
														</TableCell>
													)}
												</>
											)}
									</TableRow>
								))}
									</TableBody>
								</Table>
							</TableContainer>
						)}
				</Paper>
				</Box>

				{isOwner && (
					<Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
						<Stack spacing={2}>
							<Stack
								direction={{ xs: 'column', md: 'row' }}
								justifyContent="space-between"
								alignItems={{ md: 'center' }}
								spacing={1}
							>
								<Typography fontWeight={800}>Blocks</Typography>
								<Typography variant="body2" color="text.secondary">
									Temporarily block units for maintenance or outages.
								</Typography>
							</Stack>

							<Stack
								direction={{ xs: 'column', md: 'row' }}
								spacing={2}
								alignItems={{ md: 'center' }}
							>
								<Select
									value={blockUnitId}
									onChange={(e) => setBlockUnitId(String(e.target.value))}
									sx={{ minWidth: 220 }}
									displayEmpty
								>
									<MenuItem value="all">All units</MenuItem>
									{venue.units.map((unit) => (
										<MenuItem key={unit.id} value={unit.id}>
											{unit.name}
										</MenuItem>
									))}
								</Select>

								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<DatePicker
										label="Date"
										value={blockDate}
										onChange={(value) => setBlockDate(value)}
										slotProps={{ textField: { size: 'small' } }}
									/>
									<TimePicker
										label="Start"
										ampm={false}
										value={blockStart}
										onChange={(value) => setBlockStart(value)}
										slotProps={{
											textField: { size: 'small', sx: { width: 140 } },
										}}
									/>
									<TimePicker
										label="End"
										ampm={false}
										value={blockEnd}
										onChange={(value) => setBlockEnd(value)}
										slotProps={{
											textField: { size: 'small', sx: { width: 140 } },
										}}
									/>
								</LocalizationProvider>
							</Stack>

							<TextField
								label="Reason (optional)"
								value={blockReason}
								onChange={(e) => setBlockReason(e.target.value)}
								fullWidth
							/>

							<Stack direction="row" spacing={1} alignItems="center">
								<Button
									variant="contained"
									disabled={!canCreateBlock || createBlocksMutation.isPending}
									onClick={() => {
										if (!blockDate || !blockStart || !blockEnd) return;
										const date = blockDate.format('YYYY-MM-DD');
										const targets =
											blockUnitId === 'all'
												? venue.units.map((unit) => unit.id)
												: [blockUnitId];
										createBlocksMutation.mutate(
											targets.map((unitId) => ({
												unitId,
												startAt: `${date}T${blockStart.format('HH:mm')}:00`,
												endAt: `${date}T${blockEnd.format('HH:mm')}:00`,
												reason: blockReason.trim() || undefined,
											})),
										);
									}}
								>
									Add block
								</Button>
								{blockError && (
									<Typography variant="body2" color="error">
										{blockError}
									</Typography>
								)}
							</Stack>

							<Divider />

							<Stack spacing={1}>
								<Typography fontWeight={700}>
									Blocks for {blockDateParam}
								</Typography>
								{!blocksForDay.length ? (
									<Typography variant="body2" color="text.secondary">
										No blocks for this day.
									</Typography>
								) : (
									blocksForDay.map((block) => {
										const unitName =
											venue.units.find((u) => u.id === block.unitId)?.name ??
											'Unit';
										return (
											<Stack
												key={block.id}
												direction="row"
												justifyContent="space-between"
												alignItems="center"
												spacing={1}
											>
												<Typography variant="body2">
													{unitName} •{' '}
													{dayjs(block.startAt).format('HH:mm')}-
													{dayjs(block.endAt).format('HH:mm')}
													{block.reason ? ` • ${block.reason}` : ''}
												</Typography>
											</Stack>
										);
									})
								)}
							</Stack>
						</Stack>
					</Paper>
				)}
			</Stack>
		</Box>
	);
}

function formatDay(day: number) {
	const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	return map[day] ?? String(day);
}

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

function generateSlots(
	schedule: { startTime: string; endTime: string }[],
	stepMin: number,
	durationMin: number,
) {
	if (!schedule.length || stepMin <= 0 || durationMin <= 0) return [];

	const slots = new Set<string>();

	for (const entry of schedule) {
		const start = toMinutes(entry.startTime);
		const end = toMinutes(entry.endTime);
		if (Number.isNaN(start) || Number.isNaN(end) || end <= start) continue;

		for (let t = start; t + durationMin <= end; t += stepMin) {
			const slot = fromMinutes(t);
			slots.add(slot);
		}
	}

	return Array.from(slots).sort((a, b) => a.localeCompare(b));
}

function isSlotBooked(
	bookings: BookingSlot[],
	date: string,
	slot: string,
	durationMin: number,
) {
	const slotStart = new Date(`${date}T${slot}:00`);
	const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

	return bookings.some((booking) => {
		const start = new Date(booking.startAt);
		const end = new Date(booking.endAt);
		return start < slotEnd && end > slotStart;
	});
}

function isSlotBlocked(
	blocks: BlockSlot[],
	date: string,
	slot: string,
	durationMin: number,
) {
	const slotStart = new Date(`${date}T${slot}:00`);
	const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

	return blocks.find((block) => {
		const start = new Date(block.startAt);
		const end = new Date(block.endAt);
		return start < slotEnd && end > slotStart;
	});
}

function toMinutes(time: string) {
	const [h, m] = time.split(':').map((v) => Number(v));
	if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
	return h * 60 + m;
}

function fromMinutes(total: number) {
	const h = Math.floor(total / 60)
		.toString()
		.padStart(2, '0');
	const m = (total % 60).toString().padStart(2, '0');
	return `${h}:${m}`;
}
