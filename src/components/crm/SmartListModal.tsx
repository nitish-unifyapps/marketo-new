import { useState } from 'react'
import { initialConditionRows } from '../../data/crmData'
import type { ConditionRow } from '../../types/crm'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'

interface SmartListModalProps {
  open: boolean
  onClose: () => void
}

export function SmartListModal({ open, onClose }: SmartListModalProps) {
  const [conditions, setConditions] = useState<ConditionRow[]>(initialConditionRows)
  const [listName, setListName] = useState('')
  const [description, setDescription] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)

  function updateCondition(
    id: string,
    field: 'field' | 'operator' | 'value',
    value: string,
  ) {
    setConditions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  function addGroup(type: 'AND' | 'OR') {
    const id = `c-${Date.now()}`
    setConditions((prev) => [
      ...prev,
      {
        id,
        field: 'Lifecycle Stage',
        operator: 'is',
        value: type === 'AND' ? 'MQL' : 'SQL',
        groupType: type,
      },
    ])
  }

  return (
    <Modal title='New Smart List' open={open} onClose={onClose}>
      <div className='modalContent'>
        <div className='modalIntro'>
          <label className='modalField'>
            Smart List Name
            <input
              type='text'
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder='e.g. High Intent Accounts'
              autoFocus
            />
          </label>
          <label className='modalField'>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder='Describe this audience segment...'
            />
          </label>
        </div>

        <div className='queryBuilder'>
          <h4>Query Builder</h4>

          <div className='conditionList'>
            {conditions.map((condition) => (
              <div key={condition.id} className='conditionRow' draggable>
                <WireframeIcon name='drag' className='iconTiny muted' />
                <span className='groupTag'>{condition.groupType}</span>

                <select
                  value={condition.field}
                  onChange={(event) =>
                    updateCondition(condition.id, 'field', event.target.value)
                  }
                >
                  <option>Lifecycle Stage</option>
                  <option>Score</option>
                  <option>Industry</option>
                  <option>Last Activity</option>
                </select>

                <select
                  value={condition.operator}
                  onChange={(event) =>
                    updateCondition(condition.id, 'operator', event.target.value)
                  }
                >
                  <option>is</option>
                  <option>is not</option>
                  <option>greater than</option>
                  <option>contains</option>
                </select>

                <input
                  type='text'
                  value={condition.value}
                  onChange={(event) =>
                    updateCondition(condition.id, 'value', event.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <div className='groupActions'>
            <button
              type='button'
              className='button outline accent'
              onClick={() => addGroup('AND')}
            >
              Add AND Group
            </button>
            <button
              type='button'
              className='button outline accent'
              onClick={() => addGroup('OR')}
            >
              Add OR Group
            </button>
            <button
              type='button'
              className='button outline accent'
              onClick={() => setPreviewCount(284 + conditions.length * 17)}
            >
              Preview member count
            </button>
            {previewCount !== null && (
              <span className='previewCount'>{previewCount} matching people</span>
            )}
          </div>
        </div>

        <footer className='modalFooter'>
          <button type='button' className='button ghost' onClick={onClose}>
            Cancel
          </button>
          <button
            type='button'
            className='button solid'
            onClick={onClose}
            disabled={!listName.trim()}
          >
            Save
          </button>
        </footer>
      </div>
    </Modal>
  )
}
