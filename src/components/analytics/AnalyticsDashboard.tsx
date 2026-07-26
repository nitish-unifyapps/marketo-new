import { useState } from 'react'

export function AnalyticsDashboard() {
  const [customizing, setCustomizing] = useState(false)
  const [dateRange, setDateRange] = useState('Last 30 days')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  return <section className='analyticsDashboard viewWrap'>
    <header className='analyticsPageHeader'><div><h2>Marketing Overview</h2><p>Performance across content, executions, and pipeline.</p></div><div className='analyticsHeaderActions'><label className='dateRangePicker'><span>◫</span><select value={dateRange} onChange={(event) => setDateRange(event.target.value)}><option>Last 7 days</option><option>Last 30 days</option><option>This quarter</option><option>Custom range</option></select></label><button type='button' className='button outline accent' onClick={() => setCustomizing((value) => !value)}>{customizing ? 'Done Customizing' : 'Customize Dashboard'}</button><button type='button' className='button solid'>Save Dashboard</button></div></header>

    <div className={`analyticsWidgetGrid ${customizing ? 'customizing' : ''}`}>
      <Widget id='email' title='Email Performance Summary' className='widgetWide' menuOpen={menuOpen} setMenuOpen={setMenuOpen} customizing={customizing}>
        <div className='emailPerformanceWidget'><LineChart /><div className='emailKpis'><KpiRing label='Delivery Rate' value='98.4%' percent={98} /><KpiStat label='Open Rate' value='42.7%' trend='+3.2%' positive /><KpiStat label='Click-through Rate' value='8.9%' trend='+1.4%' positive /><KpiStat label='Unsubscribe' value='0.18%' trend='-0.03%' positive /></div></div>
      </Widget>
      <Widget id='funnel' title='Execution Funnel' menuOpen={menuOpen} setMenuOpen={setMenuOpen} customizing={customizing}><FunnelChart /></Widget>
      <Widget id='emails' title='Top Performing Emails' menuOpen={menuOpen} setMenuOpen={setMenuOpen} customizing={customizing}><HorizontalBars /></Widget>
      <Widget id='revenue' title='Revenue Pipeline' menuOpen={menuOpen} setMenuOpen={setMenuOpen} customizing={customizing}><RevenueBars /></Widget>
      <Widget id='growth' title='Smart List Growth' className='widgetWide' menuOpen={menuOpen} setMenuOpen={setMenuOpen} customizing={customizing}><AreaChart /></Widget>
    </div>
  </section>
}

interface WidgetProps { id: string; title: string; className?: string; children: React.ReactNode; menuOpen: string | null; setMenuOpen: (id: string | null) => void; customizing: boolean }
function Widget({ id, title, className = '', children, menuOpen, setMenuOpen, customizing }: WidgetProps) {
  return <article className={`analyticsWidget ${className}`}><header>{customizing && <span className='widgetDrag'>⋮⋮</span>}<h3>{title}</h3><div className='widgetMenuWrap'><button type='button' onClick={() => setMenuOpen(menuOpen === id ? null : id)}>•••</button>{menuOpen === id && <div className='widgetMenu'><button type='button'>Edit widget</button><button type='button'>View report</button><button type='button'>Remove</button></div>}</div></header>{children}</article>
}

function LineChart() {
  return <div className='chartWithLegend'><div className='chartLegend'><span><i className='sends' />Sends</span><span><i className='opens' />Opens</span><span><i className='clicks' />Clicks</span></div><svg className='analyticsLineChart' viewBox='0 0 620 185' preserveAspectRatio='none'><g className='chartGrid'><line x1='42' y1='20' x2='610' y2='20' /><line x1='42' y1='65' x2='610' y2='65' /><line x1='42' y1='110' x2='610' y2='110' /><line x1='42' y1='155' x2='610' y2='155' /></g><g className='axisLabels'><text x='4' y='24'>12k</text><text x='10' y='69'>8k</text><text x='10' y='114'>4k</text><text x='25' y='159'>0</text></g><polyline className='series sends' points='42,120 120,104 198,109 276,72 354,81 432,49 510,56 610,27' /><polyline className='series opens' points='42,145 120,137 198,140 276,118 354,124 432,104 510,108 610,91' /><polyline className='series clicks' points='42,153 120,150 198,151 276,146 354,147 432,139 510,142 610,134' /><g className='chartDates'><text x='42' y='180'>Jul 1</text><text x='190' y='180'>Jul 8</text><text x='345' y='180'>Jul 15</text><text x='500' y='180'>Jul 22</text><text x='585' y='180'>Jul 26</text></g></svg></div>
}

function KpiRing({ label, value, percent }: { label: string; value: string; percent: number }) {
  return <div className='emailKpi ringKpi'><svg viewBox='0 0 44 44'><circle cx='22' cy='22' r='17' /><circle className='progress' cx='22' cy='22' r='17' pathLength='100' strokeDasharray={`${percent} ${100 - percent}`} /></svg><div><span>{label}</span><strong>{value}</strong><small>+0.6% vs prior</small></div></div>
}
function KpiStat({ label, value, trend, positive }: { label: string; value: string; trend: string; positive?: boolean }) { return <div className='emailKpi'><span>{label}</span><strong>{value}</strong><small className={positive ? 'positive' : 'negative'}>↗ {trend} vs prior</small></div> }

function FunnelChart() {
  const stages = [{ name: 'Entered', value: '12,842', width: '100%' }, { name: 'Engaged', value: '8,416', width: '82%' }, { name: 'Qualified', value: '4,208', width: '64%' }, { name: 'Opportunity', value: '1,847', width: '47%' }, { name: 'Goal reached', value: '1,284', width: '34%' }]
  return <div className='funnelChart'>{stages.map((stage, index) => <div key={stage.name} style={{ width: stage.width, opacity: 1 - index * .12 }}><span>{stage.name}</span><strong>{stage.value}</strong><small>{index === 0 ? '100%' : `${Math.round((parseInt(stage.value.replace(',', '')) / 12842) * 100)}%`}</small></div>)}</div>
}

function HorizontalBars() {
  const rows = [{ name: 'Q3 Product Launch', opens: 92, clicks: 44 }, { name: 'Enterprise Welcome', opens: 78, clicks: 38 }, { name: 'Attribution Guide', opens: 68, clicks: 31 }, { name: 'Webinar Follow-up', opens: 56, clicks: 26 }]
  return <div className='horizontalBarChart'><div className='chartLegend'><span><i className='sends' />Opens</span><span><i className='opens' />Clicks</span></div>{rows.map((row) => <div className='horizontalBarRow' key={row.name}><span>{row.name}</span><div><i style={{ width: `${row.opens}%` }} /><b style={{ width: `${row.clicks}%` }} /></div><strong>{row.opens}%</strong></div>)}</div>
}

function RevenueBars() {
  const bars = [42, 65, 54, 83, 72, 96]
  return <div className='revenueChart'><div className='revenueTotal'><span>Influenced pipeline</span><strong>$4.82M</strong><small>↗ 18.6%</small></div><div className='verticalBars'>{bars.map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][index]}</span></div>)}</div></div>
}

function AreaChart() {
  return <div className='areaChartWrap'><div className='areaChartSummary'><div><span>Total members</span><strong>48,291</strong></div><small>↗ 12.8% growth this period</small></div><svg className='areaChart' viewBox='0 0 620 165' preserveAspectRatio='none'><defs><linearGradient id='area-fill' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#D97757' stopOpacity='.32' /><stop offset='100%' stopColor='#D97757' stopOpacity='.02' /></linearGradient></defs><g className='chartGrid'><line x1='20' y1='30' x2='610' y2='30' /><line x1='20' y1='80' x2='610' y2='80' /><line x1='20' y1='130' x2='610' y2='130' /></g><path className='areaFill' d='M20 125 C90 119 110 108 165 110 S240 85 300 91 S390 63 445 67 S535 38 610 28 L610 145 L20 145Z' /><path className='areaLine' d='M20 125 C90 119 110 108 165 110 S240 85 300 91 S390 63 445 67 S535 38 610 28' /></svg></div>
}
