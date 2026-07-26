import { useState } from 'react'
import { attributionOpportunities, channelMappings } from '../../data/analyticsData'

const touchpoints = [
  { icon: '⌕', name: 'First Touch', channel: 'Paid Search', credit: '30%' },
  { icon: '▤', name: 'Lead Creation', channel: 'Content Download', credit: '20%' },
  { icon: '✉', name: 'Opportunity Creation', channel: 'Email Marketing', credit: '30%' },
  { icon: '◆', name: 'Closed Won', channel: 'Sales Touch', credit: '20%' },
]

export function AttributionView() {
  const [model, setModel] = useState('W-Shaped')
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('Lead Creation')
  const [mappingTab, setMappingTab] = useState<'mapping' | 'results'>('mapping')

  return <section className='attributionView viewWrap'>
    <header className='analyticsPageHeader'><div><h2>Marketing Attribution</h2><p>Configure how marketing touchpoints receive revenue credit.</p></div><div className='analyticsHeaderActions'><label className='attributionModelSelect'><span>Attribution model</span><select value={model} onChange={(event) => setModel(event.target.value)}><option>W-Shaped</option><option>First Touch</option><option>Last Touch</option><option>Linear</option><option>Time Decay</option></select></label><button type='button' className='button outline accent'>Compare Models</button><button type='button' className='button solid'>Save Model</button></div></header>

    <div className='attributionSummary'><div><span>Attributed Pipeline</span><strong>$8.42M</strong><small className='positive'>↗ 16.8% vs prior period</small></div><div><span>Influenced Revenue</span><strong className='accentValue'>$3.86M</strong><small className='positive'>↗ 12.4% vs prior period</small></div><div><span>Marketing Touchpoints</span><strong>53,788</strong><small>Across 8 active channels</small></div><div><span>Average Touches to Win</span><strong>7.4</strong><small>−0.8 vs prior period</small></div></div>

    <article className='attributionModelCard'><header><div><h3>{model} Attribution Model</h3><p>Drag touchpoints to reorder the customer journey. Select one to adjust its revenue credit.</p></div><button type='button'>•••</button></header><div className='touchpointFlow'>{touchpoints.map((touchpoint, index) => <div className='touchpointWrap' key={touchpoint.name}>{index > 0 && <span className='touchpointConnection'><i>→</i></span>}<button type='button' draggable className={`touchpointNode ${selectedTouchpoint === touchpoint.name ? 'active' : ''}`} onClick={() => setSelectedTouchpoint(touchpoint.name)}><em>⋮⋮</em><span>{touchpoint.icon}</span><div><small>{touchpoint.name}</small><strong>{touchpoint.channel}</strong></div><b>{touchpoint.credit}</b></button></div>)}</div><footer><span><i /> Active touchpoint</span><span>100% revenue credit allocated</span><button type='button' className='button outline accent'>+ Add Touchpoint</button></footer></article>

    <div className='attributionChartGrid'>
      <article className='analyticsWidget channelInfluenceChart'><header><h3>Influenced Revenue by Channel</h3><button type='button'>•••</button></header><div className='channelBars'>{[{ name: 'Email Marketing', value: '$1.24M', width: 92 }, { name: 'Paid Search', value: '$986K', width: 74 }, { name: 'Events', value: '$742K', width: 58 }, { name: 'Organic Search', value: '$521K', width: 42 }, { name: 'Paid Social', value: '$371K', width: 31 }].map((row) => <div key={row.name}><span>{row.name}</span><i><b style={{ width: `${row.width}%` }} /></i><strong>{row.value}</strong></div>)}</div></article>
      <article className='analyticsWidget attributionTrend'><header><h3>Revenue Influence Trend</h3><button type='button'>•••</button></header><div className='chartLegend'><span><i className='sends' />Influenced</span><span><i className='opens' />Sourced</span></div><svg viewBox='0 0 500 190' preserveAspectRatio='none'><defs><linearGradient id='attr-fill' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#D97757' stopOpacity='.25' /><stop offset='100%' stopColor='#D97757' stopOpacity='0' /></linearGradient></defs><g><line x1='25' y1='30' x2='485' y2='30' /><line x1='25' y1='80' x2='485' y2='80' /><line x1='25' y1='130' x2='485' y2='130' /><line x1='25' y1='175' x2='485' y2='175' /></g><path d='M25 154 C80 145 105 131 150 136 S225 96 270 106 S345 61 390 72 S445 39 485 31 L485 175 L25 175Z' /><polyline points='25,154 90,142 150,136 210,112 270,106 330,80 390,72 445,48 485,31' /><polyline className='secondary' points='25,168 90,161 150,157 210,146 270,139 330,125 390,119 445,101 485,94' /></svg></article>
    </div>

    <article className='attributionDataCard'><div className='attributionDataTabs'><button type='button' className={mappingTab === 'mapping' ? 'active' : ''} onClick={() => setMappingTab('mapping')}>Channel Mapping</button><button type='button' className={mappingTab === 'results' ? 'active' : ''} onClick={() => setMappingTab('results')}>Attribution Results</button><span /><button type='button'>Export ↓</button></div>{mappingTab === 'mapping' ? <ChannelMappingTable /> : <AttributionResultsTable />}</article>
  </section>
}

function ChannelMappingTable() {
  return <div className='channelMappingTable'><div className='attributionTableHead'><span>Channel</span><span>Source Rules</span><span>Assignment</span><span>Touchpoints</span><span /></div>{channelMappings.map((row) => <div className='channelMappingRow' key={row.channel}><span><i />{row.channel}</span><span>{row.source}</span><span><em>{row.assignment}</em></span><span>{row.touchpoints}</span><button type='button'>Edit</button></div>)}</div>
}
function AttributionResultsTable() {
  return <div className='attributionResultsTable'><div className='attributionTableHead'><span>Opportunity</span><span>Account</span><span>Amount</span><span>Model</span><span className='highlightHeader'>Influenced Revenue</span><span>Influence</span></div>{attributionOpportunities.map((row) => <div className='attributionResultRow' key={row.id}><span>{row.name}</span><span>{row.account}</span><span>{row.amount}</span><span>{row.model}</span><strong>{row.influencedRevenue}</strong><span><i><b style={{ width: `${row.influence}%` }} /></i>{row.influence}%</span></div>)}</div>
}
