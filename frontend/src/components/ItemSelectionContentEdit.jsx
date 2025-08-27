import { useEffect, useState, useCallback, useMemo, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CFormCheck, CFormSwitch,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilHome, cilBrush, cilChevronLeft, cilChevronRight, cilList } from '@coreui/icons';
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
    // Base-priced styles list for style comparison (mirror Create)
    const [stylesMeta, setStylesMeta] = useState([]);
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
    const [manufacturerCostMultiplier, setManufacturerCostMultiplier] = useState(1.0);
    const [userMultiplierFetched, setUserMultiplierFetched] = useState(false);
    const [manuMultiplierFetched, setManuMultiplierFetched] = useState(false);
    const [pricingReady, setPricingReady] = useState(false);
    // Stable baseline used for style comparisons so numbers don't change when selection changes
    const [comparisonBaseline, setComparisonBaseline] = useState({ styleId: null, stylePrice: null });
    const [carouselCurrentIndex, setCarouselCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4); // Desktop default
    const [isStylesCollapsed, setIsStylesCollapsed] = useState(false); // New state for collapse/expand
    const { taxes, loading } = useSelector((state) => state.taxes);
    const [customItemError, setCustomItemError] = useState('');
    const [unavailableCount, setUnavailableCount] = useState(0);
    const authUser = useSelector((state) => state.auth?.user);
    const customization = useSelector((state) => state.customization);
    const isUserAdmin = isAdmin(authUser);
    const hideOtherStyles = readOnly && !isUserAdmin; // contractors in read-only should not see other styles

    // Items to use for calculations (do NOT depend on search filter)
    const versionItems = useMemo(() => (
        Array.isArray(tableItems)
            ? tableItems.filter(item => item.selectVersion === selectVersion?.versionName)
            : []
    ), [tableItems, selectVersion?.versionName]);

    // Filtered items for style comparison calculations
    const filteredItems = useMemo(() => versionItems, [versionItems]);


    const [fetchedCollections, setFetchedCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [modificationItems, setModificationItems] = useState('');
    const [itemModificationID, setItemModificationID] = useState('');

    // Handle responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 767) {
                setItemsPerPage(2); // Mobile: 2 items per page
            } else if (window.innerWidth <= 992) {
                setItemsPerPage(4); // Tablet: 4 items per page
            } else if (window.innerWidth <= 1200) {
                setItemsPerPage(5); // Small desktop: 5 items per page
            } else {
                setItemsPerPage(6); // Large desktop: 6 items per page
            }
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset carousel when styles list changes
    useEffect(() => {
        setCarouselCurrentIndex(0);
    }, [stylesMeta]);

    // Carousel navigation functions
    const nextSlide = (e) => {
        if (e) e.preventDefault();
        const maxIndex = Math.max(0, stylesMeta.length - itemsPerPage);
        setCarouselCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = (e) => {
        if (e) e.preventDefault();
        setCarouselCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    const canGoNext = () => carouselCurrentIndex < stylesMeta.length - itemsPerPage;

    const canGoPrev = () => carouselCurrentIndex > 0;

    // Calculate what the total proposal price would be if a different style was selected (match Create flow)
    // Calculate what the total proposal price would be if a different style was selected — match Create exactly
    const calculateTotalForStyle = (stylePrice) => {
        try {
            // Use a stable baseline style price so comparisons are consistent across selections
            const baselineStylePrice = Number(
                (comparisonBaseline?.stylePrice != null ? comparisonBaseline.stylePrice : selectedStyleData?.price) || 0
            );
            const styleDifference = Number(stylePrice || 0) - baselineStylePrice;

            const manufacturerAdjustedDifference = styleDifference * Number(manufacturerCostMultiplier || 1);
            const finalStyleDifference = manufacturerAdjustedDifference * Number(userGroupMultiplier || 1);

            // ALWAYS use fallback prices so all style comparisons are based on the full user list,
            // regardless of which items are currently available in the selected style
            const cabinetPartsTotal = filteredItems.reduce((sum, item) => {
                const unit = Number(item.comparisonPriceFallback ?? item.price ?? 0);
                return sum + unit * Number(item.qty || 1);
            }, 0);
            const customItemsTotal = customItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
            const modificationsTotal = totalModificationsCost;

            const assemblyFeeTotal = isAssembled
                ? filteredItems.reduce((sum, item) => {
                    const unitFee = Number(item?.comparisonAssemblyUnitFallback ?? (item?.includeAssemblyFee ? item?.assemblyFee ?? 0 : 0));
                    const qty = Number(item?.qty || 1);
                    return sum + unitFee * qty;
                }, 0)
                : 0;

            const newStyleTotal = cabinetPartsTotal + assemblyFeeTotal + customItemsTotal + modificationsTotal + finalStyleDifference;
            const discountAmount = (newStyleTotal * Number(discountPercent || 0)) / 100;
            const totalAfterDiscount = newStyleTotal - discountAmount;
            const taxAmount = (totalAfterDiscount * Number(defaultTaxValue || 0)) / 100;
            const grandTotal = totalAfterDiscount + taxAmount;

            return grandTotal;
        } catch (error) {
            // swallow calculation error to avoid noisy console
            return 0;
        }
    };



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
            // Set fallback prices for all existing items when component loads - PRESERVE ORIGINAL BASELINE
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

                    // Initialize fallback prices ONCE from the original loaded data - never overwrite existing fallbacks
                    if (currentVersion && Array.isArray(currentVersion.items)) {
                        const itemsWithFallbacks = currentVersion.items.map(item => {
                            // If fallbacks already exist, preserve them (they represent the original baseline)
                            if (item.comparisonPriceFallback !== undefined && item.comparisonAssemblyUnitFallback !== undefined) {
                                return item;
                            }
                            // Only set fallbacks if they don't exist yet (first load)
                            return {
                                ...item,
                                comparisonPriceFallback: Number(item.price || 0),
                                comparisonAssemblyUnitFallback: item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0
                            };
                        });
                        setTableItemsEdit(itemsWithFallbacks);
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
                    setUserGroupMultiplier(Number(response.data.multiplier));
                }
            } catch (error) {
                // silent
                // Keep default multiplier of 1.0 if error
            } finally { setUserMultiplierFetched(true); }
        };

        fetchUserMultiplier();
    }, []);

    // Removed timer-based fallback to avoid delays; pricing readiness will be set by idempotent effects

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

    // Fallback: Ensure BOTH multipliers are applied when editing an existing proposal
    // Runs after items are loaded and both multipliers are fetched
    useEffect(() => {
        if (!userMultiplierFetched || !manuMultiplierFetched) return;
        if (tableItems.length === 0) return;

    // debug removed

        const needsUpdate = tableItems.some(item => {
            const appliedUser = item.appliedMultiplier || item.appliedUserGroupMultiplier || 1.0;
            const appliedManu = item.appliedManufacturerMultiplier || 1.0;
            const base = item.originalPrice || (appliedUser > 0 || appliedManu > 0 ? (Number(item.price) / (appliedManu * appliedUser)) : Number(item.price));
            const expected = Number(base) * Number(manufacturerCostMultiplier || 1) * Number(userGroupMultiplier || 1);
            const priceMismatch = Math.abs(Number(item.price) - expected) > 0.01;
            const multiplierMismatch = Math.abs(appliedUser - Number(userGroupMultiplier || 1)) > 0.001 || Math.abs(appliedManu - Number(manufacturerCostMultiplier || 1)) > 0.001;
            return priceMismatch || multiplierMismatch;
        });

        if (!needsUpdate) {
            setPricingReady(true);
            return;
        }

        const updatedItems = tableItems.map(item => {
            const appliedUser = item.appliedMultiplier || item.appliedUserGroupMultiplier || 1.0;
            const appliedManu = item.appliedManufacturerMultiplier || 1.0;
            const base = item.originalPrice || (appliedUser > 0 || appliedManu > 0 ? (Number(item.price) / (appliedManu * appliedUser)) : Number(item.price));
            const correctPrice = Number(base) * Number(manufacturerCostMultiplier || 1) * Number(userGroupMultiplier || 1);
            const unitAssembly = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
            const qty = Number(item?.qty || 1);
            return {
                ...item,
                originalPrice: Number(base),
                appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                appliedMultiplier: Number(userGroupMultiplier || 1),
                price: correctPrice,
                total: (qty * correctPrice) + (unitAssembly * qty),
            };
        });

        setTableItemsEdit(updatedItems);
        dispatch(setTableItemsRedux(updatedItems));
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
        setPricingReady(true);
    }, [userMultiplierFetched, manuMultiplierFetched, userGroupMultiplier, manufacturerCostMultiplier, tableItems, dispatch, selectVersion?.versionName, setSelectedVersion, setFormData]);

    // Apply BOTH multipliers idempotently when fetched or when items change
    useEffect(() => {
        if (!userMultiplierFetched || !manuMultiplierFetched) return;
        if (tableItems.length === 0) return;

        const updatedItems = tableItems.map(item => {
            const appliedUser = item.appliedMultiplier || item.appliedUserGroupMultiplier || 1.0;
            const appliedManu = item.appliedManufacturerMultiplier || 1.0;
            const currentPrice = Number(item.price) || 0;
            const base = item.originalPrice != null
                ? Number(item.originalPrice)
                : (appliedUser > 0 || appliedManu > 0)
                    ? currentPrice / (appliedManu * appliedUser)
                    : currentPrice;

            const expectedUser = Number(userGroupMultiplier || 1);
            const expectedManu = Number(manufacturerCostMultiplier || 1);
            const alreadyCorrect = Math.abs(appliedUser - expectedUser) <= 0.001 && Math.abs(appliedManu - expectedManu) <= 0.001;
            if (alreadyCorrect) return item;

            const price = Number(base) * expectedManu * expectedUser;
            const unitAssembly = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
            const qty = Number(item?.qty || 1);
            return {
                ...item,
                originalPrice: Number(base),
                appliedManufacturerMultiplier: expectedManu,
                appliedUserGroupMultiplier: expectedUser,
                appliedMultiplier: expectedUser,
                price,
                total: (qty * price) + (unitAssembly * qty),
            };
        });

        const hasChanges = updatedItems.some((item, index) => Math.abs(Number(item.price) - Number(tableItems[index]?.price || 0)) > 0.001
            || (Number(item.appliedManufacturerMultiplier || 1) !== Number(tableItems[index]?.appliedManufacturerMultiplier || 1))
            || (Number(item.appliedUserGroupMultiplier || 1) !== Number(tableItems[index]?.appliedUserGroupMultiplier || 1))
        );

        if (hasChanges) {
            setTableItemsEdit(updatedItems);
            dispatch(setTableItemsRedux(updatedItems));
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
        }
        setPricingReady(true);
    }, [userMultiplierFetched, manuMultiplierFetched, userGroupMultiplier, manufacturerCostMultiplier, tableItems, dispatch, selectVersion?.versionName, setSelectedVersion, setFormData]);

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
    }, [versionItems, customItems, totalModificationsCost, isAssembled, discountPercent, defaultTaxValue, selectVersion?.versionName, selectVersion?.selectedStyle, userGroupMultiplier]);

    useEffect(() => {
        updateManufacturerData();
    }, [updateManufacturerData]);

    useEffect(() => {
        dispatch(fetchTaxes());
    }, [dispatch]);


    const manufacturerId = formData?.manufacturersData?.[0]?.manufacturer;
    // Fetch manufacturer styles meta (base prices) and cost multiplier
    useEffect(() => {
        const fetchMeta = async () => {
            if (!manufacturerId) return;
            try {
                const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`, {
                    headers: getAuthHeaders()
                });
                if (res?.data?.manufacturerCostMultiplier !== undefined) {
                    setManufacturerCostMultiplier(Number(res.data.manufacturerCostMultiplier || 1));
                }
                // Populate stylesMeta from response (handle object/array formats like Create)
                if (res?.data?.styles && Array.isArray(res.data.styles)) {
                    const filtered = res.data.styles.filter(s => String(s?.style || '').trim().length > 0);
                    setStylesMeta(filtered);
                } else if (Array.isArray(res?.data)) {
                    const filtered = res.data.filter(s => String(s?.style || '').trim().length > 0);
                    setStylesMeta(filtered);
                } else {
                    setStylesMeta([]);
                }
            } catch (e) {
                // silent
            } finally {
                setManuMultiplierFetched(true);
            }
        };
        fetchMeta();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manufacturerId]);
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
                // silent
            } finally {
                setCollectionsLoading(false);
            }
        };

        fetchCollections();
        // Depend only on manufacturerId to avoid loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manufacturerId]);

    useEffect(() => {
        if (selectVersion?.selectedStyle && stylesMeta.length > 0) {
            const match = stylesMeta.find(col => col.id === selectVersion.selectedStyle) || null;
            const same = JSON.stringify(match) === JSON.stringify(selectedStyleData);
            if (!same) setSelectedStyleData(match);
            // Initialize comparison baseline once when we have styles and selected style
            if (!comparisonBaseline.styleId && match) {
                setComparisonBaseline({ styleId: match.id, stylePrice: Number(match.price || 0) });
            }
        }
    }, [selectVersion?.selectedStyle, stylesMeta]);

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
            const price = basePrice * Number(manufacturerCostMultiplier || 1) * Number(userGroupMultiplier || 1); // Apply both multipliers
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
                appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
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
            // silent
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


    const handleStyleSelect = async (newStyleId) => {


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

            // Use base-priced stylesMeta to update selection (keep parity with Create)
            const styleData = stylesMeta.find(c => c.id === newStyleId);
            setSelectedStyleData(styleData || null);
            // Do NOT modify comparisonBaseline here; keep comparisons stable across selections

            // Re-map all existing items to the newly selected style.
            // If an item code doesn't exist in the new style, mark it unavailable with $0 and keep it visible.
            const targetStyleName = styleData?.style;
            const versionName = selectVersion?.versionName;
            const currentItems = Array.isArray(tableItems)
                ? tableItems.filter(it => it.selectVersion === versionName)
                : [];

            // Ensure we have catalog items for the selected style
            let sourceCatalog = fetchedCollections.filter(cd => cd.style === targetStyleName);
            if (!sourceCatalog.length) {
                try {
                    const manufacturerId = formData?.manufacturersData?.[0]?.manufacturer;
                    if (manufacturerId && newStyleId) {
                        const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles/${newStyleId}/items`, {
                            headers: getAuthHeaders(),
                            params: { includeDetails: '1', limit: 2000 }
                        });
                        const catalogData = res?.data?.catalogData || [];
                        sourceCatalog = catalogData.filter(cd => cd.style === targetStyleName);
                    }
                } catch (err) {
                    // silent
                }
            }

            let missing = 0;
            const newVersionItems = currentItems.map(orig => {
                // Find the same code in the catalog for the chosen style
                const match = sourceCatalog.find(cd => cd.code === orig.code);
                if (!match) {
                    missing += 1;
                    const qty = Number(orig.qty || 1);
                    return {
                        ...orig,
                        unavailable: true,
                        // Keep code/desc/qty/hinge/exposed but zero-price so it won't affect totals
                        originalPrice: 0,
                        price: 0,
                        appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                        appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                        assemblyFee: 0,
                        includeAssemblyFee: false,
                        isRowAssembled: false,
                        total: 0,
                        // PRESERVE existing fallbacks - they represent the original baseline for comparison
                        comparisonPriceFallback: orig.comparisonPriceFallback ?? Number(orig.price || 0),
                        comparisonAssemblyUnitFallback: orig.comparisonAssemblyUnitFallback ?? (orig?.includeAssemblyFee ? Number(orig?.assemblyFee || 0) : 0),
                    };
                }

                // Compute multiplied price for the new style item
                const basePrice = Number(match.price) || 0;
                const multiplied = basePrice * Number(manufacturerCostMultiplier || 1) * Number(userGroupMultiplier || 1);

                // Assembly fee (keep current behavior: use flat price if present; don't multiply)
                const baseAssemblyFee = parseFloat(match?.styleVariantsAssemblyCost?.price) || 0;
                const includeAssembly = isAssembled; // follow global toggle
                const qty = Number(orig.qty || 1);
                const unitAssembly = includeAssembly ? baseAssemblyFee : 0;

                return {
                    ...orig,
                    unavailable: false,
                    originalPrice: basePrice,
                    appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                    appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                    appliedMultiplier: Number(userGroupMultiplier || 1),
                    price: multiplied,
                    assemblyFee: baseAssemblyFee,
                    includeAssemblyFee: includeAssembly,
                    isRowAssembled: includeAssembly,
                    total: (qty * multiplied) + (unitAssembly * qty),
                    // PRESERVE existing fallbacks OR set them if this is the first time
                    comparisonPriceFallback: orig.comparisonPriceFallback ?? multiplied,
                    comparisonAssemblyUnitFallback: orig.comparisonAssemblyUnitFallback ?? unitAssembly,
                };
            });

            setUnavailableCount(missing);

            // Merge back into full items list (preserve other versions if any)
            const others = Array.isArray(tableItems)
                ? tableItems.filter(it => it.selectVersion !== versionName)
                : [];
            const merged = [...others, ...newVersionItems];

            startTransition(() => {
                setTableItemsEdit(merged);
                dispatch(setTableItemsRedux(merged));
            });

            // Update backing formData and selectedVersion too
            setFormData(prev => {
                const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
                const idx = versionName ? md.findIndex(m => m.versionName === versionName) : -1;
                if (idx !== -1) {
                    md[idx] = { ...md[idx], items: newVersionItems };
                }
                return { ...prev, manufacturersData: md };
            });
            if (setSelectedVersion && selectVersion) {
                setSelectedVersion({ ...selectVersion, items: newVersionItems });
            }
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

        startTransition(() => {
            setTableItemsEdit(updatedItems);
            dispatch(setTableItemsRedux(updatedItems));
        });

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
            {!pricingReady && (
                <div className="alert alert-info my-3" role="status">
                    Applying your pricing... Please wait.
                </div>
            )}
            {selectedStyleData && (
                <>
                    {/* Match Create step 4 layout and classes for mobile */}
                    <div className="d-flex gap-5 mb-4 flex-wrap style-selection-mobile" style={{ alignItems: 'stretch' }}>
                        <div className="current-style-section" style={{ minWidth: '250px', flex: '0 0 auto' }}>
                            <h5 className="mb-3">{t('proposalUI.currentStyle')}</h5>
                            <div className="current-style-content d-flex gap-4 align-items-start">
                                <div className="current-style-image" style={{ width: '100px' }}>
                                    <img
                                        src={
                                            selectedStyleData.styleVariants?.[0]?.image
                                                ? `${api_url}/uploads/images/${selectedStyleData.styleVariants[0].image}`
                                                : "/images/nologo.png"
                                        }
                                        alt="Selected Style"
                                        style={{
                                            width: '100%',
                                            height: '240px',
                                            objectFit: 'contain',
                                            borderRadius: '10px',
                                            backgroundColor: '#f8f9fa',
                                        }}
                                        onError={(e) => {
                                            const fname = selectedStyleData.styleVariants?.[0]?.image;
                                            if (fname && !e.target.dataset.fallbackTried) {
                                                e.target.dataset.fallbackTried = '1';
                                                e.target.src = `${api_url}/uploads/manufacturer_catalogs/${fname}`;
                                            } else {
                                                e.target.src = '/images/nologo.png';
                                            }
                                        }}
                                    />
                                </div>
                                <div className="current-style-info d-flex flex-column" style={{ gap: '1.5rem', flex: 1 }}>
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
                                        <h5 className="mb-0">{selectedStyleData.style}</h5>
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
                                    className="style-separator"
                                    style={{
                                        width: '1px',
                                        backgroundColor: '#ccc',
                                        marginInline: '16px',
                                    }}
                                />

                                <div className="other-styles-section" style={{ flex: 1 }}>
                                    {unavailableCount > 0 && (
                                        <div className="alert alert-warning py-2 px-3 mb-3" role="alert">
                                            {unavailableCount} item{unavailableCount !== 1 ? 's' : ''} not available in this style. They remain listed in red with $0 and won’t affect totals.
                                        </div>
                                    )}
                                    <div className="other-styles-header d-flex justify-content-between align-items-center mb-3" style={{ flexWrap: 'nowrap' }}>
                                        <h5 className="mb-0">{t('proposalUI.otherStyles')}</h5>
                                        <div className="d-flex align-items-center gap-2 flex-nowrap">
                                            {/* View toggle button - show on all screen sizes */}
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${isStylesCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setIsStylesCollapsed(!isStylesCollapsed)}
                                                style={{ padding: '0.25rem 0.75rem' }}
                                                disabled={readOnly}
                                            >
                                                {isStylesCollapsed ? (
                                                    <>
                                                        <CIcon icon={cilList} size="sm" className="me-1" />
                                                        <span className="d-none d-sm-inline">{t('proposalUI.expandImages')}</span>
                                                        <span className="d-sm-none">📋</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CIcon icon={cilList} size="sm" className="me-1" />
                                                        <span className="d-none d-sm-inline">{t('proposalUI.compactView')}</span>
                                                        <span className="d-sm-none">🖼️</span>
                                                    </>
                                                )}
                                            </button>
                                            {/* Mobile carousel controls - always show when there are multiple styles */}
                                            {stylesMeta.length > itemsPerPage && !isStylesCollapsed && (
                                                <div className="btn-group btn-group-sm d-md-none" role="group" aria-label="Style navigation" style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-outline-secondary btn-sm ${!canGoPrev() ? 'disabled' : ''}`}
                                                        onClick={prevSlide}
                                                        disabled={!canGoPrev() || readOnly}
                                                        style={{ padding: '0.25rem 0.4rem' }}
                                                        aria-label="Previous styles"
                                                    >
                                                        <CIcon icon={cilChevronLeft} size="sm" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-outline-secondary btn-sm ${!canGoNext() ? 'disabled' : ''}`}
                                                        onClick={nextSlide}
                                                        disabled={!canGoNext() || readOnly}
                                                        style={{ padding: '0.25rem 0.4rem' }}
                                                        aria-label="Next styles"
                                                    >
                                                        <CIcon icon={cilChevronRight} size="sm" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`other-styles-carousel-container ${isStylesCollapsed ? 'collapsed-view' : ''}`}>
                                        {collectionsLoading ? (
                                            <div className="py-4 text-muted">{t('proposalUI.loadingStyles')}</div>
                                        ) : stylesMeta.length === 0 ? (
                                            <div className="py-4 text-muted">{t('proposalUI.noStyles')}</div>
                                        ) : (
                                            <div className="styles-carousel-container">
                                                {filteredItems.length === 0 ? (
                                                    <div className="py-4 text-center text-muted" style={{ fontSize: '0.9rem' }}>
                                                        {t('proposalUI.styleComparison.selectItemsMessage')}
                                                    </div>
                                                ) : isStylesCollapsed ? (
                                                    /* Collapsed/Compact View - List format */
                                                    <div className="styles-compact-list">
                                                        {stylesMeta.map((styleItem, index) => {
                                                            const totalPrice = calculateTotalForStyle(styleItem.price);
                                                            const isCurrentStyle = styleItem.id === selectedStyleData?.id;
                                                            
                                                            return (
                                                                <div
                                                                    key={`compact-style-${styleItem.id}-${index}`}
                                                                    className={`compact-style-item ${isCurrentStyle ? 'current-style' : ''}`}
                                                                    onClick={() => !readOnly && handleStyleSelect(styleItem.id)}
                                                                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                                                                >
                                                                    <div className="style-info">
                                                                        <span className="style-name">{styleItem.style}</span>
                                                                        <span className="price-label">
                                                                            {isCurrentStyle 
                                                                                ? t('proposalUI.styleComparison.currentTotal') 
                                                                                : t('proposalUI.styleComparison.totalIfSelected')
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className={`style-price ${isCurrentStyle ? 'current' : 'alternate'}`}>
                                                                        ${totalPrice.toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="styles-carousel-track"
                                                        style={{
                                                            display: 'flex',
                                                            gap: '1rem',
                                                            transform: `translateX(-${carouselCurrentIndex * (100 / itemsPerPage)}%)`,
                                                            transition: 'transform 0.3s ease-in-out',
                                                            width: stylesMeta.length > itemsPerPage ? `${Math.ceil(stylesMeta.length / itemsPerPage) * 100}%` : '100%'
                                                        }}
                                                    >
                                                        {stylesMeta.map((styleItem, index) => {
                                                            const variant = styleItem.styleVariants?.[0];
                                                            return (
                                                                <div
                                                                    key={`style-${styleItem.id}-${index}`}
                                                                    className="style-carousel-item text-center"
                                                                    style={{ 
                                                                        cursor: readOnly ? 'default' : 'pointer', 
                                                                        transition: 'transform 0.2s ease',
                                                                        flexShrink: 0
                                                                    }}
                                                                    onClick={() => !readOnly && handleStyleSelect(styleItem.id)}
                                                                    onMouseEnter={(e) => { if (!readOnly) e.currentTarget.style.transform = 'scale(1.02)'; }}
                                                                    onMouseLeave={(e) => { if (!readOnly) e.currentTarget.style.transform = 'scale(1)'; }}
                                                                >
                                                                    <img
                                                                        src={variant?.image ? `${api_url}/uploads/images/${variant.image}` : "/images/nologo.png"}
                                                                        alt={variant?.shortName || styleItem.style}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '220px',
                                                                            objectFit: 'contain',
                                                                            borderRadius: '10px',
                                                                            backgroundColor: '#f8f9fa',
                                                                            borderWidth: styleItem.id === selectedStyleData?.id ? '3px' : '1px',
                                                                            borderStyle: 'solid',
                                                                            borderColor: styleItem.id === selectedStyleData?.id ? '#1a73e8' : '#e9ecef',
                                                                        }}
                                                                        onError={(e) => {
                                                                            if (variant?.image && !e.target.dataset.fallbackTried) {
                                                                                e.target.dataset.fallbackTried = '1';
                                                                                e.target.src = `${api_url}/uploads/manufacturer_catalogs/${variant.image}`;
                                                                            } else {
                                                                                e.target.src = '/images/nologo.png';
                                                                            }
                                                                        }}
                                                                    />
                                                                    <div className="mt-2 p-2 rounded" style={{
                                                                        backgroundColor: styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#ffffff',
                                                                        borderWidth: styleItem.id === selectedStyleData?.id ? '2px' : '1px',
                                                                        borderStyle: 'solid',
                                                                        borderColor: styleItem.id === selectedStyleData?.id ? '#1a73e8' : '#ced4da',
                                                                        fontWeight: styleItem.id === selectedStyleData?.id ? '600' : 'normal',
                                                                    }}>
                                                                        <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>{styleItem.style}</div>
                                                                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>
                                                                            {styleItem.id === selectedStyleData?.id 
                                                                                ? t('proposalUI.styleComparison.currentTotal') 
                                                                                : t('proposalUI.styleComparison.totalIfSelected')
                                                                            }
                                                                        </div>
                                                                        <strong style={{ color: styleItem.id === selectedStyleData?.id ? '#1a73e8' : '#28a745' }}>
                                                                            ${calculateTotalForStyle(styleItem.price).toFixed(2)}
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
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

            {pricingReady && (
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
            />)}

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

            {!readOnly && isUserAdmin && (
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
                    <div style={{ color: 'red', marginTop: '0.25rem', marginBottom: '1rem' }}>
                        {customItemError}
                    </div>
                )}

                {/* Desktop Table */}
                <div className="table-responsive d-none d-md-block">
                    <table className="table">
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
                
                {/* Mobile List View */}
                <div className="d-block d-md-none">
                    {/* Mobile header - only show if there are items */}
                    {customItems && customItems.length > 0 && (
                        <div className="row fw-bold text-muted mb-2 px-2" style={{ fontSize: '0.85rem' }}>
                            <div className="col-1">#</div>
                            <div className="col-4">{t('proposalUI.custom.table.itemName')}</div>
                            <div className="col-3">{t('proposalUI.custom.table.price')}</div>
                            <div className="col-2">{t('proposalUI.custom.table.taxable')}</div>
                            <div className="col-2">{t('proposalUI.custom.table.actions')}</div>
                        </div>
                    )}
                    
                    {/* Mobile items list */}
                    {customItems?.map((item, idx) => (
                        <div key={idx} className="row mb-2 py-2 border-bottom align-items-center">
                            <div className="col-1 text-center">{idx + 1}</div>
                            <div className="col-4" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                            <div className="col-3" style={{ fontSize: '0.9rem' }}>${(Number(item.price) || 0).toFixed(2)}</div>
                            <div className="col-2 text-center" style={{ fontSize: '0.9rem' }}>{item.taxable ? t('common.yes') : t('common.no')}</div>
                            <div className="col-2">
                                <button
                                    className="btn btn-sm btn-danger text-white"
                                    onClick={() => handleDeleteCustomItem(idx)}
                                    disabled={readOnly}
                                    title={readOnly ? t('proposals.lockedTooltip') : undefined}
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                                >
                                    {t('proposalUI.custom.delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Show message if no custom items */}
                    {(!customItems || customItems.length === 0) && (
                        <div className="text-muted text-center py-3" style={{ fontSize: '0.9rem' }}>
                            No custom items added yet
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Totals Summary */}
            {pricingReady && (
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
            )}

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
