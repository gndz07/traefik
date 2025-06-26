import {
  AccessibleIcon,
  Button,
  Flex,
  H2,
  styled,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPortal,
  Text,
} from '@traefiklabs/faency'
import { useCallback, useId, useMemo, useRef } from 'react'
import { FiBell, FiCheck } from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { useLocalStorage } from 'usehooks-ts'

import NotificationList from './NotificationsList'

import useLazyFetch from 'hooks/use-lazy-fetch'
import useMountEffect from 'hooks/use-mount-effect'

const NewNotificationBadge = styled(Flex, {
  position: 'absolute',
  borderRadius: 20,
  top: 4,
  right: 10,
  height: '$2',
  width: '$2',
  backgroundColor: '$red10',
})

const MarkAsReadButton = ({ notificationIds }: { notificationIds: string[] }) => {
  const [clearNotification] = useLazyFetch('/notifications', { method: 'POST' })

  const handleClearAll = useCallback(async () => {
    await clearNotification({
      body: JSON.stringify({ notificationIds }),
    })
    await mutate('/notifications')
  }, [clearNotification, notificationIds])

  return (
    <Button ghost variant="secondary" size="small" onClick={handleClearAll}>
      <FiCheck size={18} />
      <Text css={{ color: 'currentColor', ml: '$1' }} size="2">
        Mark all as read
      </Text>
    </Button>
  )
}

const Notifications = () => {
  const { pathname } = useLocation()
  const [lastNotificationId, setLastNotificationId] = useLocalStorage('last-notif-id', undefined)
  const popupTriggerRef = useRef<HTMLButtonElement>(null)
  const triggerId = useId()
  const { data: notifications } = useSWR('/notifications')

  const hasNotifications = useMemo(() => !!notifications?.length, [notifications])

  useMountEffect(() => {
    // open pop up only on dashboard
    if (pathname === '/' && notifications?.length) {
      const lastNotifId = notifications[0].id
      if (lastNotifId !== lastNotificationId) {
        popupTriggerRef.current?.click()
        setLastNotificationId(lastNotifId)
      }
    }
  }, [])

  return (
    <Flex>
      <Popover>
        <PopoverTrigger ref={popupTriggerRef} aria-controls={triggerId} asChild>
          <Button
            ghost
            css={{ px: '$2', color: '$buttonSecondaryText', position: 'relative' }}
            type="button"
            data-testid="notification-btn"
          >
            <NewNotificationBadge />
            <AccessibleIcon label="toggle notification list">
              <FiBell size={20} />
            </AccessibleIcon>
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            data-testid="notification-popup"
            css={{ p: '$3', width: '450px', maxWidth: '450px', bc: '$05dp', mr: '$4' }}
          >
            <Flex gap={3} direction="column">
              <Flex justify="between" align="end">
                <H2 css={{ fontSize: '$8' }}>Notifications ({notifications?.length})</H2>
                {hasNotifications && <MarkAsReadButton notificationIds={notifications?.map((notif) => notif.id)} />}
              </Flex>
              {hasNotifications ? (
                <NotificationList notifications={notifications} />
              ) : (
                <Text variant="subtle">No notifications to display</Text>
              )}
            </Flex>
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </Flex>
  )
}

export default Notifications
