interface Window {
  APIUrl: string
}

declare namespace JSX {
  interface IntrinsicElements {
    'hub-button-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
  }
}

type SystemNotification = {
  id: string
  type: string
  message: string
  resource?: string
  resourceId?: string
  createdAt: Date
}
