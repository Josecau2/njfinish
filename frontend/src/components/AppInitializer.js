import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import axiosInstance from '../helpers/axiosInstance'
import { setCustomization } from '../store/slices/customizationSlice'
import { CSpinner } from '@coreui/react'

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)




  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axiosInstance.get('/api/settings/customization')

        if (res.data && Object.keys(res.data).length > 0) {
          dispatch(setCustomization(res.data))
        } else {
          dispatch(setCustomization({
            headerBg: '#ffffff',
            headerFontColor: '#333333',
            sidebarBg: '#212631',
            sidebarFontColor: '#ffffff',
            logoText: 'NJ Cabinets',
            logoImage: null,
          }))
        }
      } catch (err) {
        console.error('Customization load error:', err)
        dispatch(setCustomization({
          headerBg: '#ffffff',
          headerFontColor: '#333333',
          sidebarBg: '#212631',
          sidebarFontColor: '#ffffff',
          logoText: 'NJ Cabinets',
          logoImage: null,
        }))
      } finally {
        setLoading(false)
      }
    }

    fetchCustomization()
  }, [dispatch])

  if (loading) {
    return (
      <div className="text-center pt-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  return children
}

export default AppInitializer
