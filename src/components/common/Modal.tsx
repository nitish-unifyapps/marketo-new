import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className='modalOverlay' role='presentation' onClick={onClose}>
      <div
        className='modalBody'
        role='dialog'
        aria-modal='true'
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className='modalHeader'>
          <h3>{title}</h3>
          <button type='button' className='iconButton subtle' onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}
