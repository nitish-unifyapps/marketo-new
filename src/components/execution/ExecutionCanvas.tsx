import { useEffect, useRef, useState } from 'react'
import { flowForTemplate, paletteNodes, programFlows } from '../../data/executionData'
import type { ExecutionRecord, ExecutionTemplate, FlowNode, PaletteTab } from '../../types/execution'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'

interface ExecutionCanvasProps {
  execution?: ExecutionRecord
  template?: ExecutionTemplate
  onBack: () => void
}

const paletteTabs: PaletteTab[] = ['Triggers', 'Filters', 'Actions', 'Flow Control']
const iconByKind: Record<FlowNode['kind'], string> = { 'smart-list': '☷', email: '✉', wait: '◷', choice: '◇', 'change-data': '⇄', alert: '!', 'smart-filter': '☷', action: '⚡', end: '⊗' }

type TokenType = 'Text' | 'Number' | 'Date' | 'Boolean' | 'Image URL'

interface ProgramToken {
  id: string
  name: string
  type: TokenType
  defaultValue: string
}

const defaultProgramTokens: ProgramToken[] = [
  { id: 'token-1', name: 'EventTitle', type: 'Text', defaultValue: 'Marketing Automation Summit' },
  { id: 'token-2', name: 'EventDate', type: 'Date', defaultValue: '2026-08-15' },
  { id: 'token-3', name: 'SpeakerName', type: 'Text', defaultValue: 'Sarah Jones' },
]

export function ExecutionCanvas({ execution, template, onBack }: ExecutionCanvasProps) {
  const canvasRef = useRef<HTMLElement | null>(null)
  const programKind = template?.category === 'Smart Campaign' || execution?.type === 'Smart Campaign' ? 'smart' : template?.category === 'Event Program' || execution?.type === 'Event Program' ? 'event' : 'engagement'
  const initialMode = template?.mode ?? (programKind === 'engagement' ? 'Filter' : 'Trigger')
  const [campaignMode, setCampaignMode] = useState<'Trigger' | 'Filter'>(initialMode)
  const [scheduleMode, setScheduleMode] = useState<'Trigger' | 'Batch'>(initialMode === 'Trigger' ? 'Trigger' : 'Batch')
  const [paletteTab, setPaletteTab] = useState<PaletteTab>('Actions')
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [nodes, setNodes] = useState<FlowNode[]>(() => {
    const flow = template ? flowForTemplate(template) : execution ? programFlows[programKind] : programFlows.engagement
    return execution
      ? flow.map((node) => ({
          ...node,
          subtitle: node.subtitle.endsWith(' · Configure')
            ? node.subtitle.replace(/Configure$/, 'Configured')
            : node.subtitle,
        }))
      : flow.map((node) => ({ ...node }))
  })
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [programName, setProgramName] = useState(execution?.name ?? template?.name ?? 'Untitled Program')
  const [goal, setGoal] = useState('Person reaches MQL status')
  const [zoom, setZoom] = useState(100)
  const [isLive, setIsLive] = useState(execution?.status === 'Active')
  const [showValidation, setShowValidation] = useState(false)
  const [programTokens, setProgramTokens] = useState<ProgramToken[]>(defaultProgramTokens)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) canvas.scrollLeft = (canvas.scrollWidth - canvas.clientWidth) / 2
  }, [])

  const configurationCount = nodes.filter((node) => node.subtitle.endsWith(' · Configure')).length
  const missingTokenCount = programTokens.filter((token) => !token.defaultValue.trim()).length

  function selectNode(node: FlowNode, open = false) {
    setSelectedNode(node)
    setConfigOpen(open)
  }

  function applyNodeConfiguration() {
    if (selectedNode) {
      const nextNode = {
        ...selectedNode,
        subtitle: selectedNode.subtitle.replace(/Configure$/, 'Configured'),
      }
      setNodes((current) => current.map((node) => node.id === nextNode.id ? nextNode : node))
      setSelectedNode(nextNode)
    }
    setConfigOpen(false)
  }

  function toggleActivation() {
    if (isLive) {
      setIsLive(false)
      return
    }
    if (configurationCount > 0 || missingTokenCount > 0) {
      setShowValidation(true)
      return
    }
    setIsLive(true)
    setShowValidation(false)
  }

  function changeScheduleMode(mode: 'Trigger' | 'Batch') {
    setScheduleMode(mode)
    setCampaignMode(mode === 'Trigger' ? 'Trigger' : 'Filter')
  }

  const programType = execution?.type ?? template?.category ?? 'Engagement Program'

  return <section className={`executionDesigner marketingProgramDesigner program-${programKind}`}>
    <header className='executionDesignerBar'>
      <div className='builderIdentity'><button type='button' className='backButton' onClick={onBack}>←</button><div><strong>{programName}</strong><small>{programType} · Saved just now</small></div></div>
      <div className='executionModeBadge'><span className={isLive ? 'active' : 'draft'}>{isLive ? 'Active' : 'Draft'}</span></div>
      <div className='executionDesignerActions'><button type='button' className='historyButton' title='Program history'>◴</button><button type='button' className='button outline accent'>Save Draft</button><button type='button' className='button outline accent'>Validate</button><button type='button' className='button solid' onClick={toggleActivation}>{isLive ? 'Deactivate' : 'Activate'}</button></div>
    </header>

    <div className='schedulerBar marketoScheduleBar'>
      <strong>Campaign Type</strong>
      <div className='scheduleModeToggle'><button type='button' className={scheduleMode === 'Trigger' ? 'active' : ''} onClick={() => changeScheduleMode('Trigger')}>⚡ Trigger <small>Real-time</small></button><button type='button' className={scheduleMode === 'Batch' ? 'active' : ''} onClick={() => changeScheduleMode('Batch')}>▦ Batch</button></div>
      {scheduleMode === 'Batch' ? <div className='scheduleFields'><label>Run date<input type='date' defaultValue='2026-07-28' /></label><label>Time<input type='time' defaultValue='09:00' /></label><label>Recurrence<select defaultValue='once'><option value='once'>Run once</option><option value='daily'>Daily</option><option value='weekly'>Weekly</option></select></label></div> : <p>People qualify immediately when the Smart List trigger fires.</p>}
      {showValidation && <div className='marketoValidationWarning'><span>!</span><div><strong>Program cannot be activated</strong><small>{configurationCount > 0 ? `${configurationCount} flow step${configurationCount === 1 ? '' : 's'} need configuration.` : ''} {missingTokenCount > 0 ? `${missingTokenCount} Program Token${missingTokenCount === 1 ? '' : 's'} missing a default value.` : ''}</small></div></div>}
    </div>

    <div className={`executionCanvasLayout ${paletteOpen ? '' : 'paletteClosed'}`}>
      <aside className='nodePalette'><button type='button' className='paletteCollapse' onClick={() => setPaletteOpen(false)}>‹</button><div className='paletteTitle'><strong>Flow Steps</strong><small>Drag a step onto the canvas</small></div><div className='paletteTabs'>{paletteTabs.map((tab) => <button type='button' key={tab} className={paletteTab === tab ? 'active' : ''} onClick={() => setPaletteTab(tab)}>{tab}</button>)}</div><div className='paletteNodeList'>{paletteNodes[paletteTab].map((node) => <button key={node.name} type='button' className={`paletteNodeCard ${node.name === 'End' ? 'end' : ''}`} draggable><span>{node.icon}</span><div><strong>{node.name}</strong><small>{node.description}</small></div><b>⋮⋮</b></button>)}</div></aside>
      {!paletteOpen && <button type='button' className='paletteOpenButton' onClick={() => setPaletteOpen(true)}>＋</button>}

      <main ref={canvasRef} className='nodeCanvas' onClick={() => { setSelectedNode(null); setConfigOpen(false) }}>
        <div className='canvasControls'><button type='button'>↶</button><button type='button'>↷</button><i /><button type='button' onClick={() => setZoom((value) => Math.max(60, value - 10))}>−</button><span>{zoom}%</span><button type='button' onClick={() => setZoom((value) => Math.min(140, value + 10))}>＋</button><button type='button'>⌗</button></div>
        <div className='nodeCanvasInner' style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
          <FlowConnections kind={programKind} />
          {programKind !== 'smart' && <><span className='branchLabel yes'>{programKind === 'event' ? 'ATTENDED' : 'YES'}</span><span className='branchLabel no'>{programKind === 'event' ? 'NO SHOW' : 'NO'}</span></>}
          {nodes.map((node) => {
            const needsConfiguration = node.subtitle.endsWith(' · Configure')
            const startSubtitle = node.kind === 'smart-list' ? `${campaignMode} · ${campaignMode === 'Trigger' ? (programKind === 'event' ? 'Fills Out Registration Form' : 'Fills Out Form') : 'New MQLs'}` : node.subtitle
            return <button type='button' key={node.id} className={`flowNode kind-${node.kind} ${selectedNode?.id === node.id ? 'selected' : ''} ${needsConfiguration ? 'needsConfiguration' : ''}`} style={{ left: `calc(50% + ${node.x}px)`, top: node.y }} onClick={(event) => { event.stopPropagation(); selectNode(node) }} onDoubleClick={(event) => { event.stopPropagation(); selectNode(node, true) }}><i className='nodeInputHandle' /><span className='flowNodeIcon'>{iconByKind[node.kind]}</span><span className='flowNodeCopy'><strong>{node.title}</strong><small>{startSubtitle.replace(' · Configure', '')}</small></span>{needsConfiguration ? <span className='configureBadge' onClick={(event) => { event.stopPropagation(); selectNode(node, true) }}>Configure</span> : <em>•••</em>}<i className='nodeOutputHandle' /></button>
          })}
        </div>
        <div className='canvasMinimap'><div className='minimapFlow'><i /><i /><i /><i /><i /><b /><b /><i /></div><span /></div><div className='canvasHelp'>Double-click a flow step to configure</div>
      </main>

      <aside className={`executionSettingsPanel ${configOpen ? 'nodeConfigOpen' : ''}`}>{configOpen && selectedNode ? <NodeConfiguration node={selectedNode} smartListMode={campaignMode} programTokens={programTokens} onModeChange={(mode) => { setCampaignMode(mode); setScheduleMode(mode === 'Trigger' ? 'Trigger' : 'Batch') }} onClose={() => setConfigOpen(false)} onApply={applyNodeConfiguration} /> : <ProgramSettings name={programName} onNameChange={setProgramName} goal={goal} onGoalChange={setGoal} type={programType} tokens={programTokens} onTokensChange={setProgramTokens} />}</aside>
    </div>
  </section>
}

function FlowConnections({ kind }: { kind: 'smart' | 'engagement' | 'event' }) {
  if (kind === 'smart') return <svg className='connectionLayer' viewBox='0 0 760 1080' preserveAspectRatio='none'><defs><marker id='flow-arrow' markerWidth='7' markerHeight='7' refX='6' refY='3.5' orient='auto'><path d='M0 0 7 3.5 0 7Z' /></marker></defs><path d='M380 140V210M380 280V350M380 420V490' /></svg>
    if (kind === 'event') return <svg className='connectionLayer' viewBox='0 0 760 1080' preserveAspectRatio='none'><defs><marker id='flow-arrow' markerWidth='7' markerHeight='7' refX='6' refY='3.5' orient='auto'><path d='M0 0 7 3.5 0 7Z' /></marker></defs><path d='M380 120V170M380 240V290M380 360V410M380 480V530M380 600V650' /><path d='M380 720v25q0 35-45 35H210v10M380 720v25q0 35 45 35h125v10M210 860v25q0 35 45 35h125v10M550 860v25q0 35-45 35H380v10' /></svg>
    return <svg className='connectionLayer' viewBox='0 0 760 1080' preserveAspectRatio='none'><defs><marker id='flow-arrow' markerWidth='7' markerHeight='7' refX='6' refY='3.5' orient='auto'><path d='M0 0 7 3.5 0 7Z' /></marker></defs><path d='M380 140V210M380 280V350M380 420V490' /><path d='M380 560v25q0 35-45 35H210v20M380 560v25q0 35 45 35h125v20M210 710v25q0 35 45 35h125v20M550 710v25q0 35-45 35H380v20' /></svg>
}

function ProgramSettings({ name, onNameChange, goal, onGoalChange, type, tokens, onTokensChange }: { name: string; onNameChange: (value: string) => void; goal: string; onGoalChange: (value: string) => void; type: string; tokens: ProgramToken[]; onTokensChange: (tokens: ProgramToken[]) => void }) {
  const [tokenEditorOpen, setTokenEditorOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<ProgramToken | undefined>()

  function openTokenEditor(token?: ProgramToken) {
    setEditingToken(token)
    setTokenEditorOpen(true)
  }

  function saveToken(token: ProgramToken) {
    onTokensChange(editingToken
      ? tokens.map((item) => item.id === token.id ? token : item)
      : [...tokens, token])
    setTokenEditorOpen(false)
    setEditingToken(undefined)
  }

  return <>
    <div className='executionSettingsHeader'><strong>Program Settings</strong><small>{type}</small></div>
    <div className='executionSettingsBody'>
      <label className='propertyField'>Program Name<input value={name} onChange={(event) => onNameChange(event.target.value)} /></label>
      <label className='propertyField'>Program Status<select><option>Draft</option><option>Active</option><option>Paused</option></select></label>
      <label className='propertyField'>Success / Goal<select value={goal} onChange={(event) => onGoalChange(event.target.value)}><option>Person reaches MQL status</option><option>Opportunity created</option><option>Event attended</option></select></label>
      <label className='propertyField'>Campaign Folder<select><option>Lifecycle / Nurture</option><option>Campaigns / Product Launch</option><option>Events / Webinars</option></select></label>
      <section className='programTokensSection'>
        <header><div><span>{'{{}}'}</span><div><strong>Program Tokens</strong><small>Available to every flow step</small></div></div><button type='button' onClick={() => openTokenEditor()}>+ Add Token</button></header>
        <div className='programTokenHead'><span>Name</span><span>Type</span><span>Default Value</span><span /></div>
        <div className='programTokenList'>
          {tokens.map((token) => <div className='programTokenRow' key={token.id}><span>{`my.${token.name}`}</span><span>{token.type}</span><span className={!token.defaultValue ? 'missing' : ''}>{token.defaultValue || 'Missing value'}</span><span><button type='button' title='Edit token' onClick={() => openTokenEditor(token)}>✎</button><button type='button' title='Delete token' onClick={() => onTokensChange(tokens.filter((item) => item.id !== token.id))}>×</button></span></div>)}
        </div>
        <button type='button' className='button outline accent fullButton' onClick={() => openTokenEditor()}>{'{{}}'} Add Token</button>
      </section>
      <div className='executionAudienceSummary'><span>Current membership</span><strong>1,284 people</strong><small>Smart List membership updates dynamically</small></div>
      <button type='button' className='button outline accent fullButton'>Save as Program Template</button>
    </div>
    {tokenEditorOpen && <TokenEditorModal open token={editingToken} onClose={() => setTokenEditorOpen(false)} onSave={saveToken} />}
  </>
}

function TokenEditorModal({ open, token, onClose, onSave }: { open: boolean; token?: ProgramToken; onClose: () => void; onSave: (token: ProgramToken) => void }) {
  const [name, setName] = useState(token?.name ?? '')
  const [type, setType] = useState<TokenType>(token?.type ?? 'Text')
  const [defaultValue, setDefaultValue] = useState(token?.defaultValue ?? '')
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '')

  return <Modal title={token ? 'Edit Program Token' : 'Add Program Token'} open={open} onClose={onClose}>
    <div className='tokenEditorModal'>
      <label className='modalField'>Token Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder='EventTitle' /></label>
      <div className='tokenReferencePreview'><span>Reference this token as</span><strong>{`{{my.${safeName || 'YourTokenName'}}}`}</strong></div>
      <label className='modalField'>Token Type<select value={type} onChange={(event) => { setType(event.target.value as TokenType); setDefaultValue('') }}><option>Text</option><option>Number</option><option>Date</option><option>Boolean</option><option>Image URL</option></select></label>
      <label className='modalField'>Default Value{type === 'Boolean' ? <select value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)}><option value=''>Select value</option><option>true</option><option>false</option></select> : <input type={type === 'Date' ? 'date' : type === 'Number' ? 'number' : type === 'Image URL' ? 'url' : 'text'} value={defaultValue} onChange={(event) => setDefaultValue(event.target.value)} placeholder={type === 'Image URL' ? 'https://...' : 'Enter a default value'} />}</label>
      <p>Program Tokens are local to this program and are automatically available in every flow step.</p>
      <footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!safeName} onClick={() => onSave({ id: token?.id ?? `token-${Date.now()}`, name: safeName, type, defaultValue })}>Save Token</button></footer>
    </div>
  </Modal>
}

function NodeConfiguration({ node, smartListMode, programTokens, onModeChange, onClose, onApply }: { node: FlowNode; smartListMode: 'Trigger' | 'Filter'; programTokens: ProgramToken[]; onModeChange: (mode: 'Trigger' | 'Filter') => void; onClose: () => void; onApply: () => void }) {
  return <><div className='nodeConfigTitle'><div><span>{iconByKind[node.kind]}</span><div><strong>Configure {node.title}</strong><small>Marketo Flow Step</small></div></div><button type='button' onClick={onClose}>×</button></div><div className='executionSettingsBody'>{node.kind === 'smart-list' ? <SmartListConfig mode={smartListMode} onModeChange={onModeChange} /> : node.kind === 'email' ? <SendEmailConfig programTokens={programTokens} showTriggerTokens={smartListMode === 'Trigger'} /> : node.kind === 'wait' ? <WaitConfig /> : node.kind === 'choice' ? <ChoiceConfig /> : node.kind === 'smart-filter' ? <SmartListFilterConfig /> : node.kind === 'change-data' ? <ChangeDataConfig /> : node.kind === 'alert' ? <SendAlertConfig /> : node.kind === 'end' ? <EndConfig /> : <GenericConfig node={node} />}<footer className='nodeConfigFooter'><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={onApply}>Apply</button></footer></div></>
}

function SmartListConfig({ mode, onModeChange }: { mode: 'Trigger' | 'Filter'; onModeChange: (mode: 'Trigger' | 'Filter') => void }) {
  return <><div className='smartListModeToggle'><button type='button' className={mode === 'Trigger' ? 'active' : ''} onClick={() => onModeChange('Trigger')}>Trigger</button><button type='button' className={mode === 'Filter' ? 'active' : ''} onClick={() => onModeChange('Filter')}>Filter</button></div>{mode === 'Trigger' ? <><label className='propertyField'>Trigger Event<select><option>Fills Out Form</option><option>Clicks Link in Email</option><option>Visits Web Page</option><option>Data Value Changes</option></select></label><label className='propertyField'>Form<select><option>Enterprise Demo Request</option><option>Contact Sales Form</option><option>Any Form</option></select></label><div className='constraintBuilder'><header><strong>Constraints</strong><button type='button'>+ Add Constraint</button></header><div><select><option>Web Page</option></select><select><option>is</option></select><input defaultValue='/enterprise-demo' /></div></div></> : <><label className='propertyField'>Use Existing Smart List<select><option>New MQLs</option><option>Enterprise Prospects</option><option>High Intent Accounts</option></select></label><InlineQueryBuilder /></>}</>
}

type TokenField = 'subject' | 'preheader' | 'body'
type TokenTab = 'program' | 'person' | 'system' | 'trigger'

interface PickerToken {
  reference: string
  label: string
  value: string
  source: TokenTab
}

const personFieldTokens: PickerToken[] = [
  { reference: 'Person.FirstName', label: 'First Name', value: 'John', source: 'person' },
  { reference: 'Person.LastName', label: 'Last Name', value: 'Smith', source: 'person' },
  { reference: 'Person.Company', label: 'Company', value: 'Northlane Systems', source: 'person' },
  { reference: 'Person.Score', label: 'Score', value: '82', source: 'person' },
  { reference: 'Person.Email', label: 'Email', value: 'john@northlane.com', source: 'person' },
]
const systemTokens: PickerToken[] = [
  { reference: 'System.Date', label: 'System Date', value: 'July 26, 2026', source: 'system' },
  { reference: 'System.Year', label: 'System Year', value: '2026', source: 'system' },
  { reference: 'System.SenderName', label: 'Sender Name', value: 'Maya Chen', source: 'system' },
]
const triggerTokens: PickerToken[] = [
  { reference: 'Trigger.FormName', label: 'Trigger Form Name', value: 'Webinar Registration', source: 'trigger' },
  { reference: 'Trigger.ClickLink', label: 'Clicked Link', value: 'View Event', source: 'trigger' },
  { reference: 'Trigger.ScoreChange', label: 'Score Change', value: '+50', source: 'trigger' },
]

function SendEmailConfig({ programTokens, showTriggerTokens }: { programTokens: ProgramToken[]; showTriggerTokens: boolean }) {
  const [subject, setSubject] = useState('Reminder: {{my.EventTitle}} is coming up')
  const [preheader, setPreheader] = useState('Join {{my.SpeakerName}} on {{my.EventDate}}')
  const [body, setBody] = useState('Dear {{Person.FirstName}}, join {{my.SpeakerName}} at {{my.EventTitle}} on {{my.EventDate}}.')
  const [pickerField, setPickerField] = useState<TokenField | null>(null)
  const subjectRef = useRef<HTMLInputElement | null>(null)
  const preheaderRef = useRef<HTMLInputElement | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)

  const allValues = `${subject} ${preheader} ${body}`
  const usedReferences = Array.from(allValues.matchAll(/\{\{([^}]+)}}/g), (match) => match[1])

  function insertToken(reference: string) {
    const insertion = `{{${reference}}}`
    if (pickerField === 'subject') insertAtCursor(subjectRef.current, subject, setSubject, insertion)
    if (pickerField === 'preheader') insertAtCursor(preheaderRef.current, preheader, setPreheader, insertion)
    if (pickerField === 'body') insertAtCursor(bodyRef.current, body, setBody, insertion)
    setPickerField(null)
  }

  const resolvedBody = resolveTokens(body, programTokens)

  return <>
    <label className='propertyField'>Email<div className='configSearchSelect'><WireframeIcon name='search' className='iconTiny' /><input defaultValue='Webinar Reminder Email' /></div></label>
    <div className='selectedEmailPreview'><div className='emailPreviewThumb'><i /><b /><i /><i /></div><div><strong>Webinar Reminder Email</strong><small>Approved · Contains 4 tokens</small><button type='button'>Open in Content ↗</button></div></div>
    <TokenInput label='Subject' field='subject' inputRef={subjectRef} value={subject} onChange={setSubject} onOpenPicker={setPickerField} programTokens={programTokens} />
    <TokenInput label='Preheader' field='preheader' inputRef={preheaderRef} value={preheader} onChange={setPreheader} onOpenPicker={setPickerField} programTokens={programTokens} />
    <TokenTextArea label='Body' field='body' inputRef={bodyRef} value={body} onChange={setBody} onOpenPicker={setPickerField} programTokens={programTokens} />
    {pickerField && <TokenPicker programTokens={programTokens} usedReferences={usedReferences} showTriggerTokens={showTriggerTokens} onInsert={insertToken} onClose={() => setPickerField(null)} />}
    <div className='resolvedTokenPreview'><span>Sample Preview</span><p>{resolvedBody}</p></div>
    <div className='emailTokenSummary'><strong>This email uses:</strong><p><button type='button'>Program Tokens: {programTokens.filter((token) => usedReferences.includes(`my.${token.name}`)).map((token) => `my.${token.name}`).join(', ') || 'None'}</button><button type='button'>Person Fields: {personFieldTokens.filter((token) => usedReferences.includes(token.reference)).map((token) => token.label.replace(' ', '')).join(', ') || 'None'}</button></p></div>
    <label className='propertyField'>Suppression List (optional)<select><option>Global Unsubscribes</option><option>Competitors</option><option>None</option></select></label>
    <label className='toggleProperty'><span><strong>Track opens and clicks</strong><small>Write activity to the person record</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label>
  </>
}

function insertAtCursor(element: HTMLInputElement | HTMLTextAreaElement | null, value: string, setValue: (value: string) => void, insertion: string) {
  const start = element?.selectionStart ?? value.length
  const end = element?.selectionEnd ?? start
  setValue(`${value.slice(0, start)}${insertion}${value.slice(end)}`)
}

function TokenInput({ label, field, inputRef, value, onChange, onOpenPicker, programTokens }: { label: string; field: TokenField; inputRef: React.RefObject<HTMLInputElement | null>; value: string; onChange: (value: string) => void; onOpenPicker: (field: TokenField) => void; programTokens: ProgramToken[] }) {
  return <label className='propertyField tokenAwareField'><span>{label}<button type='button' onClick={() => onOpenPicker(field)}>{'{{}}'} Insert Token</button></span><input ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} /><TokenPillPreview value={value} programTokens={programTokens} /></label>
}

function TokenTextArea({ label, field, inputRef, value, onChange, onOpenPicker, programTokens }: { label: string; field: TokenField; inputRef: React.RefObject<HTMLTextAreaElement | null>; value: string; onChange: (value: string) => void; onOpenPicker: (field: TokenField) => void; programTokens: ProgramToken[] }) {
  return <label className='propertyField tokenAwareField'><span>{label}<button type='button' onClick={() => onOpenPicker(field)}>{'{{}}'} Insert Token</button></span><textarea ref={inputRef} value={value} onChange={(event) => onChange(event.target.value)} /><TokenPillPreview value={value} programTokens={programTokens} /></label>
}

function TokenPillPreview({ value, programTokens }: { value: string; programTokens: ProgramToken[] }) {
  const references = Array.from(value.matchAll(/\{\{([^}]+)}}/g), (match) => match[1])
  if (!references.length) return null
  return <div className='inlineTokenPills'>{references.map((reference, index) => { const localToken = reference.startsWith('my.') ? programTokens.find((token) => `my.${token.name}` === reference) : undefined; const missing = Boolean(localToken && !localToken.defaultValue); return <span key={`${reference}-${index}`} className={missing ? 'missing' : ''}>{missing && <i>!</i>}{`{{${reference}}}`}</span> })}</div>
}

function TokenPicker({ programTokens, usedReferences, showTriggerTokens, onInsert, onClose }: { programTokens: ProgramToken[]; usedReferences: string[]; showTriggerTokens: boolean; onInsert: (reference: string) => void; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TokenTab>('program')
  const [query, setQuery] = useState('')
  const localTokens: PickerToken[] = programTokens.map((token) => ({ reference: `my.${token.name}`, label: token.name, value: token.defaultValue, source: 'program' }))
  const tokensByTab: Record<TokenTab, PickerToken[]> = { program: localTokens, person: personFieldTokens, system: systemTokens, trigger: triggerTokens }
  const visibleTokens = tokensByTab[activeTab].filter((token) => `${token.label} ${token.reference}`.toLowerCase().includes(query.toLowerCase()))
  const tabs: Array<{ key: TokenTab; label: string; icon: string }> = [{ key: 'program', label: 'Program Tokens', icon: '▱' }, { key: 'person', label: 'Person Fields', icon: '♙' }, { key: 'system', label: 'System Tokens', icon: '⚙' }, ...(showTriggerTokens ? [{ key: 'trigger' as TokenTab, label: 'Trigger Tokens', icon: '⚡' }] : [])]

  return <div className='tokenPickerPopover'><header><strong>Insert Token</strong><button type='button' onClick={onClose}>×</button></header><div className='tokenPickerTabs'>{tabs.map((tab) => <button type='button' key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}><span>{tab.icon}</span>{tab.label}</button>)}</div><label className='tokenPickerSearch'><WireframeIcon name='search' className='iconTiny' /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search tokens...' /></label><div className='tokenPickerList'>{visibleTokens.map((token) => <button type='button' key={token.reference} className={usedReferences.includes(token.reference) ? 'used' : ''} onClick={() => onInsert(token.reference)}><span>{`{{${token.reference}}}`}</span><small>{token.value || 'No default value'}</small>{usedReferences.includes(token.reference) && <em>Used</em>}</button>)}{visibleTokens.length === 0 && <p>No tokens found.</p>}</div></div>
}

function resolveTokens(value: string, programTokens: ProgramToken[]) {
  const samples: Record<string, string> = Object.fromEntries([...programTokens.map((token) => [`my.${token.name}`, token.name === 'EventDate' && token.defaultValue ? 'August 15' : token.defaultValue]), ...personFieldTokens.map((token) => [token.reference, token.value]), ...systemTokens.map((token) => [token.reference, token.value]), ...triggerTokens.map((token) => [token.reference, token.value])])
  return value.replace(/\{\{([^}]+)}}/g, (match, reference: string) => samples[reference] || match)
}
function WaitConfig() { const [type, setType] = useState<'duration' | 'until'>('duration'); return <><div className='smartListModeToggle'><button type='button' className={type === 'duration' ? 'active' : ''} onClick={() => setType('duration')}>Duration</button><button type='button' className={type === 'until' ? 'active' : ''} onClick={() => setType('until')}>Until Date/Time</button></div>{type === 'duration' ? <div className='durationFields'><label className='propertyField'>Wait For<input type='number' defaultValue='3' /></label><label className='propertyField'>Unit<select><option>Days</option><option>Hours</option><option>Weeks</option></select></label></div> : <><label className='propertyField'>Until Date<input type='date' defaultValue='2026-08-14' /></label><label className='propertyField'>At Time<input type='time' defaultValue='09:00' /></label></>}<label className='toggleProperty'><span>Use person time zone</span><input type='checkbox' className='toggleSwitch' defaultChecked /></label></> }
function ChoiceConfig() { return <><label className='propertyField'>Attribute / Behaviour Condition<select><option>Clicks Link in Email</option><option>Opens Email</option><option>Program Status Changes</option></select></label><label className='propertyField'>Email<select><option>Welcome Email</option><option>Any Email</option></select></label><label className='propertyField'>Link<select><option>Link A — View Product</option><option>Any Link</option></select></label><div className='choiceBranches'><header><strong>Branches</strong><button type='button'>+ Add Branch</button></header><div><i className='yes' /><span>Clicked Link A</span><button type='button'>Edit</button></div><div><i /><span>Did Not Click</span><button type='button'>Edit</button></div></div></> }
function SmartListFilterConfig() { return <><div className='multiBranchRules'><header><strong>Smart List Filter Branches</strong><button type='button'>+ Add Branch</button></header>{['High Intent', 'Mid Intent', 'Default'].map((branch, index) => <section key={branch}><span>{index + 1}</span><div><strong>{branch}</strong><small>{index === 0 ? 'Score greater than 80' : index === 1 ? 'Score between 40 and 80' : 'All other people'}</small></div><button type='button'>•••</button></section>)}</div></> }
function ChangeDataConfig() { return <><div className='dataValueRows'><header><strong>Change Data Value</strong><button type='button'>+ Add Row</button></header><div><label>Field<select><option>Person Score</option><option>Lifecycle Status</option><option>Lead Source</option></select></label><label>Operator<select><option>Change</option><option>Increment</option><option>Decrement</option></select></label><label>Value<input defaultValue='+50' /></label></div></div></> }
function SendAlertConfig() { return <><label className='propertyField'>Recipient<select><option>Assigned Sales Owner</option><option>Account Owner</option><option>Custom Email</option></select></label><label className='propertyField'>Subject<input defaultValue='New high-intent lead: {{lead.Full Name}}' /></label><label className='propertyField'>Message<textarea defaultValue='A new person submitted the Enterprise Demo Request form. Review their activity and follow up.' /></label><button type='button' className='button outline accent fullButton'>Insert Token</button></> }
function EndConfig() { return <><label className='propertyField'>End Label<input defaultValue='Goal: Converted' /></label><label className='toggleProperty'><span><strong>Mark as program success</strong><small>Update program membership status</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label></> }
function GenericConfig({ node }: { node: FlowNode }) { return <><label className='propertyField'>Flow Step Name<input defaultValue={node.title} /></label><label className='propertyField'>Description<textarea defaultValue={node.subtitle} /></label></> }

function InlineQueryBuilder() { return <div className='inlineQueryBuilder'><header><strong>Smart List Query Builder</strong><button type='button'>Open in CRM ↗</button></header><div><span>AND</span><select><option>Lifecycle Stage</option></select><select><option>is</option></select><input defaultValue='MQL' /></div><div><span>AND</span><select><option>Person Score</option></select><select><option>greater than</option></select><input defaultValue='65' /></div><button type='button'>+ Add Filter</button></div> }
