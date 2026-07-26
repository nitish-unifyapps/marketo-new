import { useEffect, useRef } from 'react'
import { WireframeIcon } from '../common/WireframeIcon'

type CreateOption = string

interface TopBarProps {
  sectionName: string
  createMenuOpen: boolean
  onToggleCreateMenu: () => void
  onCloseCreateMenu: () => void
  onCreateSelect: (value: CreateOption) => void
  createOptions?: readonly string[]
  createLabel?: string
  onPrimaryCreate?: () => void
  hideCreate?: boolean
}

export function TopBar({
  sectionName,
  createMenuOpen,
  onToggleCreateMenu,
  onCloseCreateMenu,
  onCreateSelect,
  createOptions = ['New Person', 'New Smart List', 'New Account'],
  createLabel = 'Create New',
  onPrimaryCreate,
  hideCreate = false,
}: TopBarProps) {
  const createMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!createMenuRef.current?.contains(event.target as Node)) {
        onCloseCreateMenu()
      }
    }

    if (createMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [createMenuOpen, onCloseCreateMenu])

  return (
    <header className='topBar'>
      <h1 className='sectionTitle'>{sectionName}</h1>

      <label className='searchInputWrap'>
        <WireframeIcon name='search' className='iconSmall muted' />
        <input
          type='text'
          className='searchInput'
          placeholder='Search people, content, journeys...'
          aria-label='Global search'
        />
      </label>

      {!hideCreate && <div className='createWrap' ref={createMenuRef}>
        <button className='button solid' type='button' onClick={onPrimaryCreate ?? onToggleCreateMenu}>
          {createLabel}
          {!onPrimaryCreate && <WireframeIcon name='chevron-down' className='iconSmall' />}
        </button>

        {!onPrimaryCreate && createMenuOpen && (
          <div className='menuDropdown' role='menu' aria-label='Create new menu'>
            {createOptions.map((option) => (
              <button
                key={option}
                type='button'
                role='menuitem'
                className='menuItem'
                onClick={() => onCreateSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>}
    </header>
  )
}

export type { CreateOption }
