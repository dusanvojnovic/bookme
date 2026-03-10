import NotificationsIcon from '@mui/icons-material/Notifications';
import {
	Badge,
	Box,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Popover,
	Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { api } from '../../api/api';
import { useAuthStore } from '../../store/auth.store';

type Notification = {
	id: string;
	type: string;
	title: string;
	body: string | null;
	readAt: string | null;
	venueId: string | null;
	bookingId: string | null;
	createdAt: string;
};

async function fetchUnreadCount(token: string) {
	const res = await api.get<{ count: number }>('/notifications/unread-count', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data.count;
}

async function fetchNotifications(token: string) {
	const res = await api.get<Notification[]>('/notifications', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return res.data;
}

async function markAllRead(token: string) {
	await api.patch('/notifications/read-all', null, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

async function markAsRead(token: string, id: string) {
	await api.patch(`/notifications/${id}/read`, null, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

export function NotificationBell() {
	const token = useAuthStore((s) => s.token);
	const queryClient = useQueryClient();
	const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

	const { data: count = 0 } = useQuery({
		queryKey: ['notifications-unread', token],
		queryFn: () => fetchUnreadCount(token!),
		enabled: !!token,
		refetchInterval: 60_000,
		retry: false,
	});

	const { data: notifications = [], isLoading, isError } = useQuery({
		queryKey: ['notifications', token],
		queryFn: () => fetchNotifications(token!),
		enabled: !!token && !!anchor,
		retry: false,
	});

	const markAllMutation = useMutation({
		mutationFn: () => markAllRead(token!),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});

	const markReadMutation = useMutation({
		mutationFn: (id: string) => markAsRead(token!, id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});

	const open = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
	const close = () => setAnchor(null);

	const handleNotificationClick = (n: Notification) => {
		if (!n.readAt) {
			markReadMutation.mutate(n.id);
		}
	};

	return (
		<>
			<IconButton
				color="inherit"
				onClick={open}
				aria-label="notifications"
			>
				<Badge badgeContent={count} color="error">
					<NotificationsIcon />
				</Badge>
			</IconButton>
			<Popover
				open={!!anchor}
				anchorEl={anchor}
				onClose={close}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Box sx={{ width: 360, maxHeight: 400 }}>
					<Box
						sx={{
							px: 2,
							py: 1.5,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							borderBottom: 1,
							borderColor: 'divider',
						}}
					>
						<Typography variant="subtitle1" fontWeight={600}>
							Notifications
						</Typography>
						{count > 0 && (
							<Typography
								variant="caption"
								component="button"
								onClick={() => markAllMutation.mutate()}
								sx={{
									cursor: 'pointer',
									color: 'primary.main',
									background: 'none',
									border: 'none',
								}}
							>
								Mark all as read
							</Typography>
						)}
					</Box>
					<List sx={{ maxHeight: 320, overflow: 'auto' }}>
						{isLoading ? (
							<ListItem>
								<ListItemText primary="Loading..." />
							</ListItem>
						) : isError ? (
							<ListItem>
								<ListItemText primary="Failed to load notifications" />
							</ListItem>
						) : notifications.length === 0 ? (
							<ListItem>
								<ListItemText primary="No notifications" />
							</ListItem>
						) : (
							notifications.map((n) => (
								<ListItemButton
									key={n.id}
									onClick={() => handleNotificationClick(n)}
									sx={{
										bgcolor: n.readAt ? 'transparent' : 'action.hover',
										borderBottom: 1,
										borderColor: 'divider',
										cursor: 'pointer',
									}}
								>
									<ListItemText
										primary={n.title}
										secondary={
											<>
												{n.body && (
													<Typography variant="body2" color="text.secondary">
														{n.body}
													</Typography>
												)}
												<Typography variant="caption" color="text.disabled">
													{new Date(n.createdAt).toLocaleString('en-US')}
												</Typography>
											</>
										}
									/>
								</ListItemButton>
							))
						)}
					</List>
				</Box>
			</Popover>
		</>
	);
}
