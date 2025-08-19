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
import FilesHistoryTab from './tabs/FilesHistoryTab';
import { useParams } from 'react-router-dom';
import { fetchManufacturerById } from '../../../store/slices/manufacturersSlice';
import { useDispatch, useSelector } from 'react-redux';

const EditManufacturer = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [activeKey, setActiveKey] = useState(0);
  const manufacturer = useSelector((state) => state.manufacturers.selected);

  useEffect(() => {
    if (id) {
      dispatch(fetchManufacturerById(id));
    }
  }, [id, dispatch]);

  return (
    <div className="">
      <CNav variant="tabs" role="tablist">
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer' }}
            active={activeKey === 0}
            onClick={() => setActiveKey(0)}
          >
            Edit Manufacturer Details
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer' }}
            active={activeKey === 1}
            onClick={() => setActiveKey(1)}
          >
            Settings
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer' }}
            active={activeKey === 2}
            onClick={() => setActiveKey(2)}
          >
            Catalog Mapping
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink
            style={{ cursor: 'pointer' }}
            active={activeKey === 3}
            onClick={() => setActiveKey(3)}
          >
            Files & History
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
          <FilesHistoryTab manufacturer={manufacturer} />
        </CTabPane>
      </CTabContent>
    </div>
  );
};

export default EditManufacturer;
