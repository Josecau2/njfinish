import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CFormCheck, CFormSwitch,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilHome, cilBrush } from '@coreui/icons';
import ModificationModalEdit from '../components/model/ModificationModalEdit'
import { useDispatch, useSelector } from 'react-redux';
import { fetchTaxes } from '../store/slices/taxSlice';
import CatalogTableEdit from './CatalogTableEdit';
import axiosInstance from '../helpers/axiosInstance';
import { setTableItemsEdit as setTableItemsRedux } from '../store/slices/selectedVersionEditSlice';
import { setSelectVersionNewEdit } from '../store/slices/selectVersionNewEditSlice';
import { isAdmin } from '../helpers/permissions';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};



const ItemSelectionContentEdit = ({ selectVersion, selectedVersion, formData, setFormData, setSelectedVersion, readOnly = false }) => {
    const { t } = useTranslation();


    // console.log('selectVersion edit: ', selectVersion);
    // console.log('selectVersion edit: ', selectVersion);
    // console.log('formData edit: ', formData);


    const api_url = import.meta.env.VITE_API_URL;
    const dispatch = useDispatch();
    const [selectedStyleData, setSelectedStyleData] = useState(null);
    const [tableItems, setTableItemsEdit] = useState([]);
    const [addOnTop, setAddOnTop] = useState(false);
    const [groupEnabled, setGroupEnabled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const collections = selectVersion?.manufacturerData?.collections || [];
    const catalogData = selectVersion?.manufacturerData?.catalogData || [];
    const [copied, setCopied] = useState(false);
    const [textChanges, setTextChanges] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    const [customItemTaxable, setCustomItemTaxable] = useState(true);
    const [customItems, setCustomItems] = useState([]);
    const [modificationModalVisible, setModificationModalVisible] = useState(false);
    const [selectedItemIndexForMod, setSelectedItemIndexForMod] = useState(null);
    const [modificationType, setModificationType] = useState('existing');
    const [existingModQty, setExistingModQty] = useState(1);
    const [existingModNote, setExistingModNote] = useState('');
    const [customModName, setCustomModName] = useState('');
    const [customModQty, setCustomModQty] = useState(1);
    const [customModPrice, setCustomModPrice] = useState('');
    const [customModNote, setCustomModNote] = useState('');
    const [customModTaxable, setCustomModTaxable] = useState(true);
    const [validationAttempted, setValidationAttempted] = useState(false);
    const [selectedExistingMod, setSelectedExistingMod] = useState('');
    const [modificationsMap, setModificationsMap] = useState({});
    const [isAssembled, setIsAssembled] = useState(true);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [userGroupMultiplier, setUserGroupMultiplier] = useState(1.0);
    const { taxes, loading } = useSelector((state) => state.taxes);
    const [customItemError, setCustomItemError] = useState('');
    const authUser = useSelector((state) => state.auth?.user);
    const isUserAdmin = isAdmin(authUser);
    const hideOtherStyles = readOnly && !isUserAdmin; // contractors in read-only should not see other styles
    const filteredItems = useMemo(() => (
        Array.isArray(tableItems)
            ? tableItems.filter(item =>
                (typeof item.code === 'string' && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (typeof item.description === 'string' && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            : []
    ), [tableItems, searchTerm]);

    // Items to use for calculations (do NOT depend on search filter)
    const versionItems = useMemo(() => (
        Array.isArray(tableItems)
            ? tableItems.filter(item => item.selectVersion === selectVersion?.versionName)
            : []
    ), [tableItems, selectVersion?.versionName]);


    const [fetchedCollections, setFetchedCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [modificationItems, setModificationItems] = useState('');
    const [itemModificationID, setItemModificationID] = useState('');



    useEffect(() => {
        if (
            formData &&
            Array.isArray(formData.manufacturersData) &&
            formData.manufacturersData.length > 0
        ) {
            // Prefer items matching the current versionName; fallback to first entry
            const md = formData.manufacturersData;
            const idx = selectVersion?.versionName
                ? md.findIndex(m => m.versionName === selectVersion.versionName)
                : 0;
            const itemsSrc = (idx !== -1 ? md[idx]?.items : md[0]?.items) || [];

            // Ensure existing items have proper includeAssemblyFee flag
            const itemsWithAssemblyFlag = itemsSrc.map(item => ({
                ...item,
                // Ensure items are attributed to this version so totals pick them up
                selectVersion: item.selectVersion || selectVersion?.versionName || '',
                includeAssemblyFee: item.includeAssemblyFee !== undefined ? item.includeAssemblyFee : true, // Default to true if assembly fee exists
                isRowAssembled: item.isRowAssembled !== undefined ? item.isRowAssembled : true
            }));
            setTableItemsEdit(itemsWithAssemblyFlag);
            // Also propagate to backing form/selectVersion so UI table uses these enriched items
            setFormData(prev => {
                const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
                const vIdx = selectVersion?.versionName
                    ? md.findIndex(m => m.versionName === selectVersion.versionName)
                    : -1;
                if (vIdx !== -1) {
                    md[vIdx] = { ...md[vIdx], items: itemsWithAssemblyFlag };
                } else if (md.length > 0) {
                    md[0] = { ...md[0], items: itemsWithAssemblyFlag };
                }
                return { ...prev, manufacturersData: md };
            });
            if (setSelectedVersion && selectVersion) {
                setSelectedVersion({ ...selectVersion, items: itemsWithAssemblyFlag });
            }
        } else {
            setTableItemsEdit([]); // fallback in case data is missing
        }
    }, []);

    // Load existing custom items from formData when version changes (guard against redundant updates)
    useEffect(() => {
        if (
            formData &&
            Array.isArray(formData.manufacturersData) &&
            formData.manufacturersData.length > 0
        ) {
            const currentVersion = formData.manufacturersData.find(
                manufacturer => manufacturer.versionName === selectVersion?.versionName
            );

            if (currentVersion && Array.isArray(currentVersion.customItems)) {
                const incoming = currentVersion.customItems;
                // Only update when changed to avoid feedback loops
                const same = JSON.stringify(incoming) === JSON.stringify(customItems);
                if (!same) setCustomItems(incoming);
            }
        }
    }, [selectVersion?.versionName]);

    const selectVersionInStore = useSelector(state => state.selectVersionNew?.data);
    const versionNameInStore = useSelector(state => state.selectVersionNew?.data?.versionName || null);
    useEffect(() => {
        const nextVersionName = selectVersion?.versionName || null;
        if (!nextVersionName) return;
        if (versionNameInStore !== nextVersionName) {
            dispatch(setSelectVersionNewEdit(selectVersion));
        }
        // Only run when the versionName changes to avoid deep-equals thrash
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectVersion?.versionName]);

    // Fetch user group multiplier on component mount
    useEffect(() => {
        const fetchUserMultiplier = async () => {
            try {
                const response = await axiosInstance.get('/api/user/multiplier', {
                    headers: getAuthHeaders()
                });
                if (response.data && response.data.multiplier) {
                    setUserGroupMultiplier(response.data.multiplier);
                }
            } catch (error) {
                console.error('Error fetching user multiplier:', error);
                // Keep default multiplier of 1.0 if error
            }
        };

        fetchUserMultiplier();
    }, []);

    // Force taxable ON for non-admins
    useEffect(() => {
        if (!isUserAdmin && customItemTaxable !== true) {
            setCustomItemTaxable(true);
        }
    }, [isUserAdmin]);

    useEffect(() => {
        if (!isUserAdmin && customModTaxable !== true) {
            setCustomModTaxable(true);
        }
    }, [isUserAdmin]);

    // Apply multiplier to existing items when multiplier is loaded
    useEffect(() => {
        if (userGroupMultiplier !== 1.0 && tableItems.length > 0) {
            const updatedItems = tableItems.map(item => {
                // Derive base price in an idempotent way
                const prevApplied = Number(item.appliedMultiplier || 0) || null;
                const currentPrice = Number(item.price) || 0;
                const base = item.originalPrice != null
                    ? Number(item.originalPrice)
                    : prevApplied && prevApplied > 0
                        ? currentPrice / prevApplied
                        : currentPrice;

                const multipliedPrice = Number(base) * Number(userGroupMultiplier || 1);
                const unitAssembly = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
                const qty = Number(item?.qty || 1);

                return {
                    ...item,
                    originalPrice: item.originalPrice != null ? item.originalPrice : base,
                    appliedMultiplier: Number(userGroupMultiplier || 1),
                    price: multipliedPrice,
                    total: (qty * multipliedPrice) + (unitAssembly * qty),
                };
            });

            // Update local table items and redux
            setTableItemsEdit(updatedItems);
            dispatch(setTableItemsRedux(updatedItems));

            // Propagate into formData.manufacturersData for the active version so UI table reflects it
            setFormData(prev => {
                const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
                const idx = selectVersion?.versionName
                    ? md.findIndex(m => m.versionName === selectVersion.versionName)
                    : -1;
                if (idx !== -1) {
                    md[idx] = { ...md[idx], items: updatedItems };
                }
                const next = { ...prev, manufacturersData: md };
                return next;
            });

            // Also update selectVersion items if setter available
            if (setSelectedVersion && selectVersion) {
                setSelectedVersion({ ...selectVersion, items: updatedItems });
            }
        }
    }, [userGroupMultiplier, dispatch]);

    // console.log('tableItems', tableItems);

    // Computed values needed for updateManufacturerData
    const defaultTax = taxes.find(tax => tax.isDefault);
    const defaultTaxValue = parseFloat(defaultTax?.value || '0');

    const totalModificationsCost = versionItems.reduce((sum, item) => {
        if (!item.modifications) return sum;

        const itemModsTotal = item.modifications.reduce((modSum, mod) => {
            const modPrice = parseFloat(mod.price || 0);
            const modQty = parseFloat(mod.qty || 1);
            return modSum + modPrice * modQty;
        }, 0);

        return sum + itemModsTotal;
    }, 0);

    const updateManufacturerData = useCallback(() => {
        try {
            // Since prices already include multiplier, don't apply it again
            const cabinetPartsTotal = versionItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const customItemsTotal = customItems.reduce((sum, item) => sum + (item.price * userGroupMultiplier), 0); // Only apply to custom items
            const modificationsTotal = totalModificationsCost;

            const assemblyFeeTotal = isAssembled
                ? versionItems.reduce((sum, item) => {
                    // Respect per-row toggle: only include when includeAssemblyFee is true
                    const unitFee = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
                    const qty = Number(item?.qty || 1);
                    const fee = unitFee * qty;
                    return sum + fee;
                }, 0)
                : 0;

            const styleTotal = cabinetPartsTotal + assemblyFeeTotal + customItemsTotal + modificationsTotal;

            const cabinets = customItems?.reduce((sum, item) => sum + (item.price * userGroupMultiplier), 0) +
                versionItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
            const discountAmount = (styleTotal * discountPercent) / 100;
            const totalAfterDiscount = styleTotal - discountAmount;
            const taxAmount = (totalAfterDiscount * defaultTaxValue) / 100;
            const grandTotal = totalAfterDiscount + taxAmount;

            setFormData(prev => {
                const existing = Array.isArray(prev?.manufacturersData) ? prev.manufacturersData : [];
                const updated = existing.map(manufacturer => {
                    if (manufacturer.versionName === selectVersion?.versionName) {
                        const matchedCustomItems = customItems.filter(
                            (item) => item.selectVersion === selectVersion?.versionName
                        );
                        const matchedItems = versionItems;
                        const updatedManufacturer = {
                            ...manufacturer,
                            selectedStyle: selectVersion?.selectedStyle,
                            items: matchedItems,
                            customItems: matchedCustomItems,
                            summary: {
                                cabinets: parseFloat((Number(cabinets) || 0).toFixed(2)),
                                assemblyFee: parseFloat((Number(assemblyFeeTotal) || 0).toFixed(2)),
                                modificationsCost: parseFloat((Number(totalModificationsCost) || 0).toFixed(2)),
                                styleTotal: parseFloat((Number(styleTotal) || 0).toFixed(2)),
                                discountPercent: Number(discountPercent) || 0,
                                discountAmount: parseFloat((Number(discountAmount) || 0).toFixed(2)),
                                total: parseFloat((Number(totalAfterDiscount) || 0).toFixed(2)),
                                taxRate: Number(defaultTaxValue) || 0,
                                taxAmount: parseFloat((Number(taxAmount) || 0).toFixed(2)),
                                grandTotal: parseFloat((Number(grandTotal) || 0).toFixed(2))
                            }
                        };
                        
                        // Also update selectVersion if setSelectedVersion is available
                        if (setSelectedVersion && selectVersion) {
                            setSelectedVersion({
                                ...selectVersion,
                                summary: updatedManufacturer.summary
                            });
                        }
                        
                        return updatedManufacturer;
                    }
                    return manufacturer;
                });

                // Avoid unnecessary state updates to prevent loops
                const same = JSON.stringify(existing) === JSON.stringify(updated);
                if (same) return prev;
                return { ...prev, manufacturersData: updated };
            });
        } catch (error) {
            // Error calculating totals
        }
    }, [filteredItems, customItems, totalModificationsCost, isAssembled, discountPercent, defaultTaxValue, selectVersion?.versionName, selectVersion?.selectedStyle, userGroupMultiplier]);

    useEffect(() => {
        updateManufacturerData();
    }, [updateManufacturerData]);

    useEffect(() => {
        dispatch(fetchTaxes());
    }, [dispatch]);


    const manufacturerId = formData?.manufacturersData?.[0]?.manufacturer;
    useEffect(() => {
        const fetchCollections = async () => {
            if (!manufacturerId) return;
            setCollectionsLoading(true);
            try {
                const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styleswithcatalog`, {
                    headers: getAuthHeaders()
                });
                const incoming = response.data || [];
                const same = JSON.stringify(incoming) === JSON.stringify(fetchedCollections);
                if (!same) setFetchedCollections(incoming); // Avoid redundant state updates
            } catch (error) {
                console.error('Error fetching styles with catalog:', error);
            } finally {
                setCollectionsLoading(false);
            }
        };

        fetchCollections();
        // Depend only on manufacturerId to avoid loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manufacturerId]);

    useEffect(() => {
        if (selectVersion?.selectedStyle && fetchedCollections.length > 0) {
            const match = fetchedCollections.find(col => col.id === selectVersion.selectedStyle) || null;
            const same = JSON.stringify(match) === JSON.stringify(selectedStyleData);
            if (!same) setSelectedStyleData(match);
        }
    }, [selectVersion?.selectedStyle, fetchedCollections]);

    const handleDelete = (index) => {
        // Update the formData.manufacturersData through the parent component
        if (selectVersion && selectVersion.items) {
            const updatedItems = selectVersion.items.filter((_, i) => i !== index);
            
            // Update formData.manufacturersData
            setFormData(prev => {
                const manufacturersData = Array.isArray(prev.manufacturersData) ? [...prev.manufacturersData] : [];
                
                // Find the manufacturer index that corresponds to selectVersion
                // Use versionName as stable identifier in this flow
                const manufacturerIndex = manufacturersData.findIndex(m => m.versionName === selectVersion.versionName);
                
                if (manufacturerIndex !== -1) {
                    // Update the items array for this manufacturer
                    manufacturersData[manufacturerIndex] = {
                        ...manufacturersData[manufacturerIndex],
                        items: updatedItems
                    };
                }
                
                const newFormData = {
                    ...prev,
                    manufacturersData
                };
                return newFormData;
            });

            // Also update Redux store
            dispatch(setSelectVersionNewEdit(updatedItems));
        }
        
        // Update local state as well for consistency
        setTableItemsEdit(prev => prev.filter((_, i) => i !== index));
    };

    const handleCatalogSelect = (e) => {
        const code = e.target.value;
        // console.log('code: ' , code);
        // console.log('fetchedCollections: ' , fetchedCollections);

        const item = fetchedCollections.find(cd => `${cd.code} -- ${cd.description}` === code);
    if (item) {
            const priceFields = [
                'AL', 'CM', 'CT', 'DS', 'GL', 'GR', 'KS',
                'NV', 'PE', 'SE', 'SG', 'WW'
            ];
            const basePrice = Number(item.price) || 0;
            const price = basePrice * Number(userGroupMultiplier || 1); // Apply multiplier to displayed price
            const baseAssemblyFee = parseFloat(item?.styleVariantsAssemblyCost?.price) || 0;
            const assemblyFee = baseAssemblyFee; // Don't multiply assembly fee
            const includeAssemblyFee = isAssembled; // Default to assembled state
            const totalAssemblyFee = includeAssemblyFee ? assemblyFee : 0;
            const total = price + totalAssemblyFee;

            const newItem = {
                id: item.id,
                code: item.code,
                description: item.description,
                qty: 1,
                // Track base and applied multiplier for idempotent recalculation later
                originalPrice: basePrice,
                appliedMultiplier: Number(userGroupMultiplier || 1),
                price,
                assemblyFee,
                includeAssemblyFee,
                isRowAssembled: isAssembled,
                total,
                selectVersion: selectVersion?.versionName
            };

            // Update manufacturersData items for current version
            setFormData(prev => {
                const manufacturersData = Array.isArray(prev.manufacturersData) ? [...prev.manufacturersData] : [];
                const idx = manufacturersData.findIndex(m => m.versionName === selectVersion.versionName);
                const currentItems = idx !== -1 && Array.isArray(manufacturersData[idx].items) ? manufacturersData[idx].items : [];
                const updatedItems = addOnTop ? [newItem, ...currentItems] : [...currentItems, newItem];
                if (idx !== -1) {
                    manufacturersData[idx] = { ...manufacturersData[idx], items: updatedItems };
                }
                // keep local table items in sync
                setTableItemsEdit(updatedItems);
                dispatch(setTableItemsRedux(updatedItems));
                return { ...prev, manufacturersData };
            });

        }
    };

    const updateQty = (index, newQty) => {
        if (newQty < 1) return;
        setFormData(prev => {
            const manufacturersData = Array.isArray(prev.manufacturersData) ? [...prev.manufacturersData] : [];
            const idx = manufacturersData.findIndex(m => m.versionName === selectVersion.versionName);
            if (idx !== -1) {
                const items = Array.isArray(manufacturersData[idx].items) ? [...manufacturersData[idx].items] : [];
                const updated = items.map((item, i) => {
                    if (i !== index) return item;
                    const assemblyFeeToAdd = item.includeAssemblyFee ? Number(item.assemblyFee || 0) : 0;
                    const unitAssembly = assemblyFeeToAdd;
                    return {
                        ...item,
                        qty: newQty,
                        total: newQty * Number(item.price || 0) + (unitAssembly * newQty),
                    };
                });
                manufacturersData[idx] = { ...manufacturersData[idx], items: updated };
                setTableItemsEdit(updated);
                dispatch(setTableItemsRedux(updated));
                if (setSelectedVersion && selectVersion) {
                    setSelectedVersion({ ...selectVersion, items: updated });
                }
            }
            return { ...prev, manufacturersData };
        });
    };


    const handleCopy = () => {
        const text = tableItems.map(item => `${item.code} x${item.qty}`).join('\n');
        if (text) {
            setTextChanges(false);
            navigator.clipboard.writeText(text);
        } else {
            setTextChanges(true);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddCustomItem = () => {
        if (!customItemName || !customItemPrice) {
            setCustomItemError('Please enter both item name and price.');
            return;
        }

        const newItem = {
            name: customItemName,
            price: parseFloat(customItemPrice),
            taxable: isUserAdmin ? customItemTaxable : true,
            selectVersion: selectVersion?.versionName
        };

        setCustomItems(prev => [...prev, newItem]);

        setCustomItemName('');
        setCustomItemPrice('');
    setCustomItemTaxable(true);
    };

    const handleDeleteCustomItem = (index) => {
        setCustomItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateModification = (filteredIdx, updatedModifications) => {
        // Update modificationsMap
        setModificationsMap(prev => ({
            ...prev,
            [filteredIdx]: updatedModifications
        }));

        const matchedItems = filteredItems.filter(
            (item) => item.selectVersion === selectVersion?.versionName
        );

        // Update tableItems
        const itemToUpdate = matchedItems[filteredIdx];
        const itemIndexInTable = tableItems?.findIndex(item => item?.id === itemToUpdate?.id);
        if (itemIndexInTable !== -1) {
            const updatedTableItems = [...tableItems];
            updatedTableItems[itemIndexInTable] = {
                ...updatedTableItems[itemIndexInTable],
                modifications: updatedModifications,
            };
            setTableItemsEdit(updatedTableItems);
        }
    };

    const handleOpenModificationModal = (index, id) => {
        setSelectedItemIndexForMod(index);
        setModificationModalVisible(true);
        setItemModificationID(id);
        fetchCatalogItems(id);
    };

    const fetchCatalogItems = async (id) => {
        try {
            if (id) {
                const response = await axiosInstance.get(`${api_url}/api/manufacturers/catalogs/modificationsItems/${id}`, {
                    headers: getAuthHeaders()
                });
                setModificationItems(response.data);
                // setExistingModifications(response.data); // <--- Add this
            }
        } catch (error) {
            // Error fetching modification items
        }
    }

    const handleSaveCustomModification = async (customData, catalogId) => {
        try {
            const payload = {
                catalogId,             // maps to catalogDataId
                name: customData.name, // maps to modificationName
                price: customData.price,
                note: customData.note,
                description: customData.note, // optional or use customData.description
            };

            await axiosInstance.post('/api/manufacturers/catalogs/modificationsItems/add', payload, {
                headers: getAuthHeaders()
            });
        } catch (err) {
            console.error('Error saving custom mod:', err);
        }
    };


    const handleSaveModification = () => {
        setValidationAttempted(true);

        if (modificationType === 'existing') {
            if (!selectedExistingMod || !existingModQty || existingModQty <= 0) {
                return;
            }
        } else if (modificationType === 'custom') {
            if (!customModQty || customModQty <= 0 || !customModName.trim()) {
                return;
            }
        }

        const mods = modificationsMap[selectedItemIndexForMod] || [];
        const selectedModObj = modificationItems.find(mod => mod.id == selectedExistingMod);

    const newMod = modificationType === 'existing'
            ? {
                type: 'existing',
                modificationId: selectedExistingMod,
                qty: existingModQty,
                note: existingModNote,
                name: selectedModObj ? selectedModObj.modificationName : '',
                price: selectedModObj ? selectedModObj.price : 0
            }
            : {
                type: 'custom',
                qty: customModQty,
                price: customModPrice,
        taxable: isUserAdmin ? customModTaxable : true,
                note: customModNote,
                name: customModName
            };

        const updatedMods = [...mods, newMod];
        updateModification(selectedItemIndexForMod, updatedMods);
        setModificationModalVisible(false);
        setExistingModQty(1);
        setExistingModNote('');
        setCustomModQty(1);
        setCustomModPrice('');
        setCustomModNote('');
    setCustomModTaxable(isUserAdmin ? false : true);
        setSelectedExistingMod('');
        setValidationAttempted(false);
        setCustomModName('')
        if (modificationType == 'custom') {
            handleSaveCustomModification(newMod, itemModificationID)
        }

    };

    const handleDeleteModification = (filteredIdx, modIdx) => {
        const updated = [...modificationsMap[filteredIdx]];
        updated.splice(modIdx, 1);
        updateModification(filteredIdx, updated);
    };

    const existingModifications = [
        { id: 1, name: "Modification A" },
        { id: 2, name: "Modification B" },
        { id: 3, name: "Modification C" },
    ];

    const formatPrice = (price) => {
        const val = Number(price);
        return !isNaN(val) ? `$${val.toFixed(2)}` : '$0.00';
    };


    const handleStyleSelect = (newStyleId) => {


        const updatedFormData = { ...formData };



        const versionIndex = updatedFormData.manufacturersData.findIndex(
            v => v.versionName === selectVersion.versionName
        );

        if (versionIndex !== -1) {
            updatedFormData.manufacturersData[versionIndex].selectedStyle = newStyleId;
            setFormData(updatedFormData);

            const updatedVersion = {
                ...selectVersion,
                selectedStyle: newStyleId,
            };



            setSelectedVersion(updatedVersion);
            // dispatch(setTableItemsRedux(updatedVersion)); 

            const styleData = collections.find(c => c.id === newStyleId);



            setSelectedStyleData(styleData);
        }
    };

    const toggleRowAssembly = (index, isChecked) => {
        const updatedItems = [...tableItems];
        const item = updatedItems[index];

        const newAssemblyFeeUnit = isChecked ? Number(item.assemblyFee || 0) : 0;
        const qty = Number(item.qty || 1);
        const newHinge = isChecked ? (item.hingeSide === "N/A" ? "" : item.hingeSide) : "N/A";
        const newExposed = isChecked ? (item.exposedSide === "N/A" ? "" : item.exposedSide) : "N/A";
        updatedItems[index] = {
            ...item,
            includeAssemblyFee: isChecked,
            isRowAssembled: isChecked,
            hingeSide: newHinge,
            exposedSide: newExposed,
            total: qty * Number(item.price || 0) + (newAssemblyFeeUnit * qty),
        };

        setTableItemsEdit(updatedItems);
        dispatch(setTableItemsRedux(updatedItems));

        // Update backing formData/selectVersion for consistency
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const idx = selectVersion?.versionName
                ? md.findIndex(m => m.versionName === selectVersion.versionName)
                : -1;
            if (idx !== -1) {
                md[idx] = { ...md[idx], items: updatedItems };
            }
            return { ...prev, manufacturersData: md };
        });
        if (setSelectedVersion && selectVersion) {
            setSelectedVersion({ ...selectVersion, items: updatedItems });
        }
    };

    const updateHingeSide = (index, selectedSide) => {
        setTableItemsEdit(prevItems => {
            const updated = prevItems.map((item, i) => {
                if (i !== index) return item;
                return {
                    ...item,
                    hingeSide: selectedSide,
                };
            });
            dispatch(setTableItemsRedux(updated));
            return updated;
        });
    };


    const updateExposedSide = (index, selectedSide) => {

        setTableItemsEdit(prevItems => {
            const updated = prevItems.map((item, i) => {
                if (i !== index) return item;
                return {
                    ...item,
                    exposedSide: selectedSide,
                };
            });
            dispatch(setTableItemsRedux(updated));
            return updated;
        });
    };

    return (
        <div>
            {selectedStyleData && (
                <>
                    <div className="d-flex gap-5 mb-4 flex-wrap" style={{ alignItems: 'stretch' }}>
                        <div style={{ minWidth: '250px', flex: '0 0 auto' }}>
                            <h5>{t('proposalUI.currentStyle')}</h5>
                            <div className="d-flex gap-4 align-items-start mt-3">
                                <div style={{ width: '100px' }}>
                                    <img
                                        // src={selectedStyleData.image}
                                        src={
                                            selectedStyleData.styleVariants?.[0]?.image
                                                ? `${api_url}/uploads/manufacturer_catalogs/${selectedStyleData.styleVariants[0].image}`
                                                : "/images/nologo.png"
                                        }
                                        alt="Selected Style"
                                        style={{
                                            width: '110%',
                                            height: '220px',
                                            objectFit: 'cover',
                                            borderRadius: '10px',
                                        }}
                                    />
                                </div>
                                <div className="d-flex flex-column" style={{ gap: '2rem' }}>
                                    <div className="d-flex align-items-center" style={{ fontSize: '1rem' }}>
                                        <CIcon
                                            icon={cilHome}
                                            className="me-2 text-primary"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <h5 className="mb-0">{selectVersion?.manufacturerData?.name}</h5>
                                    </div>
                                    <div className="d-flex align-items-center text-muted" style={{ fontSize: '1rem' }}>
                                        <CIcon icon={cilBrush} className="me-2 text-secondary" style={{ width: '20px', height: '20px' }} />
                                        <h5>{selectedStyleData.style}</h5>
                                    </div>
                                    <div className="d-flex align-items-center" style={{ fontSize: '1.1rem' }}>
                                        <CIcon icon={cilSettings} className="me-2 text-success" style={{ width: '20px', height: '20px' }} />
                                        <span className="me-2">{t('proposalColumns.assembled')}</span>
                                        <CFormSwitch
                                            size="md"
                                            shape="pill"
                                            checked={isAssembled}
                                            onChange={(e) => { if (!readOnly) setIsAssembled(e.target.checked); }}
                                            disabled={readOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!hideOtherStyles && (
                            <>
                                <div
                                    style={{
                                        width: '1px',
                                        backgroundColor: '#ccc',
                                        marginInline: '16px',
                                    }}
                                />

                                <div style={{ flex: 1 }}>
                                    <h5>{t('proposalUI.otherStyles')}</h5>
                                    <div
                                        style={{
                                            maxHeight: '270px',
                                            overflowY: 'auto',
                                            paddingRight: '8px',
                                        }}
                                    >

                                        {collectionsLoading ? (
                                            <div className="py-4 text-muted">{t('proposalUI.loadingStyles')}</div>
                                        ) : fetchedCollections.length === 0 ? (
                                            <div className="py-4 text-muted">{t('proposalUI.noStyles')}</div>
                                        ) : (
                                            <div className="d-flex flex-wrap gap-3 mt-3">
                                                {Array.from(
                                                    new Map(
                                                        fetchedCollections.map(item => [item.style, item]) // Deduplicate by `style`
                                                    ).values()
                                                ).map((styleItem, index) => {
                                                    const variant = styleItem.styleVariants?.[0]; // First variant (for image)

                                                    return (
                                                        <div
                                                            key={`style-${styleItem.id}-${index}`}
                                                            className="text-center"
                                                            style={{ width: '100px', flex: '0 0 auto', cursor: 'pointer' }}
                                                            onClick={() => handleStyleSelect(styleItem.id)}
                                                        >
                                                            <img
                                                                src={
                                                                    variant?.image
                                                                        ? `${api_url}/uploads/manufacturer_catalogs/${variant.image}`
                                                                        : "/images/nologo.png"
                                                                }
                                                                alt={variant?.shortName || styleItem.style}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '190px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '10px',
                                                                }}
                                                            />
                                                            <div
                                                                className="mt-2 border p-1 rounded"
                                                                style={{
                                                                    backgroundColor: styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#ffffff',
                                                                    border: styleItem.id === selectedStyleData?.id ? '3px solid #1a73e8' : '1px solid #ced4da',
                                                                    fontWeight: styleItem.id === selectedStyleData?.id ? '600' : 'normal',
                                                                }}
                                                            >
                                                                <strong>${styleItem.price}</strong>
                                                            </div>
                                                        </div>
                                                    );
                                                })}


                                            </div>

                                        )}


                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
            <hr />

            <CatalogTableEdit
                catalogData={fetchedCollections}
                handleCatalogSelect={handleCatalogSelect}
                addOnTop={addOnTop}
                setAddOnTop={readOnly ? () => {} : setAddOnTop}
                handleCopy={handleCopy}
                groupEnabled={groupEnabled}
                setGroupEnabled={readOnly ? () => {} : setGroupEnabled}
                searchTerm={searchTerm}
                setSearchTerm={readOnly ? () => {} : setSearchTerm}
                updateQty={readOnly ? () => {} : updateQty}
                handleOpenModificationModal={readOnly ? () => {} : handleOpenModificationModal}
                handleDelete={readOnly ? () => {} : handleDelete}
                updateModification={readOnly ? () => {} : updateModification}
                setModificationsMap={setModificationsMap}
                modificationsMap={modificationsMap}
                handleDeleteModification={readOnly ? () => {} : handleDeleteModification}
                formatPrice={formatPrice}
                selectVersion={selectVersion}
                isAssembled={isAssembled}
                selectedStyleData={selectedStyleData}
                toggleRowAssembly={readOnly ? () => {} : toggleRowAssembly}
                updateHingeSide={readOnly ? () => {} : updateHingeSide}
                updateExposedSide={readOnly ? () => {} : updateExposedSide}
                readOnly={readOnly}
            />

            {copied && (
                <div
                    className="position-fixed bottom-10 start-50 translate-middle-x p-3"
                    style={{ zIndex: 9999 }}
                >
                    <div className="toast show align-items-center text-white bg-success border-0">
                        <div className="d-flex">
                            <div className="toast-body">
                                {textChanges ? t('proposalUI.toast.copyEmpty') : t('proposalUI.toast.copySuccess')}
                            </div>
                            <button
                                type="button"
                                className="btn-close btn-close-white me-2 m-auto"
                                onClick={() => setCopied(false)}
                            ></button>
                        </div>
                    </div>
                </div>
            )}

            {!readOnly && (
            <div className="mt-5 p-0" style={{ maxWidth: '100%' }}>
                <div
                    className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"
                    style={{ rowGap: '0.75rem' }}
                >
                    <h6 className="mb-0 w-100 w-md-auto">{t('proposalUI.custom.title')}</h6>

                    <input
                        type="text"
                        placeholder={t('proposalUI.custom.itemName')}
                        value={customItemName}
                        onChange={e => {
                            setCustomItemName(e.target.value);
                            if (customItemError) setCustomItemError('');
                        }}
                        className="form-control"
                        style={{ flex: 1, minWidth: '200px', maxWidth: '100%' }}
                    />

                    <input
                        type="number"
                        placeholder={t('proposalUI.custom.price')}
                        value={customItemPrice}
                        onChange={e => {
                            setCustomItemPrice(e.target.value);
                            if (customItemError) setCustomItemError('');
                        }}
                        className="form-control"
                        style={{ width: '90px', minWidth: '70px' }}
                        min="0"
                        step="0.01"
                    />

                    <div className="form-check d-flex align-items-center">
                        <CFormCheck
                            checked={customItemTaxable}
                            onChange={(e) => { if (isUserAdmin) setCustomItemTaxable(e.target.checked); }}
                            disabled={!isUserAdmin}
                            style={{ transform: 'scale(1.4)' }}
                            label={<span style={{ fontSize: '1.1rem', marginLeft: '0.5rem' }}>{t('proposalUI.custom.taxable')}</span>}
                        />
                    </div>

                    <button className="btn btn-primary" style={{ minWidth: '80px' }} onClick={handleAddCustomItem}>
                        {t('proposalUI.custom.add')}
                    </button>
                </div>

                {customItemError && (
                    <div style={{ color: 'red', marginTop: '0.25rem' }}>
                        {customItemError}
                    </div>
                )}

                <div className="table-responsive">
                    <table className="table mt-5">
                        <thead>
                            <tr>
                                <th>{t('proposalUI.custom.table.index')}</th>
                                <th>{t('proposalUI.custom.table.itemName')}</th>
                                <th>{t('proposalUI.custom.table.price')}</th>
                                <th>{t('proposalUI.custom.table.taxable')}</th>
                                <th>{t('proposalUI.custom.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customItems?.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.name}</td>
                                    <td>${(Number(item.price) || 0).toFixed(2)}</td>

                                    <td>{item.taxable ? t('common.yes') : t('common.no')}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-danger text-white"
                                            onClick={() => handleDeleteCustomItem(idx)}
                                            disabled={readOnly}
                                            title={readOnly ? t('proposals.lockedTooltip') : undefined}
                                        >
                                            {t('proposalUI.custom.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Totals Summary */}
            <div className="mt-5 mb-5 d-flex justify-content-center">
                <table className="table shadow-lg" style={{ maxWidth: '500px' }}>
                    <tbody>
                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.cabinets')}</th>
                            <td className="text-center fw-medium">
                                ${selectVersion?.summary?.cabinets || "0"}
                            </td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.assembly')}</th>
                            <td className="text-center">${selectVersion?.summary?.assemblyFee || "0"}</td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.modifications')}</th>
                            <td className="text-center">${selectVersion?.summary?.modificationsCost || "0"}</td>
                        </tr>

                        <tr className="table-secondary">
                            <th>{t('proposalDoc.priceSummary.styleTotal')}</th>
                            <td className="text-center fw-semibold">
                                ${selectVersion?.summary?.styleTotal || "0"}
                            </td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalUI.summary.discountPct')}</th>
                            <td className="text-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={selectVersion?.summary?.discountPercent || "0"}
                                    onChange={(e) => {
                                        const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                        setDiscountPercent(val);
                                    }}
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        width: '60px',
                                        textAlign: 'right',
                                        fontWeight: '500',
                                    }}
                                />
                            </td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.total')}</th>
                            <td className="text-center">
                                ${selectVersion?.summary?.total || "0"}
                            </td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalUI.summary.taxRate')}</th>
                            <td className="text-center">{selectVersion?.summary?.taxRate || "0"}%</td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.tax')}</th>
                            <td className="text-center">
                                ${selectVersion?.summary?.taxAmount || "0"}
                            </td>
                        </tr>

                        <tr className="table-success fw-bold">
                            <th>{t('proposalDoc.priceSummary.grandTotal')}</th>
                            <td className="text-center">
                                ${selectVersion?.summary?.grandTotal || "0"}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <ModificationModalEdit
                itemModificationID={itemModificationID}
                catalogData={modificationItems}
                visible={modificationModalVisible}
                onClose={() => setModificationModalVisible(false)}
                onSave={handleSaveModification}
                modificationType={modificationType}
                setModificationType={setModificationType}
                existingModifications={modificationItems}
                selectedExistingMod={selectedExistingMod}
                setSelectedExistingMod={setSelectedExistingMod}
                existingModQty={existingModQty}
                setExistingModQty={setExistingModQty}
                existingModNote={existingModNote}
                setExistingModNote={setExistingModNote}
                customModName={customModName}
                setCustomModName={setCustomModName}
                customModQty={customModQty}
                setCustomModQty={setCustomModQty}
                customModPrice={customModPrice}
                setCustomModPrice={setCustomModPrice}
                customModTaxable={customModTaxable}
                setCustomModTaxable={setCustomModTaxable}
                customModNote={customModNote}
                setCustomModNote={setCustomModNote}
                validationAttempted={validationAttempted}
                isUserAdmin={isUserAdmin}
            />
        </div>
    );
};

export default ItemSelectionContentEdit;
