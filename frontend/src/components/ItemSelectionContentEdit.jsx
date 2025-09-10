import { useEffect, useState, useCallback, useMemo, startTransition, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CFormCheck, CFormSwitch,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilHome, cilBrush, cilChevronLeft, cilChevronRight, cilList } from '@coreui/icons';
import ModificationBrowserModal from './model/ModificationBrowserModal'
import { useDispatch, useSelector } from 'react-redux';
import { fetchTaxes } from '../store/slices/taxSlice';
import CatalogTableEdit from './CatalogTableEdit';
import axiosInstance from '../helpers/axiosInstance';
import { setTableItemsEdit as setTableItemsRedux } from '../store/slices/selectedVersionEditSlice';
import { setSelectVersionNewEdit } from '../store/slices/selectVersionNewEditSlice';
import { isAdmin } from '../helpers/permissions';
import { isShowroomModeActive, getShowroomMultiplier, addShowroomSettingsListener } from '../utils/showroomUtils';
import './ItemSelectionContent.css';



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
    const [preloadingComplete, setPreloadingComplete] = useState(false);
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
    const [selectedItemIdForMod, setSelectedItemIdForMod] = useState(null);
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
    const [showroomMultiplier, setShowroomMultiplier] = useState(1.0);
    const [showroomActive, setShowroomActive] = useState(false);
    const [userMultiplierFetched, setUserMultiplierFetched] = useState(false);
    const [manuMultiplierFetched, setManuMultiplierFetched] = useState(false);
    const [pricingReady, setPricingReady] = useState(false);
    // Stable baseline used for style comparisons so numbers don't change when selection changes (no longer used)
    // const [comparisonBaseline, setComparisonBaseline] = useState({ styleId: null, stylePrice: null });
    const [carouselCurrentIndex, setCarouselCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4); // Desktop default
    const [isStylesCollapsed, setIsStylesCollapsed] = useState(false); // New state for collapse/expand
    const { taxes, loading } = useSelector((state) => state.taxes);
    const taxesReady = useMemo(() => !loading && Array.isArray(taxes) && taxes.length > 0, [loading, taxes]);
    const authFailedRef = useRef(false);
    const [customItemError, setCustomItemError] = useState('');
    const [unavailableCount, setUnavailableCount] = useState(0);
    const authUser = useSelector((state) => state.auth?.user);
    const customization = useSelector((state) => state.customization);
    const isUserAdmin = isAdmin(authUser);
    const hideOtherStyles = readOnly && !isUserAdmin; // contractors in read-only should not see other styles
    // Cache style items per manufacturer/style to avoid refetching and re-render churn
    const styleItemsCacheRef = useRef(new Map()); // key: `${manufacturerId}:${styleId}` => catalogData array
    // Track last applied summary per version to avoid state update loops
    const lastSummaryRef = useRef({});

    // Extract manufacturerId early for use in functions
    const manufacturerId = formData?.manufacturersData?.[0]?.manufacturer;

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

    // Helper: update existing items with type info from catalog
    const updateExistingItemsWithTypes = useCallback((catalogData) => {
        if (!Array.isArray(catalogData) || catalogData.length === 0) return;
        const codeToType = new Map();
        catalogData.forEach(ci => {
            if (ci.code && ci.type) codeToType.set(String(ci.code).trim(), ci.type);
        });

        // Compute against current formData to avoid invoking child state updates inside parent setState updater
        const mdCurrent = Array.isArray(formData?.manufacturersData) ? [...formData.manufacturersData] : [];
        const vIdxCurrent = mdCurrent.findIndex(m => m.versionName === selectVersion?.versionName);
        if (vIdxCurrent === -1) return;
        const itemsCurrent = Array.isArray(mdCurrent[vIdxCurrent].items) ? mdCurrent[vIdxCurrent].items : [];

        let changed = false;
        const updatedItems = itemsCurrent.map(it => {
            if (it?.type) return it;
            const t = codeToType.get(String(it?.code || '').trim());
            if (t) { changed = true; return { ...it, type: t }; }
            return it;
        });
        if (!changed) return;

        // 1) Update local table immediately (child state)
        setTableItemsEdit(updatedItems);
        // 2) Inform parent selectedVersion outside of parent's setState updater
        if (setSelectedVersion && selectVersion) {
            startTransition(() => {
                setSelectedVersion({ ...selectVersion, items: updatedItems });
            });
        }
        // 3) Persist to formData (parent state) using updater without additional child updates inside
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx === -1) return prev;
            md[vIdx] = { ...md[vIdx], items: updatedItems };
            return { ...prev, manufacturersData: md };
        });
    }, [formData, selectVersion, setFormData, setSelectedVersion]);

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

    // Create a fingerprint of current items/modifications to detect when recalculation is actually needed
    const itemsFingerprint = useMemo(() => {
        const items = filteredItems.map(item => `${item.code}:${item.qty}:${JSON.stringify(item.modifications || [])}`).join('|');
        const customs = customItems.map(item => `${item.name}:${item.price}:${item.taxable}`).join('|');
        const factors = `${userGroupMultiplier}:${manufacturerCostMultiplier}:${discountPercent}:${isAssembled}:${showroomActive}:${showroomMultiplier}`;
        return `${items}#${customs}#${factors}`;
    }, [filteredItems, customItems, userGroupMultiplier, manufacturerCostMultiplier, discountPercent, isAssembled, showroomActive, showroomMultiplier]);

    const hasEligibleInStyle = useCallback((styleId) => {
        const currentManufacturerId = formData?.manufacturersData?.[0]?.manufacturer;
        if (!currentManufacturerId || !styleId) return filteredItems.length > 0 ? true : false;
        const cacheKey = `${currentManufacturerId}:${styleId}`;
        const catalogData = styleItemsCacheRef.current.get(cacheKey);
        if (!catalogData || catalogData.length === 0) return filteredItems.length > 0 ? true : false;
        const byCode = new Map(catalogData.map(ci => [String(ci.code).trim(), ci]));
        return filteredItems.some(item => byCode.has(String(item.code).trim()));
    }, [filteredItems, formData?.manufacturersData]);



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
                startTransition(() => {
                    setSelectedVersion({ ...selectVersion, items: itemsWithAssemblyFlag });
                });
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
                const response = await axiosInstance.get('/api/user/multiplier');
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

    // Initialize and listen for showroom mode changes
    useEffect(() => {
        // Set initial values
        setShowroomActive(isShowroomModeActive());
        setShowroomMultiplier(getShowroomMultiplier());

        // Listen for changes
        const cleanup = addShowroomSettingsListener(({ mode, multiplier }) => {
            setShowroomActive(mode);
            setShowroomMultiplier(multiplier);
        });

        return cleanup;
    }, []);

    // Removed timer-based fallback to avoid delays; pricing readiness will be set by idempotent effects

    // Centralized readiness: UI becomes interactive only when all prerequisites are ready
    useEffect(() => {
        const ready = userMultiplierFetched && manuMultiplierFetched && taxesReady && preloadingComplete;
        if (ready !== pricingReady) setPricingReady(ready);
    }, [userMultiplierFetched, manuMultiplierFetched, taxesReady, preloadingComplete, pricingReady]);

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

    // Fallback: Ensure ALL multipliers are applied when editing an existing proposal
    // Runs after items are loaded and both multipliers are fetched
    useEffect(() => {
        if (!userMultiplierFetched || !manuMultiplierFetched) return;
        if (tableItems.length === 0) return;

    // debug removed

        const needsUpdate = tableItems.some(item => {
            const appliedUser = item.appliedMultiplier || item.appliedUserGroupMultiplier || 1.0;
            const appliedManu = item.appliedManufacturerMultiplier || 1.0;
            const appliedShowroom = item.appliedShowroomMultiplier || 1.0;
            const base = item.originalPrice || (appliedUser > 0 || appliedManu > 0 ? (Number(item.price) / (appliedManu * appliedUser * appliedShowroom)) : Number(item.price));
            const expectedShowroom = showroomActive ? showroomMultiplier : 1.0;
            const expected = Number(base) * Number(manufacturerCostMultiplier || 1) * Number(userGroupMultiplier || 1) * expectedShowroom;
            const priceMismatch = Math.abs(Number(item.price) - expected) > 0.01;
            const multiplierMismatch = Math.abs(appliedUser - Number(userGroupMultiplier || 1)) > 0.001 ||
                                     Math.abs(appliedManu - Number(manufacturerCostMultiplier || 1)) > 0.001 ||
                                     Math.abs(appliedShowroom - expectedShowroom) > 0.001;
            return priceMismatch || multiplierMismatch;
        });

        if (!needsUpdate) {
            return;
        }

        const updatedItems = tableItems.map(item => {
            const appliedUser = item.appliedMultiplier || item.appliedUserGroupMultiplier || 1.0;
            const appliedManu = item.appliedManufacturerMultiplier || 1.0;
            const appliedShowroom = item.appliedShowroomMultiplier || 1.0;
            const base = item.originalPrice || (appliedUser > 0 || appliedManu > 0 ? (Number(item.price) / (appliedManu * appliedUser * appliedShowroom)) : Number(item.price));
            const expectedShowroom = showroomActive ? showroomMultiplier : 1.0;
            const correctPrice = Number(base) * Number(manufacturerCostMultiplier || 1) * Number(userGroupMultiplier || 1) * expectedShowroom;
            const unitAssembly = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
            const adjustedUnitAssembly = showroomActive ? unitAssembly * showroomMultiplier : unitAssembly;
            const qty = Number(item?.qty || 1);
            return {
                ...item,
                originalPrice: Number(base),
                appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                appliedShowroomMultiplier: expectedShowroom,
                appliedMultiplier: Number(userGroupMultiplier || 1),
                price: correctPrice,
                assemblyFee: adjustedUnitAssembly,
                total: (qty * correctPrice) + (adjustedUnitAssembly * qty),
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
    // readiness handled by centralized effect
    }, [userMultiplierFetched, manuMultiplierFetched, userGroupMultiplier, manufacturerCostMultiplier, showroomActive, showroomMultiplier, tableItems, dispatch, selectVersion?.versionName, setSelectedVersion, setFormData]);

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
    // readiness handled by centralized effect
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
            // Apply user group multiplier and showroom multiplier to custom items
            const baseCustomItemsTotal = customItems.reduce((sum, item) => sum + (item.price * userGroupMultiplier), 0);
            const customItemsTotal = showroomActive ? baseCustomItemsTotal * showroomMultiplier : baseCustomItemsTotal;
            // Apply showroom multiplier to modifications
            const baseModificationsTotal = totalModificationsCost;
            const modificationsTotal = showroomActive ? baseModificationsTotal * showroomMultiplier : baseModificationsTotal;

            const assemblyFeeTotal = isAssembled
                ? versionItems.reduce((sum, item) => {
                    // Respect per-row toggle: only include when includeAssemblyFee is true
                    const unitFee = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
                    const qty = Number(item?.qty || 1);
                    const fee = unitFee * qty;
                    return sum + fee;
                }, 0)
                : 0;

            const rawDeliveryFee = Number(selectVersion?.manufacturerData?.deliveryFee || 0);
            // Include delivery fee when there is at least one line item in the version
            const deliveryFee = (versionItems.length > 0) ? rawDeliveryFee : 0;
            const styleTotal = cabinetPartsTotal + assemblyFeeTotal + customItemsTotal + modificationsTotal;

            // (debug logs removed)
            const baseCabinets = customItems?.reduce((sum, item) => sum + item.price, 0) +
                versionItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
            const cabinets = baseCabinets; // Already includes showroom multiplier from pricing calculations
            const discountAmount = (styleTotal * discountPercent) / 100;
            const totalAfterDiscount = styleTotal - discountAmount;
            const totalWithDelivery = totalAfterDiscount + deliveryFee;
            const taxAmount = (totalWithDelivery * defaultTaxValue) / 100;
            const grandTotal = totalWithDelivery + taxAmount;

            // Compute next summary and compare with last applied to avoid loops
            const nextSummary = {
                cabinets: parseFloat((Number(cabinets) || 0).toFixed(2)),
                assemblyFee: parseFloat((Number(assemblyFeeTotal) || 0).toFixed(2)),
                modificationsCost: parseFloat((Number(modificationsTotal) || 0).toFixed(2)),
                deliveryFee: parseFloat((Number(deliveryFee) || 0).toFixed(2)),
                styleTotal: parseFloat((Number(styleTotal) || 0).toFixed(2)),
                discountPercent: Number(discountPercent) || 0,
                discountAmount: parseFloat((Number(discountAmount) || 0).toFixed(2)),
                total: parseFloat((Number(totalAfterDiscount) || 0).toFixed(2)),
                taxRate: Number(defaultTaxValue) || 0,
                taxAmount: parseFloat((Number(taxAmount) || 0).toFixed(2)),
                grandTotal: parseFloat((Number(grandTotal) || 0).toFixed(2))
            };

            const versionKey = selectVersion?.versionName || '__default__';
            const prevHash = lastSummaryRef.current[versionKey];
            const nextHash = JSON.stringify(nextSummary);
            if (prevHash === nextHash) {
                // No material change; skip state updates to prevent effect loops
                return;
            }

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
                            summary: nextSummary
                        };
                        return updatedManufacturer;
                    }
                    return manufacturer;
                });

                // Avoid unnecessary state updates to prevent loops
                const same = JSON.stringify(existing) === JSON.stringify(updated);
                if (same) return prev;
                // Record last applied summary hash only when we actually update state
                lastSummaryRef.current[versionKey] = nextHash;
                return { ...prev, manufacturersData: updated };
            });
            // Update the selectedVersion snapshot separately to avoid nested updates during another component's render
            if (setSelectedVersion && selectVersion) {
                startTransition(() => {
                    setSelectedVersion({ ...selectVersion, summary: nextSummary });
                });
            }
        } catch (error) {
            // Error calculating totals
        }
    }, [versionItems, customItems, totalModificationsCost, isAssembled, discountPercent, defaultTaxValue, selectVersion?.versionName, selectVersion?.selectedStyle, userGroupMultiplier, showroomActive, showroomMultiplier, selectVersion?.manufacturerData?.deliveryFee]);

    useEffect(() => {
        updateManufacturerData();
    }, [updateManufacturerData]);

    useEffect(() => {
        dispatch(fetchTaxes());
    }, [dispatch]);


    // Fetch manufacturer styles meta (base prices) and cost multiplier
    useEffect(() => {
        const fetchMeta = async () => {
            if (!manufacturerId) return;
            try {
                const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`);
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

    // Preload only the selected style's catalog data to avoid request storms
    useEffect(() => {
        const selectedStyleId = selectVersion?.selectedStyle;
        let cancelled = false;
        if (!manufacturerId || !selectedStyleId) {
            setPreloadingComplete(false);
            return;
        }
        const cacheKey = `${manufacturerId}:${selectedStyleId}`;
        if (styleItemsCacheRef.current.has(cacheKey)) {
            setPreloadingComplete(true);
            return;
        }
        (async () => {
            try {
                if (authFailedRef.current) return;
                const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles/${selectedStyleId}/items`, {
                    params: { includeDetails: '1', limit: 1000 }
                });
                if (cancelled) return;
                const catalogData = res?.data?.catalogData || [];
                styleItemsCacheRef.current.set(cacheKey, catalogData);
                // Enrich current items with type for Specs visibility
                updateExistingItemsWithTypes(catalogData);
            } catch (error) {
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    authFailedRef.current = true;
                    return; // let axios interceptor handle redirect/logout
                }
                if (!cancelled) console.warn(`Failed to preload catalog for style ${selectedStyleId}:`, error?.message || error);
            } finally {
                if (!cancelled) setPreloadingComplete(true);
            }
        })();
        return () => { cancelled = true; };
    }, [manufacturerId, selectVersion?.selectedStyle]);

    useEffect(() => {
        const fetchCollections = async () => {
            if (!manufacturerId) return;
            setCollectionsLoading(true);
            try {
                if (authFailedRef.current) return;
                const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styleswithcatalog`);
                const incoming = response.data || [];
                const same = JSON.stringify(incoming) === JSON.stringify(fetchedCollections);
                if (!same) setFetchedCollections(incoming); // Avoid redundant state updates
            } catch (error) {
                const status = error?.response?.status;
                if (status === 401 || status === 403) {
                    authFailedRef.current = true;
                    return;
                }
                // silent for non-auth
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
            // Initialize comparison baseline once when we have styles and selected style (no longer used)
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

            // Calculate assembly fee properly based on type and after all multipliers
            const assemblyCost = item?.styleVariantsAssemblyCost;
            let assemblyFee = 0;

            if (assemblyCost) {
                const feePrice = parseFloat(assemblyCost.price || 0);
                const feeType = assemblyCost.type;

                if (feeType === 'flat' || feeType === 'fixed') {
                    assemblyFee = feePrice;
                } else if (feeType === 'percentage') {
                    // percentage based on final price after all multipliers
                    assemblyFee = (price * feePrice) / 100;
                } else {
                    // Fallback for legacy data without type
                    assemblyFee = feePrice;
                }
            }

            const includeAssemblyFee = isAssembled; // Default to assembled state
            const totalAssemblyFee = includeAssemblyFee ? assemblyFee : 0;
            const total = price + totalAssemblyFee;

            const newItem = {
                id: item.id,
                code: item.code,
                description: item.description,
                type: item.type, // used for Specs badge
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

    // Update modifications for a specific item instance by row index (handles duplicates)
    const updateItemMods = (rowIndex, updatedModifications) => {
        if (typeof rowIndex !== 'number') return;

        // Use row index as the key to handle duplicate items independently
        const itemKey = `row_${rowIndex}`;
        setModificationsMap(prev => ({ ...prev, [itemKey]: updatedModifications }));

        // Update local table items by index
        setTableItemsEdit(prevItems => {
            const next = Array.isArray(prevItems) ? [...prevItems] : [];
            if (rowIndex >= 0 && rowIndex < next.length) {
                next[rowIndex] = { ...next[rowIndex], modifications: updatedModifications };
            }
            return next;
        });

        // Update backing formData structure for current version
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];
                if (rowIndex >= 0 && rowIndex < items.length) {
                    items[rowIndex] = { ...items[rowIndex], modifications: updatedModifications };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
        });

        // Update selectedVersion snapshot if provided
        if (setSelectedVersion && selectVersion?.items) {
            const updatedItems = [...selectVersion.items];
            if (rowIndex >= 0 && rowIndex < updatedItems.length) {
                updatedItems[rowIndex] = { ...updatedItems[rowIndex], modifications: updatedModifications };
                startTransition(() => {
                    setSelectedVersion({ ...selectVersion, items: updatedItems });
                });
            }
        }
    };

    const handleOpenModificationModal = (index, id) => {
        setSelectedItemIndexForMod(index);
        setSelectedItemIdForMod(`row_${index}`); // Use row-based key
        setModificationModalVisible(true);
        setItemModificationID(id);
        fetchCatalogItems(id);
    };

    const fetchCatalogItems = async (id) => {
        try {
            if (id) {
                const response = await axiosInstance.get(`/api/manufacturers/catalogs/modificationsItems/${id}`);
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

            await axiosInstance.post('/api/manufacturers/catalogs/modificationsItems/add', payload);
        } catch (err) {
            // silent
        }
    };


    // New handler for ModificationBrowserModal (accepts row index and payload)
    const handleApplyModification = (index, modificationData) => {
        const targetRowIndex = typeof index === 'number' ? index : selectedItemIndexForMod;
        const itemKey = `row_${targetRowIndex}`;
        const mods = modificationsMap[itemKey] || [];

        // Transform the modal payload into existing structure used in tables
        const newMod = {
            type: 'existing',
            modificationId: modificationData.templateId,
            qty: modificationData.quantity || 1,
            note: modificationData.note || '',
            name: modificationData.templateName || '',
            price: modificationData.price || 0,
            // Extras for grouping and details
            categoryName: modificationData.categoryName || undefined,
            fieldsConfig: modificationData.fieldsConfig || {},
            selectedOptions: modificationData.selectedOptions || {},
            attachments: Array.isArray(modificationData.attachments) ? modificationData.attachments : [],
            assignmentId: modificationData.assignmentId
        };

        const updatedMods = [...mods, newMod];
        updateItemMods(targetRowIndex, updatedMods);
        setModificationModalVisible(false);
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

        const rowKey = `row_${selectedItemIndexForMod}`;
        const mods = modificationsMap[rowKey] || [];
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
        updateItemMods(selectedItemIndexForMod, updatedMods);
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

    const handleDeleteModification = (rowIndex, modIdx) => {
        const rowKey = `row_${rowIndex}`;
        const current = modificationsMap[rowKey] || [];
        const updated = [...current];
        updated.splice(modIdx, 1);
        updateItemMods(rowIndex, updated);
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
            // Do NOT modify comparison baseline here; keep comparisons stable across selections (no longer used)

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
        // Update local working items array
        setTableItemsEdit(prevItems => {
            const updated = prevItems.map((item, i) => (
                i === index ? { ...item, hingeSide: selectedSide } : item
            ));
            // Defer Redux to keep UI responsive
            startTransition(() => dispatch(setTableItemsRedux(updated)));
            return updated;
        });

        // Update backing formData structure for the current version
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];
                if (index >= 0 && index < items.length) {
                    items[index] = { ...items[index], hingeSide: selectedSide };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
        });

        // Update the selectVersion snapshot consumed by CatalogTableEdit
        if (setSelectedVersion && selectVersion?.items) {
            const svItems = [...selectVersion.items];
            if (index >= 0 && index < svItems.length) {
                svItems[index] = { ...svItems[index], hingeSide: selectedSide };
            }
            startTransition(() => {
                setSelectedVersion({ ...selectVersion, items: svItems });
            });
        }
    };


    const updateExposedSide = (index, selectedSide) => {
        // Update local working items array
        setTableItemsEdit(prevItems => {
            const updated = prevItems.map((item, i) => (
                i === index ? { ...item, exposedSide: selectedSide } : item
            ));
            // Defer Redux to keep UI responsive
            startTransition(() => dispatch(setTableItemsRedux(updated)));
            return updated;
        });

        // Update backing formData structure for the current version
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];
                if (index >= 0 && index < items.length) {
                    items[index] = { ...items[index], exposedSide: selectedSide };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
        });

        // Update the selectVersion snapshot consumed by CatalogTableEdit
        if (setSelectedVersion && selectVersion?.items) {
            const svItems = [...selectVersion.items];
            if (index >= 0 && index < svItems.length) {
                svItems[index] = { ...svItems[index], exposedSide: selectedSide };
            }
            startTransition(() => {
                setSelectedVersion({ ...selectVersion, items: svItems });
            });
        }
    };

    return (
        <div className="item-selection-edit">
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
                                <div className="current-style-image" style={{ width: '100px', flexShrink: 0 }}>
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
                                                style={{ padding: '0.25rem 0.75rem', minHeight: 44, minWidth: 44 }}
                                                disabled={readOnly}
                                                aria-pressed={isStylesCollapsed}
                                                aria-label={isStylesCollapsed ? t('proposalUI.expandImages') : t('proposalUI.compactView')}
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
                                                        style={{ padding: '0.25rem 0.4rem', minHeight: 44, minWidth: 44 }}
                                                        aria-label="Previous styles"
                                                    >
                                                        <CIcon icon={cilChevronLeft} size="sm" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-outline-secondary btn-sm ${!canGoNext() ? 'disabled' : ''}`}
                                                        onClick={nextSlide}
                                                        disabled={!canGoNext() || readOnly}
                                                        style={{ padding: '0.25rem 0.4rem', minHeight: 44, minWidth: 44 }}
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
                                                            const isCurrentStyle = styleItem.id === selectedStyleData?.id;
                                                            const hasAnyItems = filteredItems.length > 0;
                                                            const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                            return (
                                                                <div
                                                                    key={`compact-style-${styleItem.id}-${index}`}
                                                                    className={`compact-style-item ${isCurrentStyle ? 'current-style' : ''} styleCard`}
                                                                    aria-disabled={disabled}
                                                                    onClick={() => !readOnly && handleStyleSelect(styleItem.id)}
                                                                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                                                                >
                                                                    <div className="style-info">
                                                                        <span className="style-name">{styleItem.style}</span>
                                                                        {isCurrentStyle && (
                                                                            <span className="current-style-indicator">
                                                                                {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                            </span>
                                                                        )}
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
                                                            const hasAnyItems = filteredItems.length > 0;
                                                            const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);
                                                            return (
                                                                <div
                                                                    key={`style-${styleItem.id}-${index}`}
                                                                    className="style-carousel-item text-center styleCard"
                                                                    aria-disabled={disabled}
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
                                                                        {styleItem.id === selectedStyleData?.id && (
                                                                            <div style={{ fontSize: '0.75rem', color: '#1a73e8', marginBottom: '0.25rem' }}>
                                                                                {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                            </div>
                                                                        )}
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

                        {isUserAdmin && (
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
                        )}

                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.total')}</th>
                            <td className="text-center">
                                ${selectVersion?.summary?.total || "0"}
                            </td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('settings.manufacturers.edit.deliveryFee')}</th>
                            <td className="text-center">${(versionItems.length > 0 ? (selectVersion?.summary?.deliveryFee || "0") : "0")}</td>
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

            <ModificationBrowserModal
                visible={modificationModalVisible}
                onClose={() => setModificationModalVisible(false)}
                onApplyModification={handleApplyModification}
                selectedItemIndex={selectedItemIndexForMod}
                catalogItemId={itemModificationID}
            />
        </div>
    );
};

export default ItemSelectionContentEdit;
