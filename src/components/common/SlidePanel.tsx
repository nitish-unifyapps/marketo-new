import type { ReactNode } from 'react'

interface SlidePanelProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function SlidePanel({ title, onClose, children }: SlidePanelProps) {
  return (
    <div className='panelOverlay' role='presentation' onClick={onClose}>
      <aside
        className='slidePanel'
        role='dialog'
        aria-modal='true'
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className='panelHeader'>
          <h3>{title}</h3>
          <button type='button' className='iconButton subtle' onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </aside>
    </div>
  )
}
