import { useEffect, useMemo, useRef, useState, useDeferredValue, startTransition, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CFormCheck, CFormSwitch } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilHome, cilBrush, cilChevronLeft, cilChevronRight, cilList } from '@coreui/icons';
import ModificationBrowserModal from './model/ModificationBrowserModal'
import { useDispatch, useSelector } from 'react-redux';
import { fetchTaxes } from '../store/slices/taxSlice';
import CatalogTable from './CatalogTable';
import axiosInstance from '../helpers/axiosInstance';
import { setTableItems as setTableItemsRedux } from '../store/slices/selectedVersionSlice';
import { setSelectVersionNew } from '../store/slices/selectVersionNewSlice';
import { isAdmin } from '../helpers/permissions';
import './ItemSelectionContent.css';

const ItemSelectionContent = ({ selectVersion, selectedVersion, formData, setFormData, setSelectedVersion }) => {
    const { t } = useTranslation();
    const api_url = import.meta.env.VITE_API_URL;
    const dispatch = useDispatch();
    const [selectedStyleData, setSelectedStyleData] = useState(null);
    const [tableItems, setTableItems] = useState([]);
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
    const { taxes, loading } = useSelector((state) => state.taxes);
    const authUser = useSelector((state) => state.auth?.user);
    const customization = useSelector((state) => state.customization);
    const headerBg = customization.headerBg || '#000000';

    const getContrastColor = (hexColor) => {
        if (!hexColor || hexColor.length < 7) return '#FFFFFF';
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    };

    const textColor = getContrastColor(headerBg);
    const isUserAdmin = isAdmin(authUser);
    const [customItemError, setCustomItemError] = useState('');
    const [itemModificationID, setItemModificationID] = useState('');
    const [modificationItems, setModificationItems] = useState('');
    const [userGroupMultiplier, setUserGroupMultiplier] = useState(1.0);
    const [manufacturerCostMultiplier, setManufacturerCostMultiplier] = useState(1.0);
    const [stylesMeta, setStylesMeta] = useState([]);
    const [fetchedCollections, setFetchedCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [carouselCurrentIndex, setCarouselCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4); // Desktop default
    // Stable baseline for comparison cards (prevents drift when switching styles) - no longer used
    // const [comparisonBaseline, setComparisonBaseline] = useState({ styleId: null, stylePrice: null });
    const [isStylesCollapsed, setIsStylesCollapsed] = useState(false); // New state for collapse/expand
    const [unavailableCount, setUnavailableCount] = useState(0);
    // Cache style items per manufacturer/style to avoid refetching and re-render churn
    const styleItemsCacheRef = useRef(new Map()); // key: `${manufacturerId}:${styleId}` => catalogData array
    // Track last computed summary per version to avoid redundant parent updates and render loops
    const summaryHashRef = useRef({}); // { [versionName]: stringHash }

    // Seed local items once per versionName to avoid render/dispatch loops
    const seededVersionRef = useRef(null);
    useEffect(() => {
        const versionName = selectVersion?.versionName;
        if (!versionName) return;
        if (seededVersionRef.current === versionName) return;
        seededVersionRef.current = versionName;
        const seed = Array.isArray(selectVersion?.items) ? selectVersion.items : [];
        setTableItems(seed);
        dispatch(setTableItemsRedux(seed));
    }, [selectVersion?.versionName]);

    // Fetch user group multiplier on mount
    useEffect(() => {
        const fetchUserMultiplier = async () => {
            try {
                const response = await axiosInstance.get('/api/user/multiplier');
                if (response?.data?.multiplier) {
                    setUserGroupMultiplier(Number(response.data.multiplier));
                }
            } catch (err) {
                // keep default 1.0
                // console.warn('Multiplier fetch failed', err?.message || err);
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

    // Items filtered to the current version context (memoized to avoid recompute churn)
    const filteredItems = useMemo(() => (
        Array.isArray(tableItems)
            ? tableItems.filter((item) => item?.selectVersion === selectVersion?.versionName)
            : []
    ), [tableItems, selectVersion?.versionName]);

    // Defer large lists to avoid blocking renders during style switches
    const deferredItems = useDeferredValue(filteredItems);



    // Helper function to update existing table items with type information
    const updateExistingItemsWithTypes = (catalogData) => {
        if (!Array.isArray(catalogData) || catalogData.length === 0) return;

        const codeToTypeMap = new Map();
        catalogData.forEach(item => {
            if (item.code && item.type) {
                codeToTypeMap.set(String(item.code).trim(), item.type);
            }
        });

        setTableItems(prevItems => {
            const updated = prevItems.map(item => {
                // If item already has type, keep it
                if (item.type) return item;

                // Look up type by code
                const itemType = codeToTypeMap.get(String(item.code).trim());
                if (itemType) {
                    return { ...item, type: itemType };
                }

                return item;
            });

            // Only update Redux if there were actual changes
            const hasChanges = updated.some((item, index) => item.type !== prevItems[index]?.type);
            if (hasChanges) {
                dispatch(setTableItemsRedux(updated));
            }

            return updated;
        });
    };

    // (moved below after selectedResult/defaultTaxValue are declared)

    useEffect(() => {
        dispatch(fetchTaxes());
    }, [dispatch]);


    // Load styles meta (unique styles with representative catalog id)
    useEffect(() => {
        const fetchStyles = async () => {
            const manufacturerId = selectVersion?.manufacturerData?.id;
            if (!manufacturerId) return;
            setCollectionsLoading(true);
            try {
                const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles-meta`);

                // Handle both old array format and new object format
                if (res.data.styles && Array.isArray(res.data.styles)) {
                    const filtered = res.data.styles.filter(s => String(s?.style || '').trim().length > 0);
                    setStylesMeta(filtered);
                    setManufacturerCostMultiplier(Number(res.data.manufacturerCostMultiplier || 1.0));
                } else if (Array.isArray(res.data)) {
                    // Fallback for old format
                    const filtered = res.data.filter(s => String(s?.style || '').trim().length > 0);
                    setStylesMeta(filtered);
                } else {
                    setStylesMeta([]);
                }
            } catch (e) {
                console.error('Error fetching styles meta:', e);
                setStylesMeta([]);
            } finally {
                setCollectionsLoading(false);
            }
        };
        fetchStyles();
    }, [selectVersion?.manufacturerData?.id]);

    // Preload catalog data for all styles to enable immediate price comparisons
    useEffect(() => {
        const preloadStylesCatalogData = async () => {
            const manufacturerId = selectVersion?.manufacturerData?.id;
            if (!manufacturerId || !stylesMeta.length) return;

            // Preload catalog data for all styles in parallel
            const preloadPromises = stylesMeta.map(async (style) => {
                const cacheKey = `${manufacturerId}:${style.id}`;

                // Skip if already cached
                if (styleItemsCacheRef.current.has(cacheKey)) {
                    return;
                }

                try {
                    const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles/${style.id}/items`, {
                        params: { includeDetails: '1', limit: 1000 }
                    });
                    const catalogData = res?.data?.catalogData || [];
                    styleItemsCacheRef.current.set(cacheKey, catalogData);
                } catch (error) {
                    // Silently fail for individual style preloads
                    console.warn(`Failed to preload catalog for style ${style.id}:`, error.message);
                }
            });

            // Wait for all preloads to complete
            await Promise.allSettled(preloadPromises);
        };

        preloadStylesCatalogData();
    }, [selectVersion?.manufacturerData?.id, stylesMeta]);

    // Fetch items for selected style lazily (by representative catalog id), with cache
    useEffect(() => {
        const fetchItemsForStyle = async () => {
            const manufacturerId = selectVersion?.manufacturerData?.id;
            const catalogId = selectVersion?.selectedStyle;
            if (!manufacturerId || !catalogId) {
                setFetchedCollections([]);
                return;
            }
            setCollectionsLoading(true);
            try {
                const cacheKey = `${manufacturerId}:${catalogId}`;
                if (styleItemsCacheRef.current.has(cacheKey)) {
                    const cached = styleItemsCacheRef.current.get(cacheKey) || [];
                    setFetchedCollections(cached);

                    // Update existing table items with type information from cache
                    updateExistingItemsWithTypes(cached);
                    return;
                }
                const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles/${catalogId}/items`, {
                    params: { includeDetails: '1', limit: 1000 }
                });
                const catalogData = res?.data?.catalogData || [];
                // cache raw data (unfiltered)
                styleItemsCacheRef.current.set(cacheKey, catalogData);

                // Update manufacturer cost multiplier if provided
                if (res?.data?.manufacturerCostMultiplier !== undefined) {
                    setManufacturerCostMultiplier(Number(res.data.manufacturerCostMultiplier || 1.0));
                }

                // Update existing table items with type information
                updateExistingItemsWithTypes(catalogData);

                setFetchedCollections(catalogData);
            } catch (e) {
                // swallow fetch error to avoid noisy console; keep UX resilient
                setFetchedCollections([]);
            } finally {
                setCollectionsLoading(false);
            }
        };
        fetchItemsForStyle();
    }, [selectVersion?.manufacturerData?.id, selectVersion?.selectedStyle]);

    // Optimistic prefill: show items immediately from local catalogData while network fetch warms up
    useEffect(() => {
        const manufacturerId = selectVersion?.manufacturerData?.id;
        const catalogId = selectVersion?.selectedStyle;
        if (!manufacturerId || !catalogId) return;
        if (!Array.isArray(catalogData) || catalogData.length === 0) return;
        // Try to map style id -> style name using local collections
        const styleName = (collections || []).find(c => c.id === catalogId)?.style;
        if (!styleName) return;
        // Only prefill if we currently have nothing (avoid flicker/overwrite)
        if (fetchedCollections.length === 0) {
            const local = catalogData.filter(cd => cd.style === styleName);
            if (local.length) setFetchedCollections(local);
        }
    }, [selectVersion?.manufacturerData?.id, selectVersion?.selectedStyle, catalogData, collections]);

    // Keep selectedStyleData in sync with the current selected style; constrain dependencies
    useEffect(() => {
        if (!selectVersion?.selectedStyle) return;
        const match = stylesMeta.find(col => col.id === selectVersion.selectedStyle) || null;
        setSelectedStyleData(prev => (prev === match ? prev : match));
    }, [selectVersion?.selectedStyle, stylesMeta]);

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

    // Reset carousel when collections change
    useEffect(() => {
        setCarouselCurrentIndex(0);
    }, [fetchedCollections]);

    // Carousel navigation functions
    const nextSlide = () => {
        const maxIndex = Math.max(0, stylesMeta.length - itemsPerPage);
        setCarouselCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = () => setCarouselCurrentIndex(prev => Math.max(prev - 1, 0));

    const canGoNext = () => carouselCurrentIndex < stylesMeta.length - itemsPerPage;

    const canGoPrev = () => carouselCurrentIndex > 0;

    // Atomic totals cache (cents) per style for driving the breakdown table, mirroring Edit
    // Shape: { epoch: number, key: string, entries: { [styleId]: { result: { partsCents, assemblyCents, modsCents, customCents, subtotalBeforeDiscountCents, discountCents, totalAfterDiscountCents, deliveryCents, taxRatePct, taxCents, grandTotalCents } } } }
    const totalsCacheRef = useRef({ epoch: 0, key: '', entries: {} });

    // Create a fingerprint for the current items/mods/custom state to detect when recalculation is needed
    const itemsFingerprint = useMemo(() => {
        const defaultTax = taxes.find(tax => tax.isDefault);
        const taxRatePct = parseFloat(defaultTax?.value || '0');
        const deliveryFee = Number(selectVersion?.manufacturerData?.deliveryFee || 0);
        return JSON.stringify({
            items: filteredItems.map(item => ({
                id: item.id,
                code: item.code,
                qty: item.qty,
                price: item.price,
                assemblyFee: item.assemblyFee,
                includeAssemblyFee: item.includeAssemblyFee,
                modifications: item.modifications?.map(mod => ({
                    id: mod.id,
                    price: mod.price,
                    qty: mod.qty
                })) || []
            })),
            customItems: customItems.map(item => ({
                name: item.name,
                price: item.price,
                taxable: item.taxable !== false // default true
            })),
            isAssembled,
            discountPercent,
            multipliers: {
                manufacturer: manufacturerCostMultiplier,
                userGroup: userGroupMultiplier
            },
            deliveryFee,
            taxRatePct
        });
    }, [filteredItems, customItems, isAssembled, discountPercent, manufacturerCostMultiplier, userGroupMultiplier, taxes, selectVersion?.manufacturerData?.deliveryFee]);

    // Pure calculator that returns detailed cents totals for a given style
    const computeTotalsForStyle = (stylePrice, styleId) => {
        try {
            // Start with current custom items total (unchanged by style switch)
            const customItemsTotal = customItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

            // Calculate modifications total (unchanged by style switch)
            const modificationsTotal = filteredItems.reduce((sum, item) => {
                if (!Array.isArray(item?.modifications) || item.modifications.length === 0) return sum;
                const mods = item.modifications.reduce((modSum, mod) => modSum + Number(mod.price || 0) * Number(mod.qty || 1), 0);
                return sum + mods;
            }, 0);

            // For cabinet items, we need to look up actual prices in the new style
            let cabinetPartsTotal = 0;
            let assemblyFeeTotal = 0;
            let eligible = 0; // count of parents available in this style

            const manufacturerId = selectVersion?.manufacturerData?.id;
            if (manufacturerId && styleId) {
                const cacheKey = `${manufacturerId}:${styleId}`;
                const catalogData = styleItemsCacheRef.current.get(cacheKey);

                if (catalogData && catalogData.length > 0) {
                    const byCode = new Map(catalogData.map(ci => [String(ci.code).trim(), ci]));
                    filteredItems.forEach(item => {
                        const match = byCode.get(String(item.code).trim());
                        if (match) {
                            eligible += 1;
                            const basePrice = Number(match.price) || 0;
                            const manufacturerAdjustedPrice = basePrice * Number(manufacturerCostMultiplier || 1);
                            const finalPrice = manufacturerAdjustedPrice * Number(userGroupMultiplier || 1);
                            const qty = Number(item.qty || 1);
                            cabinetPartsTotal += finalPrice * qty;
                            if (isAssembled && item?.includeAssemblyFee) {
                                const assemblyCost = match.styleVariantsAssemblyCost;
                                let assemblyFee = 0;
                                if (assemblyCost) {
                                    const feePrice = parseFloat(assemblyCost.price || 0);
                                    const feeType = assemblyCost.type;
                                    if (feeType === 'flat' || feeType === 'fixed') {
                                        assemblyFee = feePrice;
                                    } else if (feeType === 'percentage') {
                                        assemblyFee = (finalPrice * feePrice) / 100;
                                    } else {
                                        assemblyFee = feePrice;
                                    }
                                }
                                assemblyFeeTotal += assemblyFee * qty;
                            }
                        }
                    });
                } else {
                    // Fallback to style price ratio method
                    const newStylePrice = Number(stylePrice || 0);
                    const manufacturerAdjustedStylePrice = newStylePrice * Number(manufacturerCostMultiplier || 1);
                    const finalStylePrice = manufacturerAdjustedStylePrice * Number(userGroupMultiplier || 1);
                    const totalItemCount = filteredItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);
                    cabinetPartsTotal = finalStylePrice * totalItemCount;
                    eligible = filteredItems.length > 0 ? 1 : 0;

                    const currentStylePrice = Number(selectedStyleData?.price || 0);
                    const currentManufacturerAdjustedStylePrice = currentStylePrice * Number(manufacturerCostMultiplier || 1);
                    const currentFinalStylePrice = currentManufacturerAdjustedStylePrice * Number(userGroupMultiplier || 1);
                    const priceRatio = currentFinalStylePrice > 0 ? finalStylePrice / currentFinalStylePrice : 1;
                    const currentAssemblyTotal = isAssembled
                        ? filteredItems.reduce((sum, item) => {
                            const unitFee = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
                            const qty = Number(item?.qty || 1);
                            return sum + unitFee * qty;
                        }, 0)
                        : 0;
                    assemblyFeeTotal = currentAssemblyTotal * priceRatio;
                }
            }

            const styleTotal = cabinetPartsTotal + assemblyFeeTotal + customItemsTotal + modificationsTotal;
            const discountAmount = (styleTotal * Number(discountPercent || 0)) / 100;
            const totalAfterDiscount = styleTotal - discountAmount;
            const rawDeliveryFee = Number(selectVersion?.manufacturerData?.deliveryFee || 0);
            const deliveryFee = (eligible > 0 ? rawDeliveryFee : 0);
            const totalWithDelivery = totalAfterDiscount + deliveryFee;
            const defaultTax = taxes.find(tax => tax.isDefault);
            const defaultTaxValue = parseFloat(defaultTax?.value || '0');
            const taxAmount = (totalWithDelivery * Number(defaultTaxValue || 0)) / 100;
            const grandTotal = totalWithDelivery + taxAmount;

            // Convert to cents and return detailed shape
            const toCents = (n) => Math.round(Number(n || 0) * 100);
            return {
                partsCents: toCents(cabinetPartsTotal),
                assemblyCents: toCents(assemblyFeeTotal),
                modsCents: toCents(modificationsTotal),
                customCents: toCents(customItemsTotal),
                subtotalBeforeDiscountCents: toCents(styleTotal),
                discountCents: toCents(discountAmount),
                totalAfterDiscountCents: toCents(totalAfterDiscount),
                deliveryCents: toCents(deliveryFee),
                taxRatePct: Number(defaultTaxValue || 0),
                taxCents: toCents(taxAmount),
                grandTotalCents: toCents(grandTotal)
            };
        } catch (_e) {
            return null;
        }
    };

    // Atomic recompute into totals cache when fingerprint changes
    useEffect(() => {
        const key = itemsFingerprint;
        if (!stylesMeta || stylesMeta.length === 0) return;
        if (totalsCacheRef.current.key === key) return;
        const entries = {};
        stylesMeta.forEach(styleItem => {
            entries[styleItem.id] = {
                result: computeTotalsForStyle(styleItem.price, styleItem.id)
            };
        });
        totalsCacheRef.current = {
            epoch: (totalsCacheRef.current.epoch || 0) + 1,
            key,
            entries
        };
    }, [itemsFingerprint, stylesMeta]);

    // Selected style and selected cached result
    const selectedStyleId = selectVersion?.selectedStyle || selectedStyleData?.id || stylesMeta?.[0]?.id || null;
    const selectedResult = selectedStyleId ? totalsCacheRef.current.entries[selectedStyleId]?.result || null : null;

    // Helpers to format money in dollars from cents
    const money = (c) => `$${(((c || 0)) / 100).toFixed(2)}`;

    // Determine if a style has at least one eligible parent (fail open if data missing)
    const hasEligibleInStyle = useCallback((styleId) => {
        const manufacturerId = selectVersion?.manufacturerData?.id;
        if (!manufacturerId || !styleId) return filteredItems.length > 0 ? true : false;
        const cacheKey = `${manufacturerId}:${styleId}`;
        const catalogData = styleItemsCacheRef.current.get(cacheKey);
        if (!catalogData || catalogData.length === 0) {
            // Fail open when availability/pricing map is missing
            return filteredItems.length > 0 ? true : false;
        }
        const byCode = new Map(catalogData.map(ci => [String(ci.code).trim(), ci]));
        return filteredItems.some(item => byCode.has(String(item.code).trim()));
    }, [filteredItems, selectVersion?.manufacturerData?.id]);


    const defaultTax = taxes.find(tax => tax.isDefault);
    const defaultTaxValue = parseFloat(defaultTax?.value || '0');

    // (Consolidated in a single effect above)

    // Keep selectVersion.summary in sync for persistence, but do not render from it
    useEffect(() => {
        const versionName = selectVersion?.versionName;
        if (!versionName || !selectedResult) return;

        const newSummary = {
            cabinets: ((selectedResult.partsCents || 0) / 100).toFixed(2),
            assemblyFee: ((selectedResult.assemblyCents || 0) / 100).toFixed(2),
            modificationsCost: ((selectedResult.modsCents || 0) / 100).toFixed(2),
            deliveryFee: ((selectedResult.deliveryCents || 0) / 100).toFixed(2),
            styleTotal: ((selectedResult.subtotalBeforeDiscountCents || 0) / 100).toFixed(2),
            discountPercent: Number(discountPercent) || 0,
            discountAmount: (((selectedResult.discountCents || 0)) / 100).toFixed(2),
            total: ((((selectedResult.subtotalBeforeDiscountCents || 0) - (selectedResult.discountCents || 0))) / 100).toFixed(2),
            taxRate: selectedResult.taxRatePct || defaultTaxValue || 0,
            taxAmount: ((selectedResult.taxCents || 0) / 100).toFixed(2),
            grandTotal: ((selectedResult.grandTotalCents || 0) / 100).toFixed(2)
        };

        startTransition(() => {
            setFormData(prev => {
                const updatedManufacturersData = prev.manufacturersData.map(manufacturer => {
                    if (manufacturer.versionName === versionName) {
                        const matchedItems = filteredItems.filter((item) => item.selectVersion === versionName);
                        const matchedCustomItems = customItems.filter((item) => item.selectVersion === versionName);
                        return {
                            ...manufacturer,
                            selectedStyle: selectVersion?.selectedStyle,
                            items: matchedItems,
                            customItems: matchedCustomItems,
                            summary: newSummary
                        };
                    }
                    return manufacturer;
                });

                return {
                    ...prev,
                    manufacturersData: updatedManufacturersData
                };
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedResult, selectVersion?.selectedStyle, discountPercent]);

    const handleDelete = (index) => {
        // index is relative to filteredItems; map to tableItems index
        const item = filteredItems[index];
        if (!item) return;

        setTableItems(prev => {
            // Count how many items with the same ID we've seen before this filtered index
            let seenCount = 0;
            for (let i = 0; i < index; i++) {
                if (filteredItems[i]?.id === item.id && filteredItems[i]?.selectVersion === item.selectVersion) {
                    seenCount++;
                }
            }

            // Find the nth occurrence of this item in tableItems
            let foundCount = 0;
            let removeIdx = -1;
            for (let i = 0; i < prev.length; i++) {
                if (prev[i]?.id === item?.id && prev[i]?.selectVersion === item?.selectVersion) {
                    if (foundCount === seenCount) {
                        removeIdx = i;
                        break;
                    }
                    foundCount++;
                }
            }

            const updatedItems = removeIdx >= 0 ? prev.filter((_, i) => i !== removeIdx) : prev;
            dispatch(setTableItemsRedux(updatedItems));
            return updatedItems;
        });

        // Update backing formData structure for the current version (COPY FROM EDIT COMPONENT)
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];

                // Use the same logic to find the correct item index in formData
                let seenCount = 0;
                for (let i = 0; i < index; i++) {
                    if (filteredItems[i]?.id === item.id && filteredItems[i]?.selectVersion === item.selectVersion) {
                        seenCount++;
                    }
                }

                let foundCount = 0;
                let removeIdx = -1;
                for (let i = 0; i < items.length; i++) {
                    if (items[i]?.id === item?.id && items[i]?.selectVersion === item?.selectVersion) {
                        if (foundCount === seenCount) {
                            removeIdx = i;
                            break;
                        }
                        foundCount++;
                    }
                }

                if (removeIdx >= 0) {
                    const updatedItems = items.filter((_, i) => i !== removeIdx);
                    md[vIdx] = { ...md[vIdx], items: updatedItems };
                }
            }
            return { ...prev, manufacturersData: md };
        });
    };

    const handleCatalogSelect = (e) => {
        const code = e.target.value;
        const item = fetchedCollections.find(cd => `${cd.code} -- ${cd.description}` === code);
        // Additional safety check: ensure the item belongs to the selected style
        if (item && item.style === selectedStyleData?.style) {
            const basePrice = Number(item.price) || 0;

            // Apply manufacturer cost multiplier first, then user group multiplier
            const manufacturerAdjustedPrice = basePrice * Number(manufacturerCostMultiplier || 1);
            const finalPrice = manufacturerAdjustedPrice * Number(userGroupMultiplier || 1);

            // Calculate assembly fee AFTER all multipliers are applied
            const assemblyCost = item.styleVariantsAssemblyCost;
            let assemblyFee = 0;

            if (assemblyCost) {
                const feePrice = parseFloat(assemblyCost.price || 0);
                const feeType = assemblyCost.type;

                if (feeType === 'flat' || feeType === 'fixed') {
                    assemblyFee = feePrice;
                } else if (feeType === 'percentage') {
                    // percentage based on final price after all multipliers
                    assemblyFee = (finalPrice * feePrice) / 100;
                } else {
                    // Fallback for legacy data without type - treat as fixed fee
                    assemblyFee = feePrice;
                }
            }

            // (debug logs removed)

            const qty = 1;
            const total = finalPrice * qty + assemblyFee * qty;
            const newItem = {
                id: item.id,
                code: item.code,
                description: item.description,
                type: item.type, // Add the type field so Specs badges can work
                qty,
                originalPrice: basePrice,
                manufacturerAdjustedPrice: manufacturerAdjustedPrice,
                appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                price: finalPrice,
                assemblyFee,
                // Ensure assembly fee is considered immediately (was undefined so totals skipped it)
                includeAssemblyFee: isAssembled ? true : false,
                isRowAssembled: isAssembled ? true : false,
                hingeSide: isAssembled ? '' : 'N/A',
                exposedSide: isAssembled ? '' : 'N/A',
                total,
                selectVersion: selectVersion?.versionName
            };

            // Initialize comparison fallbacks ONCE when item is first added
            newItem.comparisonPriceFallback = Number(finalPrice || 0);
            newItem.comparisonAssemblyUnitFallback = Number(assemblyFee || 0);

            setTableItems(prev => {
                const updatedItems = addOnTop ? [newItem, ...prev] : [...prev, newItem];
                dispatch(setTableItemsRedux(updatedItems));  // Send the full list to Redux
                return updatedItems;
            });
    }
    };

    const updateQty = (index, newQty) => {
        // index is relative to filteredItems; map to tableItems index
        const viewItem = filteredItems[index];
        if (!viewItem || newQty < 1) return;

        setTableItems(prev => {
            // Count how many items with the same ID we've seen before this filtered index
            let seenCount = 0;
            for (let i = 0; i < index; i++) {
                if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                    seenCount++;
                }
            }

            // Find the nth occurrence of this item in tableItems
            let foundCount = 0;
            let targetIdx = -1;
            for (let i = 0; i < prev.length; i++) {
                if (prev[i]?.id === viewItem?.id && prev[i]?.selectVersion === viewItem?.selectVersion) {
                    if (foundCount === seenCount) {
                        targetIdx = i;
                        break;
                    }
                    foundCount++;
                }
            }

            if (targetIdx < 0) return prev;

            const updated = prev.map((item, i) => {
                if (i !== targetIdx) return item;
                return {
                    ...item,
                    qty: newQty,
                    total: newQty * Number(item.price || 0) + (Number(item.includeAssemblyFee ? item.assemblyFee || 0 : 0) * newQty),
                };
            });
            dispatch(setTableItemsRedux(updated));
            return updated;
        });

        // Update backing formData structure for the current version (COPY FROM EDIT COMPONENT)
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];

                // Use the same logic to find the correct item index in formData
                let seenCount = 0;
                for (let i = 0; i < index; i++) {
                    if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                        seenCount++;
                    }
                }

                let foundCount = 0;
                let formDataIdx = -1;
                for (let i = 0; i < items.length; i++) {
                    if (items[i]?.id === viewItem?.id && items[i]?.selectVersion === viewItem?.selectVersion) {
                        if (foundCount === seenCount) {
                            formDataIdx = i;
                            break;
                        }
                        foundCount++;
                    }
                }

                if (formDataIdx >= 0 && formDataIdx < items.length) {
                    const item = items[formDataIdx];
                    items[formDataIdx] = {
                        ...item,
                        qty: newQty,
                        total: newQty * Number(item.price || 0) + (Number(item.includeAssemblyFee ? item.assemblyFee || 0 : 0) * newQty),
                    };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
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

    const handleDeleteCustomItem = (itemToRemove) => {
        setCustomItems(prev => prev.filter((ci, i) => {
            // remove the first matching item for current version
            if (ci === itemToRemove) return false;
            if (
                ci.name === itemToRemove.name &&
                Number(ci.price) === Number(itemToRemove.price) &&
                ci.selectVersion === itemToRemove.selectVersion &&
                ci.taxable === itemToRemove.taxable
            ) {
                // prevent removing multiple duplicates: keep others after first mismatch handled
                itemToRemove = { ...itemToRemove, name: `__removed__${Math.random()}` };
            }
            return true;
        }));
    };

    const updateModification = (rowIndex, updatedModifications) => {
        if (typeof rowIndex !== 'number') return;

        // Update the local items array by row index
        setTableItems(prevItems => {
            const updated = Array.isArray(prevItems) ? [...prevItems] : [];
            if (rowIndex >= 0 && rowIndex < updated.length) {
                updated[rowIndex] = { ...updated[rowIndex], modifications: updatedModifications };
            }
            return updated;
        });

        // Also update manufacturersData directly like in Edit component
        setFormData(prev => {
            const md = Array.isArray(prev.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(manufacturer => manufacturer.versionName === selectVersion?.versionName);
            if (vIdx !== -1 && md[vIdx].items) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];
                if (rowIndex >= 0 && rowIndex < items.length) {
                    items[rowIndex] = { ...items[rowIndex], modifications: updatedModifications };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
        });
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
                const response = await axiosInstance.get(`${api_url}/api/manufacturers/catalogs/modificationsItems/${id}`);
                setModificationItems(response.data);
                // setExistingModifications(response.data); // <--- Add this
            }
        } catch (error) {
            console.log('error', error);
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
            console.error('Error saving custom mod:', err);
        }
    };




    // New handler for ModificationBrowserModal (accepts row index and payload)
    const handleApplyModification = (index, modificationData) => {
        const targetIndex = typeof index === 'number' ? index : selectedItemIndexForMod;
        const rowKey = `row_${targetIndex}`;
        const mods = modificationsMap[rowKey] || [];

        // Transform the new modification format to the existing format
        const newMod = {
            type: 'existing',
            modificationId: modificationData.templateId,
            qty: modificationData.quantity || 1,
            note: modificationData.note || '',
            name: modificationData.templateName || '',
            price: modificationData.price || 0,
            // Store additional data from the new system
            fieldsConfig: modificationData.fieldsConfig || {},
            selectedOptions: modificationData.selectedOptions || {},
            attachments: Array.isArray(modificationData.attachments) ? modificationData.attachments : []
        };

        const updatedMods = [...mods, newMod];
        updateModification(targetIndex, updatedMods);
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



    const handleDeleteModification = (rowIndex, modIdx) => {
        const rowKey = `row_${rowIndex}`;
        const updated = [...(modificationsMap[rowKey] || [])];
        updated.splice(modIdx, 1);
        updateModification(rowIndex, updated);
    };

    const existingModifications = [
        { id: 1, name: "Modification A" }
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
            const styleData = stylesMeta.find(c => c.id === newStyleId) || collections.find(c => c.id === newStyleId);
            setSelectedStyleData(styleData);

            // Establish baseline once if not set (no longer used)
            // setComparisonBaseline(prev => prev?.styleId ? prev : { styleId: styleData?.id || newStyleId, stylePrice: styleData?.price || 0 });

            // Fetch new style items to remap existing table items
            try {
                const manufacturerId = selectVersion?.manufacturerData?.id;
                if (!manufacturerId || !newStyleId) return;
                const cacheKey = `${manufacturerId}:${newStyleId}`;
                let catalogData = styleItemsCacheRef.current.get(cacheKey);
                if (!catalogData) {
                    const res = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styles/${newStyleId}/items`, {
                        params: { includeDetails: '1', limit: 1000 }
                    });
                    catalogData = res?.data?.catalogData || [];
                    styleItemsCacheRef.current.set(cacheKey, catalogData);
                }

                // Build a quick lookup by code
                const byCode = new Map(catalogData.map(ci => [String(ci.code).trim(), ci]));

                // Remap table items to the new style; mark missing as unavailable with $0
        let missing = 0;
                const remapped = tableItems.map(item => {
                    const match = byCode.get(String(item.code).trim());
                    if (!match) {
                        // Item not available in new style
                        const qty = Number(item.qty || 1);
            missing += 1;
                        return {
                            ...item,
                            unavailable: true,
                            price: 0,
                            assemblyFee: 0,
                            total: 0 * qty,
                            // Preserve existing fallbacks if any
                            comparisonPriceFallback: item.comparisonPriceFallback ?? Number(item.price || 0),
                            comparisonAssemblyUnitFallback: item.comparisonAssemblyUnitFallback ?? Number(item.assemblyFee || 0),
                        };
                    }

                    // Compute new price and assembly based on new style
                    const basePrice = Number(match.price) || 0;
                    const manufacturerAdjustedPrice = basePrice * Number(manufacturerCostMultiplier || 1);
                    const finalPrice = manufacturerAdjustedPrice * Number(userGroupMultiplier || 1);

                    // Calculate assembly fee after all multipliers are applied
                    const assemblyCost = match.styleVariantsAssemblyCost;
                    let newAssemblyUnit = 0;
                    if (assemblyCost) {
                        const feePrice = parseFloat(assemblyCost.price || 0);
                        const feeType = assemblyCost.type;
                        if (feeType === 'flat' || feeType === 'fixed') newAssemblyUnit = feePrice;
                        else if (feeType === 'percentage') newAssemblyUnit = (finalPrice * feePrice) / 100;
                        else newAssemblyUnit = feePrice; // Fallback for legacy data without type
                    }
                    const qty = Number(item.qty || 1);
                    return {
                        ...item,
                        unavailable: false,
                        type: match.type, // Update type from the new style's catalog item
                        originalPrice: basePrice,
                        manufacturerAdjustedPrice,
                        appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                        appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                        price: finalPrice,
                        assemblyFee: newAssemblyUnit,
                        total: finalPrice * qty + (isAssembled ? newAssemblyUnit * qty : 0),
                        // Preserve fallbacks if already set; otherwise initialize
                        comparisonPriceFallback: item.comparisonPriceFallback ?? Number(item.price || finalPrice || 0),
                        comparisonAssemblyUnitFallback: item.comparisonAssemblyUnitFallback ?? Number(item.assemblyFee || newAssemblyUnit || 0),
                    };
                });

                startTransition(() => {
                    setTableItems(remapped);
                    dispatch(setTableItemsRedux(remapped));
                    setUnavailableCount(missing);
                });
            } catch (err) {
                console.error('Failed to remap items for style switch:', err);
            }
        }
    };



    const totalAssemblyFee = isAssembled
        ? filteredItems.reduce(
            (sum, item) => sum + (item.includeAssemblyFee ? Number(item.assemblyFee || 0) : 0),
            0
        )
        : 0;


    const totalModificationsCost = filteredItems.reduce((sum, item) => {
        if (!item.modifications) return sum;

        const itemModsTotal = item.modifications.reduce((modSum, mod) => {
            const modPrice = parseFloat(mod.price || 0);
            const modQty = parseFloat(mod.qty || 1);
            return modSum + modPrice * modQty;
        }, 0);

        return sum + itemModsTotal;
    }, 0);


    const toggleRowAssembly = (index, isChecked) => {
        const viewItem = filteredItems[index];
        if (!viewItem) return;

        // Count how many items with the same ID we've seen before this filtered index
        let seenCount = 0;
        for (let i = 0; i < index; i++) {
            if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                seenCount++;
            }
        }

        // Find the nth occurrence of this item in tableItems
        let foundCount = 0;
        let targetIdx = -1;
        for (let i = 0; i < tableItems.length; i++) {
            if (tableItems[i]?.id === viewItem?.id && tableItems[i]?.selectVersion === viewItem?.selectVersion) {
                if (foundCount === seenCount) {
                    targetIdx = i;
                    break;
                }
                foundCount++;
            }
        }

        if (targetIdx < 0) return;

        const updatedItems = [...tableItems];
        const item = updatedItems[targetIdx];
        const newAssemblyFee = isChecked ? Number(item.assemblyFee || 0) : 0;
        const qty = Number(item.qty || 1);
        const newHinge = isChecked ? (item.hingeSide === "N/A" ? "" : item.hingeSide) : "N/A";
        const newExposed = isChecked ? (item.exposedSide === "N/A" ? "" : item.exposedSide) : "N/A";
        updatedItems[targetIdx] = {
            ...item,
            includeAssemblyFee: isChecked,
            isRowAssembled: isChecked,
            hingeSide: newHinge,
            exposedSide: newExposed,
            total: qty * Number(item.price || 0) + (newAssemblyFee * qty),
        };
        startTransition(() => {
            setTableItems(updatedItems);
            dispatch(setTableItemsRedux(updatedItems));
        });

        // Update backing formData/selectVersion for consistency (COPY FROM EDIT COMPONENT)
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
    };

    const updateHingeSide = (index, selectedSide) => {
        const viewItem = filteredItems[index];
        if (!viewItem) return;

        // Find the specific instance by creating a unique identifier that includes position
        setTableItems(prevItems => {
            // Count how many items with the same ID we've seen before this filtered index
            let seenCount = 0;
            for (let i = 0; i < index; i++) {
                if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                    seenCount++;
                }
            }

            // Find the nth occurrence of this item in tableItems
            let foundCount = 0;
            let targetIdx = -1;
            for (let i = 0; i < prevItems.length; i++) {
                if (prevItems[i]?.id === viewItem?.id && prevItems[i]?.selectVersion === viewItem?.selectVersion) {
                    if (foundCount === seenCount) {
                        targetIdx = i;
                        break;
                    }
                    foundCount++;
                }
            }

            if (targetIdx < 0) return prevItems;

            const updated = prevItems.map((item, i) => {
                if (i !== targetIdx) return item;
                return {
                    ...item,
                    hingeSide: selectedSide,
                };
            });
            // Use startTransition to ensure the Redux dispatch doesn't block the UI update
            startTransition(() => {
                dispatch(setTableItemsRedux(updated));
            });
            return updated;
        });

        // Update backing formData structure for the current version (COPY FROM EDIT COMPONENT)
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];

                // Use the same logic to find the correct item index in formData
                let seenCount = 0;
                for (let i = 0; i < index; i++) {
                    if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                        seenCount++;
                    }
                }

                let foundCount = 0;
                let formDataIdx = -1;
                for (let i = 0; i < items.length; i++) {
                    if (items[i]?.id === viewItem?.id && items[i]?.selectVersion === viewItem?.selectVersion) {
                        if (foundCount === seenCount) {
                            formDataIdx = i;
                            break;
                        }
                        foundCount++;
                    }
                }

                if (formDataIdx >= 0 && formDataIdx < items.length) {
                    items[formDataIdx] = { ...items[formDataIdx], hingeSide: selectedSide };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
        });
    };


    const updateExposedSide = (index, selectedSide) => {
        const viewItem = filteredItems[index];
        if (!viewItem) return;

        // Find the specific instance by creating a unique identifier that includes position
        setTableItems(prevItems => {
            // Count how many items with the same ID we've seen before this filtered index
            let seenCount = 0;
            for (let i = 0; i < index; i++) {
                if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                    seenCount++;
                }
            }

            // Find the nth occurrence of this item in tableItems
            let foundCount = 0;
            let targetIdx = -1;
            for (let i = 0; i < prevItems.length; i++) {
                if (prevItems[i]?.id === viewItem?.id && prevItems[i]?.selectVersion === viewItem?.selectVersion) {
                    if (foundCount === seenCount) {
                        targetIdx = i;
                        break;
                    }
                    foundCount++;
                }
            }

            if (targetIdx < 0) return prevItems;

            const updated = prevItems.map((item, i) => {
                if (i !== targetIdx) return item;
                return {
                    ...item,
                    exposedSide: selectedSide,
                };
            });
            // Use startTransition to ensure the Redux dispatch doesn't block the UI update
            startTransition(() => {
                dispatch(setTableItemsRedux(updated));
            });
            return updated;
        });

        // Update backing formData structure for the current version (COPY FROM EDIT COMPONENT)
        setFormData(prev => {
            const md = Array.isArray(prev?.manufacturersData) ? [...prev.manufacturersData] : [];
            const vIdx = md.findIndex(m => m.versionName === selectVersion?.versionName);
            if (vIdx !== -1) {
                const items = Array.isArray(md[vIdx].items) ? [...md[vIdx].items] : [];

                // Use the same logic to find the correct item index in formData
                let seenCount = 0;
                for (let i = 0; i < index; i++) {
                    if (filteredItems[i]?.id === viewItem.id && filteredItems[i]?.selectVersion === viewItem.selectVersion) {
                        seenCount++;
                    }
                }

                let foundCount = 0;
                let formDataIdx = -1;
                for (let i = 0; i < items.length; i++) {
                    if (items[i]?.id === viewItem?.id && items[i]?.selectVersion === viewItem?.selectVersion) {
                        if (foundCount === seenCount) {
                            formDataIdx = i;
                            break;
                        }
                        foundCount++;
                    }
                }

                if (formDataIdx >= 0 && formDataIdx < items.length) {
                    items[formDataIdx] = { ...items[formDataIdx], exposedSide: selectedSide };
                }
                md[vIdx] = { ...md[vIdx], items };
            }
            return { ...prev, manufacturersData: md };
        });
    };

    useEffect(() => {
        let nextUpdated = null;
        setTableItems(prevItems => {
            const updated = prevItems.map(item => {
                const includeFee = !!isAssembled;
                const unitAssembly = includeFee ? Number(item.assemblyFee || 0) : 0;
                const qty = Number(item.qty || 1);
                return {
                    ...item,
                    includeAssemblyFee: includeFee,
                    isRowAssembled: includeFee,
                    hingeSide: isAssembled ? (item.hingeSide || "") : "N/A",
                    exposedSide: isAssembled ? (item.exposedSide || "") : "N/A",
                    total: qty * Number(item.price || 0) + (unitAssembly * qty),
                };
            });
            nextUpdated = updated;
            return updated;
        });
        if (nextUpdated) {
            startTransition(() => dispatch(setTableItemsRedux(nextUpdated)));
        }
    }, [isAssembled]);

    // Apply multipliers to existing table items when loaded (idempotent)
    useEffect(() => {
        if (!tableItems?.length) return;
        if ((!userGroupMultiplier || userGroupMultiplier === 1) && (!manufacturerCostMultiplier || manufacturerCostMultiplier === 1)) return;

    const updated = tableItems.map((item) => {
            const base = item.originalPrice != null ? Number(item.originalPrice) : Number(item.price) || 0;

            // Apply manufacturer multiplier first, then user group multiplier
            const manufacturerAdjustedPrice = base * Number(manufacturerCostMultiplier || 1);
            const finalPrice = manufacturerAdjustedPrice * Number(userGroupMultiplier || 1);

            const unitAssembly = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
            const qty = Number(item?.qty || 1);
            return {
                ...item,
                originalPrice: item.originalPrice != null ? item.originalPrice : base,
                manufacturerAdjustedPrice: manufacturerAdjustedPrice,
                appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                price: finalPrice,
                total: qty * finalPrice + unitAssembly * qty,
            };
        });
        startTransition(() => {
            setTableItems(updated);
            dispatch(setTableItemsRedux(updated));
        });
    }, [userGroupMultiplier, manufacturerCostMultiplier]);


    // const fetchModifications = () => async{

    // }




    // useEffect(() => {
    //     if (itemModificationID) {
    //         fetchModifications(itemModificationID);
    //     }
    // }, [itemModificationID]);

    return (
        <div>
            {selectedStyleData && (
                <>
                    <div className="d-flex gap-5 mb-4 flex-wrap style-selection-mobile" style={{ alignItems: 'stretch' }}>
                        <div className="current-style-section" style={{ minWidth: '250px', flex: '0 0 auto' }}>
                            <h5 className="mb-3">{t('proposalUI.currentStyle')}</h5>
                            <div className="current-style-content d-flex gap-3 align-items-start">
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
                                            onChange={(e) => setIsAssembled(e.target.checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="style-separator"
                            style={{
                                width: '1px',
                                backgroundColor: '#ccc',
                                marginInline: '16px',
                            }}
                        />

                            <div className="other-styles-section" style={{ flex: 1 }}>
                            <div className="other-styles-header d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">{t('proposalUI.otherStyles')}</h5>
                                <div className="d-flex align-items-center gap-2">
                                    {/* View toggle button - show on all screen sizes */}
                                    <button
                                        className={`btn btn-sm ${isStylesCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setIsStylesCollapsed(!isStylesCollapsed)}
                                        style={{ padding: '0.25rem 0.75rem' }}
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
                                    {/* Mobile carousel controls */}
                                    {filteredItems.length > 0 && !isStylesCollapsed && (
                                        <div className="carousel-controls d-flex gap-2 d-md-none">
                                            <button
                                                className={`btn btn-outline-secondary btn-sm ${!canGoPrev() ? 'disabled' : ''}`}
                                                onClick={prevSlide}
                                                disabled={!canGoPrev()}
                                                style={{ padding: '0.25rem 0.5rem' }}
                                                aria-label="Previous styles"
                                            >
                                                <CIcon icon={cilChevronLeft} size="sm" />
                                            </button>
                                            <button
                                                className={`btn btn-outline-secondary btn-sm ${!canGoNext() ? 'disabled' : ''}`}
                                                onClick={nextSlide}
                                                disabled={!canGoNext()}
                                                style={{ padding: '0.25rem 0.5rem' }}
                                                aria-label="Next styles"
                                            >
                                                <CIcon icon={cilChevronRight} size="sm" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {unavailableCount > 0 && (
                                <div className="alert alert-warning py-2 px-3 mb-3" role="alert">
                                    {unavailableCount} item{unavailableCount !== 1 ? 's' : ''} not available in this style. They remain listed in red with $0 and won’t affect totals.
                                </div>
                            )}
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
                                                    const variant = styleItem.styleVariants?.[0];
                                                    const isCurrentStyle = styleItem.id === selectedStyleData?.id;
                                                    const hasAnyItems = filteredItems.length > 0;
                                                    const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                    return (
                                                        <div
                                                            key={`compact-style-${styleItem.id}-${index}`}
                                                            className={`compact-style-item ${isCurrentStyle ? 'current-style' : ''} styleCard`}
                                                            aria-disabled={disabled}
                                                            onClick={() => handleStyleSelect(styleItem.id)}
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
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s ease',
                                                                flexShrink: 0
                                                            }}
                                                            onClick={() => handleStyleSelect(styleItem.id)}
                                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
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
                    </div>
                </>
            )}
            <hr />            <CatalogTable
                catalogData={fetchedCollections}
                handleCatalogSelect={handleCatalogSelect}
                addOnTop={addOnTop}
                setAddOnTop={setAddOnTop}
                handleCopy={handleCopy}
                groupEnabled={groupEnabled}
                setGroupEnabled={setGroupEnabled}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                updateQty={updateQty}
                handleOpenModificationModal={handleOpenModificationModal}
                handleDelete={handleDelete}
                updateModification={updateModification}
                setModificationsMap={setModificationsMap}
                modificationsMap={modificationsMap}
                handleDeleteModification={handleDeleteModification}
                formatPrice={formatPrice}
                selectVersion={selectVersion}
                isAssembled={isAssembled}
                selectedStyleData={selectedStyleData}
                toggleRowAssembly={toggleRowAssembly}
                updateHingeSide={updateHingeSide}
                updateExposedSide={updateExposedSide}
                items={filteredItems}
                headerBg={headerBg}
                textColor={textColor}
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

            {isUserAdmin && (
            <div className="mt-5 p-0 custom-items-mobile" style={{ maxWidth: '100%' }}>
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
                            {customItems
                                .filter(ci => ci.selectVersion === selectVersion?.versionName)
                                .map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.name}</td>
                                    <td>${(Number(item.price) || 0).toFixed(2)}</td>
                                    <td>{item.taxable ? t('common.yes') : t('common.no')}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-danger text-white"
                                            onClick={() => handleDeleteCustomItem(item)}
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
                    {customItems && customItems.filter(ci => ci.selectVersion === selectVersion?.versionName).length > 0 && (
                        <div className="row fw-bold text-muted mb-2 px-2" style={{ fontSize: '0.85rem' }}>
                            <div className="col-1">#</div>
                            <div className="col-4">{t('proposalUI.custom.table.itemName')}</div>
                            <div className="col-3">{t('proposalUI.custom.table.price')}</div>
                            <div className="col-2">{t('proposalUI.custom.table.taxable')}</div>
                            <div className="col-2">{t('proposalUI.custom.table.actions')}</div>
                        </div>
                    )}
                    {customItems
                        .filter(ci => ci.selectVersion === selectVersion?.versionName)
                        .map((item, idx) => (
                        <div key={idx} className="row mb-2 py-2 border-bottom align-items-center">
                            <div className="col-1 text-center">{idx + 1}</div>
                            <div className="col-4" style={{ fontSize: '0.9rem' }}>{item.name}</div>
                            <div className="col-3" style={{ fontSize: '0.9rem' }}>${(Number(item.price) || 0).toFixed(2)}</div>
                            <div className="col-2 text-center" style={{ fontSize: '0.9rem' }}>{item.taxable ? t('common.yes') : t('common.no')}</div>
                            <div className="col-2">
                                <button
                                    onClick={() => handleDeleteCustomItem(item)}
                                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                                >
                                    {t('proposalUI.custom.delete')}
                                </button>
                            </div>
                        </div>
                    ))}

                    {(!customItems || customItems.filter(ci => ci.selectVersion === selectVersion?.versionName).length === 0) && (
                        <div className="text-muted text-center py-3" style={{ fontSize: '0.9rem' }}>
                            No custom items added yet
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Totals Summary */}
            <div className="mt-5 mb-5 d-flex justify-content-center totals-summary-mobile">
                <div className="summary-panel">
                    <table className="table">
                        <tbody>
                            <tr>
                                <th className="bg-light">{t('proposalDoc.priceSummary.cabinets')}</th>
                                <td className="text-center fw-medium">{money(selectedResult?.partsCents)}</td>
                            </tr>

                            <tr>
                                <th className="bg-light">{t('proposalDoc.priceSummary.assembly')}</th>
                                <td className="text-center">{money(selectedResult?.assemblyCents)}</td>
                            </tr>

                            <tr>
                                <th className="bg-light">{t('proposalDoc.priceSummary.modifications')}</th>
                                <td className="text-center">{money(selectedResult?.modsCents)}</td>
                            </tr>

                            <tr className="table-secondary">
                                <th>{t('proposalDoc.priceSummary.styleTotal')}</th>
                            <td className="text-center fw-semibold">{money(selectedResult?.subtotalBeforeDiscountCents)}</td>
                        </tr>

                        {isUserAdmin && (
                            <tr>
                                <th className="bg-light">{t('proposalUI.summary.discountPct')}</th>
                                <td className="text-center">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={discountPercent}
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
                            <td className="text-center">{money(((selectedResult?.subtotalBeforeDiscountCents || 0) - (selectedResult?.discountCents || 0)))}</td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('settings.manufacturers.edit.deliveryFee')}</th>
                            <td className="text-center">{money(selectedResult?.deliveryCents)}</td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalUI.summary.taxRate')}</th>
                            <td className="text-center">{(selectedResult?.taxRatePct ?? defaultTaxValue) || 0}%</td>
                        </tr>

                        <tr>
                            <th className="bg-light">{t('proposalDoc.priceSummary.tax')}</th>
                            <td className="text-center">{money(selectedResult?.taxCents)}</td>
                        </tr>

                        <tr className="grand">
                            <th>{t('proposalDoc.priceSummary.grandTotal')}</th>
                            <td className="text-center">{money(selectedResult?.grandTotalCents)}</td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>

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

export default ItemSelectionContent;
