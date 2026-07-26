import { useState } from 'react'
import { executionFolders, executionTemplates, executions } from '../../data/executionData'
import type { ExecutionRecord, ExecutionTemplate, ProgramTabKey } from '../../types/execution'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'

interface ExecutionLibraryProps {
  activeTab: ProgramTabKey
  onOpenProgram: (program: ExecutionRecord) => void
  onStartTemplate: (template?: ExecutionTemplate) => void
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}

const typeByTab: Partial<Record<ProgramTabKey, ExecutionRecord['type']>> = {
  'smart-campaigns': 'Smart Campaign',
  'engagement-programs': 'Engagement Program',
  'event-programs': 'Event Program',
}

export function ExecutionLibrary({ activeTab, onOpenProgram, onStartTemplate, createOpen, onCreateOpenChange }: ExecutionLibraryProps) {
  const [folder, setFolder] = useState('Marketing Activities')
  const [selectedId, setSelectedId] = useState('ex-1')
  const [modalTab, setModalTab] = useState<'templates' | 'blank'>('templates')
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)

  const visiblePrograms = executions.filter((program) => {
    const matchesType = !typeByTab[activeTab] || program.type === typeByTab[activeTab]
    const matchesFolder = folder === 'Marketing Activities' || program.folder.includes(folder)
    return matchesType && matchesFolder
  })

  function openProgram(program: ExecutionRecord) {
    setSelectedId(program.id)
    setContextMenu(null)
    onOpenProgram(program)
  }

  function handleUseTemplate(template?: ExecutionTemplate) {
    onCreateOpenChange(false)
    onStartTemplate(template)
  }

  return <section className='executionLibrary marketingActivitiesLibrary' onClick={() => setContextMenu(null)}>
    <div className='executionViewBar'><div><h2>Marketing Activities</h2><p>Build and manage Smart Campaigns, Engagement Programs, and Event Programs.</p></div><button type='button' className='button solid createExecutionButton' onClick={() => onCreateOpenChange(true)}><WireframeIcon name='plus' className='iconSmall' /> New Program</button></div>
    <div className='executionWorkspace'>
      <aside className='executionTree'>
        <div className='executionTreeHeader'><strong>Marketing Activities</strong><button type='button'>＋</button></div>
        <label className='executionTreeSearch'><WireframeIcon name='search' className='iconTiny' /><input placeholder='Search programs...' /></label>
        <div className='executionFolders'>{executionFolders.map((item) => <div key={item.name}><button type='button' className={`executionFolderRow ${folder === item.name ? 'active' : ''}`} onClick={() => setFolder(item.name)}><span>▾</span><b>▱</b>{item.name}<small>{item.count}</small></button>{item.children?.map((child) => <button type='button' key={child} className={`executionFolderRow child ${folder === child ? 'active' : ''}`} onClick={() => setFolder(child)}>{child}</button>)}</div>)}</div>
        <div className='treeExecutions'><h4>Programs</h4>{executions.map((program) => <button type='button' key={program.id} className={`treeExecutionItem ${selectedId === program.id ? 'selected' : ''}`} onClick={() => openProgram(program)} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); setSelectedId(program.id); setContextMenu({ id: program.id, x: event.clientX, y: event.clientY }) }}><i className={program.status.toLowerCase()} /><span>{program.name}</span><em className={`miniStatus ${program.status.toLowerCase()}`}>{program.status}</em></button>)}</div>
      </aside>
      <main className='executionResults'><header className='executionResultsHeader'><div><h2>{folder}</h2><p>{visiblePrograms.length} programs</p></div><div className='executionHeaderActions'><button type='button'>Status: All</button><button type='button'>Last modified ↓</button></div></header><div className='executionCardGrid'>{visiblePrograms.map((program) => <ProgramCard key={program.id} program={program} onOpen={() => openProgram(program)} />)}{visiblePrograms.length === 0 && <div className='assetEmpty'>No programs in this view.</div>}</div></main>
    </div>

    {contextMenu && <div className='programContextMenu' style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}><strong>{executions.find((item) => item.id === contextMenu.id)?.name}</strong><button type='button'>Edit</button><button type='button'>Clone</button><button type='button'>Deactivate</button><button type='button' className='danger'>Delete</button></div>}

    <Modal title='Create New Program' open={createOpen} onClose={() => onCreateOpenChange(false)}>
      <div className='newProgramModal'>
        <div className='newProgramTabs' role='tablist'><button type='button' role='tab' className={modalTab === 'templates' ? 'active' : ''} onClick={() => setModalTab('templates')}>Templates</button><button type='button' role='tab' className={modalTab === 'blank' ? 'active' : ''} onClick={() => setModalTab('blank')}>Blank Program</button></div>
        {modalTab === 'templates' ? <div className='programTemplateGroups'>{(['Smart Campaign', 'Engagement Program', 'Event Program'] as const).map((category) => <section key={category}><header><h3>{category} Templates</h3><p>{category === 'Smart Campaign' ? 'Triggered or batch campaigns using Smart List and Flow.' : category === 'Engagement Program' ? 'Continuous nurture streams for known audiences.' : 'Registration, reminder, and follow-up programs.'}</p></header><div>{executionTemplates.filter((template) => template.category === category).map((template) => <ProgramTemplateCard key={template.id} template={template} onUse={() => handleUseTemplate(template)} />)}</div></section>)}</div> : <div className='blankProgramPanel'><span>＋</span><h3>Start with a blank program</h3><p>Choose a program type and build the Smart List and Flow from scratch.</p><label>Program Type<select><option>Smart Campaign</option><option>Engagement Program</option><option>Event Program</option></select></label><button type='button' className='button solid' onClick={() => handleUseTemplate()}>Start Blank</button></div>}
      </div>
    </Modal>
  </section>
}

function ProgramCard({ program, onOpen }: { program: ExecutionRecord; onOpen: () => void }) {
  return <article className='executionCard' onDoubleClick={onOpen}><div className='executionCardTop'><span className='executionTypeIcon'>{program.type === 'Smart Campaign' ? '⚡' : program.type === 'Engagement Program' ? '⑂' : '◇'}</span><span className={`executionStatus ${program.status.toLowerCase()}`}>{program.status}</span><button type='button'>•••</button></div><button type='button' className='executionCardName' onClick={onOpen}>{program.name}</button><div className='executionCardMeta'><span>{program.type}</span><span>{program.lastRun}</span></div><MiniFlow type={program.type} /><footer><span>{program.folder}</span><button type='button' onClick={onOpen}>Edit Program →</button></footer></article>
}

function MiniFlow({ type }: { type: ExecutionRecord['type'] }) {
  return <div className='miniFlowPreview'><svg viewBox='0 0 220 70'><path d='M32 35H81M101 35h28m20 0h39' /><circle cx='24' cy='35' r='8' /><rect x='81' y='25' width='20' height='20' rx='4' /><path d={type === 'Engagement Program' ? 'm139 25 10 10-10 10-10-10Z' : 'M129 27h20v16h-20z'} /><circle cx='196' cy='35' r='8' /></svg></div>
}

function ProgramTemplateCard({ template, onUse }: { template: ExecutionTemplate; onUse: () => void }) {
  return <article className='programTemplateCard'><div className='templatePreview'>{template.steps.slice(0, 5).map((step, index) => <i key={`${step}-${index}`} style={{ left: `${10 + index * 19}%`, top: `${24 + (index % 2) * 30}%` }} />)}</div><div className='programTemplateCopy'><span>{template.mode} mode</span><h4>{template.name}</h4><p>{template.description}</p><small>{template.steps.join(' → ')}</small><button type='button' className='button solid' onClick={onUse}>Use Template</button></div></article>
}
