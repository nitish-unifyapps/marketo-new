import { useMemo, useState } from 'react'
import { Modal } from '../common/Modal'
import { chartLabels, defaultProgramMembers, reportChartSeries, reportKpis } from '../../data/programReportsData'
import type { ProgramFlowStep, ProgramMemberRecord, ProgramRecord } from '../../types/programs'

type ReportSubTab = 'summary' | 'members'

interface ProgramReportsViewProps {
  program: ProgramRecord
  onMembersChange: (members: ProgramMemberRecord[]) => void
}

function flattenSteps(steps: ProgramFlowStep[]): ProgramFlowStep[] {
  return steps.flatMap((step) => [step, ...flattenSteps(step.children ?? []), ...(step.branches?.flatMap((branch) => flattenSteps(branch.steps)) ?? [])])
}

function memberStatuses(program: ProgramRecord) {
  if (program.type === 'Event') return ['Invited', 'Registered', 'Attended', 'No Show', 'Waitlisted', 'Cancelled']
  if (program.type === 'Nurture' || program.convertedToNurture) return ['Normal', 'Active', 'Paused', 'Exhausted']
  if (program.type === 'Container') return ['Member', 'Active', 'Inactive']
  return ['Member', 'Qualified', 'Engaged', 'Converted', 'Paused', 'Removed']
}

function memberMatchesDate(member: ProgramMemberRecord, range: string) {
  if (range === 'All time') return true
  const days = range === 'Last 7 days' ? 7 : range === 'Last 30 days' ? 30 : 90
  const reference = new Date('2026-07-28T23:59:59')
  const registered = new Date(`${member.registrationDate}T00:00:00`)
  return (reference.getTime() - registered.getTime()) / 86400000 <= days
}

function statusClass(status: string) {
  return status.toLowerCase().replaceAll(/[^a-z]+/g, '-')
}

function ReportSummary({ program }: { program: ProgramRecord }) {
  const [range, setRange] = useState('Last 30 days')
  const [customStart, setCustomStart] = useState('2026-07-01')
  const [customEnd, setCustomEnd] = useState('2026-07-28')
  const kpis = reportKpis(program.type, program.convertedToNurture)
  const series = reportChartSeries(program.type, program.convertedToNurture)
  const multiplier = range === 'Last 7 days' ? .72 : range === 'Last 90 days' ? 1.14 : range === 'Custom' ? .88 : 1
  const scaledSeries = series.map((item) => ({ ...item, values: item.values.map((value) => Math.min(100, Math.round(value * multiplier))) }))

  return <div className='programReportSummary'>
    <div className='programReportKpis'>{kpis.map((kpi) => <article key={kpi.label}><span>{kpi.label}</span><strong>{kpi.value}</strong><small className={kpi.direction}>{kpi.direction === 'up' ? '↗' : '↘'} {kpi.trend}</small></article>)}</div>
    <section className='programReportChartCard'>
      <header><div><strong>Performance Over Time</strong><small>Key program metrics for the selected period</small></div><div className='reportDateFilter'><select value={range} onChange={(event) => setRange(event.target.value)} aria-label='Report date range'><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option><option>Custom</option></select>{range === 'Custom' && <><input type='date' value={customStart} onChange={(event) => setCustomStart(event.target.value)} aria-label='Report start date' /><span>to</span><input type='date' value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} aria-label='Report end date' /></>}</div></header>
      <div className='programChartLegend'>{scaledSeries.map((item) => <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>)}</div>
      <div className='programMetricChart'>
        <svg viewBox='0 0 800 250' role='img' aria-label='Program metrics over time'>
          {[30, 75, 120, 165, 210].map((y) => <line key={y} x1='55' x2='780' y1={y} y2={y} stroke='#E7EAEE' strokeWidth='1' />)}
          {[0, 25, 50, 75, 100].map((value, index) => <text key={value} x='10' y={214 - index * 45} fill='#98A2B3' fontSize='10'>{value}%</text>)}
          {scaledSeries[0]?.values.map((value, index) => <rect key={index} x={70 + index * 88} y={210 - value * 1.75} width='24' height={value * 1.75} rx='4' fill={scaledSeries[0].color} opacity='.16' />)}
          {scaledSeries.map((item) => <g key={item.name}><polyline points={item.values.map((value, index) => `${82 + index * 88},${210 - value * 1.75}`).join(' ')} fill='none' stroke={item.color} strokeWidth='3' strokeLinecap='round' strokeLinejoin='round' />{item.values.map((value, index) => <circle key={index} cx={82 + index * 88} cy={210 - value * 1.75} r='4' fill='white' stroke={item.color} strokeWidth='2' />)}</g>)}
          {chartLabels.map((label, index) => <text key={label} x={82 + index * 88} y='238' textAnchor='middle' fill='#98A2B3' fontSize='9'>{label}</text>)}
        </svg>
      </div>
    </section>
  </div>
}

export function ProgramReportsView({ program, onMembersChange }: ProgramReportsViewProps) {
  const [subTab, setSubTab] = useState<ReportSubTab>(program.type === 'Container' ? 'members' : 'summary')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [streamFilter, setStreamFilter] = useState('All streams')
  const [dateFilter, setDateFilter] = useState('All time')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkStream, setBulkStream] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [openMemberId, setOpenMemberId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const members = program.members ?? defaultProgramMembers(program.type)
  const nurture = program.type === 'Nurture' || program.convertedToNurture
  const statuses = memberStatuses(program)
  const streams = useMemo(() => {
    const names = flattenSteps(program.flowSteps ?? []).filter((step) => step.type === 'Stream').map((step) => String(step.config.streamName || 'New Stream'))
    return [...new Set(names.length ? names : ['General Nurture', 'Engaged'])]
  }, [program.flowSteps])
  const openMember = members.find((member) => member.id === openMemberId)

  const filteredMembers = useMemo(() => members.filter((member) => {
    const normalized = query.trim().toLowerCase()
    const matchesQuery = !normalized || [member.name, member.email].some((value) => value.toLowerCase().includes(normalized))
    const matchesStatus = statusFilter === 'All statuses' || member.status === statusFilter
    const matchesStream = !nurture || streamFilter === 'All streams' || member.stream === streamFilter
    return matchesQuery && matchesStatus && matchesStream && memberMatchesDate(member, dateFilter)
  }), [dateFilter, members, nurture, query, statusFilter, streamFilter])

  function updateSelected(updater: (member: ProgramMemberRecord) => ProgramMemberRecord) {
    const selected = new Set(selectedIds)
    onMembersChange(members.map((member) => selected.has(member.id) ? updater(member) : member))
  }

  function addActivity(member: ProgramMemberRecord, label: string, type: ProgramMemberRecord['activity'][number]['type']): ProgramMemberRecord {
    return { ...member, lastActivity: 'Just now', activity: [{ id: `member-activity-${Date.now()}-${member.id}`, label, type, timestamp: 'Just now' }, ...member.activity] }
  }

  function changeStatus(status: string) {
    if (!status) return
    updateSelected((member) => addActivity({ ...member, status }, `Program status changed to ${status}`, 'status'))
    setNotice(`${selectedIds.length} members changed to ${status}.`)
    setBulkStatus('')
  }

  function pauseResume(status: 'Paused' | 'Active') {
    updateSelected((member) => addActivity({ ...member, status }, `${status === 'Paused' ? 'Paused in' : 'Resumed'} nurture program`, 'status'))
    setNotice(`${selectedIds.length} members ${status === 'Paused' ? 'paused' : 'resumed'}.`)
  }

  function moveToStream() {
    if (!bulkStream) return
    updateSelected((member) => addActivity({ ...member, stream: bulkStream, status: 'Active' }, `Moved to Stream: ${bulkStream}`, 'stream'))
    setNotice(`${selectedIds.length} members moved to ${bulkStream}.`)
    setBulkStream('')
  }

  function sendManualEmail() {
    if (!emailSubject.trim()) return
    updateSelected((member) => addActivity(member, `Manual email sent: ${emailSubject.trim()}`, 'email'))
    setNotice(`Manual email sent to ${selectedIds.length} members.`)
    setEmailOpen(false)
    setEmailSubject('')
    setEmailMessage('')
  }

  function exportCsv() {
    const selected = selectedIds.length ? members.filter((member) => selectedIds.includes(member.id)) : filteredMembers
    const rows = [['Name', 'Email', 'Status', 'Stream', 'Registration Date', 'Last Activity'], ...selected.map((member) => [member.name, member.email, member.status, member.stream ?? '', member.registrationDate, member.lastActivity])]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${program.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-members.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setNotice(`${selected.length} members exported.`)
  }

  const allVisibleSelected = filteredMembers.length > 0 && filteredMembers.every((member) => selectedIds.includes(member.id))

  return <div className='programReportsView'>
    <header className='programReportsHeader'><div><h2>Reports</h2><p>Measure program performance and manage membership.</p></div></header>
    <nav className='programReportsSubnav' aria-label='Program report views'>{program.type !== 'Container' && <button type='button' className={subTab === 'summary' ? 'active' : ''} onClick={() => setSubTab('summary')}>Summary</button>}<button type='button' className={subTab === 'members' ? 'active' : ''} onClick={() => setSubTab('members')}>Members <span>{members.length}</span></button></nav>

    {subTab === 'summary' && program.type !== 'Container' ? <ReportSummary program={program} /> : <div className='programMembersView'>
      <div className='programMemberFilters'>
        <label className='programMemberSearch'><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Search members by name or email…' /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label='Member status filter'><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        {nurture && <select value={streamFilter} onChange={(event) => setStreamFilter(event.target.value)} aria-label='Member stream filter'><option>All streams</option>{streams.map((stream) => <option key={stream}>{stream}</option>)}</select>}
        <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label='Member date range'><option>All time</option><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select>
        <button type='button' className='button outline' onClick={exportCsv}>↓ Export CSV</button>
      </div>

      {notice && <div className='programMemberNotice' role='status'><span>✓</span>{notice}<button type='button' onClick={() => setNotice('')}>×</button></div>}

      {selectedIds.length > 0 && <div className='programMemberBulkBar'><strong>{selectedIds.length} selected</strong><div><select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} aria-label='Bulk member status'><option value=''>Change Status…</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button type='button' disabled={!bulkStatus} onClick={() => changeStatus(bulkStatus)}>Apply</button><button type='button' onClick={() => setEmailOpen(true)}>✉ Send Email</button>{nurture && <><button type='button' onClick={() => pauseResume('Paused')}>Pause</button><button type='button' onClick={() => pauseResume('Active')}>Resume</button><select value={bulkStream} onChange={(event) => setBulkStream(event.target.value)} aria-label='Move members to Stream'><option value=''>Move to Stream…</option>{streams.map((stream) => <option key={stream}>{stream}</option>)}</select><button type='button' disabled={!bulkStream} onClick={moveToStream}>Move</button></>}<button type='button' onClick={exportCsv}>Export CSV</button><button type='button' className='clear' onClick={() => setSelectedIds([])}>×</button></div></div>}

      <div className='programMembersTableWrap'><table className='programMembersTable'><thead><tr><th><input type='checkbox' checked={allVisibleSelected} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...filteredMembers.map((member) => member.id)])] : selectedIds.filter((id) => !filteredMembers.some((member) => member.id === id)))} aria-label='Select all visible members' /></th><th>Name</th><th>Email</th><th>Status</th>{nurture && <th>Stream</th>}<th>{program.type === 'Event' ? 'Registration Date' : 'Member Since'}</th><th>Last Activity</th></tr></thead><tbody>{filteredMembers.map((member) => <tr key={member.id}><td><input type='checkbox' checked={selectedIds.includes(member.id)} onChange={() => setSelectedIds((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} aria-label={`Select ${member.name}`} /></td><td><button type='button' onClick={() => setOpenMemberId(member.id)}>{member.name}</button></td><td>{member.email}</td><td><span className={`programMemberStatus status-${statusClass(member.status)}`}>{member.status}</span></td>{nurture && <td><span className='programMemberStream'>{member.stream ?? '—'}</span></td>}<td>{member.registrationDate}</td><td>{member.lastActivity}</td></tr>)}{filteredMembers.length === 0 && <tr><td colSpan={nurture ? 7 : 6} className='programMembersEmpty'>No members match the selected filters.</td></tr>}</tbody></table></div>
      <footer className='programMembersFooter'><span>{filteredMembers.length} of {members.length} members</span><span>Membership updates are reflected immediately.</span></footer>
    </div>}

    <Modal title='Send Manual Email' open={emailOpen} onClose={() => setEmailOpen(false)}><div className='programManualEmailModal'><p>Send a one-time email to <strong>{selectedIds.length} selected members</strong>.</p><label>Subject<input autoFocus value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} placeholder='Email subject' /></label><label>Message<textarea value={emailMessage} onChange={(event) => setEmailMessage(event.target.value)} placeholder='Write a short message…' /></label><footer><button type='button' className='button ghost' onClick={() => setEmailOpen(false)}>Cancel</button><button type='button' className='button solid' disabled={!emailSubject.trim()} onClick={sendManualEmail}>Send Email</button></footer></div></Modal>

    {openMember && <div className='programMemberPanelScrim' onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenMemberId(null) }}><aside className='programMemberDetailPanel'><header><div><span>{openMember.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div><strong>{openMember.name}</strong><small>{openMember.email}</small></div></div><button type='button' onClick={() => setOpenMemberId(null)}>×</button></header><div className='programMemberSnapshot'><div><span>Status</span><strong>{openMember.status}</strong></div>{nurture && <div><span>Stream</span><strong>{openMember.stream}</strong></div>}<div><span>{program.type === 'Event' ? 'Registered' : 'Member Since'}</span><strong>{openMember.registrationDate}</strong></div></div><section><header><strong>Activity Timeline</strong><small>{openMember.activity.length} recorded activities</small></header><div className='programMemberTimeline'>{openMember.activity.map((activity) => <article key={activity.id}><i className={`type-${activity.type}`} /><div><strong>{activity.label}</strong><small>{activity.timestamp}</small></div></article>)}</div></section></aside></div>}
  </div>
}
