import { useState } from 'react'
import type { ActivityNode, ProgramStatus } from '../MarketingActivitiesPhaseOne'
import { DefaultProgramAssets, DefaultProgramMembers, DefaultProgramOverview } from './DefaultProgramViews'
import { EmailProgramEmailTab } from './EmailProgramEmailTab'
import { FlowEditor } from './FlowEditor'
import { ResultsView } from './ResultsView'
import { ScheduleEditor } from './ScheduleEditor'
import { SmartListEditor } from './SmartListEditor'
import { EventAssetsTab, EventMembersTab, EventScheduleTab, EventSetupTab } from '../phase3/EventProgramViews'
import { EngagementContentTab, EngagementMembersTab, EngagementSettingsTab, EngagementStreamsTab } from '../phase3/EngagementProgramViews'
import { Modal } from '../../common/Modal'

type SmartCampaignTab = 'smart-list' | 'flow' | 'schedule' | 'results'
type EmailProgramTab = 'smart-list' | 'email' | 'schedule' | 'results'
type DefaultProgramTab = 'overview' | 'assets' | 'members'
type EventProgramTab = 'setup' | 'assets' | 'members' | 'schedule'
type EngagementProgramTab = 'streams' | 'content' | 'members' | 'settings'
type ProgramTab = SmartCampaignTab | EmailProgramTab | DefaultProgramTab | EventProgramTab | EngagementProgramTab

export interface SharedProgramToken {
  id: number
  name: string
  type: 'Text' | 'Number' | 'Date' | 'Boolean' | 'Image URL'
  value: string
}

interface ProgramEditorProps {
  node: ActivityNode
  onRename: (name: string) => void
  onStatusChange: (status: ProgramStatus) => void
}

const typeLabels: Partial<Record<ActivityNode['type'], string>> = {
  'smart-campaign': 'Smart Campaign',
  'email-program': 'Email Program',
  'default-program': 'Default Program',
  'event-program': 'Event Program',
  'engagement-program': 'Engagement Program',
}

export function ProgramEditor({ node, onRename, onStatusChange }: ProgramEditorProps) {
  const tabs: Array<{ key: ProgramTab; label: string }> = node.type === 'smart-campaign'
    ? [{ key: 'smart-list', label: 'Smart List' }, { key: 'flow', label: 'Flow' }, { key: 'schedule', label: 'Schedule' }, { key: 'results', label: 'Results' }]
    : node.type === 'email-program'
      ? [{ key: 'smart-list', label: 'Smart List' }, { key: 'email', label: 'Email' }, { key: 'schedule', label: 'Schedule' }, { key: 'results', label: 'Results' }]
      : node.type === 'event-program'
        ? [{ key: 'setup', label: 'Setup' }, { key: 'assets', label: 'Assets' }, { key: 'members', label: 'Members' }, { key: 'schedule', label: 'Schedule' }]
        : node.type === 'engagement-program'
          ? [{ key: 'streams', label: 'Streams' }, { key: 'content', label: 'Content' }, { key: 'members', label: 'Members' }, { key: 'settings', label: 'Settings' }]
          : [{ key: 'overview', label: 'Overview' }, { key: 'assets', label: 'Assets' }, { key: 'members', label: 'Members' }]
  const [activeTab, setActiveTab] = useState<ProgramTab>(tabs[0].key)
  const [name, setName] = useState(node.name)
  const [status, setStatus] = useState<ProgramStatus>(node.status ?? 'draft')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tokens, setTokens] = useState<SharedProgramToken[]>([
    { id: 1, name: 'ProgramName', type: 'Text', value: node.name },
    { id: 2, name: 'OwnerName', type: 'Text', value: 'Maya Chen' },
    { id: 3, name: 'EventDate', type: 'Date', value: node.type === 'event-program' ? '2026-08-15' : '' },
  ])

  function toggleActive() {
    const nextStatus: ProgramStatus = status === 'active' ? 'paused' : 'active'
    setStatus(nextStatus)
    onStatusChange(nextStatus)
  }

  function saveName() {
    if (name.trim() && name.trim() !== node.name) onRename(name.trim())
  }

  return <section className='phase2ProgramEditor'>
    <header className='programEditorHeader'>
      <div className='programTitleGroup'><input value={name} onChange={(event) => setName(event.target.value)} onBlur={saveName} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label='Program name' /><span className='programTypeTag'>{typeLabels[node.type]}</span><span className={`editorProgramStatus status-${status}`}><i />{status[0].toUpperCase() + status.slice(1)}</span></div>
      <div className='programHeaderActions'><button type='button' className='programSettingsButton' title='Program Settings' onClick={() => setSettingsOpen(true)}>⚙</button><button type='button' className={`button ${status === 'active' ? 'deactivateButton' : 'solid'}`} onClick={toggleActive}>{status === 'active' ? 'Deactivate' : 'Activate'}</button></div>
    </header>
    <nav className='programEditorTabs' aria-label={`${typeLabels[node.type]} sections`}>{tabs.map((tab) => <button type='button' key={tab.key} className={activeTab === tab.key ? 'active' : ''} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>)}</nav>
    <main className='programEditorBody'>{node.type === 'smart-campaign' ? <SmartCampaignContent tab={activeTab as SmartCampaignTab} active={status === 'active'} tokens={tokens} onActivate={toggleActive} /> : node.type === 'email-program' ? <EmailProgramContent tab={activeTab as EmailProgramTab} active={status === 'active'} onActivate={toggleActive} /> : node.type === 'event-program' ? <EventProgramContent tab={activeTab as EventProgramTab} /> : node.type === 'engagement-program' ? <EngagementProgramContent tab={activeTab as EngagementProgramTab} name={name} onNameChange={(value) => { setName(value); onRename(value) }} /> : <DefaultProgramContent tab={activeTab as DefaultProgramTab} name={name} onNameChange={(value) => { setName(value); onRename(value) }} />}</main>
    {settingsOpen && <ProgramSettingsPanel node={node} name={name} tokens={tokens} onTokensChange={setTokens} onClose={() => setSettingsOpen(false)} />}
  </section>
}

function SmartCampaignContent({ tab, active, tokens, onActivate }: { tab: SmartCampaignTab; active: boolean; tokens: SharedProgramToken[]; onActivate: () => void }) {
  if (tab === 'smart-list') return <SmartListEditor />
  if (tab === 'flow') return <FlowEditor programTokens={tokens.map((token) => `{{my.${token.name}}}`)} />
  if (tab === 'schedule') return <ScheduleEditor variant='smart-campaign' active={active} onActivate={onActivate} />
  return <ResultsView variant='smart-campaign' />
}

function EmailProgramContent({ tab, active, onActivate }: { tab: EmailProgramTab; active: boolean; onActivate: () => void }) {
  if (tab === 'smart-list') return <SmartListEditor filterOnly />
  if (tab === 'email') return <EmailProgramEmailTab />
  if (tab === 'schedule') return <ScheduleEditor variant='email-program' active={active} onActivate={onActivate} />
  return <ResultsView variant='email-program' />
}

function DefaultProgramContent({ tab, name, onNameChange }: { tab: DefaultProgramTab; name: string; onNameChange: (name: string) => void }) {
  if (tab === 'overview') return <DefaultProgramOverview name={name} onNameChange={onNameChange} />
  if (tab === 'assets') return <DefaultProgramAssets />
  return <DefaultProgramMembers />
}

function EventProgramContent({ tab }: { tab: EventProgramTab }) {
  if (tab === 'setup') return <EventSetupTab />
  if (tab === 'assets') return <EventAssetsTab />
  if (tab === 'members') return <EventMembersTab />
  return <EventScheduleTab />
}

function EngagementProgramContent({ tab, name, onNameChange }: { tab: EngagementProgramTab; name: string; onNameChange: (name: string) => void }) {
  if (tab === 'streams') return <EngagementStreamsTab />
  if (tab === 'content') return <EngagementContentTab />
  if (tab === 'members') return <EngagementMembersTab />
  return <EngagementSettingsTab programName={name} onProgramNameChange={onNameChange} />
}

function ProgramSettingsPanel({ node, name, tokens, onTokensChange, onClose }: { node: ActivityNode; name: string; tokens: SharedProgramToken[]; onTokensChange: (tokens: SharedProgramToken[]) => void; onClose: () => void }) {
  const [tokenModalOpen, setTokenModalOpen] = useState(false)
  const [editingToken, setEditingToken] = useState<SharedProgramToken | null>(null)
  function saveToken(token: SharedProgramToken) {
    onTokensChange(editingToken ? tokens.map((item) => item.id === token.id ? token : item) : [...tokens, { ...token, id: Math.max(0, ...tokens.map((item) => item.id)) + 1 }])
    setTokenModalOpen(false)
    setEditingToken(null)
  }
  return <><div className='programSettingsScrim' onClick={onClose} /><aside className='phase2ProgramSettings phase3TokenSettings'><header><div><span>⚙</span><div><strong>Program Settings</strong><small>{name}</small></div></div><button type='button' onClick={onClose}>×</button></header><div className='phase2SettingsBody'><section><h4>General</h4><label>Program ID<input value={`PRG-${node.id.replace(/\D/g, '') || '10482'}`} readOnly /></label><label>Workspace<select><option>Default Workspace</option><option>Enterprise Marketing</option></select></label><label>Folder<select><option>Marketing Activities / Lifecycle</option><option>Marketing Activities / Demand Generation</option></select></label></section><section><h4>Communication Limits</h4><label className='phase2ToggleRow'><span><strong>Respect communication limits</strong><small>Skip people who exceeded frequency limits</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><label>Priority<select><option>Normal</option><option>Operational — ignore limits</option><option>Low</option></select></label></section><section className='sharedTokensSection'><header><div><h4>Program Tokens</h4><small>Available in assets and flow steps</small></div><button type='button' onClick={() => { setEditingToken(null); setTokenModalOpen(true) }}>＋ Add Token</button></header><div className='sharedTokensHead'><span>Name</span><span>Type</span><span>Default Value</span><span /></div>{tokens.map((token) => <div className='sharedTokenRow' key={token.id}><code>{`{{my.${token.name}}}`}</code><span>{token.type}</span><span className={!token.value ? 'missing' : ''}>{token.value || 'Missing value'}</span><span><button type='button' onClick={() => { setEditingToken(token); setTokenModalOpen(true) }}>✎</button><button type='button' onClick={() => onTokensChange(tokens.filter((item) => item.id !== token.id))}>×</button></span></div>)}</section><section><h4>Advanced</h4><label className='phase2ToggleRow'><span><strong>Block non-operational emails</strong><small>Honor unsubscribe and marketing suspension</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label><button type='button' className='button outline accent fullButton'>Manage Custom Statuses</button></section></div><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={onClose}>Save Settings</button></footer></aside>{tokenModalOpen && <SharedTokenModal token={editingToken} onClose={() => setTokenModalOpen(false)} onSave={saveToken} />}</>
}

function SharedTokenModal({ token, onClose, onSave }: { token: SharedProgramToken | null; onClose: () => void; onSave: (token: SharedProgramToken) => void }) {
  const [name, setName] = useState(token?.name ?? '')
  const [type, setType] = useState<SharedProgramToken['type']>(token?.type ?? 'Text')
  const [value, setValue] = useState(token?.value ?? '')
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '')
  return <Modal title={token ? 'Edit Program Token' : 'Add Program Token'} open onClose={onClose}><div className='sharedTokenModal'><label>Token Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><div><span>Reference</span><code>{`{{my.${safeName || 'TokenName'}}}`}</code></div><label>Type<select value={type} onChange={(event) => setType(event.target.value as SharedProgramToken['type'])}><option>Text</option><option>Number</option><option>Date</option><option>Boolean</option><option>Image URL</option></select></label><label>Default Value{type === 'Boolean' ? <select value={value} onChange={(event) => setValue(event.target.value)}><option value=''>Select value</option><option>true</option><option>false</option></select> : <input type={type === 'Date' ? 'date' : type === 'Number' ? 'number' : type === 'Image URL' ? 'url' : 'text'} value={value} onChange={(event) => setValue(event.target.value)} />}</label><p>Program Tokens resolve in asset previews and can be inserted into text fields using the token picker.</p><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!safeName} onClick={() => onSave({ id: token?.id ?? 0, name: safeName, type, value })}>Save Token</button></footer></div></Modal>
}
