import { Fragment, useEffect, useRef, useState } from 'react'
import { defaultSegmentForProgramType } from '../../data/programsData'
import type { ProgramRecord, ProgramSegmentCondition, ProgramSegmentConfig, ProgramSegmentGroup } from '../../types/programs'
import { WireframeIcon } from '../common/WireframeIcon'

interface ProgramSegmentEditorProps {
  program: ProgramRecord
  onChange: (segment: ProgramSegmentConfig) => void
}

const allFields = ['Lifecycle Stage', 'Lead Score', 'Job Title', 'Country', 'Email Address', 'Person Owner', 'Account Name', 'Industry', 'Annual Revenue', 'Employee Count', 'Account Tier', 'Visited Web Page', 'Opened Email', 'Clicked Link', 'Filled Out Form', 'Attended Event', 'Member of Smart List', 'Not Member of Smart List', 'Program Status', 'Member of Program', 'Acquired By Program']
const operators = ['is', 'is not', 'contains', 'does not contain', 'greater than', 'less than', 'in past']

const previewMembersSample = [
  { name: 'Maya Chen', email: 'maya.chen@northstar.io', company: 'Northstar Labs', lifecycle: 'MQL', score: 86 },
  { name: 'Jordan Brooks', email: 'jordan.brooks@lumon.com', company: 'Lumon Systems', lifecycle: 'MQL', score: 79 },
  { name: 'Priya Shah', email: 'priya.shah@verdant.co', company: 'Verdant', lifecycle: 'MQL', score: 74 },
  { name: 'Theo Martin', email: 'theo.martin@harborworks.com', company: 'Harborworks', lifecycle: 'MQL', score: 88 },
  { name: 'Elena García', email: 'elena.garcia@solara.ai', company: 'Solara AI', lifecycle: 'MQL', score: 92 },
  { name: 'Noah Williams', email: 'noah.williams@apexfield.com', company: 'ApexField', lifecycle: 'MQL', score: 71 },
  { name: 'Amina Okafor', email: 'amina.okafor@contour.dev', company: 'Contour', lifecycle: 'MQL', score: 83 },
  { name: 'Lucas Meyer', email: 'lucas.meyer@kinetic.de', company: 'Kinetic GmbH', lifecycle: 'MQL', score: 76 },
  { name: 'Sofia Rossi', email: 'sofia.rossi@copperlane.it', company: 'Copperlane', lifecycle: 'MQL', score: 77 },
  { name: 'Ethan Park', email: 'ethan.park@bluepeak.io', company: 'BluePeak', lifecycle: 'MQL', score: 81 },
]

function ConditionRow({ condition, onChange, onDelete }: { condition: ProgramSegmentCondition; onChange: (condition: ProgramSegmentCondition) => void; onDelete: () => void }) {
  return <div className='segmentConditionRow'>
    <select value={condition.field} onChange={(event) => onChange({ ...condition, field: event.target.value })} aria-label='Condition field'>{allFields.map((field) => <option key={field}>{field}</option>)}</select>
    <select value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value })} aria-label='Condition operator'>{operators.map((operator) => <option key={operator}>{operator}</option>)}</select>
    <input value={condition.value} onChange={(event) => onChange({ ...condition, value: event.target.value })} placeholder='Enter or select value' aria-label='Condition value' />
    <button type='button' onClick={onDelete} aria-label='Delete condition'>×</button>
  </div>
}

function LogicMenu({ value, open, ariaLabel, onToggle, onChange }: { value: 'AND' | 'OR'; open: boolean; ariaLabel: string; onToggle: () => void; onChange: (logic: 'AND' | 'OR') => void }) {
  return <div className='segmentLogicMenu' onClick={(event) => event.stopPropagation()}>
    <button type='button' className='segmentLogicTrigger' aria-label={ariaLabel} aria-haspopup='menu' aria-expanded={open} onClick={onToggle}><span>{value}</span><span className='segmentLogicCaret' aria-hidden='true' /></button>
    {open && <div className='segmentLogicPopover' role='menu'>
      {(['AND', 'OR'] as const).map((logic) => <button type='button' role='menuitemradio' aria-checked={value === logic} className={value === logic ? 'active' : ''} key={logic} onClick={() => onChange(logic)}>{logic}</button>)}
    </div>}
  </div>
}

export function ProgramSegmentEditor({ program, onChange }: ProgramSegmentEditorProps) {
  const nextId = useRef(1)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [previewCount, setPreviewCount] = useState<number | null>(1842)
  const [previewState, setPreviewState] = useState<'idle' | 'updating' | 'ready'>('ready')
  const [openLogicMenu, setOpenLogicMenu] = useState<string | null>(null)
  const savedSegment = program.segment ?? defaultSegmentForProgramType(program.type)
  const segment = savedSegment.mode === 'filter' ? savedSegment : { ...savedSegment, mode: 'filter' as const }
  const includeGroups = segment.groups.filter((group) => !group.id.startsWith('segment-exclude-'))

  useEffect(() => {
    if (savedSegment.mode !== 'filter') onChange({ ...savedSegment, mode: 'filter' })
  }, [onChange, savedSegment])

  useEffect(() => () => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
  }, [])

  useEffect(() => {
    if (!openLogicMenu) return
    const closeMenu = () => setOpenLogicMenu(null)
    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [openLogicMenu])

  function update(next: ProgramSegmentConfig) {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    setPreviewCount(null)
    setPreviewState('idle')
    onChange(next)
  }

  function createCondition(field = 'Lifecycle Stage'): ProgramSegmentCondition {
    return { id: `segment-condition-${nextId.current++}`, field, operator: 'is', value: '' }
  }

  function addCondition(groupId: string, field = 'Lifecycle Stage') {
    update({ ...segment, groups: segment.groups.map((group) => group.id === groupId ? { ...group, conditions: [...group.conditions, createCondition(field)] } : group) })
  }

  function addGroup() {
    const group: ProgramSegmentGroup = { id: `segment-group-${nextId.current++}`, logic: 'AND', joinLogic: 'OR', conditions: [createCondition()] }
    update({ ...segment, groups: [...segment.groups, group] })
  }

  function updateGroup(groupId: string, updater: (group: ProgramSegmentGroup) => ProgramSegmentGroup) {
    update({ ...segment, groups: segment.groups.map((group) => group.id === groupId ? updater(group) : group) })
  }

  function previewMembers() {
    const conditionCount = segment.groups.reduce((total, group) => total + group.conditions.length, 0)
    setPreviewState('updating')
    setPreviewCount(null)
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => {
      const base = 12840
      setPreviewCount(Math.max(12, Math.round(base / (1 + conditionCount * 1.75 + Math.max(includeGroups.length - 1, 0)))))
      setPreviewState('ready')
    }, 550)
  }

  function renderConditionGroup(group: ProgramSegmentGroup, groupIndex: number) {
    return <div key={group.id}>
      {groupIndex > 0 && <div className='segmentGroupConnector'><LogicMenu value={group.joinLogic ?? 'OR'} open={openLogicMenu === `group:${group.id}`} ariaLabel={`Choose how filter group ${groupIndex + 1} connects to the previous group`} onToggle={() => setOpenLogicMenu((current) => current === `group:${group.id}` ? null : `group:${group.id}`)} onChange={(joinLogic) => { updateGroup(group.id, (item) => ({ ...item, joinLogic })); setOpenLogicMenu(null) }} /></div>}
      <section className='segmentConditionGroup'>
        <header><div className='segmentGroupTitle'><strong>Filter group {groupIndex + 1}</strong><small>{group.conditions.length} {group.conditions.length === 1 ? 'filter' : 'filters'}</small></div>{includeGroups.length > 1 && <button type='button' className='segmentDeleteGroup' aria-label={`Delete filter group ${groupIndex + 1}`} title='Delete group' onClick={() => update({ ...segment, groups: segment.groups.filter((item) => item.id !== group.id) })}><WireframeIcon name='delete' /></button>}</header>
        <div>{group.conditions.map((condition, index) => <Fragment key={condition.id}>{index > 0 && <div className='segmentConditionConnector'><LogicMenu value={condition.logic ?? group.logic} open={openLogicMenu === `condition:${condition.id}`} ariaLabel={`Choose logic before filter ${index + 1}`} onToggle={() => setOpenLogicMenu((current) => current === `condition:${condition.id}` ? null : `condition:${condition.id}`)} onChange={(logic) => { updateGroup(group.id, (item) => ({ ...item, conditions: item.conditions.map((entry) => entry.id === condition.id ? { ...entry, logic } : entry) })); setOpenLogicMenu(null) }} /></div>}<ConditionRow condition={condition} onChange={(nextCondition) => updateGroup(group.id, (item) => ({ ...item, conditions: item.conditions.map((entry) => entry.id === condition.id ? nextCondition : entry) }))} onDelete={() => updateGroup(group.id, (item) => ({ ...item, conditions: item.conditions.length === 1 ? [createCondition()] : item.conditions.filter((entry) => entry.id !== condition.id) }))} /></Fragment>)}</div>
        <footer><button type='button' onClick={() => addCondition(group.id)}>＋ Add filter</button></footer>
      </section>
    </div>
  }

  const databaseSize = 248600
  const previewPercentage = previewCount === null ? null : (previewCount / databaseSize) * 100
  const visiblePreviewMembers = previewCount === null ? [] : previewMembersSample.slice(0, Math.min(previewCount, previewMembersSample.length))

  const resultsPane = <aside className='segmentResultsPane' aria-label='Estimated results'>
    <div className='segmentResultsTop'>
      <div className='segmentResultsHeading'><span className={`segmentResultStatus ${previewState}`}></span><div><strong>Estimated results</strong><small>{previewState === 'updating' ? 'Updating estimate…' : previewState === 'ready' ? 'Estimate is ready' : 'Ready to estimate'}</small></div></div>
      <div className='segmentResultsMetrics'>
        <div className='segmentResultsMetric'><span>Members</span><strong>{previewState === 'updating' ? '•••' : previewCount === null ? '—' : previewCount.toLocaleString()}</strong></div>
        <div className='segmentResultsMetric secondary'><span>Database</span><strong>{previewState === 'updating' ? '•••' : previewPercentage === null ? '—' : `${previewPercentage < .1 && previewPercentage > 0 ? '<0.1' : previewPercentage.toFixed(1)}%`}</strong></div>
      </div>
      <button type='button' className='button solid segmentResultsAction' onClick={previewMembers} disabled={previewState === 'updating'}>{previewState === 'updating' ? 'Updating…' : previewState === 'ready' ? 'Refresh preview' : 'Preview member count'}</button>
    </div>
    <div className='segmentMemberPreview'>
      <div className='segmentMemberPreviewHeading'><div><strong>Member preview</strong><small>{previewCount === null ? 'Run an estimate to preview matching people.' : `Showing ${visiblePreviewMembers.length} of ${previewCount.toLocaleString()} matching people`}</small></div></div>
      <div className='segmentMemberTableWrap'>
        <table className='segmentMemberTable'>
          <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Lifecycle Stage</th><th>Score</th></tr></thead>
          <tbody>{previewState === 'updating' ? <tr><td colSpan={5} className='segmentMemberTableEmpty'>Refreshing member preview…</td></tr> : visiblePreviewMembers.length > 0 ? visiblePreviewMembers.map((member) => <tr key={member.email}><td><strong>{member.name}</strong></td><td>{member.email}</td><td>{member.company}</td><td><span>{member.lifecycle}</span></td><td>{member.score}</td></tr>) : <tr><td colSpan={5} className='segmentMemberTableEmpty'>No preview loaded yet.</td></tr>}</tbody>
        </table>
      </div>
    </div>
    <p className='segmentResultsNote'>Counts are estimates and may change as people and activities are updated.</p>
  </aside>

  return <div className='programSegmentEditor'>
    <div className='segmentEditorWorkspace'><main className='segmentDefinitionPane'><div className='segmentFilterCanvas'>
        <p className='segmentPageInstruction'>People are included when they match your filter group criteria.</p>
        <section className='segmentAudienceSection'>
          <div className='segmentConditionGroups'>{includeGroups.map((group, groupIndex) => renderConditionGroup(group, groupIndex))}{includeGroups.length === 0 && <button type='button' className='segmentAddFirstGroup' onClick={addGroup}>＋ Add the first filter group</button>}</div>
          {includeGroups.length > 0 && <button type='button' className='segmentAddGroupBottom' onClick={addGroup}>＋ Add filter group</button>}
        </section>
      </div></main>{resultsPane}</div>
  </div>
}
