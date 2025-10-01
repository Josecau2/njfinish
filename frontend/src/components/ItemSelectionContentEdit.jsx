import { useEffect, useState, useCallback, useMemo, startTransition, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    AlertDescription,
    AlertIcon,
    Box,
    Button,
    Checkbox,
    CloseButton,
    Divider,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Image,
    Input,
    NumberInput,
    NumberInputField,
    Stack,
    Switch,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
} from '@chakra-ui/react';
import { Settings, Home, Brush, ChevronLeft, ChevronRight, List } from 'lucide-react';
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
                if (!cancelled) {
                    // Failed to preload catalog - silent error
                }
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
        <Box>
            {selectedStyleData && (
                <>
                    <Flex
                        gap={5}
                        mb={4}
                        flexWrap="wrap"
                        align="stretch"
                        className="style-selection-mobile"
                    >
                        <Box
                            className="current-style-section"
                            minW="250px"
                            flexShrink={0}
                        >
                            <Heading size="sm" mb={3}>
                                {t('proposalUI.currentStyle')}
                            </Heading>
                            <Flex
                                className="current-style-content"
                                gap={4}
                                align="flex-start"
                            >
                                <Box
                                    className="current-style-image"
                                    w="100px"
                                    flexShrink={0}
                                >
                                    <Image
                                        src={
                                            selectedStyleData.styleVariants?.[0]?.image
                                                ? `${api_url}/uploads/images/${selectedStyleData.styleVariants[0].image}`
                                                : '/images/nologo.png'
                                        }
                                        alt="Selected Style"
                                        w="100%"
                                        h="240px"
                                        objectFit="contain"
                                        borderRadius="10px"
                                        bg="gray.50"
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
                                </Box>
                                <Stack
                                    className="current-style-info"
                                    spacing={6}
                                    flex="1"
                                >
                                    <Flex align="center" fontSize="md">
                                        <Icon as={Home} boxSize={5} color="blue.500" mr={2} />
                                        <Heading size="sm" mb={0}>
                                            {selectVersion?.manufacturerData?.name}
                                        </Heading>
                                    </Flex>
                                    <Flex align="center" fontSize="md" color="gray.600">
                                        <Icon as={Brush} boxSize={5} color="gray.500" mr={2} />
                                        <Heading size="sm" mb={0}>
                                            {selectedStyleData.style}
                                        </Heading>
                                    </Flex>
                                    <Flex align="center" fontSize="lg">
                                        <Icon as={Settings} boxSize={5} color="green.500" mr={2} />
                                        <Text mr={2}>{t('proposalColumns.assembled')}</Text>
                                        <Switch
                                            size="md"
                                            colorScheme="teal"
                                            isChecked={isAssembled}
                                            onChange={(e) => {
                                                if (!readOnly) setIsAssembled(e.target.checked);
                                            }}
                                            isDisabled={readOnly}
                                            aria-label={t('proposalColumns.assembled')}
                                        />
                                    </Flex>
                                </Stack>
                            </Flex>
                        </Box>

                        {!hideOtherStyles && (
                            <>
                                <Box
                                    className="style-separator"
                                    w="1px"
                                    bg="#ccc"
                                    mx={4}
                                    display={{ base: 'none', lg: 'block' }}
                                />

                                <Box className="other-styles-section" flex="1">
                                    {unavailableCount > 0 && (
                                        <Alert status="warning" py={2} px={3} mb={3} borderRadius="md">
                                            <AlertIcon />
                                            <AlertDescription>
                                                {unavailableCount} item
                                                {unavailableCount !== 1 ? 's' : ''} not available in this style. They remain listed in red with $0 and won't affect totals.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <Flex
                                        className="other-styles-header"
                                        justify="space-between"
                                        align="center"
                                        mb={3}
                                    >
                                        <Heading size="sm" mb={0}>
                                            {t('proposalUI.otherStyles')}
                                        </Heading>
                                        <HStack spacing={4} align="center">
                                            <Button
                                                size="sm"
                                                variant={isStylesCollapsed ? 'solid' : 'outline'}
                                                colorScheme="blue"
                                                onClick={() => setIsStylesCollapsed(!isStylesCollapsed)}
                                                px={3}
                                                minH="44px"
                                                minW="44px"
                                                aria-pressed={isStylesCollapsed}
                                                aria-label={
                                                    isStylesCollapsed
                                                        ? t('proposalUI.expandImages')
                                                        : t('proposalUI.compactView')
                                                }
                                            >
                                                <Icon as={List} boxSize={4} mr={1} />
                                                <Text display={{ base: 'none', sm: 'inline' }}>
                                                    {isStylesCollapsed
                                                        ? t('proposalUI.expandImages')
                                                        : t('proposalUI.compactView')}
                                                </Text>
                                                <Text
                                                    aria-hidden="true"
                                                    display={{ base: 'inline', sm: 'none' }}
                                                    fontSize="lg"
                                                    ml={1}
                                                >
                                                    {isStylesCollapsed ? '📋' : '🖼️'}
                                                </Text>
                                            </Button>

                                            {filteredItems.length > 0 && !isStylesCollapsed && (
                                                <HStack
                                                    spacing={4}
                                                    display={{ base: 'flex', md: 'none' }}
                                                >
                                                    <IconButton
                                                        icon={<ChevronLeft size={16} />}
                                                        size="sm"
                                                        variant="outline"
                                                        colorScheme="gray"
                                                        onClick={prevSlide}
                                                        isDisabled={!canGoPrev() || readOnly}
                                                        aria-label="Previous styles"
                                                        minH="44px"
                                                        minW="44px"
                                                    />
                                                    <IconButton
                                                        icon={<ChevronRight size={16} />}
                                                        size="sm"
                                                        variant="outline"
                                                        colorScheme="gray"
                                                        onClick={nextSlide}
                                                        isDisabled={!canGoNext() || readOnly}
                                                        aria-label="Next styles"
                                                        minH="44px"
                                                        minW="44px"
                                                    />
                                                </HStack>
                                            )}
                                        </HStack>
                                    </Flex>

                                    <Box
                                        className={`other-styles-carousel-container ${isStylesCollapsed ? 'collapsed-view' : ''}`}
                                    >
                                        {collectionsLoading ? (
                                            <Text py={4} color="gray.500">
                                                {t('proposalUI.loadingStyles')}
                                            </Text>
                                        ) : stylesMeta.length === 0 ? (
                                            <Text py={4} color="gray.500">
                                                {t('proposalUI.noStyles')}
                                            </Text>
                                        ) : (
                                            <Box className="styles-carousel-container">
                                                {filteredItems.length === 0 ? (
                                                    <Text py={4} textAlign="center" color="gray.500" fontSize="sm">
                                                        {t('proposalUI.styleComparison.selectItemsMessage')}
                                                    </Text>
                                                ) : isStylesCollapsed ? (
                                                    <Stack className="styles-compact-list" spacing={4}>
                                                        {stylesMeta.map((styleItem, index) => {
                                                            const isCurrentStyle = styleItem.id === selectedStyleData?.id;
                                                            const hasAnyItems = filteredItems.length > 0;
                                                            const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                            return (
                                                                <Flex
                                                                    key={`compact-style-${styleItem.id}-${index}`}
                                                                    className={`compact-style-item styleCard ${isCurrentStyle ? 'current-style' : ''}`}
                                                                    aria-disabled={disabled || readOnly}
                                                                    align="center"
                                                                    justify="space-between"
                                                                    onClick={() => {
                                                                        if (!readOnly) handleStyleSelect(styleItem.id);
                                                                    }}
                                                                    cursor={readOnly ? 'default' : 'pointer'}
                                                                >
                                                                    <Box className="style-info">
                                                                        <Text className="style-name">
                                                                            {styleItem.style}
                                                                        </Text>
                                                                        {isCurrentStyle && (
                                                                            <Text className="current-style-indicator">
                                                                                {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                            </Text>
                                                                        )}
                                                                    </Box>
                                                                </Flex>
                                                            );
                                                        })}
                                                    </Stack>
                                                ) : (
                                                    <Box
                                                        className="styles-carousel-track"
                                                        display="flex"
                                                        gap="1rem"
                                                        transform={`translateX(-${carouselCurrentIndex * (100 / itemsPerPage)}%)`}
                                                        transition="transform 0.3s ease-in-out"
                                                        width={
                                                            stylesMeta.length > itemsPerPage
                                                                ? `${Math.ceil(stylesMeta.length / itemsPerPage) * 100}%`
                                                                : '100%'
                                                        }
                                                    >
                                                        {stylesMeta.map((styleItem, index) => {
                                                            const variant = styleItem.styleVariants?.[0];
                                                            const hasAnyItems = filteredItems.length > 0;
                                                            const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                            return (
                                                                <Box
                                                                    key={`style-${styleItem.id}-${index}`}
                                                                    className="style-carousel-item styleCard"
                                                                    textAlign="center"
                                                                    aria-disabled={disabled || readOnly}
                                                                    cursor={readOnly ? 'default' : 'pointer'}
                                                                    transition="transform 0.2s ease"
                                                                    flexShrink={0}
                                                                    onClick={() => {
                                                                        if (!readOnly) handleStyleSelect(styleItem.id);
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!readOnly) e.currentTarget.style.transform = 'scale(1.02)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (!readOnly) e.currentTarget.style.transform = 'scale(1)';
                                                                    }}
                                                                >
                                                                    <Image
                                                                        src={
                                                                            variant?.image
                                                                                ? `${api_url}/uploads/images/${variant.image}`
                                                                                : '/images/nologo.png'
                                                                        }
                                                                        alt={variant?.shortName || styleItem.style}
                                                                        w="100%"
                                                                        h="220px"
                                                                        objectFit="contain"
                                                                        borderRadius="10px"
                                                                        bg="gray.50"
                                                                        borderWidth={styleItem.id === selectedStyleData?.id ? '3px' : '1px'}
                                                                        borderStyle="solid"
                                                                        borderColor={styleItem.id === selectedStyleData?.id ? "blue.500" : "gray.100"}
                                                                        onError={(e) => {
                                                                            if (variant?.image && !e.target.dataset.fallbackTried) {
                                                                                e.target.dataset.fallbackTried = '1';
                                                                                e.target.src = `${api_url}/uploads/manufacturer_catalogs/${variant.image}`;
                                                                            } else {
                                                                                e.target.src = '/images/nologo.png';
                                                                            }
                                                                        }}
                                                                    />
                                                                    <Box
                                                                        mt={2}
                                                                        p={2}
                                                                        borderRadius="md"
                                                                        bg={styleItem.id === selectedStyleData?.id ? "blue.100" : "white"}
                                                                        borderWidth={styleItem.id === selectedStyleData?.id ? '2px' : '1px'}
                                                                        borderStyle="solid"
                                                                        borderColor={styleItem.id === selectedStyleData?.id ? "blue.500" : "gray.300"}
                                                                        fontWeight={styleItem.id === selectedStyleData?.id ? '600' : 'normal'}
                                                                    >
                                                                        <Text fontSize="sm" mb="0.25rem">
                                                                            {styleItem.style}
                                                                        </Text>
                                                                        {styleItem.id === selectedStyleData?.id && (
                                                                            <Text fontSize="xs" color="blue.500" mb="0.25rem">
                                                                                {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                            </Text>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Flex>
                </>
            )}
            <Divider my={6} />

            {!pricingReady ? (
                <Alert status="info" my={3} borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>
                        {t('proposalUI.applyingPricing', 'Applying pricing, please wait...')}
                    </AlertDescription>
                </Alert>
            ) : (
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
                />
            )}

            {copied && (
                <Box
                    position="fixed"
                    bottom={10}
                    left="50%"
                    transform="translateX(-50%)"
                    zIndex={9999}
                    px={3}
                >
                    <Alert status="success" variant="solid" borderRadius="md" alignItems="center">
                        <AlertIcon />
                        <AlertDescription flex="1">
                            {textChanges ? t('proposalUI.toast.copyEmpty') : t('proposalUI.toast.copySuccess')}
                        </AlertDescription>
                        <CloseButton color="white" onClick={() => setCopied(false)} />
                    </Alert>
                </Box>
            )}
            {!readOnly && isUserAdmin && (
                <Box mt={5} className="custom-items-mobile" maxW="100%">
                    <Stack
                        direction={{ base: 'column', md: 'row' }}
                        spacing={4}
                        align={{ base: 'stretch', md: 'center' }}
                        mb={3}
                    >
                        <Heading size="sm" mb={{ base: 1, md: 0 }}>
                            {t('proposalUI.custom.title')}
                        </Heading>
                        <Input
                            placeholder={t('proposalUI.custom.itemName')}
                            value={customItemName}
                            onChange={(e) => {
                                setCustomItemName(e.target.value);
                                if (customItemError) setCustomItemError('');
                            }}
                            flex="1"
                            minW={{ base: '0', md: '200px' }}
                        />
                        <NumberInput
                            value={customItemPrice}
                            min={0}
                            step={0.01}
                            precision={2}
                            onChange={(valueString) => {
                                setCustomItemPrice(valueString);
                                if (customItemError) setCustomItemError('');
                            }}
                            w="110px"
                        >
                            <NumberInputField />
                        </NumberInput>
                        <Checkbox
                            isChecked={customItemTaxable}
                            onChange={(e) => setCustomItemTaxable(e.target.checked)}
                            size="lg"
                        >
                            {t('proposalUI.custom.taxable')}
                        </Checkbox>
                        <Button
                            colorScheme="blue"
                            minW="80px"
                            onClick={handleAddCustomItem}
                        >
                            {t('proposalUI.custom.add')}
                        </Button>
                    </Stack>

                    {customItemError && (
                        <Text color="red.500" mt={1} mb={4}>
                            {customItemError}
                        </Text>
                    )}

                    <TableContainer display={{ base: 'none', md: 'block' }}>
                        <Table size="sm">
                            <Thead>
                                <Tr>
                                    <Th>{t('proposalUI.custom.table.index')}</Th>
                                    <Th>{t('proposalUI.custom.table.itemName')}</Th>
                                    <Th>{t('proposalUI.custom.table.price')}</Th>
                                    <Th>{t('proposalUI.custom.table.taxable')}</Th>
                                    <Th>{t('proposalUI.custom.table.actions')}</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {customItems?.map((item, idx) => (
                                    <Tr key={`${item.name}-${idx}`}>
                                        <Td>{idx + 1}</Td>
                                        <Td>{item.name}</Td>
                                        <Td>${(Number(item.price) || 0).toFixed(2)}</Td>
                                        <Td>{item.taxable ? t('common.yes') : t('common.no')}</Td>
                                        <Td>
                                            <Button
                                                size="xs"
                                                colorScheme="red"
                                                onClick={() => handleDeleteCustomItem(idx)}
                                            >
                                                {t('proposalUI.custom.delete')}
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>

                    <Box display={{ base: 'block', md: 'none' }}>
                        {customItems && customItems.length > 0 && (
                            <Flex
                                fontWeight="semibold"
                                color="gray.600"
                                mb={2}
                                px={2}
                                fontSize="sm"
                            >
                                <Text flex="0 0 10%" textAlign="center">#</Text>
                                <Text flex="0 0 40%">{t('proposalUI.custom.table.itemName')}</Text>
                                <Text flex="0 0 25%">{t('proposalUI.custom.table.price')}</Text>
                                <Text flex="0 0 15%" textAlign="center">{t('proposalUI.custom.table.taxable')}</Text>
                                <Text flex="0 0 10%">{t('proposalUI.custom.table.actions')}</Text>
                            </Flex>
                        )}

                        {customItems?.map((item, idx) => (
                            <Flex
                                key={`${item.name}-${idx}-mobile`}
                                mb={2}
                                py={2}
                                px={2}
                                borderBottom="1px solid"
                                borderColor="gray.200"
                                align="center"
                            >
                                <Text flex="0 0 10%" textAlign="center">{idx + 1}</Text>
                                <Text flex="0 0 40%" fontSize="sm">{item.name}</Text>
                                <Text flex="0 0 25%" fontSize="sm">
                                    ${(Number(item.price) || 0).toFixed(2)}
                                </Text>
                                <Text flex="0 0 15%" fontSize="sm" textAlign="center">
                                    {item.taxable ? t('common.yes') : t('common.no')}
                                </Text>
                                <Button
                                    flex="0 0 10%"
                                    size="xs"
                                    colorScheme="red"
                                    onClick={() => handleDeleteCustomItem(idx)}
                                >
                                    {t('proposalUI.custom.delete')}
                                </Button>
                            </Flex>
                        ))}

                        {(!customItems || customItems.length === 0) && (
                            <Text color="gray.500" textAlign="center" py={3} fontSize="sm">
                                No custom items added yet
                            </Text>
                        )}
                    </Box>
                </Box>
            )}
            {pricingReady && (
                <Flex
                    mt={5}
                    mb={5}
                    justify="center"
                >
                    <TableContainer w="full" maxW="500px">
                        <Table variant="simple" size="sm">
                            <Tbody>
                                <Tr>
                                    <Th bg="gray.50">{t('proposalDoc.priceSummary.cabinets')}</Th>
                                    <Td textAlign="center" fontWeight="semibold">
                                        {`$${selectVersion?.summary?.cabinets || '0'}`}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg="gray.50">{t('proposalDoc.priceSummary.assembly')}</Th>
                                    <Td textAlign="center">
                                        {`$${selectVersion?.summary?.assemblyFee || '0'}`}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg="gray.50">{t('proposalDoc.priceSummary.modifications')}</Th>
                                    <Td textAlign="center">
                                        {`$${selectVersion?.summary?.modificationsCost || '0'}`}
                                    </Td>
                                </Tr>

                                <Tr bg="gray.100">
                                    <Th>{t('proposalDoc.priceSummary.styleTotal')}</Th>
                                    <Td textAlign="center" fontWeight="semibold">
                                        {`$${selectVersion?.summary?.styleTotal || '0'}`}
                                    </Td>
                                </Tr>

                                {isUserAdmin && (
                                    <Tr>
                                        <Th bg="gray.50">{t('proposalUI.summary.discountPct')}</Th>
                                        <Td textAlign="center">
                                            <NumberInput
                                                value={selectVersion?.summary?.discountPercent || 0}
                                                min={0}
                                                max={100}
                                                onChange={(valueString, valueNumber) => {
                                                    const next = Number.isFinite(valueNumber)
                                                        ? valueNumber
                                                        : parseFloat(valueString) || 0;
                                                    const clamped = Math.max(0, Math.min(100, next));
                                                    setDiscountPercent(clamped);
                                                }}
                                                w="60px"
                                                mx="auto"
                                                size="sm"
                                                variant="flushed"
                                                isDisabled={readOnly}
                                            >
                                                <NumberInputField
                                                    textAlign="right"
                                                    fontWeight="500"
                                                    border="none"
                                                />
                                            </NumberInput>
                                        </Td>
                                    </Tr>
                                )}

                                <Tr>
                                    <Th bg="gray.50">{t('proposalDoc.priceSummary.total')}</Th>
                                    <Td textAlign="center">
                                        {`$${selectVersion?.summary?.total || '0'}`}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg="gray.50">{t('settings.manufacturers.edit.deliveryFee')}</Th>
                                    <Td textAlign="center">
                                        {`$${versionItems.length > 0 ? (selectVersion?.summary?.deliveryFee || '0') : '0'}`}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg="gray.50">{t('proposalUI.summary.taxRate')}</Th>
                                    <Td textAlign="center">
                                        {`${selectVersion?.summary?.taxRate || '0'}%`}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg="gray.50">{t('proposalDoc.priceSummary.tax')}</Th>
                                    <Td textAlign="center">
                                        {`$${selectVersion?.summary?.taxAmount || '0'}`}
                                    </Td>
                                </Tr>

                                <Tr bg="green.50">
                                    <Th>{t('proposalDoc.priceSummary.grandTotal')}</Th>
                                    <Td textAlign="center" fontWeight="bold">
                                        {`$${selectVersion?.summary?.grandTotal || '0'}`}
                                    </Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Flex>
            )}

            <ModificationBrowserModal
                visible={modificationModalVisible}
                onClose={() => setModificationModalVisible(false)}
                onApplyModification={handleApplyModification}
                selectedItemIndex={selectedItemIndexForMod}
                catalogItemId={itemModificationID}
            />
        </Box>
    );
};

export default ItemSelectionContentEdit;



