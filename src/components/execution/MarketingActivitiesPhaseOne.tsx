import { useMemo, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent } from 'react'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'
import { ProgramEditor } from './phase2/ProgramEditor'

export type ActivityNodeType =
  | 'folder'
  | 'smart-campaign'
  | 'email-program'
  | 'event-program'
  | 'engagement-program'
  | 'default-program'
  | 'assets-folder'
  | 'asset-category'
  | 'members-folder'
  | 'asset'

export type ProgramStatus = 'active' | 'draft' | 'paused' | 'error'
type CreateKind = 'folder' | 'smart-campaign' | 'email-program' | 'event-program' | 'engagement-program' | 'default-program' | 'import'

export interface ActivityNode {
  id: string
  name: string
  type: ActivityNodeType
  status?: ProgramStatus
  children?: ActivityNode[]
  assetType?: 'email' | 'landing-page' | 'form'
}

interface ContextMenuState {
  nodeId: string
  x: number
  y: number
}

const createOptions: Array<{ kind: CreateKind; label: string; icon: string }> = [
  { kind: 'folder', label: 'New Folder', icon: '▱' },
  { kind: 'smart-campaign', label: 'New Smart Campaign', icon: '⚙' },
  { kind: 'email-program', label: 'New Email Program', icon: '✉' },
  { kind: 'event-program', label: 'New Event Program', icon: '□' },
  { kind: 'engagement-program', label: 'New Engagement Program', icon: '◉' },
  { kind: 'default-program', label: 'New Default Program', icon: '✣' },
  { kind: 'import', label: 'Import Program', icon: '⇧' },
]

function assetsFor(programId: string, samples: Partial<Record<'email' | 'landing-page' | 'form', string[]>> = {}): ActivityNode[] {
  return [{
    id: `${programId}-assets`,
    name: 'Assets',
    type: 'assets-folder',
    children: [
      { id: `${programId}-emails`, name: 'Emails', type: 'asset-category', assetType: 'email', children: (samples.email ?? []).map((name, index) => ({ id: `${programId}-email-${index}`, name, type: 'asset', assetType: 'email' })) },
      { id: `${programId}-pages`, name: 'Landing Pages', type: 'asset-category', assetType: 'landing-page', children: (samples['landing-page'] ?? []).map((name, index) => ({ id: `${programId}-page-${index}`, name, type: 'asset', assetType: 'landing-page' })) },
      { id: `${programId}-forms`, name: 'Forms', type: 'asset-category', assetType: 'form', children: (samples.form ?? []).map((name, index) => ({ id: `${programId}-form-${index}`, name, type: 'asset', assetType: 'form' })) },
    ],
  }]
}

const initialTree: ActivityNode[] = [
  {
    id: 'folder-lifecycle', name: 'Lifecycle Marketing', type: 'folder', children: [
      { id: 'program-demo-nurture', name: 'Enterprise Demo Nurture', type: 'engagement-program', status: 'active', children: assetsFor('program-demo-nurture', { email: ['Welcome Email', 'Enterprise Case Study'], form: ['Demo Qualification Form'] }) },
      { id: 'campaign-mql-followup', name: 'New MQL Follow-up', type: 'smart-campaign', status: 'active' },
      { id: 'folder-reengagement', name: 'Re-engagement', type: 'folder', children: [
        { id: 'program-dormant-sql', name: 'Dormant SQL Re-engagement', type: 'engagement-program', status: 'draft', children: assetsFor('program-dormant-sql') },
      ] },
    ],
  },
  {
    id: 'folder-demand', name: 'Demand Generation', type: 'folder', children: [
      { id: 'program-q3-launch', name: 'Q3 Product Launch', type: 'email-program', status: 'active', children: assetsFor('program-q3-launch', { email: ['Product Launch Announcement', 'Launch Follow-up'], 'landing-page': ['Product Launch Page'], form: ['Early Access Form'] }) },
      { id: 'program-abm', name: 'Enterprise ABM Program', type: 'default-program', status: 'error', children: [...assetsFor('program-abm', { email: ['Executive Outreach'] }), { id: 'program-abm-members', name: 'Members', type: 'members-folder' }] },
      { id: 'campaign-score', name: 'High Intent Score Update', type: 'smart-campaign', status: 'paused' },
    ],
  },
  {
    id: 'folder-events', name: 'Events', type: 'folder', children: [
      { id: 'program-webinar', name: 'Revenue Leaders Webinar', type: 'event-program', status: 'paused', children: assetsFor('program-webinar', { email: ['Registration Confirmation', '24 Hour Reminder'], 'landing-page': ['Webinar Registration'], form: ['Webinar Registration Form'] }) },
      { id: 'program-summit', name: 'Customer Summit 2026', type: 'event-program', status: 'draft', children: assetsFor('program-summit') },
    ],
  },
  {
    id: 'folder-operational', name: 'Operational', type: 'folder', children: [
      { id: 'campaign-normalize', name: 'Normalize Country Data', type: 'smart-campaign', status: 'active' },
      { id: 'campaign-owner', name: 'Assign Lead Owner', type: 'smart-campaign', status: 'draft' },
    ],
  },
]

const expandableTypes: ActivityNodeType[] = ['folder', 'email-program', 'event-program', 'engagement-program', 'default-program', 'assets-folder', 'asset-category']
const programTypes: ActivityNodeType[] = ['smart-campaign', 'email-program', 'event-program', 'engagement-program', 'default-program']

function findNode(nodes: ActivityNode[], id: string): ActivityNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = node.children ? findNode(node.children, id) : undefined
    if (found) return found
  }
}

function findParentId(nodes: ActivityNode[], id: string, parentId = 'root'): string | undefined {
  for (const node of nodes) {
    if (node.id === id) return parentId
    const found = node.children ? findParentId(node.children, id, node.id) : undefined
    if (found) return found
  }
}

function mapTree(nodes: ActivityNode[], id: string, transform: (node: ActivityNode) => ActivityNode): ActivityNode[] {
  return nodes.map((node) => node.id === id ? transform(node) : { ...node, children: node.children ? mapTree(node.children, id, transform) : undefined })
}

function removeFromTree(nodes: ActivityNode[], id: string): { nodes: ActivityNode[]; removed?: ActivityNode } {
  let removed: ActivityNode | undefined
  const next: ActivityNode[] = []
  for (const node of nodes) {
    if (node.id === id) {
      removed = node
      continue
    }
    if (node.children) {
      const result = removeFromTree(node.children, id)
      if (result.removed) removed = result.removed
      next.push({ ...node, children: result.nodes })
    } else next.push(node)
  }
  return { nodes: next, removed }
}

function addToTree(nodes: ActivityNode[], parentId: string, child: ActivityNode): ActivityNode[] {
  if (parentId === 'root') return [...nodes, child]
  return mapTree(nodes, parentId, (parent) => ({ ...parent, children: [...(parent.children ?? []), child] }))
}

function containsNode(node: ActivityNode, id: string): boolean {
  return node.id === id || Boolean(node.children?.some((child) => containsNode(child, id)))
}

function collectExpandableIds(nodes: ActivityNode[]): string[] {
  return nodes.flatMap((node) => [expandableTypes.includes(node.type) ? node.id : '', ...(node.children ? collectExpandableIds(node.children) : [])]).filter(Boolean)
}

function filterTree(nodes: ActivityNode[], query: string): ActivityNode[] {
  if (!query.trim()) return nodes
  const normalized = query.toLowerCase()
  return nodes.flatMap((node) => {
    const children = node.children ? filterTree(node.children, query) : []
    return node.name.toLowerCase().includes(normalized) || children.length ? [{ ...node, children }] : []
  })
}

function cloneNode(node: ActivityNode, suffix: string): ActivityNode {
  return { ...node, id: `${node.id}-${suffix}`, name: `${node.name} Copy`, status: programTypes.includes(node.type) ? 'draft' : node.status, children: node.children?.map((child, index) => cloneNode(child, `${suffix}-${index}`)) }
}

function programChildren(id: string, type: ActivityNodeType): ActivityNode[] | undefined {
  if (type === 'smart-campaign') return undefined
  const assets = assetsFor(id)
  return type === 'default-program' ? [...assets, { id: `${id}-members`, name: 'Members', type: 'members-folder' }] : assets
}

export function MarketingActivitiesPhaseOne() {
  const nextId = useRef(1)
  const [tree, setTree] = useState<ActivityNode[]>(initialTree)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['folder-lifecycle', 'folder-demand', 'folder-events', 'program-q3-launch', 'program-q3-launch-assets']))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openProgramId, setOpenProgramId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [createState, setCreateState] = useState<{ kind: CreateKind; destinationId: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [deleteNode, setDeleteNode] = useState<ActivityNode | null>(null)
  const [renameNode, setRenameNode] = useState<ActivityNode | null>(null)
  const [clipboard, setClipboard] = useState<ActivityNode | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)

  const visibleTree = useMemo(() => filterTree(tree, query), [query, tree])
  const openProgram = openProgramId ? findNode(tree, openProgramId) : undefined
  const folderOptions = useMemo(() => {
    const rows: Array<{ id: string; name: string; level: number }> = [{ id: 'root', name: 'Marketing Activities', level: 0 }]
    function visit(nodes: ActivityNode[], level: number) {
      nodes.forEach((node) => {
        if (node.type === 'folder') {
          rows.push({ id: node.id, name: node.name, level })
          if (node.children) visit(node.children, level + 1)
        }
      })
    }
    visit(tree, 1)
    return rows
  }, [tree])

  function toggleNode(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openCreate(kind: CreateKind, destinationId = 'root') {
    setContextMenu(null)
    setCreateMenuOpen(false)
    setCreateState({ kind, destinationId })
  }

  function createItem(name: string, description: string, destinationId: string) {
    if (!createState) return
    const id = `new-${createState.kind}-${nextId.current++}`
    const type: ActivityNodeType = createState.kind === 'import' ? 'default-program' : createState.kind
    const node: ActivityNode = { id, name, type, status: type === 'folder' ? undefined : 'draft', children: type === 'folder' ? [] : programChildren(id, type) }
    setTree((current) => addToTree(current, destinationId, node))
    setExpanded((current) => new Set([...current, destinationId, id]))
    setSelectedId(id)
    setCreateState(null)
    void description
  }

  function importProgram(selection: { name: string; type: ActivityNodeType; sourceId?: string }, destinationId: string) {
    const id = `imported-program-${nextId.current++}`
    const source = selection.sourceId ? findNode(tree, selection.sourceId) : undefined
    const node: ActivityNode = source
      ? { ...cloneNode(source, `import-${nextId.current++}`), id, name: selection.name, status: 'draft' }
      : { id, name: selection.name, type: selection.type, status: 'draft', children: programChildren(id, selection.type) }
    setTree((current) => addToTree(current, destinationId, node))
    setExpanded((current) => new Set([...current, destinationId, id]))
    setSelectedId(id)
    setCreateState(null)
  }

  function deleteConfirmed() {
    if (!deleteNode) return
    setTree((current) => removeFromTree(current, deleteNode.id).nodes)
    if (selectedId === deleteNode.id) setSelectedId(null)
    if (openProgramId === deleteNode.id) setOpenProgramId(null)
    setDeleteNode(null)
  }

  function renameConfirmed(name: string) {
    if (!renameNode || !name.trim()) return
    setTree((current) => mapTree(current, renameNode.id, (node) => ({ ...node, name: name.trim() })))
    setRenameNode(null)
  }

  function updateStatus(nodeId: string, status: ProgramStatus) {
    setTree((current) => mapTree(current, nodeId, (node) => ({ ...node, status })))
    setContextMenu(null)
  }

  function openProgramEditor(nodeId: string) {
    const node = findNode(tree, nodeId)
    if (!node) return
    setSelectedId(nodeId)
    setContextMenu(null)
    setOpenProgramId(programTypes.includes(node.type) ? nodeId : null)
  }

  function cloneProgram(node: ActivityNode) {
    const parentId = findParentId(tree, node.id) ?? 'root'
    const cloned = cloneNode(node, `clone-${nextId.current++}`)
    setTree((current) => addToTree(current, parentId, cloned))
    setExpanded((current) => new Set([...current, parentId]))
    setContextMenu(null)
  }

  function pasteInto(folderId: string) {
    if (!clipboard) return
    const cloned = cloneNode(clipboard, `paste-${nextId.current++}`)
    setTree((current) => addToTree(current, folderId, cloned))
    setExpanded((current) => new Set([...current, folderId]))
    setContextMenu(null)
  }

  function createLocalAsset(program: ActivityNode, assetType: 'email' | 'landing-page' | 'form') {
    const categoryId = `${program.id}-${assetType === 'email' ? 'emails' : assetType === 'landing-page' ? 'pages' : 'forms'}`
    const label = assetType === 'email' ? 'Untitled Email' : assetType === 'landing-page' ? 'Untitled Landing Page' : 'Untitled Form'
    const asset: ActivityNode = { id: `asset-${nextId.current++}`, name: label, type: 'asset', assetType }
    setTree((current) => addToTree(current, categoryId, asset))
    setExpanded((current) => new Set([...current, program.id, `${program.id}-assets`, categoryId]))
    setContextMenu(null)
  }

  function moveNode(targetId: string) {
    if (!draggedId || draggedId === targetId) return
    const dragged = findNode(tree, draggedId)
    const target = targetId === 'root' ? undefined : findNode(tree, targetId)
    if (!dragged || (target && target.type !== 'folder') || containsNode(dragged, targetId)) return
    const result = removeFromTree(tree, draggedId)
    if (!result.removed) return
    setTree(addToTree(result.nodes, targetId, result.removed))
    setExpanded((current) => new Set([...current, targetId]))
    setDraggedId(null)
    setDropTargetId(null)
  }

  function handleContextMenu(event: MouseEvent, nodeId: string) {
    event.preventDefault()
    event.stopPropagation()
    const clientX = Number.isFinite(event.clientX) ? event.clientX : 200
    const clientY = Number.isFinite(event.clientY) ? event.clientY : 160
    setSelectedId(nodeId)
    setCreateMenuOpen(false)
    setContextMenu({ nodeId, x: Math.max(8, Math.min(clientX, window.innerWidth - 235)), y: Math.max(8, Math.min(clientY, window.innerHeight - 390)) })
  }

  function handleDragStart(event: DragEvent, nodeId: string) {
    event.dataTransfer.effectAllowed = 'move'
    setDraggedId(nodeId)
  }

  return <section className='marketingPhaseOne' onClick={() => { setContextMenu(null); setCreateMenuOpen(false) }}>
    <aside className='activityTreePane'>
      <div className='activityTreeTopbar'>
        <div className='activityTreeRoot'><strong>Marketing Activities</strong><div className='activityCreateWrap'><button type='button' className='activityAddButton' aria-label='Create in Marketing Activities' onClick={(event) => { event.stopPropagation(); setCreateMenuOpen((value) => !value) }}>＋</button>{createMenuOpen && <CreateDropdown onSelect={(kind) => openCreate(kind)} />}</div></div>
        <div className='activityTreeTools'><button type='button' title='Collapse all' onClick={() => setExpanded(new Set())}>⇈</button><button type='button' title='Expand all' onClick={() => setExpanded(new Set(collectExpandableIds(tree)))}>⇊</button></div>
      </div>
      <label className='activityTreeSearch'><WireframeIcon name='search' className='iconSmall' /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search programs…' />{query && <button type='button' onClick={() => setQuery('')}>×</button>}</label>
      <div className={`activityRootDrop ${draggedId ? 'dragging' : ''} ${dropTargetId === 'root' ? 'dropTarget' : ''}`} onDragOver={(event) => { event.preventDefault(); setDropTargetId('root') }} onDragLeave={() => setDropTargetId(null)} onDrop={(event) => { event.preventDefault(); moveNode('root') }}><span>Drop here to move to root</span></div>
      <div className='activityTreeScroll'>{visibleTree.map((node) => <TreeNode key={node.id} node={node} level={0} expanded={expanded} selectedId={selectedId} query={query} dropTargetId={dropTargetId} onToggle={toggleNode} onSelect={setSelectedId} onOpen={openProgramEditor} onContextMenu={handleContextMenu} onDragStart={handleDragStart} onDragEnd={() => { setDraggedId(null); setDropTargetId(null) }} onDragOverFolder={setDropTargetId} onDrop={moveNode} />)}</div>
      <footer className='activityTreeFooter'><span>{countPrograms(tree)} programs</span><span>Right-click for actions</span></footer>
    </aside>

    {openProgram && programTypes.includes(openProgram.type) ? <ProgramEditor key={openProgram.id} node={openProgram} onRename={(name) => setTree((current) => mapTree(current, openProgram.id, (node) => ({ ...node, name })))} onStatusChange={(status) => updateStatus(openProgram.id, status)} /> : <main className='activityPhasePlaceholder'><div><span>✣</span><h2>Select a program from the tree to view details.</h2><p>Double-click any program to open its editor.</p></div></main>}

    {contextMenu && <ActivityContextMenu node={findNode(tree, contextMenu.nodeId)} position={contextMenu} clipboardAvailable={Boolean(clipboard)} onCreate={(kind) => openCreate(kind, contextMenu.nodeId)} onOpen={() => openProgramEditor(contextMenu.nodeId)} onClone={cloneProgram} onStatus={updateStatus} onRename={(node) => { setRenameNode(node); setContextMenu(null) }} onDelete={(node) => { setDeleteNode(node); setContextMenu(null) }} onCopy={(node) => { setClipboard(node); setContextMenu(null) }} onPaste={pasteInto} onCreateAsset={createLocalAsset} onClose={() => setContextMenu(null)} />}
    {createState && (createState.kind === 'import' ? <ImportProgramModal destinationId={createState.destinationId} folderOptions={folderOptions} programs={flattenPrograms(tree)} onClose={() => setCreateState(null)} onImport={importProgram} /> : <CreateProgramModal state={createState} folderOptions={folderOptions} onClose={() => setCreateState(null)} onCreate={createItem} />)}
    {renameNode && <RenameModal node={renameNode} onClose={() => setRenameNode(null)} onRename={renameConfirmed} />}
    <Modal title='Delete Item' open={Boolean(deleteNode)} onClose={() => setDeleteNode(null)}><div className='activityDeleteConfirm'><span>!</span><h3>Delete “{deleteNode?.name}”?</h3><p>This removes the item and everything contained within it. This action cannot be undone.</p><footer><button type='button' className='button ghost' onClick={() => setDeleteNode(null)}>Cancel</button><button type='button' className='button dangerButton' onClick={deleteConfirmed}>Delete</button></footer></div></Modal>
  </section>
}

function TreeNode({ node, level, expanded, selectedId, query, dropTargetId, onToggle, onSelect, onOpen, onContextMenu, onDragStart, onDragEnd, onDragOverFolder, onDrop }: { node: ActivityNode; level: number; expanded: Set<string>; selectedId: string | null; query: string; dropTargetId: string | null; onToggle: (id: string) => void; onSelect: (id: string) => void; onOpen: (id: string) => void; onContextMenu: (event: MouseEvent, id: string) => void; onDragStart: (event: DragEvent, id: string) => void; onDragEnd: () => void; onDragOverFolder: (id: string | null) => void; onDrop: (id: string) => void }) {
  const isExpandable = expandableTypes.includes(node.type) && Boolean(node.children)
  const isOpen = query ? true : expanded.has(node.id)
  const isFolderDrop = node.type === 'folder'
  const matches = Boolean(query && node.name.toLowerCase().includes(query.toLowerCase()))
  const style = { '--tree-level': level } as CSSProperties
  return <div className='activityTreeNode' style={style}>
    <button type='button' draggable={node.type !== 'asset-category' && node.type !== 'assets-folder' && node.type !== 'members-folder'} className={`activityTreeRow type-${node.type} ${selectedId === node.id ? 'selected' : ''} ${matches ? 'searchMatch' : ''} ${dropTargetId === node.id ? 'dropTarget' : ''}`} onClick={() => { onSelect(node.id); if (isExpandable) onToggle(node.id) }} onDoubleClick={(event) => { event.stopPropagation(); onOpen(node.id) }} onContextMenu={(event) => onContextMenu(event, node.id)} onDragStart={(event) => onDragStart(event, node.id)} onDragEnd={onDragEnd} onDragOver={(event) => { if (isFolderDrop) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; onDragOverFolder(node.id) } }} onDragLeave={() => { if (dropTargetId === node.id) onDragOverFolder(null) }} onDrop={(event) => { if (isFolderDrop) { event.preventDefault(); event.stopPropagation(); onDrop(node.id) } }}>
      {level > 0 && <i className='treeConnector' />}
      <span className={`treeChevron ${isExpandable ? '' : 'hidden'}`}>{isOpen ? '⌄' : '›'}</span>
      {node.status ? <i className={`programStatusDot ${node.status}`} title={node.status} /> : <i className='programStatusSpacer' />}
      <TreeItemIcon type={node.type} open={isOpen} assetType={node.assetType} />
      <span className='activityTreeName'>{node.name}</span>
      {node.children && node.children.length > 0 && node.type === 'folder' && <small>{countPrograms(node.children)}</small>}
    </button>
    {isOpen && node.children?.map((child) => <TreeNode key={child.id} node={child} level={level + 1} expanded={expanded} selectedId={selectedId} query={query} dropTargetId={dropTargetId} onToggle={onToggle} onSelect={onSelect} onOpen={onOpen} onContextMenu={onContextMenu} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOverFolder={onDragOverFolder} onDrop={onDrop} />)}
  </div>
}

function TreeItemIcon({ type, open, assetType }: { type: ActivityNodeType; open: boolean; assetType?: ActivityNode['assetType'] }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (type === 'folder' || type === 'assets-folder' || type === 'asset-category' || type === 'members-folder') return <svg {...common} className={`activityTreeIcon folderIcon ${open ? 'open' : ''}`}><path d={open ? 'M3 8h7l2-2h8l1 3H5L3 19z' : 'M3 6h7l2 2h9v11H3z'} /></svg>
  if (type === 'smart-campaign') return <svg {...common} className='activityTreeIcon'><circle cx='12' cy='12' r='3' /><path d='M19 12a7 7 0 0 0-.2-1.5l2-1.5-2-3.4-2.4 1A7 7 0 0 0 14 5.2L13.6 3h-4L9 5.2A7 7 0 0 0 6.7 6.6l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 4 12c0 .5.1 1 .2 1.5l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 9 18.8l.5 2.2h4l.5-2.2a7 7 0 0 0 2.4-1.4l2.4 1 2-3.4-2-1.5c.1-.5.2-1 .2-1.5Z' /></svg>
  if (type === 'email-program' || (type === 'asset' && assetType === 'email')) return <svg {...common} className='activityTreeIcon'><rect x='3' y='5' width='18' height='14' rx='2' /><path d='m4 7 8 6 8-6' /></svg>
  if (type === 'event-program') return <svg {...common} className='activityTreeIcon'><rect x='3' y='5' width='18' height='16' rx='2' /><path d='M8 3v4M16 3v4M3 10h18' /></svg>
  if (type === 'engagement-program') return <svg {...common} className='activityTreeIcon'><path d='M12 3C9 7 6 10 6 14a6 6 0 0 0 12 0c0-4-3-7-6-11Z' /><circle cx='12' cy='14' r='2' /></svg>
  if (type === 'default-program') return <svg {...common} className='activityTreeIcon'><rect x='3' y='6' width='18' height='14' rx='2' /><path d='M9 6V4h6v2M12 10v6M9 13h6' /></svg>
  if (type === 'asset' && assetType === 'landing-page') return <svg {...common} className='activityTreeIcon'><rect x='4' y='3' width='16' height='18' rx='2' /><path d='M7 7h10M7 11h7M7 15h9' /></svg>
  if (type === 'asset' && assetType === 'form') return <svg {...common} className='activityTreeIcon'><rect x='4' y='3' width='16' height='18' rx='2' /><path d='M8 8h8M8 12h8M8 16h5' /></svg>
  return <svg {...common} className='activityTreeIcon'><path d='M5 3h10l4 4v14H5zM15 3v5h4' /></svg>
}

function CreateDropdown({ onSelect }: { onSelect: (kind: CreateKind) => void }) {
  return <div className='activityCreateDropdown' onClick={(event) => event.stopPropagation()}>{createOptions.map((option, index) => <button type='button' key={option.kind} className={index === 1 || index === 6 ? 'groupStart' : ''} onClick={() => onSelect(option.kind)}><span>{option.icon}</span>{option.label}</button>)}</div>
}

function ActivityContextMenu({ node, position, clipboardAvailable, onCreate, onOpen, onClone, onStatus, onRename, onDelete, onCopy, onPaste, onCreateAsset, onClose }: { node?: ActivityNode; position: ContextMenuState; clipboardAvailable: boolean; onCreate: (kind: CreateKind) => void; onOpen: () => void; onClone: (node: ActivityNode) => void; onStatus: (id: string, status: ProgramStatus) => void; onRename: (node: ActivityNode) => void; onDelete: (node: ActivityNode) => void; onCopy: (node: ActivityNode) => void; onPaste: (id: string) => void; onCreateAsset: (program: ActivityNode, type: 'email' | 'landing-page' | 'form') => void; onClose: () => void }) {
  if (!node) return null
  const isFolder = node.type === 'folder'
  const isSmart = node.type === 'smart-campaign'
  const isProgram = programTypes.includes(node.type)
  const isAsset = node.type === 'asset'
  return <div className='activityContextMenu' style={{ left: position.x, top: position.y }} onClick={(event) => event.stopPropagation()}>
    <header><TreeItemIcon type={node.type} open assetType={node.assetType} /><strong>{node.name}</strong><button type='button' onClick={onClose}>×</button></header>
    {isFolder && <>{createOptions.map((option) => <button type='button' key={option.kind} onClick={() => onCreate(option.kind)}><span>{option.icon}</span>{option.label}</button>)}<i /><button type='button' disabled={!clipboardAvailable} onClick={() => onPaste(node.id)}><span>▣</span>Paste</button><button type='button' onClick={() => onRename(node)}><span>✎</span>Rename</button><button type='button' className='danger' onClick={() => onDelete(node)}><span>×</span>Delete</button></>}
    {isProgram && <><button type='button' onClick={onOpen}><span>↗</span>Open</button><button type='button' onClick={onOpen}><span>✎</span>Edit</button><button type='button' onClick={() => onClone(node)}><span>▣</span>Clone</button><button type='button' onClick={() => onStatus(node.id, node.status === 'active' ? 'paused' : 'active')}><span>●</span>{node.status === 'active' ? 'Deactivate' : 'Activate'}</button><button type='button' onClick={() => onStatus(node.id, 'paused')}><span>▱</span>Archive</button><button type='button' onClick={() => onRename(node)}><span>✎</span>Rename</button><button type='button' onClick={() => onCopy(node)}><span>□</span>Copy</button>{!isSmart && <><i /><div className='contextSubheading'>Create Local Asset</div><button type='button' onClick={() => onCreateAsset(node, 'email')}><span>✉</span>Email</button><button type='button' onClick={() => onCreateAsset(node, 'landing-page')}><span>▤</span>Landing Page</button><button type='button' onClick={() => onCreateAsset(node, 'form')}><span>☷</span>Form</button></>}<i /><button type='button' className='danger' onClick={() => onDelete(node)}><span>×</span>Delete</button></>}
    {isAsset && <><button type='button'><span>✎</span>Edit</button><button type='button'><span>◉</span>Preview</button><button type='button' onClick={() => onRename(node)}><span>✎</span>Rename</button><button type='button'><span>↗</span>Move to Global Content</button><button type='button' onClick={() => onCopy(node)}><span>□</span>Copy to Clipboard</button><i /><button type='button' className='danger' onClick={() => onDelete(node)}><span>×</span>Delete</button></>}
  </div>
}

function CreateProgramModal({ state, folderOptions, onClose, onCreate }: { state: { kind: CreateKind; destinationId: string }; folderOptions: Array<{ id: string; name: string; level: number }>; onClose: () => void; onCreate: (name: string, description: string, destinationId: string) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState(state.destinationId)
  const option = createOptions.find((item) => item.kind === state.kind)
  const title = state.kind === 'import' ? 'Import Program' : option?.label ?? 'Create Program'
  return <Modal title={title} open onClose={onClose}><div className='activityCreateModal'>{state.kind === 'import' && <button type='button' className='programImportDrop'><span>⇧</span><strong>Drop a program archive here</strong><small>or click to choose a .zip file</small></button>}<label>Program Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={state.kind === 'folder' ? 'Folder name' : 'Enter program name'} /></label><label>Destination Folder<select value={destination} onChange={(event) => setDestination(event.target.value)}>{folderOptions.map((folder) => <option key={folder.id} value={folder.id}>{'— '.repeat(folder.level)}{folder.name}</option>)}</select></label>{state.kind !== 'folder' && <label>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder='Describe the purpose of this program' /></label>}{state.kind !== 'folder' && <div className='newProgramStatus'><span>Status</span><strong><i />Draft</strong><small>New programs remain inactive until configured and activated.</small></div>}<footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim()} onClick={() => onCreate(name.trim(), description, destination)}>{state.kind === 'folder' ? 'Create Folder' : state.kind === 'import' ? 'Import Program' : 'Create Program'}</button></footer></div></Modal>
}

function RenameModal({ node, onClose, onRename }: { node: ActivityNode; onClose: () => void; onRename: (name: string) => void }) {
  const [name, setName] = useState(node.name)
  return <Modal title='Rename Item' open onClose={onClose}><div className='activityRenameModal'><label>Name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onRename(name) }} /></label><footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' onClick={() => onRename(name)}>Rename</button></footer></div></Modal>
}

function ImportProgramModal({ destinationId, folderOptions, programs, onClose, onImport }: { destinationId: string; folderOptions: Array<{ id: string; name: string; level: number }>; programs: ActivityNode[]; onClose: () => void; onImport: (selection: { name: string; type: ActivityNodeType; sourceId?: string }, destinationId: string) => void }) {
  const templates: Array<{ id: string; name: string; description: string; type: ActivityNodeType; steps: string[] }> = [
    { id: 'lead-nurture', name: 'Lead Nurture', description: 'Three-stream engagement program with transition rules and welcome content.', type: 'engagement-program', steps: ['Smart List', 'Welcome', 'Wait', 'Transition'] },
    { id: 'webinar-followup', name: 'Webinar Follow-up', description: 'Registration, reminders, attendance decision, and follow-up assets.', type: 'event-program', steps: ['Register', 'Wait', 'Reminder', 'Decision'] },
    { id: 'simple-batch', name: 'Simple Batch', description: 'Filtered audience, one email, and a program-status update.', type: 'smart-campaign', steps: ['Smart List', 'Send Email', 'Status'] },
  ]
  const [tab, setTab] = useState<'template' | 'existing'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id)
  const [selectedProgram, setSelectedProgram] = useState(programs[0]?.id ?? '')
  const [destination, setDestination] = useState(destinationId)
  const [query, setQuery] = useState('')
  const chosenTemplate = templates.find((template) => template.id === selectedTemplate) ?? templates[0]
  const chosenProgram = programs.find((program) => program.id === selectedProgram)
  function handleImport() {
    if (tab === 'template') onImport({ name: chosenTemplate.name, type: chosenTemplate.type }, destination)
    else if (chosenProgram) onImport({ name: `Copy of ${chosenProgram.name}`, type: chosenProgram.type, sourceId: chosenProgram.id }, destination)
  }
  return <Modal title='Import Program' open onClose={onClose}><div className='importProgramModal'><div className='importProgramTabs'><button type='button' className={tab === 'template' ? 'active' : ''} onClick={() => setTab('template')}>From Template</button><button type='button' className={tab === 'existing' ? 'active' : ''} onClick={() => setTab('existing')}>From Existing</button></div><div className='importProgramBody'>{tab === 'template' ? <div className='importTemplateGrid'>{templates.map((template) => <button type='button' key={template.id} className={selectedTemplate === template.id ? 'selected' : ''} onClick={() => setSelectedTemplate(template.id)}><span className='importFlowThumb'>{template.steps.map((step, index) => <i key={step} style={{ left: `${12 + index * 24}%`, top: `${22 + (index % 2) * 34}%` }} />)}<b /></span><span><em>{template.type.replace('-', ' ')}</em><strong>{template.name}</strong><small>{template.description}</small><code>{template.steps.join(' → ')}</code></span><i>{selectedTemplate === template.id ? '✓' : ''}</i></button>)}</div> : <div className='importExistingList'><label><WireframeIcon name='search' className='iconSmall' /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search all existing programs…' /></label><div>{programs.filter((program) => program.name.toLowerCase().includes(query.toLowerCase())).map((program) => <button type='button' key={program.id} className={selectedProgram === program.id ? 'selected' : ''} onClick={() => setSelectedProgram(program.id)}><TreeItemIcon type={program.type} open /><span><strong>{program.name}</strong><small>{program.type.replace('-', ' ')} · {program.status ?? 'Draft'}</small></span><i>{selectedProgram === program.id ? '✓' : ''}</i></button>)}</div><p>The clone includes local assets, flow steps, Program Tokens, and configuration.</p></div>}<label className='importDestination'>Destination Folder<select value={destination} onChange={(event) => setDestination(event.target.value)}>{folderOptions.map((folder) => <option key={folder.id} value={folder.id}>{'— '.repeat(folder.level)}{folder.name}</option>)}</select></label></div><footer><span>{tab === 'template' ? `Template: ${chosenTemplate.name}` : chosenProgram ? `Clone: ${chosenProgram.name}` : 'Select a program'}</span><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={tab === 'existing' && !chosenProgram} onClick={handleImport}>Import Program</button></footer></div></Modal>
}

function flattenPrograms(nodes: ActivityNode[]): ActivityNode[] {
  return nodes.flatMap((node) => [...(programTypes.includes(node.type) ? [node] : []), ...(node.children ? flattenPrograms(node.children) : [])])
}

function countPrograms(nodes: ActivityNode[]): number {
  return nodes.reduce((count, node) => count + (programTypes.includes(node.type) ? 1 : 0) + (node.children ? countPrograms(node.children) : 0), 0)
}
