import { useState } from 'react'

interface ResultsViewProps {
  variant: 'smart-campaign' | 'email-program'
}

const campaignMembers = [
  { name: 'Sophia Kim', email: 'sophia.kim@northlane.com', status: 'Goal Reached', activity: 'Clicked email · 12 min ago' },
  { name: 'Noah Patel', email: 'noah.patel@brightscale.io', status: 'Delivered', activity: 'Email delivered · 28 min ago' },
  { name: 'Elena Garcia', email: 'elena.garcia@hexametrics.com', status: 'Opened', activity: 'Opened email · 1h ago' },
  { name: 'Arjun Rao', email: 'arjun.rao@finarc.io', status: 'Sent', activity: 'Email sent · 2h ago' },
  { name: 'Grace Walker', email: 'grace.walker@cloudforge.net', status: 'Member', activity: 'Added to campaign · 3h ago' },
]

export function ResultsView({ variant }: ResultsViewProps) {
  const [status, setStatus] = useState('All statuses')
  const emailProgram = variant === 'email-program'
  const kpis = emailProgram
    ? [
        { label: 'Delivered', value: '11,926', trend: '+8.4%', icon: '✓' },
        { label: 'Opens', value: '5,094', trend: '+12.1%', icon: '◉' },
        { label: 'Clicks', value: '1,064', trend: '+5.6%', icon: '↗' },
        { label: 'CTR', value: '8.9%', trend: '+1.4%', icon: '%' },
        { label: 'Bounce Rate', value: '1.6%', trend: '-0.3%', icon: '!' },
        { label: 'Unsubscribe', value: '0.18%', trend: '-0.02%', icon: '−' },
      ]
    : [
        { label: 'Total Members', value: '12,842', trend: '+9.2%', icon: '♙' },
        { label: 'Sent', value: '12,118', trend: '+8.1%', icon: '✉' },
        { label: 'Delivered', value: '11,926', trend: '+8.4%', icon: '✓' },
        { label: 'Opened', value: '5,094', trend: '+12.1%', icon: '◉' },
        { label: 'Clicked', value: '1,064', trend: '+5.6%', icon: '↗' },
        { label: 'Goal Reached', value: '684', trend: '+14.8%', icon: '★' },
      ]
  const filteredMembers = status === 'All statuses' ? campaignMembers : campaignMembers.filter((member) => member.status === status)

  return <div className='phase2Results'>
    <header><div><h3>{emailProgram ? 'Email Performance' : 'Campaign Results'}</h3><p>Updated in real-time · Last refreshed just now</p></div><div><label><span>◫</span><select><option>Last 30 days</option><option>Last 7 days</option><option>This quarter</option></select></label><button type='button' className='button outline accent'>↓ Export CSV</button></div></header>
    <div className='phase2KpiGrid'>{kpis.map((kpi, index) => <article key={kpi.label}><span>{kpi.icon}</span><div><small>{kpi.label}</small><strong>{kpi.value}</strong><em className={kpi.trend.startsWith('-') && index < 3 ? 'negative' : 'positive'}>{kpi.trend.startsWith('-') ? '↘' : '↗'} {kpi.trend}</em></div></article>)}</div>
    <article className='phase2ResultsChart'><header><div><strong>Engagement Over Time</strong><small>Sends, opens, and clicks by day</small></div><div><span><i className='sent' />Sent</span><span><i className='opened' />Opened</span><span><i className='clicked' />Clicked</span></div></header><svg viewBox='0 0 900 260' preserveAspectRatio='none'><g className='resultGrid'><line x1='55' y1='25' x2='880' y2='25' /><line x1='55' y1='80' x2='880' y2='80' /><line x1='55' y1='135' x2='880' y2='135' /><line x1='55' y1='190' x2='880' y2='190' /><line x1='55' y1='235' x2='880' y2='235' /></g><g className='resultLabels'><text x='10' y='29'>4k</text><text x='10' y='84'>3k</text><text x='10' y='139'>2k</text><text x='10' y='194'>1k</text><text x='30' y='239'>0</text><text x='55' y='255'>Jul 1</text><text x='235' y='255'>Jul 7</text><text x='425' y='255'>Jul 14</text><text x='620' y='255'>Jul 21</text><text x='840' y='255'>Jul 27</text></g><polyline className='sent' points='55,190 145,162 235,170 325,115 415,128 505,78 595,95 685,52 775,64 880,31' /><polyline className='opened' points='55,219 145,205 235,209 325,180 415,187 505,154 595,162 685,132 775,138 880,105' /><polyline className='clicked' points='55,232 145,227 235,229 325,220 415,222 505,211 595,215 685,202 775,205 880,192' /></svg></article>
    <article className='campaignMembersCard'><header><div><strong>Campaign Members</strong><span>{filteredMembers.length} shown · 12,842 total</span></div><div><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option><option>Member</option><option>Sent</option><option>Delivered</option><option>Opened</option><option>Goal Reached</option></select><label><span>⌕</span><input placeholder='Search members…' /></label></div></header><div className='campaignMembersTable'><div className='membersTableHead'><span>Name</span><span>Email</span><span>Status</span><span>Last Activity</span><span /></div>{filteredMembers.map((member) => <div className='memberResultRow' key={member.email}><span><i>{member.name.split(' ').map((part) => part[0]).join('')}</i><strong>{member.name}</strong></span><span>{member.email}</span><span><em className={`status-${member.status.toLowerCase().replace(' ', '-')}`}>{member.status}</em></span><span>{member.activity}</span><button type='button'>•••</button></div>)}</div></article>
  </div>
}
