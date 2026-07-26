import { useState } from 'react'
import { savedReports } from '../../data/analyticsData'
import { Modal } from '../common/Modal'
import { WireframeIcon } from '../common/WireframeIcon'

const reportTypes = [
  { icon: '▥', name: 'Email Performance', description: 'Sends, delivery, engagement, and conversions.' },
  { icon: '⑂', name: 'Execution Performance', description: 'Flow entries, completion, and goal results.' },
  { icon: '◇', name: 'Revenue Attribution', description: 'Pipeline and revenue influenced by marketing.' },
  { icon: '▽', name: 'Lifecycle Funnel', description: 'Conversion across lifecycle stages.' },
]
const metrics = ['Sends', 'Delivered', 'Delivery Rate', 'Unique Opens', 'Open Rate', 'Unique Clicks', 'Click-through Rate', 'Conversions', 'Unsubscribes']

export function ReportsView() {
  const [builderOpen, setBuilderOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [reportType, setReportType] = useState('Email Performance')
  const [selectedMetrics, setSelectedMetrics] = useState(['Sends', 'Delivered', 'Open Rate', 'Click-through Rate'])
  const [search, setSearch] = useState('')

  function toggleMetric(metric: string) { setSelectedMetrics((current) => current.includes(metric) ? current.filter((item) => item !== metric) : [...current, metric]) }
  function closeBuilder() { setBuilderOpen(false); setStep(1) }

  return <section className='reportsView viewWrap'>
    <header className='analyticsPageHeader'><div><h2>Reports</h2><p>Build, schedule, and export performance reporting.</p></div><button type='button' className='button solid' onClick={() => setBuilderOpen(true)}><WireframeIcon name='plus' className='iconSmall' /> Create New Report</button></header>
    <div className='reportFilterBar'><label className='searchInputWrap'><WireframeIcon name='search' className='iconSmall muted' /><input className='searchInput' value={search} onChange={(event) => setSearch(event.target.value)} placeholder='Search reports...' /></label><select><option>All report types</option><option>Email Performance</option><option>Revenue Attribution</option></select><select><option>All owners</option><option>Maya Chen</option><option>Rita Nair</option></select><button type='button'>Last modified ↓</button></div>
    <div className='reportTable'><div className='reportTableHead'><span>Report Name</span><span>Type</span><span>Owner</span><span>Last Modified</span><span>Status</span><span>Export</span><span /></div>{savedReports.filter((report) => report.name.toLowerCase().includes(search.toLowerCase())).map((report) => <div className='reportRow' key={report.id}><span><i>▥</i><b>{report.name}</b></span><span>{report.type}</span><span>{report.owner}</span><span>{report.modified}</span><span><em className={`reportStatus ${report.status.toLowerCase()}`}>{report.status}</em>{report.schedule && <small>{report.schedule}</small>}</span><span className='reportDownloads'><button type='button' title='Download CSV'>↓ CSV</button><button type='button' title='Download PDF'>↓ PDF</button></span><button type='button' className='reportMore'>•••</button></div>)}</div>

    <Modal title='Create New Report' open={builderOpen} onClose={closeBuilder}>
      <div className='reportBuilder'>
        <div className='reportStepper'>{['Report Type', 'Metrics', 'Preview & Save'].map((label, index) => <div key={label} className={`${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'complete' : ''}`}><span>{step > index + 1 ? '✓' : index + 1}</span><b>{label}</b>{index < 2 && <i />}</div>)}</div>
        <div className='reportBuilderBody'>
          {step === 1 && <div className='reportTypeStep'><header><h3>Choose a report type</h3><p>Select the dataset and visualization foundation.</p></header><div>{reportTypes.map((type) => <button type='button' key={type.name} className={reportType === type.name ? 'selected' : ''} onClick={() => setReportType(type.name)}><span>{type.icon}</span><strong>{type.name}</strong><small>{type.description}</small><i /></button>)}</div></div>}
          {step === 2 && <div className='metricsStep'><header><h3>Configure metrics</h3><p>Choose the fields to include in this report.</p></header><div className='metricsLayout'><section><label className='searchInputWrap'><WireframeIcon name='search' className='iconTiny muted' /><input className='searchInput' placeholder='Search metrics...' /></label><h4>Email Metrics</h4>{metrics.map((metric) => <label key={metric} className='metricCheckbox'><input type='checkbox' checked={selectedMetrics.includes(metric)} onChange={() => toggleMetric(metric)} /><span>{metric}</span><small>{metric.includes('Rate') ? 'Percentage' : 'Number'}</small></label>)}</section><aside><h4>Selected Metrics</h4>{selectedMetrics.map((metric, index) => <div key={metric}><span>⋮⋮</span><b>{metric}</b><button type='button' onClick={() => toggleMetric(metric)}>×</button><small>{index === 0 ? 'Primary metric' : 'Metric'}</small></div>)}</aside></div></div>}
          {step === 3 && <div className='reportPreviewStep'><header><div><h3>Preview your report</h3><p>{reportType} · {selectedMetrics.length} metrics selected</p></div><div className='previewMode'><button type='button' className='active'>Chart</button><button type='button'>Table</button></div></header><div className='reportNameFields'><label className='propertyField'>Report Name<input defaultValue='Q3 Email Performance Overview' /></label><label className='propertyField'>Folder<select><option>Marketing Reports / Q3</option><option>Shared Reports</option></select></label></div><div className='reportPreviewChart'><div className='previewLegend'><span><i />Open Rate</span><span><i />Click-through Rate</span></div><svg viewBox='0 0 650 190' preserveAspectRatio='none'><g><line x1='35' y1='30' x2='635' y2='30' /><line x1='35' y1='80' x2='635' y2='80' /><line x1='35' y1='130' x2='635' y2='130' /><line x1='35' y1='175' x2='635' y2='175' /></g><polyline points='35,142 120,123 205,131 290,91 375,99 460,64 545,71 635,42' /><polyline className='secondary' points='35,165 120,157 205,160 290,145 375,148 460,132 545,137 635,119' /></svg></div><div className='scheduleExport'><div><strong>Schedule export</strong><small>Automatically send this report to stakeholders.</small></div><button type='button' className='button outline accent'>Schedule Export</button></div></div>}
        </div>
        <footer className='reportBuilderFooter'><button type='button' className='button ghost' onClick={step === 1 ? closeBuilder : () => setStep((value) => value - 1)}>Back</button><span>Step {step} of 3</span><button type='button' className='button solid' onClick={step === 3 ? closeBuilder : () => setStep((value) => value + 1)}>{step === 3 ? 'Save Report' : 'Continue'}</button></footer>
      </div>
    </Modal>
  </section>
}
