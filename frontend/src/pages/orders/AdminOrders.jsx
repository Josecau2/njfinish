import OrdersList from './OrdersList'
import withContractorScope from '../../components/withContractorScope'
import { useTranslation } from 'react-i18next'

const AdminOrders = () => {
  const { t } = useTranslation()
  // For admins, show all; for group admins, could pass groupId, but keeping null shows all
  return (
    <OrdersList
      title={t('orders.page.all.title', 'Orders')}
      subtitle={t('orders.page.all.subtitle', 'All accepted and locked quotes')}
      groupId={null}
      isContractor={false}
    />
  
  )
}

// Gate by existing 'proposals' module so we don't require a new 'orders' module flag
export default withContractorScope(AdminOrders, 'proposals')
