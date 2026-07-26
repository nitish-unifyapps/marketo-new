import { useState } from 'react'

interface FormBuilderProps { onBack: () => void }

const fieldLibrary = {
  Standard: ['First Name', 'Last Name', 'Email', 'Company', 'Job Title'],
  Custom: ['Company Size', 'Buying Timeline', 'Product Interest'],
  Hidden: ['UTM Source', 'Campaign ID', 'Lead Source'],
}

export function FormBuilder({ onBack }: FormBuilderProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [fields, setFields] = useState(['Work Email', 'First Name', 'Last Name', 'Company'])
  const [buttonText, setButtonText] = useState('Submit')
  const [redirectUrl, setRedirectUrl] = useState('https://marketonext.com/thank-you')

  return (
    <section className='standaloneFormBuilder'>
      <header className='builderActionBar'>
        <div className='builderIdentity'>
          <button type='button' className='backButton' onClick={onBack}>←</button>
          <div><strong>Contact Sales Form</strong><small>Standalone Form · Draft</small></div>
        </div>
        <div className='formWizardSteps'>
          <button type='button' className={step === 1 ? 'active' : 'complete'} onClick={() => setStep(1)}><span>{step === 2 ? '✓' : '1'}</span> Fields</button>
          <i />
          <button type='button' className={step === 2 ? 'active' : ''} onClick={() => setStep(2)}><span>2</span> Settings</button>
        </div>
        <button type='button' className='button solid'>Save Form</button>
      </header>

      {step === 1 ? (
        <div className='formBuilderLayout'>
          <aside className='fieldLibrary'>
            <h3>Field Library</h3><p>Drag fields into your form</p>
            {Object.entries(fieldLibrary).map(([group, items]) => (
              <section key={group}><h4>{group}</h4>{items.map((field) => (
                <button key={field} type='button' draggable onClick={() => !fields.includes(field) && setFields((current) => [...current, field])}><span>⋮⋮</span>{field}<b>+</b></button>
              ))}</section>
            ))}
          </aside>
          <main className='formDesignStage'>
            <div className='formStageHeader'><span>Form Preview</span><button type='button'>▰ Desktop</button></div>
            <div className='formPreviewCard'>
              <div className='formPreviewIntro'><span>LET’S TALK</span><h2>See Marketo Next in action</h2><p>Tell us a little about yourself and our team will be in touch.</p></div>
              <div className='formFieldsCanvas'>
                {fields.map((field, index) => (
                  <div className='formCanvasField' key={field}><span className='dragDots'>⋮⋮</span><label>{field}{index < 2 && <em>*</em>}<input placeholder={field === 'Work Email' ? 'you@company.com' : ''} /></label><span className='crmLinked'>✓ CRM</span><button type='button' onClick={() => setFields((current) => current.filter((item) => item !== field))}>×</button></div>
                ))}
                <div className='formDropTarget'>+ Drop a field here</div>
                <button type='button' className='formPreviewSubmit'>{buttonText}</button>
              </div>
            </div>
          </main>
          <aside className='formFieldSettings'>
            <h3>Field Settings</h3><div className='selectedComponentLabel'><span>@</span><div><strong>Work Email</strong><small>Standard field</small></div></div>
            <label className='propertyField'>Field Label<input defaultValue='Work Email' /></label>
            <label className='propertyField'>Placeholder<input defaultValue='you@company.com' /></label>
            <label className='propertyField'>CRM Mapping<select><option>Person.Email</option></select><em className='mappingBadge'>✓ Linked to CRM</em></label>
            <label className='toggleProperty'><span>Required field</span><input type='checkbox' className='toggleSwitch' defaultChecked /></label>
            <label className='toggleProperty'><span>Validate email format</span><input type='checkbox' className='toggleSwitch' defaultChecked /></label>
          </aside>
        </div>
      ) : (
        <div className='formSettingsStep'>
          <div className='formSettingsCard'>
            <header><span>2</span><div><h2>Form Settings</h2><p>Configure what happens after a visitor submits this form.</p></div></header>
            <div className='settingsSection'><h3>Submission Behavior</h3><label className='propertyField'>After submission<select><option>Redirect to a thank you page</option><option>Show confirmation message</option></select></label><label className='propertyField'>Thank you page URL<input value={redirectUrl} onChange={(event) => setRedirectUrl(event.target.value)} /></label></div>
            <div className='settingsSection'><h3>Button</h3><label className='propertyField'>Button text<input value={buttonText} onChange={(event) => setButtonText(event.target.value)} /></label><label className='colorProperty'>Button color<span><i />#D97757</span></label><div className='buttonPreview'><small>PREVIEW</small><button type='button'>{buttonText}</button></div></div>
            <div className='settingsSection'><h3>Notifications</h3><label className='toggleProperty'><span><strong>Notify owner on submission</strong><small>Send an email to the assigned CRM owner</small></span><input type='checkbox' className='toggleSwitch' defaultChecked /></label></div>
          </div>
          <footer><button type='button' className='button outline accent' onClick={() => setStep(1)}>Back to Fields</button><button type='button' className='button solid'>Save Form</button></footer>
        </div>
      )}
    </section>
  )
}
