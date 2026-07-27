import { useMemo, useState } from 'react'
import { AccountsView } from './components/crm/AccountsView'
import { AccountDetailPanel } from './components/crm/AccountDetailPanel'
import { ContentModule } from './components/content/ContentModule'
import { ContentSubNav } from './components/content/ContentSubNav'
import { MarketingActivitiesPhaseOne } from './components/execution/MarketingActivitiesPhaseOne'
import { AnalyticsModule } from './components/analytics/AnalyticsModule'
import { AnalyticsSubNav } from './components/analytics/AnalyticsSubNav'
import { PeopleView } from './components/crm/PeopleView'
import { PersonDetailPanel } from './components/crm/PersonDetailPanel'
import { SmartListModal } from './components/crm/SmartListModal'
import { SmartListEditorPage } from './components/crm/SmartListEditorPage'
import { SmartListsView } from './components/crm/SmartListsView'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar, type CreateOption } from './components/layout/TopBar'
import { accountRows, peopleRows, smartLists } from './data/crmData'
import type { CrmSubTabKey, MainNavKey } from './types/crm'
import type { ContentTabKey } from './types/content'
import type { AnalyticsTabKey } from './types/analytics'

const sectionNameByMainTab: Record<MainNavKey, string> = {
  crm: 'CRM',
  content: 'Content',
  execution: 'Marketing Activities',
  analytics: 'Analytics',
  integrations: 'Integrations',
  calendar: 'Calendar',
  admin: 'Admin',
}

function App() {
  const [activeMainTab, setActiveMainTab] = useState<MainNavKey>('crm')
  const [activeCrmTab, setActiveCrmTab] = useState<CrmSubTabKey>('people')
  const [activeContentTab, setActiveContentTab] = useState<ContentTabKey>('all-assets')
  const [contentBuilderOpen, setContentBuilderOpen] = useState(false)
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<AnalyticsTabKey>('dashboards')
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [smartListModalOpen, setSmartListModalOpen] = useState(false)
  const [crmSmartLists, setCrmSmartLists] = useState(smartLists)
  const [smartListDraft, setSmartListDraft] = useState<{ name: string; description: string } | null>(null)
  const [marketingSearchQuery, setMarketingSearchQuery] = useState('')

  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [openPersonId, setOpenPersonId] = useState<string | null>(null)
  const [openAccountId, setOpenAccountId] = useState<string | null>(null)

  const activePerson = useMemo(
    () => peopleRows.find((person) => person.id === openPersonId),
    [openPersonId],
  )

  const activeAccount = useMemo(
    () => accountRows.find((account) => account.id === openAccountId),
    [openAccountId],
  )

  function handleMainTabChange(tab: MainNavKey) {
    setActiveMainTab(tab)
    setContentBuilderOpen(false)
    setCreateMenuOpen(false)
    setOpenPersonId(null)
    setOpenAccountId(null)
    setSelectedPeopleIds([])
    setSelectedAccountIds([])
  }

  function handleCrmTabChange(tab: CrmSubTabKey) {
    setActiveCrmTab(tab)
    setOpenPersonId(null)
    setOpenAccountId(null)
    setSelectedPeopleIds([])
    setSelectedAccountIds([])
    if (tab !== 'smart-lists') setSmartListDraft(null)
  }

  function handleCreateSelect(option: CreateOption) {
    setCreateMenuOpen(false)

    if (activeMainTab === 'content') {
      const contentTabByOption: Record<string, ContentTabKey> = {
        Email: 'emails',
        'Landing Page': 'landing-pages',
        Form: 'forms',
        Snippet: 'snippets',
        Template: 'templates',
        'Upload File': 'files',
      }
      setActiveContentTab(contentTabByOption[option] ?? 'all-assets')
      setContentBuilderOpen(false)
      return
    }

    if (activeMainTab === 'execution') {
      return
    }

    if (activeMainTab === 'analytics') {
      if (option === 'Report') setActiveAnalyticsTab('reports')
      if (option === 'Attribution Model') setActiveAnalyticsTab('attribution')
      return
    }

    setActiveMainTab('crm')

    if (option === 'New Person') {
      setActiveCrmTab('people')
      return
    }

    if (option === 'New Account') {
      setActiveCrmTab('accounts')
      return
    }

    setActiveCrmTab('smart-lists')
    setSmartListModalOpen(true)
  }

  function togglePeopleRow(id: string) {
    setSelectedPeopleIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  function toggleAccountRow(id: string) {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  function renderMainContent() {
    if (activeMainTab === 'analytics') {
      return <AnalyticsModule activeTab={activeAnalyticsTab} />
    }

    if (activeMainTab === 'execution') {
      return <MarketingActivitiesPhaseOne query={marketingSearchQuery} />
    }

    if (activeMainTab === 'content') {
      return (
        <ContentModule
          key={activeContentTab}
          activeTab={activeContentTab}
          onBuilderStateChange={setContentBuilderOpen}
        />
      )
    }

    if (activeMainTab !== 'crm') {
      return (
        <section className='placeholderModule'>
          <h2>{sectionNameByMainTab[activeMainTab]} Module</h2>
          <p>
            This wireframe keeps the platform shell ready for expansion while CRM
            interactions are represented in full detail.
          </p>
        </section>
      )
    }

    if (activeCrmTab === 'people') {
      return (
        <PeopleView
          rows={peopleRows}
          selectedIds={selectedPeopleIds}
          onToggleRow={togglePeopleRow}
          onToggleAll={(selected) =>
            setSelectedPeopleIds(selected ? peopleRows.map((person) => person.id) : [])
          }
          onOpenPerson={setOpenPersonId}
          onCreateSmartListFromView={() => setSmartListModalOpen(true)}
        />
      )
    }

    if (activeCrmTab === 'accounts') {
      return (
        <AccountsView
          rows={accountRows}
          selectedIds={selectedAccountIds}
          onToggleRow={toggleAccountRow}
          onToggleAll={(selected) =>
            setSelectedAccountIds(
              selected ? accountRows.map((account) => account.id) : [],
            )
          }
          onOpenAccount={setOpenAccountId}
        />
      )
    }

    if (smartListDraft) {
      return <SmartListEditorPage initialName={smartListDraft.name} description={smartListDraft.description} rows={peopleRows} onCancel={() => setSmartListDraft(null)} onSave={(name, description, memberCount) => { setCrmSmartLists((current) => [...current, { id: `sl-created-${current.length + 1}`, name, description: description || 'Dynamic CRM segment', memberCount, lastModified: 'Just now' }]); setSmartListDraft(null) }} />
    }

    return (
      <SmartListsView
        lists={crmSmartLists}
        onOpenCreateSmartList={() => setSmartListModalOpen(true)}
      />
    )
  }

  return (
    <div className='appShell'>
      <Sidebar activeTab={activeMainTab} onTabChange={handleMainTabChange} searchValue={marketingSearchQuery} onSearchChange={setMarketingSearchQuery} activeCrmTab={activeCrmTab} onCrmTabChange={handleCrmTabChange} />

      <div className='mainPane'>
        <TopBar
          sectionName={sectionNameByMainTab[activeMainTab]}
          createMenuOpen={createMenuOpen}
          onToggleCreateMenu={() => setCreateMenuOpen((prev) => !prev)}
          onCloseCreateMenu={() => setCreateMenuOpen(false)}
          onCreateSelect={handleCreateSelect}
          createOptions={
            activeMainTab === 'content'
              ? ['Email', 'Landing Page', 'Form', 'Snippet', 'Template', 'Upload File']
              : activeMainTab === 'analytics'
                  ? ['Dashboard', 'Report', 'Attribution Model']
              : undefined
          }
          hideCreate={activeMainTab === 'execution'}
        />

        {activeMainTab === 'content' && !contentBuilderOpen && (
          <ContentSubNav activeTab={activeContentTab} onChange={setActiveContentTab} />
        )}

        {activeMainTab === 'analytics' && (
          <AnalyticsSubNav activeTab={activeAnalyticsTab} onChange={setActiveAnalyticsTab} />
        )}

        <main
          className={`contentArea ${contentBuilderOpen ? 'builderContentArea' : ''} ${activeMainTab === 'execution' ? 'phaseOneContentArea' : ''} ${activeMainTab === 'crm' ? 'crmContentArea' : ''}`}
        >
          {renderMainContent()}
        </main>
      </div>

      {activePerson && (
        <PersonDetailPanel person={activePerson} onClose={() => setOpenPersonId(null)} />
      )}

      {activeAccount && (
        <AccountDetailPanel
          account={activeAccount}
          onClose={() => setOpenAccountId(null)}
        />
      )}

      <SmartListModal open={smartListModalOpen} onClose={() => setSmartListModalOpen(false)} onCreate={(name, description) => { setSmartListModalOpen(false); setActiveMainTab('crm'); setActiveCrmTab('smart-lists'); setSmartListDraft({ name, description }) }} />
    </div>
  )
}

export default App
