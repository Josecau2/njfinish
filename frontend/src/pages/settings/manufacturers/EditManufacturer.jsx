import { useEffect, useState } from 'react';
import {
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CCard,
  CCardBody,
} from '@coreui/react';
import EditManufacturerTab from './tabs/EditManufacturerTab';
import SettingsTab from './tabs/SettingsTab';
import CatalogMappingTab from './tabs/CatalogMappingTab';
import StylePicturesTab from './tabs/StylePicturesTab';
import TypesTab from './tabs/TypesTab';
import FilesHistoryTab from './tabs/FilesHistoryTab';
import { useParams } from 'react-router-dom';
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

const EditManufacturer = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState(0);
  const manufacturer = useSelector((state) => state.manufacturers.selected);
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      // Don't load catalog data initially for manufacturer editing - only load basic info
      dispatch(fetchManufacturerById({ id, includeCatalog: false }));
    }
  }, [id, dispatch]);

  return (
    <div className="">
      <CNav variant="tabs" role="tablist" className="border-bottom-0 mb-0">
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer', padding: '12px 20px', fontSize: '0.95rem', fontWeight: '500' }}
            active={activeKey === 0}
            onClick={() => setActiveKey(0)}
            className={activeKey === 0 ? 'bg-primary text-white border-primary' : 'text-primary border-light'}
      >
        {t('settings.manufacturers.tabs.editDetails', 'Edit Manufacturer Details')}
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer', padding: '12px 20px', fontSize: '0.95rem', fontWeight: '500' }}
            active={activeKey === 1}
            onClick={() => setActiveKey(1)}
            className={activeKey === 1 ? 'bg-primary text-white border-primary' : 'text-primary border-light'}
      >
        {t('settings.manufacturers.tabs.settings', 'Settings')}
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer', padding: '12px 20px', fontSize: '0.95rem', fontWeight: '500' }}
            active={activeKey === 2}
            onClick={() => setActiveKey(2)}
            className={activeKey === 2 ? 'bg-primary text-white border-primary' : 'text-primary border-light'}
      >
        {t('settings.manufacturers.tabs.catalogMapping', 'Catalog Mapping')}
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer', padding: '12px 20px', fontSize: '0.95rem', fontWeight: '500' }}
            active={activeKey === 3}
            onClick={() => setActiveKey(3)}
            className={activeKey === 3 ? 'bg-primary text-white border-primary' : 'text-primary border-light'}
      >
        {t('settings.manufacturers.tabs.stylePictures', 'Style Pictures')}
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer', padding: '12px 20px', fontSize: '0.95rem', fontWeight: '500' }}
            active={activeKey === 4}
            onClick={() => setActiveKey(4)}
            className={activeKey === 4 ? 'bg-primary text-white border-primary' : 'text-primary border-light'}
      >
        {t('settings.manufacturers.tabs.typePictures', 'Type Pictures')}
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer', padding: '12px 20px', fontSize: '0.95rem', fontWeight: '500' }}
            active={activeKey === 5}
            onClick={() => setActiveKey(5)}
            className={activeKey === 5 ? 'bg-primary text-white border-primary' : 'text-primary border-light'}
      >
        {t('settings.manufacturers.tabs.filesHistory', 'Files & History')}
          </CNavLink>
        </CNavItem>
      </CNav>

      <CTabContent className="mt-4">
        <CTabPane visible={activeKey === 0}>
          <EditManufacturerTab manufacturer={manufacturer} id={id} />
        </CTabPane>
        <CTabPane visible={activeKey === 1}>
          <SettingsTab manufacturer={manufacturer} />
        </CTabPane>
        <CTabPane visible={activeKey === 2}>
          <CatalogMappingTab manufacturer={manufacturer} id={id} />
        </CTabPane>
        <CTabPane visible={activeKey === 3}>
          <StylePicturesTab manufacturer={manufacturer} />
        </CTabPane>
        <CTabPane visible={activeKey === 4}>
          <TypesTab manufacturer={manufacturer} />
        </CTabPane>
        <CTabPane visible={activeKey === 5}>
          <FilesHistoryTab manufacturer={manufacturer} />
        </CTabPane>
      </CTabContent>
    </div>
  );
};

export default EditManufacturer;
