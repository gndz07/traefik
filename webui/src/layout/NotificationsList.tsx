import { Bubble, Button, Card, Flex, Text, Skeleton as FaencySkeleton, Grid } from '@traefiklabs/faency'
import { DateTime } from 'luxon'
import { useCallback, useMemo } from 'react'
import { FiX } from 'react-icons/fi'
import { mutate } from 'swr'

import useLazyFetch from 'hooks/use-lazy-fetch'

type NotificationCardProps = {
  notification: SystemNotification
}

const NotificationCard = ({ notification }: NotificationCardProps) => {
  const relativeDate = useMemo(
    () => DateTime.fromJSDate(new Date(notification.createdAt)).toRelative(),
    [notification.createdAt],
  )

  const [clearNotification] = useLazyFetch('/notifications', { method: 'POST' })

  const handleClear = useCallback(async () => {
    await clearNotification({
      body: JSON.stringify({ notificationIds: [notification.id] }),
    })
    await mutate('/notifications')
  }, [clearNotification, notification.id])

  const bubbleVariant = useMemo(() => {
    switch (notification.type) {
      case 'error':
        return 'red'
      case 'success':
        return 'green'
      case 'info':
      default:
        return 'gray'
    }
  }, [notification.type])

  return (
    <Card>
      <Flex gap={2} direction="column" css={{ flex: 1 }}>
        <Grid columns="2" css={{ gridTemplateColumns: '20px 1fr 20px' }}>
          <Flex css={{ ai: 'center', gap: '$2' }}>
            <Bubble noAnimation variant={bubbleVariant} css={{ mb: 2 }} />
          </Flex>
          <Text>{notification.message}</Text>
          <Button
            ghost
            onClick={handleClear}
            variant="secondary"
            size="small"
            css={{
              py: '$1',
              px: '$2',
              boxShadow: 'none',
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          >
            <FiX size={14} />
          </Button>
        </Grid>
        <Flex justify="between">
          <Text size={1} variant="subtle">
            {relativeDate}
          </Text>
        </Flex>
      </Flex>
    </Card>
  )
}

const CardSkeleton = () => (
  <Card css={{ position: 'relative', p: 0, height: 66 }}>
    <FaencySkeleton variant="square" css={{ width: '100%', height: '100%' }} />
  </Card>
)

type NotificationListProps = {
  notifications: SystemNotification[]
}

const NotificationList = ({ notifications }: NotificationListProps) => (
  <Flex
    gap={2}
    direction="column"
    css={{
      maxHeight: '600px',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: '$colors$grayA8 transparent',
    }}
  >
    {notifications.map((n) => (
      <NotificationCard key={n.id} notification={n} />
    ))}
  </Flex>
)

export const Skeleton = () => (
  <Flex
    gap={2}
    direction="column"
    css={{
      maxHeight: '600px',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: '$colors$grayA8 transparent',
    }}
  >
    <CardSkeleton />
    <CardSkeleton />
    <CardSkeleton />
  </Flex>
)

export default NotificationList
