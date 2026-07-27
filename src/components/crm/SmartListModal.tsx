import { useState } from 'react'
import { Modal } from '../common/Modal'

interface SmartListModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => void
}

export function SmartListModal({ open, onClose, onCreate }: SmartListModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [folder, setFolder] = useState('CRM / Segments')

  function create() {
    if (!name.trim()) return
    onCreate(name.trim(), description.trim())
    setName('')
    setDescription('')
  }

  return <Modal title='Create Smart List' open={open} onClose={onClose}>
    <div className='createSmartListModal'>
      <div className='createSmartListIntro'><span>☷</span><div><h3>New Smart List</h3><p>Name the segment first. Smart List rules and member preview are configured on the next page.</p></div></div>
      <label>Smart List Name <strong>*</strong><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder='e.g. High Intent Enterprise MQLs' /></label>
      <label>Destination Folder<select value={folder} onChange={(event) => setFolder(event.target.value)}><option>CRM / Segments</option><option>CRM / Lifecycle Segments</option><option>CRM / Campaign Audiences</option><option>CRM / Shared Segments</option></select></label>
      <label>Description <span>Optional</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder='Describe who this Smart List is intended to identify' /></label>
      <div className='smartListCreationNote'><span>i</span><p>The Smart List will be saved as a draft until at least one rule is configured.</p></div>
      <footer><button type='button' className='button ghost' onClick={onClose}>Cancel</button><button type='button' className='button solid' disabled={!name.trim()} onClick={create}>Create & Edit Smart List</button></footer>
    </div>
  </Modal>
}
