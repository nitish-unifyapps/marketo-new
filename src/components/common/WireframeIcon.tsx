type IconName =
  | 'crm'
  | 'content'
  | 'execution'
  | 'programs'
  | 'campaigns'
  | 'journeys'
  | 'analytics'
  | 'integrations'
  | 'calendar'
  | 'admin'
  | 'search'
  | 'chevron-down'
  | 'profile'
  | 'activity'
  | 'membership'
  | 'consent'
  | 'email-open'
  | 'form-fill'
  | 'page-visit'
  | 'webinar'
  | 'gear'
  | 'drag'
  | 'edit'
  | 'clone'
  | 'delete'
  | 'plus'

interface WireframeIconProps {
  name: IconName
  className?: string
}

export function WireframeIcon({ name, className }: WireframeIconProps) {
  const shared = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'crm':
      return (
        <svg {...shared}>
          <rect x='3' y='4' width='7' height='7' rx='1.5' />
          <rect x='14' y='4' width='7' height='7' rx='1.5' />
          <rect x='3' y='13' width='7' height='7' rx='1.5' />
          <path d='M14 16.5h7M17.5 13v7' />
        </svg>
      )
    case 'content':
      return (
        <svg {...shared}>
          <path d='M4 5.5A2.5 2.5 0 0 1 6.5 3H11l2 2h4.5A2.5 2.5 0 0 1 20 7.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z' />
          <path d='M8 10h8M8 14h5' />
        </svg>
      )
    case 'execution':
      return (
        <svg {...shared}>
          <circle cx='6' cy='6' r='2.5' />
          <circle cx='18' cy='12' r='2.5' />
          <circle cx='6' cy='18' r='2.5' />
          <path d='M8.5 6h2.7a4 4 0 0 1 4 4v0M8.5 18h2.7a4 4 0 0 0 4-4v0' />
        </svg>
      )
    case 'programs':
      return (
        <svg {...shared}>
          <rect x='3' y='7' width='18' height='13' rx='2.5' />
          <path d='M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2' />
        </svg>
      )
    case 'campaigns':
      return (
        <svg {...shared}>
          <path d='M4 9h12l4-3v12l-4-3H4z' />
          <path d='M8 15.5a3.5 3.5 0 0 0 0-7' />
        </svg>
      )
    case 'journeys':
      return (
        <svg {...shared}>
          <circle cx='6' cy='6' r='2.5' />
          <circle cx='18' cy='18' r='2.5' />
          <circle cx='6' cy='18' r='2.5' />
          <path d='M8.5 6H15a3 3 0 0 1 3 3v6.5M8.5 18h5.5' />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...shared}>
          <path d='M4 20V6M10 20V10M16 20V13M22 20V4' />
        </svg>
      )
    case 'integrations':
      return (
        <svg {...shared}>
          <path d='M8 8 5.5 5.5M16 16l2.5 2.5M15 5l4 4-4 4M9 19l-4-4 4-4' />
          <path d='M13 7h2a4 4 0 0 1 4 4v2M11 17H9a4 4 0 0 1-4-4v-2' />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x='3' y='5' width='18' height='16' rx='2.5' />
          <path d='M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 17h2' />
        </svg>
      )
    case 'admin':
      return (
        <svg {...shared}>
          <path d='M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6z' />
          <circle cx='12' cy='10' r='2.2' />
          <path d='M8.5 16a4 4 0 0 1 7 0' />
        </svg>
      )
    case 'search':
      return (
        <svg {...shared}>
          <circle cx='11' cy='11' r='7' />
          <path d='m20 20-3.6-3.6' />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg {...shared}>
          <path d='m6 9 6 6 6-6' />
        </svg>
      )
    case 'profile':
      return (
        <svg {...shared}>
          <circle cx='12' cy='8' r='3.2' />
          <path d='M5 19a7 7 0 0 1 14 0' />
        </svg>
      )
    case 'activity':
      return (
        <svg {...shared}>
          <path d='M3 13h4l2.5-5 5 10 2.5-5H21' />
        </svg>
      )
    case 'membership':
      return (
        <svg {...shared}>
          <rect x='3' y='4' width='18' height='16' rx='2.5' />
          <path d='M3 10h18M8 4v16' />
        </svg>
      )
    case 'consent':
      return (
        <svg {...shared}>
          <path d='M4 12.5 9 17l11-10' />
          <rect x='3' y='3' width='18' height='18' rx='4' />
        </svg>
      )
    case 'email-open':
      return (
        <svg {...shared}>
          <path d='M3.5 7.5 12 13l8.5-5.5' />
          <rect x='3.5' y='6' width='17' height='12' rx='2.5' />
        </svg>
      )
    case 'form-fill':
      return (
        <svg {...shared}>
          <rect x='5' y='4' width='14' height='16' rx='2.5' />
          <path d='M8.5 9.5h7M8.5 13h7M8.5 16.5h4.5' />
        </svg>
      )
    case 'page-visit':
      return (
        <svg {...shared}>
          <path d='M4 5h16v14H4z' />
          <path d='m4 9 4-3 4 3 4-3 4 3' />
        </svg>
      )
    case 'webinar':
      return (
        <svg {...shared}>
          <rect x='4' y='4' width='16' height='13' rx='2.5' />
          <path d='M10 20h4M12 17v3' />
        </svg>
      )
    case 'gear':
      return (
        <svg {...shared}>
          <circle cx='12' cy='12' r='3' />
          <path d='M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.8-1L14 3h-4l-.7 2a7 7 0 0 0-1.8 1L5.1 5l-2 3.4L5 10a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.8 1L10 21h4l.7-2a7 7 0 0 0 1.8-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.6.1-1Z' />
        </svg>
      )
    case 'drag':
      return (
        <svg {...shared}>
          <circle cx='8' cy='8' r='1' />
          <circle cx='8' cy='12' r='1' />
          <circle cx='8' cy='16' r='1' />
          <circle cx='14' cy='8' r='1' />
          <circle cx='14' cy='12' r='1' />
          <circle cx='14' cy='16' r='1' />
        </svg>
      )
    case 'edit':
      return (
        <svg {...shared}>
          <path d='m4 20 4.5-1 9-9-3.5-3.5-9 9L4 20Z' />
          <path d='m12.8 6.7 3.5 3.5' />
        </svg>
      )
    case 'clone':
      return (
        <svg {...shared}>
          <rect x='7' y='7' width='11' height='11' rx='2.5' />
          <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
        </svg>
      )
    case 'delete':
      return (
        <svg {...shared}>
          <path d='M4 7h16M9 7V4h6v3M7.5 7 8.2 20h7.6l.7-13' />
        </svg>
      )
    case 'plus':
      return (
        <svg {...shared}>
          <path d='M12 5v14M5 12h14' />
        </svg>
      )
    default:
      return null
  }
}
