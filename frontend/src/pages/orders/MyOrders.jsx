import OrdersList from './OrdersList'
import withContractorScope from '../../components/withContractorScope'
import { useTranslation } from 'react-i18next'

const MyOrders = ({ isContractor, contractorGroupId, contractorGroupName }) => {
  const { t } = useTranslation()
  // For contractors, backend will scope by created_by_user_id; pass groupId for admins viewing a group if needed
  const title = t('orders.page.my.title', 'My Orders')
  const subtitle = contractorGroupName
    ? t('orders.page.my.subtitleForGroup', 'Accepted & locked quotes for {{group}}', {
        group: contractorGroupName,
      })
    : t('orders.page.my.subtitleDefault', 'Your accepted and locked quotes')

  return (
    <OrdersList
      title={title}
      subtitle={subtitle}
      groupId={isContractor ? contractorGroupId : null}
      isContractor={isContractor}
      mineOnly={true}
    />
  
  )
}

// Gate by 'proposals' so contractors with proposals module can access
export default withContractorScope(MyOrders, 'proposals')
