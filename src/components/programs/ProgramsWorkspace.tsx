import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent } from 'react'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'
import { ProgramAssetEditor } from './ProgramAssetEditor'
import { ProgramFlowEditor } from './ProgramFlowEditor'
import { ProgramReportsView } from './ProgramReportsView'
import { ProgramScheduleEditor } from './ProgramScheduleEditor'
import { ProgramSegmentEditor } from './ProgramSegmentEditor'
import { ProgramSettingsPanel } from './ProgramSettingsPanel'
import { defaultEventDetails, defaultScheduleForProgramType, defaultSegmentForProgramType, defaultTokensForProgramType, initialProgramFolders, initialPrograms, programAssetFolderLabels, programFlowTemplates, programTypeDefaults } from '../../data/programsData'
import { defaultFlowStepsForProgramType } from '../../data/programFlowData'
import type { ProgramAssetFolderKey, ProgramAssetRecord, ProgramAssetType, ProgramFlowStep, ProgramFolderRecord, ProgramRecord, ProgramStatus, ProgramType } from '../../types/programs'

interface ProgramsWorkspaceProps {
  onExit: () => void
  embedded?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
}

type ProgramTab = 'segment' | 'flow' | 'schedule' | 'reports' | 'settings'
type CreateState = { kind: 'folder' | 'program'; parentId: string | null }
type RenameState = { kind: 'folder' | 'program' | 'asset'; id: string; programId?: string; name: string }
type DraggedNode = { kind: 'folder' | 'program'; id: string }
type ContextTarget = { kind: 'folder' | 'program' | 'asset'; id: string; programId?: string; x: number; y: number }
type AssetCreateState = { programId: string; type: ProgramAssetType; folder: ProgramAssetFolderKey }
type AssetEditorState = { programId: string; assetId: string }
type AssetFolderSelection = { programId: string; folder: 'assets' | ProgramAssetFolderKey }

const assetTypeFolder: Record<ProgramAssetType, ProgramAssetFolderKey> = {
  Email: 'emails',
  'Landing Page': 'landing-pages',
  Form: 'forms',
  File: 'files',
}

const statusLabels: ProgramStatus[] = ['Active', 'Draft', 'Paused', 'Error', 'Archived']

function initialTabForProgram(type: ProgramType): ProgramTab {
  return type === 'Container' ? 'reports' : 'segment'
}

function updateFlowAssetName(steps: ProgramFlowStep[] | undefined, previousName: string, nextName: string): ProgramFlowStep[] | undefined {
  return steps?.map((step) => ({
    ...step,
    config: step.config.emailName === previousName ? { ...step.config, emailName: nextName } : step.config,
    children: updateFlowAssetName(step.children, previousName, nextName),
    branches: step.branches?.map((branch) => ({ ...branch, steps: updateFlowAssetName(branch.steps, previousName, nextName) ?? branch.steps })),
  }))
}

function folderOptions(folders: ProgramFolderRecord[], parentId: string | null = null, level = 0): Array<ProgramFolderRecord & { level: number }> {
  return folders
    .filter((folder) => folder.parentId === parentId)
    .flatMap((folder) => [{ ...folder, level }, ...folderOptions(folders, folder.id, level + 1)])
}

function descendantFolderIds(folders: ProgramFolderRecord[], folderId: string) {
  const ids = new Set([folderId])
  let changed = true
  while (changed) {
    changed = false
    folders.forEach((folder) => {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id)
        changed = true
      }
    })
  }
  return ids
}

function ProgramObjectIcon() {
  const shared = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return <svg {...shared}><path d='M5 4v5a3 3 0 0 0 3 3h8a3 3 0 0 1 3 3v5M12 8l4 4-4 4' /><circle cx='5' cy='4' r='2' /><circle cx='19' cy='20' r='2' /></svg>
}

function FolderTreeIcon({ open }: { open: boolean }) {
  return <svg className={`programFolderIcon ${open ? 'open' : ''}`} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round'><path d='M3.5 6.5A2.5 2.5 0 0 1 6 4h4l2 2h6A2.5 2.5 0 0 1 20.5 8.5v8A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z' />{open && <path d='M4 10h16l-2 9H6z' />}</svg>
}

function AssetTypeIcon({ type }: { type: ProgramAssetType }) {
  return <span className={`programAssetTypeIcon type-${type.toLowerCase().replace(' ', '-')}`}>{type === 'Email' ? '✉' : type === 'Landing Page' ? '▤' : type === 'Form' ? '▧' : '◇'}</span>
}

export function ProgramsWorkspace({ onExit, embedded = false, searchValue = '', onSearchChange }: ProgramsWorkspaceProps) {
  const nextId = useRef(100)
  const [folders, setFolders] = useState(initialProgramFolders)
  const [programs, setPrograms] = useState(initialPrograms)
  const [expandedFolders, setExpandedFolders] = useState(() => new Set(initialProgramFolders.map((folder) => folder.id)))
  const [expandedPrograms, setExpandedPrograms] = useState(() => new Set(initialPrograms.map((program) => program.id)))
  const [expandedAssetFolders, setExpandedAssetFolders] = useState(() => new Set(initialPrograms.map((program) => `${program.id}:assets`)))
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedAssetFolder, setSelectedAssetFolder] = useState<AssetFolderSelection | null>(null)
  const [activeTab, setActiveTab] = useState<ProgramTab>('segment')
  const [internalQuery, setInternalQuery] = useState('')
  const query = embedded ? searchValue : internalQuery
  const setQuery = (value: string) => embedded ? onSearchChange?.(value) : setInternalQuery(value)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [contextTarget, setContextTarget] = useState<ContextTarget | null>(null)
  const [createState, setCreateState] = useState<CreateState | null>(null)
  const [renameState, setRenameState] = useState<RenameState | null>(null)
  const [manageProgramId, setManageProgramId] = useState<string | null>(null)
  const [settingsProgramId, setSettingsProgramId] = useState<string | null>(null)
  const [assetCreateState, setAssetCreateState] = useState<AssetCreateState | null>(null)
  const [assetEditorState, setAssetEditorState] = useState<AssetEditorState | null>(null)
  const [draggedNode, setDraggedNode] = useState<DraggedNode | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [copiedProgramId, setCopiedProgramId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const selectedProgram = programs.find((program) => program.id === selectedProgramId)
  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)
  const selectedAssetProgram = programs.find((program) => program.id === selectedAssetFolder?.programId)
  const managedProgram = programs.find((program) => program.id === manageProgramId)
  const settingsProgram = programs.find((program) => program.id === settingsProgramId)
  const assetEditorProgram = programs.find((program) => program.id === assetEditorState?.programId)
  const assetEditorAsset = assetEditorProgram?.assets.find((asset) => asset.id === assetEditorState?.assetId)
  const orderedFolders = useMemo(() => folderOptions(folders), [folders])

  const visibleTree = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return null
    const programIds = new Set<string>()
    const folderIds = new Set<string>()

    function markFolderPath(folderId: string | null) {
      let currentId = folderId
      while (currentId) {
        if (folderIds.has(currentId)) break
        folderIds.add(currentId)
        currentId = folders.find((folder) => folder.id === currentId)?.parentId ?? null
      }
    }

    programs.forEach((program) => {
      const matches = [program.name, program.type, ...program.assets.map((asset) => asset.name)].some((value) => value.toLowerCase().includes(normalized))
      if (matches) {
        programIds.add(program.id)
        markFolderPath(program.parentId)
      }
    })

    folders.forEach((folder) => {
      if (folder.name.toLowerCase().includes(normalized)) markFolderPath(folder.id)
    })

    return { programIds, folderIds, normalized }
  }, [folders, programs, query])

  useEffect(() => {
    if (!contextTarget) return
    const close = () => setContextTarget(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [contextTarget])

  function updateProgram(programId: string, updater: (program: ProgramRecord) => ProgramRecord) {
    setPrograms((current) => current.map((program) => program.id === programId ? updater(program) : program))
  }

  function openFolderDetail(folderId: string) {
    setSelectedFolderId(folderId)
    setSelectedProgramId(null)
    setSelectedAssetFolder(null)
  }

  function openProgramDetail(program: ProgramRecord) {
    setSelectedProgramId(program.id)
    setSelectedFolderId(null)
    setSelectedAssetFolder(null)
    setActiveTab(initialTabForProgram(program.type))
  }

  function openAssetFolderDetail(programId: string, folder: AssetFolderSelection['folder']) {
    setSelectedAssetFolder({ programId, folder })
    setSelectedProgramId(null)
    setSelectedFolderId(null)
  }

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setter((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    setExpandedFolders(new Set(folders.map((folder) => folder.id)))
    setExpandedPrograms(new Set(programs.filter((program) => program.enabledAssetFolders.length).map((program) => program.id)))
    setExpandedAssetFolders(new Set(programs.flatMap((program) => [`${program.id}:assets`, ...program.enabledAssetFolders.map((folder) => `${program.id}:${folder}`)])))
  }

  function collapseAll() {
    setExpandedFolders(new Set())
    setExpandedPrograms(new Set())
    setExpandedAssetFolders(new Set())
  }

  function openContext(event: MouseEvent, target: Omit<ContextTarget, 'x' | 'y'>) {
    event.preventDefault()
    setContextTarget({ ...target, x: event.clientX, y: event.clientY })
  }

  function createFolder(name: string, parentId: string | null) {
    const folder: ProgramFolderRecord = { id: `program-folder-${nextId.current++}`, name, parentId }
    setFolders((current) => [...current, folder])
    if (parentId) setExpandedFolders((current) => new Set(current).add(parentId))
    setNotice(`Folder “${name}” created.`)
  }

  function createProgram(name: string, parentId: string | null, type: ProgramType) {
    const program: ProgramRecord = {
      id: `program-created-${nextId.current++}`,
      name,
      parentId,
      type,
      status: 'Draft',
      enabledAssetFolders: [...programTypeDefaults[type]],
      assets: [],
      flow: [...programFlowTemplates[type]],
      flowSteps: defaultFlowStepsForProgramType(type),
      description: '',
      createdAt: 'Just now',
      segment: defaultSegmentForProgramType(type),
      tags: [],
      tokens: defaultTokensForProgramType(type, name),
      schedule: defaultScheduleForProgramType(type),
      eventDetails: type === 'Event' ? defaultEventDetails(name) : undefined,
      communicationLimits: type === 'Simple Email' || type === 'Nurture' ? { perDay: 1, perWeek: 3 } : undefined,
      exclusionSmartList: type === 'Nurture' ? 'Global Suppression List' : undefined,
      pauseOnEngagement: type === 'Nurture',
    }
    setPrograms((current) => [...current, program])
    if (parentId) setExpandedFolders((current) => new Set(current).add(parentId))
    openProgramDetail(program)
    setNotice(`Program “${name}” created as Draft.`)
  }

  function renameTarget(name: string) {
    if (!renameState) return
    if (renameState.kind === 'folder') setFolders((current) => current.map((folder) => folder.id === renameState.id ? { ...folder, name } : folder))
    if (renameState.kind === 'program') updateProgram(renameState.id, (program) => ({ ...program, name }))
    if (renameState.kind === 'asset' && renameState.programId) updateProgram(renameState.programId, (program) => ({ ...program, assets: program.assets.map((asset) => asset.id === renameState.id ? { ...asset, name } : asset) }))
    setRenameState(null)
    setNotice(`Renamed to “${name}”.`)
  }

  function deleteFolder(folderId: string) {
    const removedFolderIds = descendantFolderIds(folders, folderId)
    const removedProgramIds = new Set(programs.filter((program) => program.parentId && removedFolderIds.has(program.parentId)).map((program) => program.id))
    setFolders((current) => current.filter((folder) => !removedFolderIds.has(folder.id)))
    setPrograms((current) => current.filter((program) => !removedProgramIds.has(program.id)))
    if (selectedProgramId && removedProgramIds.has(selectedProgramId)) setSelectedProgramId(null)
    if (selectedFolderId && removedFolderIds.has(selectedFolderId)) setSelectedFolderId(null)
    if (selectedAssetFolder && removedProgramIds.has(selectedAssetFolder.programId)) setSelectedAssetFolder(null)
    setNotice('Folder and its contents deleted.')
  }

  function deleteProgram(programId: string) {
    setPrograms((current) => current.filter((program) => program.id !== programId))
    if (selectedProgramId === programId) setSelectedProgramId(null)
    if (selectedAssetFolder?.programId === programId) setSelectedAssetFolder(null)
    setNotice('Program deleted.')
  }

  function cloneProgram(programId: string, parentId?: string | null) {
    const source = programs.find((program) => program.id === programId)
    if (!source) return
    const clonedId = `program-clone-${nextId.current++}`
    const clone: ProgramRecord = {
      ...source,
      id: clonedId,
      name: `Copy of ${source.name}`,
      parentId: parentId === undefined ? source.parentId : parentId,
      status: 'Draft',
      assets: source.assets.map((asset) => ({ ...asset, id: `asset-clone-${nextId.current++}` })),
      flow: [...source.flow],
      flowSteps: source.flowSteps ? structuredClone(source.flowSteps) : undefined,
      createdAt: 'Just now',
    }
    setPrograms((current) => [...current, clone])
    openProgramDetail(clone)
    setNotice(`“${source.name}” cloned as Draft.`)
  }

  function moveNode(targetParentId: string | null) {
    if (!draggedNode) return
    if (draggedNode.kind === 'folder') {
      const blockedIds = descendantFolderIds(folders, draggedNode.id)
      if (targetParentId && blockedIds.has(targetParentId)) {
        setNotice('A folder cannot be moved into itself or one of its children.')
      } else {
        setFolders((current) => current.map((folder) => folder.id === draggedNode.id ? { ...folder, parentId: targetParentId } : folder))
        setNotice('Folder moved.')
      }
    } else {
      setPrograms((current) => current.map((program) => program.id === draggedNode.id ? { ...program, parentId: targetParentId } : program))
      setNotice('Program moved.')
    }
    setDraggedNode(null)
    setDropTarget(null)
  }

  function handleRowDragOver(event: DragEvent, target: string) {
    if (!draggedNode) return
    event.preventDefault()
    event.stopPropagation()
    setDropTarget(target)
  }

  function createAsset(programId: string, type: ProgramAssetType, folder: ProgramAssetFolderKey, name: string) {
    const asset: ProgramAssetRecord = { id: `local-asset-${nextId.current++}`, name, type, folder }
    updateProgram(programId, (program) => ({ ...program, assets: [...program.assets, asset] }))
    setExpandedPrograms((current) => new Set(current).add(programId))
    setExpandedAssetFolders((current) => new Set([...current, `${programId}:assets`, `${programId}:${folder}`]))
    setNotice(`${type} “${name}” created locally.`)
  }

  function deleteAsset(programId: string, assetId: string, moved = false) {
    updateProgram(programId, (program) => ({ ...program, assets: program.assets.filter((asset) => asset.id !== assetId) }))
    setNotice(moved ? 'Asset moved to Global Content.' : 'Local asset deleted.')
  }

  function renderProgram(program: ProgramRecord, level: number) {
    if (visibleTree && !visibleTree.programIds.has(program.id)) return null
    const hasFolders = program.enabledAssetFolders.length > 0
    const open = query ? true : expandedPrograms.has(program.id)
    const selected = selectedProgramId === program.id
    return <div className='programTreeNode' key={program.id}>
      <div
        className={`programTreeRow programRow ${selected ? 'selected' : ''} ${dropTarget === `program:${program.id}` ? 'dropTarget' : ''}`}
        style={{ '--program-level': level } as CSSProperties}
        draggable
        onDragStart={() => setDraggedNode({ kind: 'program', id: program.id })}
        onDragEnd={() => { setDraggedNode(null); setDropTarget(null) }}
        onDragOver={(event) => handleRowDragOver(event, `program:${program.id}`)}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); moveNode(program.parentId) }}
        onContextMenu={(event) => openContext(event, { kind: 'program', id: program.id })}
      >
        <button type='button' className='programTreeChevron' disabled={!hasFolders} onClick={(event) => { event.stopPropagation(); if (hasFolders) toggleSet(setExpandedPrograms, program.id) }} aria-label={`${open ? 'Collapse' : 'Expand'} ${program.name}`}>{hasFolders ? (open ? '⌄' : '›') : ''}</button>
        <span className='programTypeIcon'><ProgramObjectIcon /></span>
        <button type='button' className='programTreeName' onClick={() => openProgramDetail(program)}>{program.name}</button>
        <span className={`programStatusDot status-${program.status.toLowerCase()}`} title={program.status} />
      </div>
      {open && hasFolders && <div>
        {(() => {
          const assetsKey = `${program.id}:assets`
          const assetsOpen = query ? true : expandedAssetFolders.has(assetsKey)
          return <>
            <div className={`programTreeRow assetRootRow ${selectedAssetFolder?.programId === program.id && selectedAssetFolder.folder === 'assets' ? 'selected' : ''}`} style={{ '--program-level': level + 1 } as CSSProperties}>
              <button type='button' className='programTreeChevron' onClick={() => toggleSet(setExpandedAssetFolders, assetsKey)} aria-label={`${assetsOpen ? 'Collapse' : 'Expand'} Assets`}>{assetsOpen ? '⌄' : '›'}</button>
              <FolderTreeIcon open={assetsOpen} />
              <button type='button' className='programTreeName folderName' onClick={() => openAssetFolderDetail(program.id, 'assets')}>Assets</button>
              <span className='programTreeCount'>{program.enabledAssetFolders.length}</span>
            </div>
            {assetsOpen && program.enabledAssetFolders.map((folder) => {
              const key = `${program.id}:${folder}`
              const assets = program.assets.filter((asset) => asset.folder === folder).filter((asset) => !visibleTree || asset.name.toLowerCase().includes(visibleTree.normalized))
              const folderOpen = query ? true : expandedAssetFolders.has(key)
              return <div key={folder}>
                <div className={`programTreeRow assetFolderRow ${selectedAssetFolder?.programId === program.id && selectedAssetFolder.folder === folder ? 'selected' : ''}`} style={{ '--program-level': level + 2 } as CSSProperties}>
                  <button type='button' className='programTreeChevron' onClick={() => toggleSet(setExpandedAssetFolders, key)} aria-label={`${folderOpen ? 'Collapse' : 'Expand'} ${programAssetFolderLabels[folder]}`}>{folderOpen ? '⌄' : '›'}</button>
                  <FolderTreeIcon open={folderOpen} />
                  <button type='button' className='programTreeName' onClick={() => openAssetFolderDetail(program.id, folder)}>{programAssetFolderLabels[folder]}</button>
                  <span className='programTreeCount'>{assets.length}</span>
                </div>
                {folderOpen && assets.map((asset) => <div
                  className='programTreeRow assetRow'
                  style={{ '--program-level': level + 3 } as CSSProperties}
                  key={asset.id}
                  onContextMenu={(event) => openContext(event, { kind: 'asset', id: asset.id, programId: program.id })}
                >
                  <span className='programTreeChevron' />
                  <AssetTypeIcon type={asset.type} />
                  <button type='button' className='programTreeName' onClick={() => asset.type === 'File' ? setNotice(`Previewing file “${asset.name}”.`) : setAssetEditorState({ programId: program.id, assetId: asset.id })}>{asset.name}</button>
                </div>)}
              </div>
            })}
          </>
        })()}
      </div>}
    </div>
  }

  function renderFolder(folder: ProgramFolderRecord, level: number): React.ReactNode {
    if (visibleTree && !visibleTree.folderIds.has(folder.id)) return null
    const open = query ? true : expandedFolders.has(folder.id)
    const childFolders = folders.filter((item) => item.parentId === folder.id)
    const childPrograms = programs.filter((program) => program.parentId === folder.id)
    return <div className='programTreeNode' key={folder.id}>
      <div
        className={`programTreeRow folderRow ${selectedFolderId === folder.id ? 'selected' : ''} ${dropTarget === `folder:${folder.id}` ? 'dropTarget' : ''}`}
        style={{ '--program-level': level } as CSSProperties}
        draggable
        onDragStart={() => setDraggedNode({ kind: 'folder', id: folder.id })}
        onDragEnd={() => { setDraggedNode(null); setDropTarget(null) }}
        onDragOver={(event) => handleRowDragOver(event, `folder:${folder.id}`)}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); moveNode(folder.id) }}
        onContextMenu={(event) => openContext(event, { kind: 'folder', id: folder.id })}
      >
        <button type='button' className='programTreeChevron' onClick={() => toggleSet(setExpandedFolders, folder.id)} aria-label={`${open ? 'Collapse' : 'Expand'} ${folder.name}`}>{open ? '⌄' : '›'}</button>
        <FolderTreeIcon open={open} />
        <button type='button' className='programTreeName folderName' onClick={() => openFolderDetail(folder.id)}>{folder.name}</button>
      </div>
      {open && <div>{childFolders.map((child) => renderFolder(child, level + 1))}{childPrograms.map((program) => renderProgram(program, level + 1))}</div>}
    </div>
  }

  const rootFolders = folders.filter((folder) => folder.parentId === null)
  const rootPrograms = programs.filter((program) => program.parentId === null)

  if (assetEditorState && assetEditorProgram && assetEditorAsset && assetEditorAsset.type !== 'File') {
    return <ProgramAssetEditor
      key={assetEditorAsset.id}
      program={assetEditorProgram}
      asset={assetEditorAsset}
      onCancel={() => setAssetEditorState(null)}
      onSave={(updatedAsset) => {
        setPrograms((current) => current.map((program) => program.id !== assetEditorProgram.id ? program : {
          ...program,
          assets: program.assets.map((asset) => asset.id === updatedAsset.id ? updatedAsset : asset),
          flowSteps: updateFlowAssetName(program.flowSteps, assetEditorAsset.name, updatedAsset.name),
        }))
        setAssetEditorState(null)
        setNotice(`${updatedAsset.type} “${updatedAsset.name}” saved.`)
      }}
    />
  }

  return <div className={`programsWorkspace ${embedded ? 'embeddedProgramsWorkspace' : ''}`}>
    <aside className='programsTreePane'>
      {!embedded && <div className='programsWorkspaceBrand'><button type='button' onClick={onExit} aria-label='Back to main navigation'>‹</button><WireframeIcon name='programs' /><span>Marketo Next</span></div>}
      {!embedded && <div className='programTreeRootHeader'>
        <strong>Programs</strong>
        <div>
          <button type='button' title='Collapse all' onClick={collapseAll}>−</button>
          <button type='button' title='Expand all' onClick={expandAll}>↕</button>
          <button type='button' className='programTreeAdd' title='Create' onClick={() => setAddMenuOpen((open) => !open)}>+</button>
        </div>
        {addMenuOpen && <div className='programTreeAddMenu'><button type='button' onClick={() => { setCreateState({ kind: 'folder', parentId: null }); setAddMenuOpen(false) }}>New Folder</button><button type='button' onClick={() => { setCreateState({ kind: 'program', parentId: null }); setAddMenuOpen(false) }}>New Program</button></div>}
      </div>}
      <label className='programTreeSearch'><WireframeIcon name='search' className='iconSmall' /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search programs and assets…' />{query && <button type='button' onClick={() => setQuery('')} aria-label='Clear search'>×</button>}</label>
      <div
        className='programTreeScroll'
        role='tree'
        onDragOver={(event) => { if (draggedNode) { event.preventDefault(); setDropTarget('root') } }}
        onDrop={(event) => { event.preventDefault(); moveNode(null) }}
      >
        {rootFolders.map((folder) => renderFolder(folder, 0))}
        {rootPrograms.map((program) => renderProgram(program, 0))}
        {visibleTree && visibleTree.folderIds.size === 0 && visibleTree.programIds.size === 0 && <div className='programTreeNoResults'>No programs, folders, or assets match “{query}”.</div>}
        {draggedNode && <div className={`programTreeRootDrop ${dropTarget === 'root' ? 'active' : ''}`}>Move to Programs root</div>}
      </div>
      {notice && <div className='programTreeNotice' role='status'><span>{notice}</span><button type='button' onClick={() => setNotice('')}>×</button></div>}
    </aside>

    <main className='programsDetailPane'>
      {selectedAssetFolder && selectedAssetProgram ? <ProgramAssetsFolderDetail
        program={selectedAssetProgram}
        folder={selectedAssetFolder.folder}
        onOpenProgram={() => openProgramDetail(selectedAssetProgram)}
        onOpenFolder={(folder) => openAssetFolderDetail(selectedAssetProgram.id, folder)}
        onOpenAsset={(asset) => asset.type === 'File' ? setNotice(`Previewing file “${asset.name}”.`) : setAssetEditorState({ programId: selectedAssetProgram.id, assetId: asset.id })}
      /> : selectedFolder ? <ProgramFolderDetail
        folder={selectedFolder}
        childFolders={folders.filter((folder) => folder.parentId === selectedFolder.id)}
        childPrograms={programs.filter((program) => program.parentId === selectedFolder.id)}
        onOpenFolder={openFolderDetail}
        onOpenProgram={openProgramDetail}
      /> : selectedProgram ? <ProgramDetails
        program={selectedProgram}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUpdate={(updater) => updateProgram(selectedProgram.id, updater)}
        onOpenSettings={() => setSettingsProgramId(selectedProgram.id)}
        onActivate={() => updateProgram(selectedProgram.id, (program) => ({ ...program, status: 'Active', schedule: { ...(program.schedule ?? defaultScheduleForProgramType(program.type)), active: true } }))}
        onEditAsset={(assetId) => { const asset = selectedProgram.assets.find((item) => item.id === assetId); if (asset?.type === 'File') setNotice(`Previewing file “${asset.name}”.`); else setAssetEditorState({ programId: selectedProgram.id, assetId }) }}
      /> : <div className='programsEmptyState'><span><WireframeIcon name='programs' /></span><h2>Select a program from the tree to view details.</h2><p>Browse folders or search to find a program.</p></div>}
    </main>

    {contextTarget && <ProgramContextMenu
      target={contextTarget}
      folders={folders}
      programs={programs}
      copiedProgramId={copiedProgramId}
      onAction={(action) => {
        const target = contextTarget
        setContextTarget(null)
        if (target.kind === 'folder') {
          const folder = folders.find((item) => item.id === target.id)
          if (!folder) return
          if (action === 'new-folder') setCreateState({ kind: 'folder', parentId: folder.id })
          if (action === 'new-program') setCreateState({ kind: 'program', parentId: folder.id })
          if (action === 'paste' && copiedProgramId) cloneProgram(copiedProgramId, folder.id)
          if (action === 'rename') setRenameState({ kind: 'folder', id: folder.id, name: folder.name })
          if (action === 'delete') deleteFolder(folder.id)
        }
        if (target.kind === 'program') {
          const program = programs.find((item) => item.id === target.id)
          if (!program) return
          if (action === 'open') openProgramDetail(program)
          if (action === 'edit') { openProgramDetail(program); setSettingsProgramId(program.id) }
          if (action === 'clone') cloneProgram(program.id)
          if (action === 'activate') updateProgram(program.id, (item) => { const active = item.status !== 'Active'; return { ...item, status: active ? 'Active' : 'Paused', schedule: item.schedule ? { ...item.schedule, active } : item.schedule } })
          if (action === 'archive') updateProgram(program.id, (item) => ({ ...item, status: 'Archived' }))
          if (action === 'rename') setRenameState({ kind: 'program', id: program.id, name: program.name })
          if (action === 'delete') deleteProgram(program.id)
          if (action === 'copy') { setCopiedProgramId(program.id); setNotice(`Copied “${program.name}”.`) }
          if (action === 'manage-assets') setManageProgramId(program.id)
          if (action.startsWith('asset:')) {
            const type = action.slice(6) as ProgramAssetType
            setAssetCreateState({ programId: program.id, type, folder: assetTypeFolder[type] })
          }
        }
        if (target.kind === 'asset' && target.programId) {
          const program = programs.find((item) => item.id === target.programId)
          const asset = program?.assets.find((item) => item.id === target.id)
          if (!program || !asset) return
          if (action === 'edit') {
            if (asset.type === 'File') setNotice(`Previewing “${asset.name}”.`)
            else setAssetEditorState({ programId: program.id, assetId: asset.id })
          }
          if (action === 'preview') setNotice(`Previewing “${asset.name}”.`)
          if (action === 'rename') setRenameState({ kind: 'asset', id: asset.id, programId: program.id, name: asset.name })
          if (action === 'delete') deleteAsset(program.id, asset.id)
          if (action === 'move-global') deleteAsset(program.id, asset.id, true)
        }
      }}
    />}

    {createState?.kind === 'folder' && <NewFolderModal folders={orderedFolders} initialParentId={createState.parentId} onClose={() => setCreateState(null)} onCreate={(name, parentId) => { createFolder(name, parentId); setCreateState(null) }} />}
    {createState?.kind === 'program' && <NewProgramModal folders={orderedFolders} initialParentId={createState.parentId} onClose={() => setCreateState(null)} onCreate={(name, parentId, type) => { createProgram(name, parentId, type); setCreateState(null) }} />}
    {renameState && <RenameModal state={renameState} onClose={() => setRenameState(null)} onRename={renameTarget} />}
    {managedProgram && <ManageAssetsModal program={managedProgram} onClose={() => setManageProgramId(null)} onSave={(enabledAssetFolders) => { updateProgram(managedProgram.id, (program) => ({ ...program, enabledAssetFolders })); setManageProgramId(null); setNotice('Local asset folders updated.') }} />}
    {settingsProgram && <ProgramSettingsPanel key={settingsProgram.id} program={settingsProgram} onClose={() => setSettingsProgramId(null)} onSave={(updatedProgram) => { setPrograms((current) => current.map((program) => program.id === updatedProgram.id ? updatedProgram : program)); setSettingsProgramId(null); setNotice('Program settings saved.') }} />}
    {assetCreateState && <NewAssetModal state={assetCreateState} onClose={() => setAssetCreateState(null)} onCreate={(name) => { createAsset(assetCreateState.programId, assetCreateState.type, assetCreateState.folder, name); setAssetCreateState(null) }} />}
  </div>
}

function ProgramContextMenu({ target, folders, programs, copiedProgramId, onAction }: { target: ContextTarget; folders: ProgramFolderRecord[]; programs: ProgramRecord[]; copiedProgramId: string | null; onAction: (action: string) => void }) {
  const program = target.kind === 'program' ? programs.find((item) => item.id === target.id) : undefined
  const asset = target.kind === 'asset' ? programs.find((item) => item.id === target.programId)?.assets.find((item) => item.id === target.id) : undefined
  const style = { left: Math.min(target.x, window.innerWidth - 245), top: Math.min(target.y, window.innerHeight - 430) }
  return <div className='programContextMenu' style={style} onClick={(event) => event.stopPropagation()}>
    {target.kind === 'folder' && <>
      <button type='button' onClick={() => onAction('new-folder')}>New Folder</button><button type='button' onClick={() => onAction('new-program')}>New Program</button><button type='button' disabled={!copiedProgramId} onClick={() => onAction('paste')}>Paste</button><hr /><button type='button' onClick={() => onAction('rename')}>Rename</button><button type='button' className='danger' onClick={() => onAction('delete')}>Delete</button>
    </>}
    {program && <>
      <button type='button' onClick={() => onAction('open')}>Open</button><button type='button' onClick={() => onAction('edit')}>Edit</button><button type='button' onClick={() => onAction('clone')}>Clone</button><button type='button' onClick={() => onAction('activate')}>{program.status === 'Active' ? 'Deactivate' : 'Activate'}</button><button type='button' onClick={() => onAction('archive')}>Archive</button><hr /><button type='button' onClick={() => onAction('rename')}>Rename</button><button type='button' className='danger' onClick={() => onAction('delete')}>Delete</button><button type='button' onClick={() => onAction('copy')}>Copy</button><button type='button' onClick={() => onAction('manage-assets')}>Manage Assets</button>
      {program.enabledAssetFolders.length > 0 && <><hr /><span className='programContextLabel'>Create Local Asset</span>{(['Email', 'Landing Page', 'Form'] as ProgramAssetType[]).filter((type) => program.enabledAssetFolders.includes(assetTypeFolder[type])).map((type) => <button type='button' key={type} onClick={() => onAction(`asset:${type}`)}>↳ {type}</button>)}</>}
    </>}
    {asset && <><button type='button' onClick={() => onAction('edit')}>Edit</button><button type='button' onClick={() => onAction('preview')}>Preview</button><button type='button' onClick={() => onAction('rename')}>Rename</button><button type='button' className='danger' onClick={() => onAction('delete')}>Delete</button><hr /><button type='button' onClick={() => onAction('move-global')}>Move to Global Content</button></>}
    {target.kind === 'folder' && !folders.some((folder) => folder.id === target.id) && <span>Folder unavailable</span>}
  </div>
}

function ProgramFolderDetail({ folder, childFolders, childPrograms, onOpenFolder, onOpenProgram }: { folder: ProgramFolderRecord; childFolders: ProgramFolderRecord[]; childPrograms: ProgramRecord[]; onOpenFolder: (folderId: string) => void; onOpenProgram: (program: ProgramRecord) => void }) {
  return <div className='programFolderDetail programDetailTransition'>
    <header><nav><span>Programs</span><i>›</i><strong>{folder.name}</strong></nav><div><span><FolderTreeIcon open /></span><div><h1>{folder.name}</h1><p>{childFolders.length} folders · {childPrograms.length} programs</p></div></div></header>
    <section><div className='programFolderSectionHeading'><div><h2>Contents</h2><p>Direct folders and programs in {folder.name}</p></div></div><div className='programFolderContentGrid'>
      {childFolders.map((child) => <button type='button' className='programFolderContentCard folder' key={child.id} onClick={() => onOpenFolder(child.id)}><span><FolderTreeIcon open={false} /></span><div><strong>{child.name}</strong><small>Folder</small></div><em>›</em></button>)}
      {childPrograms.map((program) => <button type='button' className='programFolderContentCard program' key={program.id} onClick={() => onOpenProgram(program)}><span><ProgramObjectIcon /></span><div><strong>{program.name}</strong><small>{program.status} · {program.enabledAssetFolders.length} asset folders</small></div><em>›</em></button>)}
      {childFolders.length === 0 && childPrograms.length === 0 && <div className='programFolderEmpty'>This folder is empty.</div>}
    </div></section>
  </div>
}

function ProgramAssetsFolderDetail({ program, folder, onOpenProgram, onOpenFolder, onOpenAsset }: { program: ProgramRecord; folder: 'assets' | ProgramAssetFolderKey; onOpenProgram: () => void; onOpenFolder: (folder: 'assets' | ProgramAssetFolderKey) => void; onOpenAsset: (asset: ProgramAssetRecord) => void }) {
  const isRoot = folder === 'assets'
  const title = isRoot ? 'Assets' : programAssetFolderLabels[folder]
  const assets = isRoot ? [] : program.assets.filter((asset) => asset.folder === folder)
  return <div className='programFolderDetail programAssetsDetail programDetailTransition'>
    <header><nav><button type='button' onClick={onOpenProgram}>{program.name}</button><i>›</i>{!isRoot && <><button type='button' onClick={() => onOpenFolder('assets')}>Assets</button><i>›</i></>}<strong>{title}</strong></nav><div><span><FolderTreeIcon open /></span><div><h1>{title}</h1><p>{isRoot ? `${program.enabledAssetFolders.length} enabled asset folders` : `${assets.length} local assets`}</p></div></div></header>
    <section><div className='programFolderSectionHeading'><div><h2>{isRoot ? 'Asset folders' : 'Local assets'}</h2><p>{isRoot ? 'Open a folder to manage its local assets' : `Assets available only inside ${program.name}`}</p></div></div><div className='programFolderContentGrid'>
      {isRoot && program.enabledAssetFolders.map((assetFolder) => <button type='button' className='programFolderContentCard folder' key={assetFolder} onClick={() => onOpenFolder(assetFolder)}><span><FolderTreeIcon open={false} /></span><div><strong>{programAssetFolderLabels[assetFolder]}</strong><small>{program.assets.filter((asset) => asset.folder === assetFolder).length} assets</small></div><em>›</em></button>)}
      {!isRoot && assets.map((asset) => <button type='button' className='programFolderContentCard asset' key={asset.id} onClick={() => onOpenAsset(asset)}><AssetTypeIcon type={asset.type} /><div><strong>{asset.name}</strong><small>{asset.type} · Local asset</small></div><em>›</em></button>)}
      {!isRoot && assets.length === 0 && <div className='programFolderEmpty'>No assets in this folder.</div>}
    </div></section>
  </div>
}

function ProgramDetails({ program, activeTab, onTabChange, onUpdate, onOpenSettings, onActivate, onEditAsset }: { program: ProgramRecord; activeTab: ProgramTab; onTabChange: (tab: ProgramTab) => void; onUpdate: (updater: (program: ProgramRecord) => ProgramRecord) => void; onOpenSettings: () => void; onActivate: () => void; onEditAsset: (assetId: string) => void }) {
  const detailTabs: ProgramTab[] = program.type === 'Container' ? ['reports'] : ['segment', 'flow', 'schedule', 'reports']
  const displayType = 'Program'

  return <div className='programDetails'>
    <header className='programDetailsHeader'>
      <div className='programDetailsIdentity'><span className='programDetailTypeIcon'><ProgramObjectIcon /></span><div><small>Programs / {displayType}</small><h1>{program.name}</h1><p>{program.description || 'No description added yet.'}</p></div></div>
      <div><span className={`programStatusBadge status-${program.status.toLowerCase()}`}><i />{program.status}</span>{program.type !== 'Container' && <button type='button' className='button solid programHeaderActivate' disabled={program.status === 'Active'} onClick={onActivate}>{program.status === 'Active' ? 'Active' : 'Activate'}</button>}<button type='button' className='programSettingsGear' onClick={onOpenSettings} aria-label='Open Program Settings'>⚙</button></div>
    </header>
    <nav className='programDetailTabs' aria-label='Program details'>{detailTabs.map((tab) => <button type='button' key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => onTabChange(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav>
    <div className='programDetailBody'>
      {activeTab === 'segment' && program.type !== 'Container' && <ProgramSegmentEditor program={program} onChange={(segment) => onUpdate((item) => ({ ...item, segment }))} />}
      {activeTab === 'flow' && program.type !== 'Container' && <ProgramFlowEditor program={program} onChange={(flowSteps) => onUpdate((item) => ({ ...item, flowSteps }))} onConvertToNurture={() => onUpdate((item) => ({ ...item, convertedToNurture: true }))} onEditAsset={onEditAsset} />}
      {activeTab === 'schedule' && program.type !== 'Container' && <ProgramScheduleEditor program={program} onChange={(schedule) => onUpdate((item) => ({ ...item, schedule }))} onActivate={() => onUpdate((item) => ({ ...item, status: 'Active', schedule: { ...(item.schedule ?? defaultScheduleForProgramType(item.type)), active: true } }))} />}
      {activeTab === 'reports' && <ProgramReportsView program={program} onMembersChange={(members) => onUpdate((item) => ({ ...item, members }))} />}
      {activeTab === 'settings' && <div className='programSettingsView'><header><h2>Program Settings</h2><p>Control program status, description, and local asset folders.</p></header><div className='programSettingsGrid'><section><header><strong>General</strong><small>Core program configuration</small></header><label>Program Name<input value={program.name} onChange={(event) => onUpdate((item) => ({ ...item, name: event.target.value }))} /></label><label>Status<select value={program.status} onChange={(event) => onUpdate((item) => ({ ...item, status: event.target.value as ProgramStatus }))}>{statusLabels.map((status) => <option key={status}>{status}</option>)}</select></label><label>Description<textarea value={program.description} onChange={(event) => onUpdate((item) => ({ ...item, description: event.target.value }))} placeholder='Describe the purpose of this program…' /></label></section><section><header><strong>Local Asset Folders</strong><small>Show or hide folders beneath this program</small></header>{(Object.keys(programAssetFolderLabels) as ProgramAssetFolderKey[]).map((folder) => <label className='programAssetToggle' key={folder}><span><FolderTreeIcon open={program.enabledAssetFolders.includes(folder)} /><span><strong>{programAssetFolderLabels[folder]}</strong><small>{program.assets.filter((asset) => asset.folder === folder).length} existing assets</small></span></span><input type='checkbox' checked={program.enabledAssetFolders.includes(folder)} onChange={(event) => onUpdate((item) => ({ ...item, enabledAssetFolders: event.target.checked ? [...item.enabledAssetFolders, folder] : item.enabledAssetFolders.filter((value) => value !== folder) }))} /></label>)}</section></div></div>}
    </div>
  </div>
}

function NewFolderModal({ folders, initialParentId, onClose, onCreate }: { folders: Array<ProgramFolderRecord & { level: number }>; initialParentId: string | null; onClose: () => void; onCreate: (name: string, parentId: string | null) => void }) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState(initialParentId ?? '')
  return <Modal title='New Folder' open onClose={onClose}><div className='programCreateModal'><label>Folder Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder='Enter folder name' /></label><label>Parent Folder<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value=''>Programs (root)</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{'— '.repeat(folder.level)}{folder.name}</option>)}</select></label><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onCreate(name.trim(), parentId || null)}>Create Folder</button></footer></div></Modal>
}

function NewProgramModal({ folders, initialParentId, onClose, onCreate }: { folders: Array<ProgramFolderRecord & { level: number }>; initialParentId: string | null; onClose: () => void; onCreate: (name: string, parentId: string | null, type: ProgramType) => void }) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState(initialParentId ?? '')
  const [type, setType] = useState<ProgramType>('Automated Campaign')
  const enabledFolders = programTypeDefaults[type]
  return <Modal title='New Program' open onClose={onClose}><div className='programCreateModal newProgramModal'><label>Program Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder='Enter program name' /></label><label>Folder<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value=''>Programs (root)</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{'— '.repeat(folder.level)}{folder.name}</option>)}</select></label><label>Type<select value={type} onChange={(event) => setType(event.target.value as ProgramType)}><option value='Automated Campaign'>Blank (Automated Campaign)</option><option value='Simple Email'>Simple Email</option><option value='Nurture'>Nurture</option><option value='Event'>Event</option><option value='Container'>Container (Default)</option></select></label><div className='programTypePreview'><header><strong>Default local asset folders</strong><small>These can be changed later in Settings.</small></header><div>{(Object.keys(programAssetFolderLabels) as ProgramAssetFolderKey[]).map((folder) => <span className={enabledFolders.includes(folder) ? 'enabled' : ''} key={folder}><FolderTreeIcon open={enabledFolders.includes(folder)} />{programAssetFolderLabels[folder]}<i>{enabledFolders.includes(folder) ? '✓' : '—'}</i></span>)}</div><p>{programFlowTemplates[type].length ? `Includes a ${programFlowTemplates[type].length}-step editable flow template.` : 'Starts empty. Build a flow and enable asset folders when ready.'}</p></div><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onCreate(name.trim(), parentId || null, type)}>Create</button></footer></div></Modal>
}

function RenameModal({ state, onClose, onRename }: { state: RenameState; onClose: () => void; onRename: (name: string) => void }) {
  const [name, setName] = useState(state.name)
  return <Modal title={`Rename ${state.kind === 'asset' ? 'Asset' : state.kind === 'program' ? 'Program' : 'Folder'}`} open onClose={onClose}><div className='programCreateModal'><label>Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && name.trim()) onRename(name.trim()) }} /></label><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onRename(name.trim())}>Rename</button></footer></div></Modal>
}

function ManageAssetsModal({ program, onClose, onSave }: { program: ProgramRecord; onClose: () => void; onSave: (folders: ProgramAssetFolderKey[]) => void }) {
  const [enabled, setEnabled] = useState<ProgramAssetFolderKey[]>(program.enabledAssetFolders)
  return <Modal title='Manage Local Assets' open onClose={onClose}><div className='manageProgramAssets'><p>Choose which asset folders appear beneath <strong>{program.name}</strong>.</p>{(Object.keys(programAssetFolderLabels) as ProgramAssetFolderKey[]).map((folder) => <label key={folder}><span><FolderTreeIcon open={enabled.includes(folder)} /><span><strong>{programAssetFolderLabels[folder]}</strong><small>{program.assets.filter((asset) => asset.folder === folder).length} existing assets</small></span></span><input type='checkbox' checked={enabled.includes(folder)} onChange={(event) => setEnabled((current) => event.target.checked ? [...current, folder] : current.filter((value) => value !== folder))} /></label>)}<footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={() => onSave(enabled)}>Save Changes</button></footer></div></Modal>
}

function NewAssetModal({ state, onClose, onCreate }: { state: AssetCreateState; onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return <Modal title={`New Local ${state.type}`} open onClose={onClose}><div className='programCreateModal'><label>{state.type} Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={`Enter ${state.type.toLowerCase()} name`} /></label><div className='newAssetDestination'><span>Destination</span><strong>{programAssetFolderLabels[state.folder]}</strong></div><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Create {state.type}</button></footer></div></Modal>
}
