import { SlidePanel } from '../common/SlidePanel'
import type { AccountRecord } from '../../types/crm'

interface AccountDetailPanelProps {
  account: AccountRecord
  onClose: () => void
}

export function AccountDetailPanel({ account, onClose }: AccountDetailPanelProps) {
  return (
    <SlidePanel title={account.accountName} onClose={onClose}>
      <div className='panelContent accountPanel'>
        <div className='accountSnapshot'>
          <p>
            <strong>Industry:</strong> {account.industry}
          </p>
          <p>
            <strong>Revenue:</strong> {account.revenue}
          </p>
          <p>
            <strong>Number of Contacts:</strong> {account.numberOfContacts}
          </p>
        </div>

        <section>
          <h4>Associated People</h4>
          <ul className='membershipList'>
            {account.associatedPeople.map((person) => (
              <li key={person.id}>
                <button type='button' className='textLink accent'>
                  {person.name}
                </button>
              </li>
            ))}
          </ul>

          <button type='button' className='button outline accent'>
            Add Person
          </button>
        </section>
      </div>
    </SlidePanel>
  )
}
