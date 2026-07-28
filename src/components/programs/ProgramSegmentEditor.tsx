import { useRef, useState, type DragEvent } from 'react'
import { defaultSegmentForProgramType } from '../../data/programsData'
import type { ProgramRecord, ProgramSegmentCondition, ProgramSegmentConfig, ProgramSegmentGroup, ProgramSegmentMode, ProgramSegmentTrigger, ProgramTriggerType } from '../../types/programs'

interface ProgramSegmentEditorProps {
  program: ProgramRecord
  onChange: (segment: ProgramSegmentConfig) => void
}

const paletteCategories = [
  { name: 'Person Fields', icon: '♙', fields: ['Lifecycle Stage', 'Lead Score', 'Job Title', 'Country', 'Email Address', 'Person Owner'] },
  { name: 'Account Fields', icon: '▣', fields: ['Account Name', 'Industry', 'Annual Revenue', 'Employee Count', 'Account Tier'] },
  { name: 'Activity History', icon: '↻', fields: ['Visited Web Page', 'Opened Email', 'Clicked Link', 'Filled Out Form', 'Attended Event'] },
  { name: 'Smart List Membership', icon: '☷', fields: ['Member of Smart List', 'Not Member of Smart List'] },
  { name: 'Program Membership', icon: '◇', fields: ['Program Status', 'Member of Program', 'Acquired By Program'] },
]

const allFields = paletteCategories.flatMap((category) => category.fields)
const operators = ['is', 'is not', 'contains', 'does not contain', 'greater than', 'less than', 'in past']
const triggerTypes: ProgramTriggerType[] = ['Fills Out Form', 'Clicks Link in Email', 'Visits Web Page', 'Data Value Changes', 'Person Is Created', 'Added to Smart List']

const triggerSourceOptions: Partial<Record<ProgramTriggerType, string[]>> = {
  'Fills Out Registration Form': ['Event Registration Form', 'Partner Registration Form', 'VIP Registration Form'],
  'Fills Out Form': ['Demo Request Form', 'Contact Sales Form', 'Newsletter Signup', 'Any Form'],
  'Clicks Link in Email': ['Product Announcement · Learn More', 'Summit Invitation · Register', 'Any Email Link'],
  'Visits Web Page': ['/pricing', '/product', '/events/revenue-summit', 'Any Web Page'],
  'Data Value Changes': ['Lifecycle Stage', 'Lead Score', 'Person Owner', 'Account Tier'],
  'Added to Smart List': ['High Intent Leads', 'Enterprise ABM', 'Event Registrants', 'Any Smart List'],
}

function ConditionRow({ condition, onChange, onDelete }: { condition: ProgramSegmentCondition; onChange: (condition: ProgramSegmentCondition) => void; onDelete: () => void }) {
  return <div className='segmentConditionRow'>
    <span className='segmentConditionGrip'>⋮⋮</span>
    <select value={condition.field} onChange={(event) => onChange({ ...condition, field: event.target.value })} aria-label='Condition field'>{allFields.map((field) => <option key={field}>{field}</option>)}</select>
    <select value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value })} aria-label='Condition operator'>{operators.map((operator) => <option key={operator}>{operator}</option>)}</select>
    <input value={condition.value} onChange={(event) => onChange({ ...condition, value: event.target.value })} placeholder='Enter or select value' aria-label='Condition value' />
    <button type='button' onClick={onDelete} aria-label='Delete condition'>×</button>
  </div>
}

function triggerConfigurationLabel(type: ProgramTriggerType) {
  if (type === 'Fills Out Registration Form' || type === 'Fills Out Form') return 'Form'
  if (type === 'Clicks Link in Email') return 'Email link'
  if (type === 'Visits Web Page') return 'Web page'
  if (type === 'Data Value Changes') return 'Field'
  if (type === 'Added to Smart List') return 'Smart List'
  return 'Configuration'
}

export function ProgramSegmentEditor({ program, onChange }: ProgramSegmentEditorProps) {
  const nextId = useRef(1)
  const [draggedField, setDraggedField] = useState('')
  const [triggerMenuOpen, setTriggerMenuOpen] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const segment = program.segment ?? defaultSegmentForProgramType(program.type)
  const fixedFilterMode = program.type === 'Simple Email' || program.type === 'Nurture'
  const availableModes: ProgramSegmentMode[] = program.type === 'Event' ? ['trigger', 'filter', 'batch'] : ['trigger', 'filter']

  function update(next: ProgramSegmentConfig) {
    setPreviewCount(null)
    onChange(next)
  }

  function createCondition(field = 'Lifecycle Stage'): ProgramSegmentCondition {
    return { id: `segment-condition-${nextId.current++}`, field, operator: 'is', value: '' }
  }

  function addCondition(groupId: string, field = 'Lifecycle Stage') {
    update({ ...segment, groups: segment.groups.map((group) => group.id === groupId ? { ...group, conditions: [...group.conditions, createCondition(field)] } : group) })
  }

  function addGroup() {
    const group: ProgramSegmentGroup = { id: `segment-group-${nextId.current++}`, logic: 'AND', conditions: [] }
    update({ ...segment, groups: [...segment.groups, group] })
  }

  function updateGroup(groupId: string, updater: (group: ProgramSegmentGroup) => ProgramSegmentGroup) {
    update({ ...segment, groups: segment.groups.map((group) => group.id === groupId ? updater(group) : group) })
  }

  function addTrigger(type: ProgramTriggerType) {
    const source = type === 'Person Is Created' ? 'Any new person' : ''
    const trigger: ProgramSegmentTrigger = { id: `segment-trigger-${nextId.current++}`, type, source, constraints: [] }
    update({ ...segment, mode: 'trigger', triggers: [...segment.triggers, trigger] })
    setTriggerMenuOpen(false)
  }

  function updateTrigger(triggerId: string, updater: (trigger: ProgramSegmentTrigger) => ProgramSegmentTrigger) {
    update({ ...segment, triggers: segment.triggers.map((trigger) => trigger.id === triggerId ? updater(trigger) : trigger) })
  }

  function previewMembers() {
    const conditionCount = segment.mode === 'trigger'
      ? segment.triggers.reduce((total, trigger) => total + trigger.constraints.length, 0)
      : segment.groups.reduce((total, group) => total + group.conditions.length, 0)
    const unconfiguredTriggers = segment.triggers.filter((trigger) => !trigger.source).length
    if (segment.mode === 'trigger' && (segment.triggers.length === 0 || unconfiguredTriggers > 0)) {
      setPreviewCount(0)
      return
    }
    const base = segment.mode === 'trigger' ? 860 * Math.max(segment.triggers.length, 1) : segment.mode === 'batch' ? 2500 : 12840
    setPreviewCount(Math.max(12, Math.round(base / (1 + conditionCount * 1.75 + Math.max(segment.groups.length - 1, 0)))))
  }

  function handlePaletteDragStart(event: DragEvent, field: string) {
    setDraggedField(field)
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('text/plain', field)
  }

  function handleDrop(event: DragEvent, groupId: string) {
    event.preventDefault()
    const field = event.dataTransfer.getData('text/plain') || draggedField
    if (field) addCondition(groupId, field)
    setDraggedField('')
  }

  return <div className='programSegmentEditor'>
    <header className='segmentEditorHeader'>
      <div><h2>Segment</h2><p>Define the people who can enter this program.</p></div>
      <div className='segmentHeaderActions'>
        {!fixedFilterMode ? <div className='segmentModeToggle' role='group' aria-label='Segment mode'>{availableModes.map((mode) => <button type='button' key={mode} className={segment.mode === mode ? 'active' : ''} onClick={() => update({ ...segment, mode })} aria-pressed={segment.mode === mode}>{mode === 'trigger' ? 'Trigger' : mode === 'filter' ? 'Filter' : 'Batch'}</button>)}</div> : <span className='segmentFixedMode'>Filter-based audience</span>}
        <button type='button' className='button outline accent segmentPreviewButton' onClick={previewMembers}>Preview Member Count</button>
      </div>
    </header>

    {previewCount !== null && <div className={`segmentPreviewResult ${previewCount === 0 ? 'warning' : ''}`} role='status'><span>{previewCount === 0 ? '!' : '✓'}</span><div><strong>{previewCount === 0 ? 'Audience cannot be estimated yet' : `${previewCount.toLocaleString()} estimated members`}</strong><small>{previewCount === 0 ? 'Configure every trigger before previewing members.' : 'Estimate based on the current segment definition.'}</small></div><button type='button' onClick={() => setPreviewCount(null)}>×</button></div>}

    {segment.mode === 'trigger' ? <div className='segmentTriggerMode'>
      <div className='segmentTriggerToolbar'>
        <div><strong>Entry Triggers</strong><small>Each trigger is evaluated with OR logic.</small></div>
        <div className='segmentAddTriggerWrap'><button type='button' className='button solid' onClick={() => setTriggerMenuOpen((open) => !open)}>+ Add Trigger <span>⌄</span></button>{triggerMenuOpen && <div className='segmentTriggerMenu'>{triggerTypes.map((type) => <button type='button' key={type} onClick={() => addTrigger(type)}>{type}</button>)}</div>}</div>
      </div>

      <div className='segmentTriggerList'>
        {segment.triggers.map((trigger, index) => <div key={trigger.id}>
          {index > 0 && <div className='segmentOrDivider'><span>OR</span></div>}
          <section className={`segmentTriggerBlock ${!trigger.source ? 'needsConfiguration' : ''}`}>
            <header><div><span>⚡</span><div><strong>{trigger.type}</strong><small>{trigger.source ? 'Configured trigger' : 'Needs configuration'}</small></div></div><button type='button' onClick={() => update({ ...segment, triggers: segment.triggers.filter((item) => item.id !== trigger.id) })} aria-label={`Delete ${trigger.type}`}>×</button></header>
            <div className='segmentTriggerConfig'>
              <label><span>{triggerConfigurationLabel(trigger.type)} <strong>*</strong></span>{triggerSourceOptions[trigger.type] ? <select value={trigger.source} onChange={(event) => updateTrigger(trigger.id, (item) => ({ ...item, source: event.target.value }))}><option value=''>Select {triggerConfigurationLabel(trigger.type).toLowerCase()}</option>{triggerSourceOptions[trigger.type]?.map((option) => <option key={option}>{option}</option>)}</select> : <input value={trigger.source} onChange={(event) => updateTrigger(trigger.id, (item) => ({ ...item, source: event.target.value }))} placeholder='Any new person' />}</label>
            </div>
            <div className='segmentTriggerConstraints'>
              <header><div><strong>Filter constraints</strong><small>All constraints below must match for this trigger.</small></div><button type='button' onClick={() => updateTrigger(trigger.id, (item) => ({ ...item, constraints: [...item.constraints, createCondition()] }))}>+ Add Constraint</button></header>
              {trigger.constraints.map((condition) => <ConditionRow key={condition.id} condition={condition} onChange={(nextCondition) => updateTrigger(trigger.id, (item) => ({ ...item, constraints: item.constraints.map((entry) => entry.id === condition.id ? nextCondition : entry) }))} onDelete={() => updateTrigger(trigger.id, (item) => ({ ...item, constraints: item.constraints.filter((entry) => entry.id !== condition.id) }))} />)}
              {trigger.constraints.length === 0 && <p>No additional constraints. This trigger applies to everyone who meets the trigger configuration.</p>}
            </div>
          </section>
        </div>)}
        {segment.triggers.length === 0 && <div className='segmentTriggerEmpty'><span>⚡</span><h3>No entry triggers</h3><p>Add at least one trigger to define how people enter this program.</p><button type='button' className='button outline accent' onClick={() => setTriggerMenuOpen(true)}>Add Trigger</button></div>}
      </div>
    </div> : <div className='segmentFilterWorkspace'>
      <aside className='segmentFilterPalette'>
        <header><strong>Available Filters</strong><small>Drag a field onto the canvas</small></header>
        {paletteCategories.map((category) => <section key={category.name}><header><span>{category.icon}</span><strong>{category.name}</strong></header>{category.fields.map((field) => <button type='button' draggable key={field} onDragStart={(event) => handlePaletteDragStart(event, field)} onClick={() => addCondition(segment.groups[0]?.id ?? '', field)}><span>⋮⋮</span>{field}<i>+</i></button>)}</section>)}
      </aside>
      <main className='segmentFilterCanvas'>
        {segment.mode === 'batch' && <div className='segmentBatchNotice'><span>⇧</span><div><strong>Batch audience for event imports</strong><small>Define filters here, then import members from the Event members workflow.</small></div></div>}
        <div className='segmentCanvasIntro'><div><h3>Audience Conditions</h3><p>People must match the condition groups below to enter this program.</p></div><button type='button' className='button outline accent' onClick={addGroup}>+ Add Condition Group</button></div>
        <div className='segmentConditionGroups'>
          {segment.groups.map((group, groupIndex) => <div key={group.id}>
            {groupIndex > 0 && <div className='segmentGroupConnector'><span>{group.logic}</span></div>}
            <section className='segmentConditionGroup' onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, group.id)}>
              <header><div><span>{groupIndex + 1}</span><div><strong>Condition Group {groupIndex + 1}</strong><small>{group.conditions.length} conditions</small></div></div><div className='segmentGroupLogic'><button type='button' className={group.logic === 'AND' ? 'active' : ''} onClick={() => updateGroup(group.id, (item) => ({ ...item, logic: 'AND' }))}>AND</button><button type='button' className={group.logic === 'OR' ? 'active' : ''} onClick={() => updateGroup(group.id, (item) => ({ ...item, logic: 'OR' }))}>OR</button>{segment.groups.length > 1 && <button type='button' className='deleteGroup' onClick={() => update({ ...segment, groups: segment.groups.filter((item) => item.id !== group.id) })}>Delete Group</button>}</div></header>
              <div>{group.conditions.map((condition) => <ConditionRow key={condition.id} condition={condition} onChange={(nextCondition) => updateGroup(group.id, (item) => ({ ...item, conditions: item.conditions.map((entry) => entry.id === condition.id ? nextCondition : entry) }))} onDelete={() => updateGroup(group.id, (item) => ({ ...item, conditions: item.conditions.filter((entry) => entry.id !== condition.id) }))} />)}{group.conditions.length === 0 && <div className='segmentConditionDropzone'><span>＋</span><strong>Drop a filter here</strong><small>Or choose one from the filter library</small></div>}</div>
              <footer><button type='button' onClick={() => addCondition(group.id)}>+ Add Condition</button><span>Conditions in this group use <strong>{group.logic}</strong> logic</span></footer>
            </section>
          </div>)}
          {segment.groups.length === 0 && <button type='button' className='segmentAddFirstGroup' onClick={addGroup}>+ Add the first condition group</button>}
        </div>
      </main>
    </div>}
  </div>
}
