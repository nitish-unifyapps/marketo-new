import { useState } from 'react'

interface SmartListEditorProps {
  filterOnly?: boolean
}

interface Condition {
  id: number
  field: string
  operator: string
  value: string
}

const filterCategories = [
  { name: 'Person Fields', icon: '♙', items: ['Lifecycle Stage', 'Person Score', 'Job Title', 'Country', 'Lead Source'] },
  { name: 'Account Fields', icon: '▣', items: ['Account Name', 'Industry', 'Revenue', 'Employee Count'] },
  { name: 'Activity History', icon: '◷', items: ['Opened Email', 'Clicked Link', 'Filled Out Form', 'Visited Web Page'] },
  { name: 'Smart List Membership', icon: '☷', items: ['Member of Smart List', 'Not Member of Smart List'] },
  { name: 'Program Membership', icon: '✣', items: ['Program Status', 'Success', 'Acquisition Program'] },
]

const triggerOptions = ['Fills Out Form', 'Clicks Link in Email', 'Visits Web Page', 'Data Value Changes', 'Program Status Changes', 'Person is Created']

export function SmartListEditor({ filterOnly = false }: SmartListEditorProps) {
  const [mode, setMode] = useState<'trigger' | 'filter'>(filterOnly ? 'filter' : 'trigger')
  const [trigger, setTrigger] = useState(filterOnly ? '' : 'Fills Out Form')
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, field: 'Lifecycle Stage', operator: 'is', value: 'MQL' },
    { id: 2, field: 'Person Score', operator: 'greater than', value: '65' },
  ])
  const [expandedCategories, setExpandedCategories] = useState(() => new Set(['Person Fields', 'Activity History']))
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND')
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [nextId, setNextId] = useState(3)

  function toggleCategory(name: string) {
    setExpandedCategories((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function addCondition(field = 'Lifecycle Stage') {
    setConditions((current) => [...current, { id: nextId, field, operator: 'is', value: '' }])
    setNextId((value) => value + 1)
  }

  function updateCondition(id: number, updates: Partial<Condition>) {
    setConditions((current) => current.map((condition) => condition.id === id ? { ...condition, ...updates } : condition))
  }

  return <div className='phase2SmartList'>
    <header className='smartListEditorHeader'>
      <div><h3>Define Entry Audience</h3><p>{filterOnly ? 'Select the people who should receive this email program.' : mode === 'trigger' ? 'People enter when the trigger occurs and optional filters match.' : 'Build a batch audience from profile and activity filters.'}</p></div>
      {!filterOnly && <div className='phase2ModeToggle'><button type='button' className={mode === 'trigger' ? 'active' : ''} onClick={() => setMode('trigger')}>Trigger</button><button type='button' className={mode === 'filter' ? 'active' : ''} onClick={() => setMode('filter')}>Filter</button></div>}
    </header>
    <div className='smartListWorkspace'>
      <aside className='smartListPalette'>
        <header><strong>Filters{!filterOnly && '/Triggers'}</strong><small>Drag an attribute to the canvas</small></header>
        <label className='phase2PaletteSearch'><span>⌕</span><input placeholder='Search attributes…' /></label>
        <div>{filterCategories.map((category) => <section key={category.name}><button type='button' onClick={() => toggleCategory(category.name)}><span>{category.icon}</span><strong>{category.name}</strong><i>{expandedCategories.has(category.name) ? '⌄' : '›'}</i></button>{expandedCategories.has(category.name) && category.items.map((item) => <button type='button' draggable className='filterPaletteItem' key={item} onClick={() => addCondition(item)}><span>⋮⋮</span>{item}<b>＋</b></button>)}</section>)}</div>
      </aside>
      <main className='smartListCanvas' onDragOver={(event) => event.preventDefault()} onDrop={() => addCondition()}>
        <div className='smartListCanvasInner'>
          {mode === 'trigger' && !filterOnly && <section className='triggerDefinitionCard'><header><span>⚡</span><div><strong>Campaign Trigger</strong><small>At least one trigger is required</small></div><em>Required</em></header><div><label>Add Trigger<select value={trigger} onChange={(event) => setTrigger(event.target.value)}>{triggerOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>{trigger === 'Fills Out Form' ? 'Form' : 'Constraint'}<select><option>{trigger === 'Fills Out Form' ? 'Enterprise Demo Request' : 'Any'}</option><option>Any {trigger}</option></select></label><button type='button' title='Remove trigger'>×</button></div></section>}
          <section className='filterLogicCard'>
            <header><div><span>☷</span><div><strong>{mode === 'trigger' && !filterOnly ? 'Filter Constraints' : 'Audience Filters'}</strong><small>{conditions.length} conditions</small></div></div><div className='logicToggle'><button type='button' className={logic === 'AND' ? 'active' : ''} onClick={() => setLogic('AND')}>AND</button><button type='button' className={logic === 'OR' ? 'active' : ''} onClick={() => setLogic('OR')}>OR</button></div></header>
            <div className='conditionRows'>{conditions.map((condition, index) => <div className='conditionRowV2' key={condition.id}><span className='conditionIndex'>{index + 1}</span><span className='conditionJoin'>{index === 0 ? 'WHERE' : logic}</span><select value={condition.field} onChange={(event) => updateCondition(condition.id, { field: event.target.value })}><option>Lifecycle Stage</option><option>Person Score</option><option>Job Title</option><option>Country</option><option>Industry</option><option>Member of Smart List</option><option>Opened Email</option></select><select value={condition.operator} onChange={(event) => updateCondition(condition.id, { operator: event.target.value })}><option>is</option><option>is not</option><option>contains</option><option>greater than</option><option>less than</option><option>is not empty</option></select><input value={condition.value} onChange={(event) => updateCondition(condition.id, { value: event.target.value })} placeholder='Enter value' /><button type='button' onClick={() => setConditions((current) => current.filter((item) => item.id !== condition.id))}>×</button></div>)}</div>
            <footer><button type='button' onClick={() => addCondition()}>＋ Add Filter</button><button type='button'>＋ Add Group</button></footer>
          </section>
          <div className='smartListDropHint'><span>＋</span><p>Drop another filter or trigger here</p></div>
        </div>
        <footer className='smartListCanvasFooter'><button type='button' className='button outline accent' onClick={() => setMemberCount(12842)}>Preview Member Count</button>{memberCount !== null && <div><span>Estimated audience</span><strong>{memberCount.toLocaleString()} people</strong><small>Updated just now</small></div>}<p>{mode === 'trigger' && !filterOnly ? 'People qualify in real-time.' : 'Audience refreshes when the batch runs.'}</p></footer>
      </main>
    </div>
  </div>
}
