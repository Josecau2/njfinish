import StandardCard from './StandardCard'
import { TableCard } from './TableCard'
import { useEffect, useMemo, useRef, useState, useDeferredValue, startTransition, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertIcon, Box, Button, Checkbox, CloseButton, Divider, Flex, Heading, HStack, Icon, IconButton, Image, Input, NumberInput, NumberInputField, Stack, Switch, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useBreakpointValue, useColorModeValue } from '@chakra-ui/react';
import { Settings, Home, Brush, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { ICON_SIZE_MD, ICON_BOX_MD } from '../constants/iconSizes'
import ModificationBrowserModal from './model/ModificationBrowserModal'
import { useDispatch, useSelector } from 'react-redux';
import { fetchTaxes } from '../store/slices/taxSlice';
import CatalogTable from './CatalogTable';
import axiosInstance from '../helpers/axiosInstance';
import { setTableItems as setTableItemsRedux } from '../store/slices/selectedVersionSlice';
import { setSelectVersionNew } from '../store/slices/selectVersionNewSlice';
import { isAdmin } from '../helpers/permissions';
import { isShowroomModeActive, getShowroomMultiplier, addShowroomSettingsListener } from '../utils/showroomUtils';
import { useStyleCarousel } from '../hooks/useStyleCarousel';
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
    const taxesReady = useMemo(() => !loading && Array.isArray(taxes), [loading, taxes]);
    const authUser = useSelector((state) => state.auth?.user);
    const customization = useSelector((state) => state.customization);
    const headerBg = customization.headerBg || "black";

    const getContrastColor = (hexColor) => {
        if (!hexColor || hexColor.length < 7) return "white";
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? "black" : "white";
    };

    const textColor = getContrastColor(headerBg);
    const isUserAdmin = isAdmin(authUser);
    const [customItemError, setCustomItemError] = useState('');

    // Dark mode colors
    const bgGray50 = useColorModeValue("gray.50", "gray.800");
    const summaryTableMaxWidth = useBreakpointValue({ base: '100%', md: '440px', lg: '500px' }) || '100%';
    const styleCarouselMinHeight = useBreakpointValue({ base: '237px', md: '200px', lg: '210px' }) || '200px';
    const styleImageContainerWidth = useBreakpointValue({ base: 121, md: 180, lg: 200 }) || 180;
    const styleImageContainerHeight = useBreakpointValue({ base: 182, md: 160, lg: 180 }) || 160;
    const styleImageMaxHeight = useBreakpointValue({ base: 171, md: 140, lg: 160 }) || 140;
    const styleImagePadding = useBreakpointValue({ base: 1, md: 2.5 }) || 2;
    const colorGray500 = useColorModeValue("gray.500", "gray.400");
    const colorGray600 = useColorModeValue("gray.600", "gray.400");
    const iconBlue = useColorModeValue("blue.500", "blue.300");
    const iconGray = useColorModeValue("gray.500", "gray.400");
    const styleCardBgSelected = useColorModeValue('blue.50', 'blue.900');
    const styleCardBgUnselected = useColorModeValue('white', 'gray.700');
    const styleCardBorderSelected = useColorModeValue('blue.500', 'blue.400');
    const styleCardBorderUnselected = useColorModeValue('gray.300', 'gray.600');
    const styleCardTextColor = useColorModeValue("gray.900", "gray.100");
    const styleCardLabelColor = useColorModeValue("blue.600", "blue.300");
    const borderGray = useColorModeValue("gray.200", "gray.600");
    const tableHeaderBg = useColorModeValue("gray.50", "gray.800");
    const tableRowBg = useColorModeValue("gray.100", "gray.700");
    const tableTotalRowBg = useColorModeValue("green.50", "green.900");
    const settingsIconColor = useColorModeValue("green.500", "green.300");
    const separatorBg = useColorModeValue("gray.300", "gray.600");
    const errorTextColor = useColorModeValue("red.500", "red.300");
    const [itemModificationID, setItemModificationID] = useState('');
    const [modificationItems, setModificationItems] = useState('');
    const [userGroupMultiplier, setUserGroupMultiplier] = useState(1.0);
    const [manufacturerCostMultiplier, setManufacturerCostMultiplier] = useState(1.0);
    const [showroomMultiplier, setShowroomMultiplier] = useState(1.0);
    const [showroomActive, setShowroomActive] = useState(false);
    // Readiness flags to avoid UI flicker until pricing context is complete
    const [userMultiplierFetched, setUserMultiplierFetched] = useState(false);
    const [manuMultiplierFetched, setManuMultiplierFetched] = useState(false);
    const [preloadingComplete, setPreloadingComplete] = useState(false);
    const [pricingReady, setPricingReady] = useState(false);
    const [stylesMeta, setStylesMeta] = useState([]);
    const [fetchedCollections, setFetchedCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);

    // Embla Carousel - replaces custom carousel implementation
    const {
        emblaRef,
        canScrollPrev,
        canScrollNext,
        scrollPrev,
        scrollNext,
    } = useStyleCarousel(stylesMeta);

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
                    setManuMultiplierFetched(true);
                } else if (Array.isArray(res.data)) {
                    // Fallback for old format
                    const filtered = res.data.filter(s => String(s?.style || '').trim().length > 0);
                    setStylesMeta(filtered);
                    setManuMultiplierFetched(true);
                } else {
                    setStylesMeta([]);
                    setManuMultiplierFetched(true);
                }
            } catch (e) {
                console.error('Error fetching styles meta:', e);
                setStylesMeta([]);
                setManuMultiplierFetched(true);
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
            setPreloadingComplete(false);
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
            setPreloadingComplete(true);
        };

        preloadStylesCatalogData();
    }, [selectVersion?.manufacturerData?.id, stylesMeta]);

    // Centralized readiness gating to avoid flicker
    useEffect(() => {
        setPricingReady(Boolean(userMultiplierFetched && manuMultiplierFetched && taxesReady && preloadingComplete));
    }, [userMultiplierFetched, manuMultiplierFetched, taxesReady, preloadingComplete]);

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
                userGroup: userGroupMultiplier,
                showroomActive,
                showroomMultiplier
            },
            deliveryFee,
            taxRatePct
        });
    }, [filteredItems, customItems, isAssembled, discountPercent, manufacturerCostMultiplier, userGroupMultiplier, showroomActive, showroomMultiplier, taxes, selectVersion?.manufacturerData?.deliveryFee]);

    // Pure calculator that returns detailed cents totals for a given style
    const computeTotalsForStyle = (stylePrice, styleId) => {
        try {
            // Start with current custom items total (affected by showroom multiplier)
            const baseCustomItemsTotal = customItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
            const customItemsTotal = showroomActive ? baseCustomItemsTotal * showroomMultiplier : baseCustomItemsTotal;

            // Calculate modifications total (affected by showroom multiplier)
            const baseModificationsTotal = filteredItems.reduce((sum, item) => {
                if (!Array.isArray(item?.modifications) || item.modifications.length === 0) return sum;
                const mods = item.modifications.reduce((modSum, mod) => modSum + Number(mod.price || 0) * Number(mod.qty || 1), 0);
                return sum + mods;
            }, 0);
            const modificationsTotal = showroomActive ? baseModificationsTotal * showroomMultiplier : baseModificationsTotal;

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
                            const userGroupAdjustedPrice = manufacturerAdjustedPrice * Number(userGroupMultiplier || 1);
                            const finalPrice = showroomActive ? userGroupAdjustedPrice * showroomMultiplier : userGroupAdjustedPrice;
                            const qty = Number(item.qty || 1);
                            cabinetPartsTotal += finalPrice * qty;
                            if (isAssembled && item?.includeAssemblyFee) {
                                const assemblyCost = match.styleVariantsAssemblyCost;
                                let assemblyFee = 0;
                                if (assemblyCost) {
                                    const feePrice = parseFloat(assemblyCost.price || 0);
                                    const feeType = assemblyCost.type;
                                    if (feeType === 'flat' || feeType === 'fixed') {
                                        assemblyFee = showroomActive ? feePrice * showroomMultiplier : feePrice;
                                    } else if (feeType === 'percentage') {
                                        assemblyFee = (finalPrice * feePrice) / 100;
                                    } else {
                                        assemblyFee = showroomActive ? feePrice * showroomMultiplier : feePrice;
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
                    const userGroupAdjustedStylePrice = manufacturerAdjustedStylePrice * Number(userGroupMultiplier || 1);
                    const finalStylePrice = showroomActive ? userGroupAdjustedStylePrice * showroomMultiplier : userGroupAdjustedStylePrice;
                    const totalItemCount = filteredItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);
                    cabinetPartsTotal = finalStylePrice * totalItemCount;
                    eligible = filteredItems.length > 0 ? 1 : 0;

                    const currentStylePrice = Number(selectedStyleData?.price || 0);
                    const currentManufacturerAdjustedStylePrice = currentStylePrice * Number(manufacturerCostMultiplier || 1);
                    const currentUserGroupAdjustedStylePrice = currentManufacturerAdjustedStylePrice * Number(userGroupMultiplier || 1);
                    const currentFinalStylePrice = showroomActive ? currentUserGroupAdjustedStylePrice * showroomMultiplier : currentUserGroupAdjustedStylePrice;
                    const priceRatio = currentFinalStylePrice > 0 ? finalStylePrice / currentFinalStylePrice : 1;
                    const currentAssemblyTotal = isAssembled
                        ? filteredItems.reduce((sum, item) => {
                            const baseUnitFee = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
                            const unitFee = showroomActive ? baseUnitFee * showroomMultiplier : baseUnitFee;
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

    // Keep formData.manufacturersData in sync so saved drafts retain items even before totals compute
    useEffect(() => {
        const versionName = selectVersion?.versionName;
        if (!versionName) return;

        const matchedItems = filteredItems.filter((item) => item.selectVersion === versionName);
        const matchedCustomItems = customItems.filter((item) => item.selectVersion === versionName);

        let summaryForState = null;
        if (selectedResult) {
            summaryForState = {
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
                grandTotal: ((selectedResult.grandTotalCents || 0) / 100).toFixed(2),
            };
        }

        const snapshot = JSON.stringify({
            items: matchedItems,
            customItems: matchedCustomItems,
            summary: summaryForState,
            selectedStyle: selectVersion?.selectedStyle ?? null,
            discountPercent: Number(discountPercent) || 0,
        });

        if (summaryHashRef.current[versionName] === snapshot) {
            return;
        }

        summaryHashRef.current[versionName] = snapshot;

        startTransition(() => {
            setFormData((prev) => {
                if (!Array.isArray(prev?.manufacturersData)) {
                    return prev;
                }

                let didUpdate = false;
                const nextManufacturersData = prev.manufacturersData.map((manufacturer) => {
                    if (manufacturer.versionName !== versionName) {
                        return manufacturer;
                    }

                    const nextEntry = {
                        ...manufacturer,
                        items: matchedItems,
                        customItems: matchedCustomItems,
                    };

                    if (summaryForState) {
                        nextEntry.summary = summaryForState;
                    }

                    if (selectVersion?.selectedStyle && manufacturer.selectedStyle !== selectVersion.selectedStyle) {
                        nextEntry.selectedStyle = selectVersion.selectedStyle;
                    }

                    didUpdate = true;
                    return nextEntry;
                });

                if (!didUpdate) {
                    return prev;
                }

                return {
                    ...prev,
                    manufacturersData: nextManufacturersData,
                };
            });
        });
    }, [filteredItems, customItems, selectedResult, selectVersion?.selectedStyle, selectVersion?.versionName, discountPercent, defaultTaxValue]);

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

                    // Update the selectVersion snapshot consumed by CatalogTable
                    // This ensures the UI re-renders immediately after delete
                    if (setSelectedVersion && selectVersion) {
                        setSelectedVersion({ ...selectVersion, items: updatedItems });
                    }
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

            // Apply multiplier chain: manufacturer → user group → showroom
            const manufacturerAdjustedPrice = basePrice * Number(manufacturerCostMultiplier || 1);
            const userGroupAdjustedPrice = manufacturerAdjustedPrice * Number(userGroupMultiplier || 1);
            const finalPrice = showroomActive ? userGroupAdjustedPrice * showroomMultiplier : userGroupAdjustedPrice;

            // Calculate assembly fee AFTER all multipliers are applied
            const assemblyCost = item.styleVariantsAssemblyCost;
            let assemblyFee = 0;

            if (assemblyCost) {
                const feePrice = parseFloat(assemblyCost.price || 0);
                const feeType = assemblyCost.type;

                if (feeType === 'flat' || feeType === 'fixed') {
                    // Fixed fees are also affected by showroom multiplier
                    assemblyFee = showroomActive ? feePrice * showroomMultiplier : feePrice;
                } else if (feeType === 'percentage') {
                    // percentage based on final price after all multipliers (including showroom)
                    assemblyFee = (finalPrice * feePrice) / 100;
                } else {
                    // Fallback for legacy data without type - treat as fixed fee
                    assemblyFee = showroomActive ? feePrice * showroomMultiplier : feePrice;
                }
            }

            // (debug logs removed)

            const qty = 1;
            const total = finalPrice * qty + assemblyFee * qty;
            const newItem = {
                id: item.id,
                catalogDataId: item.id, // Reference to original catalog item for sub-type validation
                code: item.code,
                description: item.description,
                type: item.type, // Add the type field so Specs badges can work
                qty,
                originalPrice: basePrice,
                manufacturerAdjustedPrice: manufacturerAdjustedPrice,
                appliedManufacturerMultiplier: Number(manufacturerCostMultiplier || 1),
                appliedUserGroupMultiplier: Number(userGroupMultiplier || 1),
                appliedShowroomMultiplier: showroomActive ? showroomMultiplier : 1,
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
        <Box>
            {selectedStyleData && (
                <>
                    <Flex
                        gap={5}
                        mb={4}
                        flexWrap="wrap"
                        align="stretch"
                    >
                        <Box
                            minW="250px"
                            flexShrink={0}
                        >
                            <Heading size="sm" mb={3}>
                                {t('proposalUI.currentStyle')}
                            </Heading>
                            <Flex
                                gap={4}
                                align="flex-start"
                            >
                                <Box flexShrink={0}>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        maxW={`${styleImageContainerWidth}px`}
                                        maxH={`${styleImageContainerHeight}px`}
                                        mx="auto"
                                        bg={bgGray50}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor={styleCardBorderSelected}
                                        p={styleImagePadding}
                                    >
                                        <Image
                                            src={
                                                selectedStyleData.styleVariants?.[0]?.image
                                                    ? `${api_url}/uploads/images/${selectedStyleData.styleVariants[0].image}`
                                                    : '/images/nologo.png'
                                            }
                                            alt={selectedStyleData.styleVariants?.[0]?.shortName || selectedStyleData.style}
                                            w={`${styleImageContainerWidth}px`}
                                            h={`${styleImageMaxHeight}px`}
                                            objectFit="contain"
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
                                </Box>
                                <Stack
                                    spacing={6}
                                    flex="1"
                                >
                                    <Flex align="center" fontSize="md">
                                        <Icon as={Home} boxSize={ICON_BOX_MD} color={iconBlue} mr={2} />
                                        <Heading size="sm" mb={0}>
                                            {selectVersion?.manufacturerData?.name}
                                        </Heading>
                                    </Flex>
                                    <Flex align="center" fontSize="md" color={colorGray600}>
                                        <Icon as={Brush} boxSize={ICON_BOX_MD} color={colorGray500} mr={2} />
                                        <Heading size="sm" mb={0}>
                                            {selectedStyleData.style}
                                        </Heading>
                                    </Flex>
                                    <Flex align="center" fontSize="lg">
                                        <Icon as={Settings} boxSize={ICON_BOX_MD} color={settingsIconColor} mr={2} />
                                        <Text mr={2}>{t('proposalColumns.assembled')}</Text>
                                        <Switch
                                            size="md"
                                            colorScheme="teal"
                                            isChecked={isAssembled}
                                            onChange={(e) => setIsAssembled(e.target.checked)}
                                            aria-label={t('proposalColumns.assembled')}
                                        />
                                    </Flex>
                                </Stack>
                            </Flex>
                        </Box>

                        <Box
                            w="1px"
                            bg={separatorBg}
                            mx={4}
                            display={{ base: 'none', lg: 'block' }}
                        />

                        <Box flex="1">
                            <Flex
                                justify="space-between"
                                align="center"
                                mb={8}
                            >
                                <Heading size="sm" mb={0}>
                                    {t('proposalUI.otherStyles')}
                                </Heading>
                                <HStack spacing={4} align="center">
                                    <Button
                                        size="sm"
                                        variant={isStylesCollapsed ? 'solid' : 'outline'}
                                        colorScheme="brand"
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
                                        <Icon as={List} boxSize={ICON_BOX_MD} mr={1} />
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
                                            {isStylesCollapsed ? 'List' : 'Images'}
                                        </Text>
                                    </Button>

                                    {filteredItems.length > 0 && !isStylesCollapsed && (
                                        <HStack
                                            spacing={4}
                                            display={{ base: 'flex', md: 'none' }}
                                        >
                                            <IconButton
                                                icon={<ChevronLeft size={ICON_SIZE_MD} />}
                                                size="sm"
                                                variant="outline"
                                                colorScheme="gray"
                                                onClick={scrollPrev}
                                                isDisabled={!canScrollPrev}
                                                aria-label={t('catalog.navigation.previousStyles', 'Previous styles')}
                                                minH="44px"
                                                minW="44px"
                                            />
                                            <IconButton
                                                icon={<ChevronRight size={ICON_SIZE_MD} />}
                                                size="sm"
                                                variant="outline"
                                                colorScheme="gray"
                                                onClick={scrollNext}
                                                isDisabled={!canScrollNext}
                                                aria-label={t('catalog.navigation.nextStyles', 'Next styles')}
                                                minH="44px"
                                                minW="44px"
                                            />
                                        </HStack>
                                    )}
                                </HStack>
                            </Flex>

                            {unavailableCount > 0 && (
                                <Alert status="warning" py={2} px={3} mb={3} borderRadius="md">
                                    <AlertIcon />
                                    <AlertDescription>
                                        {unavailableCount} item
                                        {unavailableCount !== 1 ? 's' : ''} not available in this style. They remain listed in red with $0 and won't affect totals.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Box
                                position="relative"
                                w="100%"
                                overflowX="hidden"
                                overflowY="visible"
                                minH={isStylesCollapsed ? '120px' : styleCarouselMinHeight}
                            >
                                {collectionsLoading ? (
                                    <Text py={4} color={colorGray500}>
                                        {t('proposalUI.loadingStyles')}
                                    </Text>
                                ) : stylesMeta.length === 0 ? (
                                    <Text py={4} color={colorGray500}>
                                        {t('proposalUI.noStyles')}
                                    </Text>
                                ) : (
                                    <Box>
                                        {filteredItems.length === 0 ? (
                                            <Text py={4} textAlign="center" color={colorGray500} fontSize="sm">
                                                {t('proposalUI.styleComparison.selectItemsMessage')}
                                            </Text>
                                        ) : isStylesCollapsed ? (
                                            <Stack spacing={4}>
                                                {stylesMeta.map((styleItem, index) => {
                                                    const isCurrentStyle = styleItem.id === selectedStyleData?.id;
                                                    const hasAnyItems = filteredItems.length > 0;
                                                    const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                    return (
                                                        <Flex
                                                            key={`compact-style-${styleItem.id}-${index}`}
                                                            p={3}
                                                            borderRadius="md"
                                                            borderWidth="2px"
                                                            borderColor={isCurrentStyle ? styleCardBorderSelected : styleCardBorderUnselected}
                                                            bg={isCurrentStyle ? styleCardBgSelected : styleCardBgUnselected}
                                                            cursor={disabled ? 'not-allowed' : 'pointer'}
                                                            opacity={disabled ? 0.5 : 1}
                                                            aria-disabled={disabled}
                                                            align="center"
                                                            justify="space-between"
                                                            onClick={() => handleStyleSelect(styleItem.id)}
                                                            _hover={disabled ? {} : { transform: 'scale(1.02)', transition: 'all 0.2s' }}
                                                        >
                                                            <Box>
                                                                <Text fontWeight={isCurrentStyle ? "bold" : "medium"} fontSize="md" color={styleCardTextColor}>
                                                                    {styleItem.style}
                                                                </Text>
                                                                {isCurrentStyle && (
                                                                    <Text fontSize="xs" color={styleCardLabelColor} mt={1}>
                                                                        {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        </Flex>
                                                    );
                                                })}
                                            </Stack>
                                        ) : (
                                            <>
                                                {/* Embla Carousel - Mobile/Tablet only */}
                                                <Box className="embla" ref={emblaRef} display={{ base: 'block', md: 'none' }}>
                                                    <Flex className="embla__container">
                                                        {stylesMeta.map((styleItem, index) => {
                                                    const variant = styleItem.styleVariants?.[0];
                                                    const hasAnyItems = filteredItems.length > 0;
                                                    const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                    return (
                                                        <Box
                                                            key={`style-${styleItem.id}-${index}`}
                                                            className="embla__slide"
                                                            display="flex"
                                                            flexDirection="column"
                                                            alignItems="center"
                                                            aria-disabled={disabled}
                                                            cursor={disabled ? 'not-allowed' : 'pointer'}
                                                            opacity={disabled ? 0.5 : 1}
                                                            transition="transform 0.2s ease"
                                                            onClick={() => !disabled && handleStyleSelect(styleItem.id)}
                                                            _hover={disabled ? {} : { transform: 'scale(1.02)' }}
                                                        >
                                                            <Box
                                                                display="flex"
                                                                alignItems="center"
                                                                justifyContent="center"
                                                                maxW={`${styleImageContainerWidth}px`}
                                                                maxH={`${styleImageContainerHeight}px`}
                                                                w="100%"
                                                                bg={bgGray50}
                                                                borderRadius="md"
                                                                borderWidth={styleItem.id === selectedStyleData?.id ? '2px' : '1px'}
                                                                borderStyle="solid"
                                                                borderColor={styleItem.id === selectedStyleData?.id ? 'blue.500' : 'gray.200'}
                                                                p={styleImagePadding}
                                                            >
                                                                <Image
                                                                    src={
                                                                        variant?.image
                                                                            ? `${api_url}/uploads/images/${variant.image}`
                                                                            : '/images/nologo.png'
                                                                    }
                                                                    alt={variant?.shortName || styleItem.style}
                                                                    w={`${styleImageContainerWidth}px`}
                                                                    h={`${styleImageMaxHeight}px`}
                                                                    objectFit="contain"
                                                                    onError={(e) => {
                                                                        if (variant?.image && !e.target.dataset.fallbackTried) {
                                                                            e.target.dataset.fallbackTried = '1';
                                                                            e.target.src = `${api_url}/uploads/manufacturer_catalogs/${variant.image}`;
                                                                        } else {
                                                                            e.target.src = '/images/nologo.png';
                                                                        }
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Box
                                                                mt={1.5}
                                                                px={2}
                                                                py={1}
                                                                borderRadius="sm"
                                                                bg={styleItem.id === selectedStyleData?.id ? styleCardBgSelected : styleCardBgUnselected}
                                                                borderWidth="1px"
                                                                borderStyle="solid"
                                                                borderColor={styleItem.id === selectedStyleData?.id ? styleCardBorderSelected : styleCardBorderUnselected}
                                                                fontWeight={styleItem.id === selectedStyleData?.id ? '600' : 'normal'}
                                                                minH="40px"
                                                                display="flex"
                                                                flexDirection="column"
                                                                justifyContent="center"
                                                            >
                                                                <Text fontSize="xs" mb={0} color={styleCardTextColor} textAlign="center" lineHeight="1.2">
                                                                    {styleItem.style}
                                                                </Text>
                                                                {styleItem.id === selectedStyleData?.id && (
                                                                    <Text fontSize="2xs" color={styleCardLabelColor} mt={0.5} textAlign="center">
                                                                        {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                                    </Flex>
                                                </Box>

                                                {/* Desktop Grid - Same styles shown as grid on desktop */}
                                                <Box
                                                    display={{ base: 'none', md: 'flex' }}
                                                    gap="0.85rem"
                                                    flexWrap="wrap"
                                                >
                                                    {stylesMeta.map((styleItem, index) => {
                                                        const variant = styleItem.styleVariants?.[0];
                                                        const hasAnyItems = filteredItems.length > 0;
                                                        const disabled = hasAnyItems && !hasEligibleInStyle(styleItem.id);

                                                        return (
                                                            <Box
                                                                key={`style-desktop-${styleItem.id}-${index}`}
                                                                display="flex"
                                                                flexDirection="column"
                                                                alignItems="center"
                                                                aria-disabled={disabled}
                                                                cursor={disabled ? 'not-allowed' : 'pointer'}
                                                                opacity={disabled ? 0.5 : 1}
                                                                transition="transform 0.2s ease"
                                                                onClick={() => !disabled && handleStyleSelect(styleItem.id)}
                                                                _hover={disabled ? {} : { transform: 'scale(1.02)' }}
                                                            >
                                                                <Box
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    justifyContent="center"
                                                                    maxW={`${styleImageContainerWidth}px`}
                                                                    maxH={`${styleImageContainerHeight}px`}
                                                                    w="100%"
                                                                    bg={bgGray50}
                                                                    borderRadius="md"
                                                                    borderWidth={styleItem.id === selectedStyleData?.id ? '2px' : '1px'}
                                                                    borderStyle="solid"
                                                                    borderColor={styleItem.id === selectedStyleData?.id ? 'blue.500' : 'gray.200'}
                                                                    p={styleImagePadding}
                                                                >
                                                                    <Image
                                                                        src={
                                                                            variant?.image
                                                                                ? `${api_url}/uploads/images/${variant.image}`
                                                                                : '/images/nologo.png'
                                                                        }
                                                                        alt={variant?.shortName || styleItem.style}
                                                                        w={`${styleImageContainerWidth}px`}
                                                                        h={`${styleImageMaxHeight}px`}
                                                                        objectFit="contain"
                                                                        loading="lazy"
                                                                        fallbackSrc="/images/nologo.png"
                                                                        onError={(e) => {
                                                                            if (variant?.image && !e.target.dataset.fallbackTried) {
                                                                                e.target.dataset.fallbackTried = '1';
                                                                                e.target.src = `${api_url}/uploads/manufacturer_catalogs/${variant.image}`;
                                                                            } else {
                                                                                e.target.src = '/images/nologo.png';
                                                                            }
                                                                        }}
                                                                    />
                                                                </Box>
                                                                <Box
                                                                    mt={1.5}
                                                                    w="100%"
                                                                    maxW={`${styleImageContainerWidth}px`}
                                                                    px={2}
                                                                    py={1}
                                                                    borderRadius="sm"
                                                                    bg={styleItem.id === selectedStyleData?.id ? styleCardBgSelected : styleCardBgUnselected}
                                                                    borderWidth="1px"
                                                                    borderStyle="solid"
                                                                    borderColor={styleItem.id === selectedStyleData?.id ? styleCardBorderSelected : styleCardBorderUnselected}
                                                                    fontWeight={styleItem.id === selectedStyleData?.id ? '600' : 'normal'}
                                                                    textAlign="center"
                                                                >
                                                                    <Text fontSize="xs" mb={0} color={styleCardTextColor} noOfLines={1}>
                                                                        {styleItem.style}
                                                                    </Text>
                                                                    {styleItem.id === selectedStyleData?.id && (
                                                                        <Text fontSize="2xs" color={styleCardLabelColor} mt={0.5}>
                                                                            {t('proposalUI.styleComparison.currentStyle', 'Current Style')}
                                                                        </Text>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Box>
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
                <CatalogTable
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
            {isUserAdmin && (
                <Box mt={5} maxW="100%">
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
                            onChange={(e) => {
                                if (isUserAdmin) setCustomItemTaxable(e.target.checked);
                            }}
                            isDisabled={!isUserAdmin}
                            size="lg"
                        >
                            {t('proposalUI.custom.taxable')}
                        </Checkbox>
                        <Button
                            colorScheme="brand"
                            minW="80px"
                            onClick={handleAddCustomItem}
                        >
                            {t('proposalUI.custom.add')}
                        </Button>
                    </Stack>

                    {customItemError && (
                        <Text color={errorTextColor} mt={1} mb={4}>
                            {customItemError}
                        </Text>
                    )}

                    <Box display={{ base: 'none', lg: 'block' }}>
                        <TableCard>
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
                                    {customItems
                                        .filter((ci) => ci.selectVersion === selectVersion?.versionName)
                                        .map((item, idx) => (
                                            <Tr key={`${item.name}-${idx}`}>
                                                <Td>{idx + 1}</Td>
                                                <Td>{item.name}</Td>
                                                <Td>${(Number(item.price) || 0).toFixed(2)}</Td>
                                                <Td>{item.taxable ? t('common.yes') : t('common.no')}</Td>
                                                <Td>
                                                    <Button
                                                        size="xs"
                                                        colorScheme="red"
                                                        onClick={() => handleDeleteCustomItem(item)}
                                                    >
                                                        {t('proposalUI.custom.delete')}
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        ))}
                                </Tbody>
                            </Table>
                        </TableCard>
                    </Box>

                    <Box display={{ base: 'block', lg: 'none' }}>
                        {customItems && customItems.filter((ci) => ci.selectVersion === selectVersion?.versionName).length > 0 && (
                            <Flex
                                fontWeight="semibold"
                                color={colorGray600}
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

                        {customItems
                            ?.filter((ci) => ci.selectVersion === selectVersion?.versionName)
                            .map((item, idx) => (
                                <Flex
                                    key={`${item.name}-${idx}-mobile`}
                                    mb={2}
                                    py={2}
                                    px={2}
                                    borderBottom="1px solid"
                                    borderColor={borderGray}
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
                                        onClick={() => handleDeleteCustomItem(item)}
                                    >
                                        {t('proposalUI.custom.delete')}
                                    </Button>
                                </Flex>
                            ))}

                        {(!customItems ||
                            customItems.filter((ci) => ci.selectVersion === selectVersion?.versionName).length === 0) && (
                            <Text color={colorGray500} textAlign="center" py={3} fontSize="sm">
                                No custom items added yet
                            </Text>
                        )}
                    </Box>
                </Box>
            )}
            {pricingReady && (
                <Flex mt={5} mb={5} justify="center">
                    <TableCard cardProps={{ w: 'full', maxW: summaryTableMaxWidth }} containerProps={{ overflowX: 'auto' }}>
                        <Table variant="simple" size="sm">
                            <Tbody>
                                <Tr>
                                    <Th bg={bgGray50}>{t('proposalDoc.priceSummary.cabinets')}</Th>
                                    <Td textAlign="right" fontWeight="semibold">
                                        {money(selectedResult?.partsCents)}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg={bgGray50}>{t('proposalDoc.priceSummary.assembly')}</Th>
                                    <Td textAlign="right">
                                        {money(selectedResult?.assemblyCents)}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg={bgGray50}>{t('proposalDoc.priceSummary.modifications')}</Th>
                                    <Td textAlign="right">
                                        {money(selectedResult?.modsCents)}
                                    </Td>
                                </Tr>

                                <Tr bg={tableRowBg}>
                                    <Th>{t('proposalDoc.priceSummary.styleTotal')}</Th>
                                    <Td textAlign="right" fontWeight="semibold">
                                        {money(selectedResult?.subtotalBeforeDiscountCents)}
                                    </Td>
                                </Tr>

                                {isUserAdmin && (
                                    <Tr>
                                        <Th bg={bgGray50}>{t('proposalUI.summary.discountPct')}</Th>
                                        <Td textAlign="center">
                                            <NumberInput
                                                value={discountPercent}
                                                min={0}
                                                max={100}
                                                onChange={(valueString, valueNumber) => {
                                                    const computed = Number.isFinite(valueNumber)
                                                        ? valueNumber
                                                        : parseFloat(valueString) || 0;
                                                    const clamped = Math.max(0, Math.min(100, computed));
                                                    setDiscountPercent(clamped);
                                                }}
                                                w="60px"
                                                mx="auto"
                                                size="sm"
                                                variant="flushed"
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
                                    <Th bg={bgGray50}>{t('proposalDoc.priceSummary.total')}</Th>
                                    <Td textAlign="right">
                                        {money((selectedResult?.subtotalBeforeDiscountCents || 0) - (selectedResult?.discountCents || 0))}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg={bgGray50}>{t('settings.manufacturers.edit.deliveryFee')}</Th>
                                    <Td textAlign="right">
                                        {money(selectedResult?.deliveryCents)}
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg={bgGray50}>{t('proposalUI.summary.taxRate')}</Th>
                                    <Td textAlign="right">
                                        {(selectedResult?.taxRatePct ?? defaultTaxValue) || 0}%
                                    </Td>
                                </Tr>

                                <Tr>
                                    <Th bg={bgGray50}>{t('proposalDoc.priceSummary.tax')}</Th>
                                    <Td textAlign="right">
                                        {money(selectedResult?.taxCents)}
                                    </Td>
                                </Tr>

                                <Tr bg={tableTotalRowBg}>
                                    <Th>{t('proposalDoc.priceSummary.grandTotal')}</Th>
                                    <Td textAlign="right" fontWeight="bold">
                                        {money(selectedResult?.grandTotalCents)}
                                    </Td>
                                </Tr>
                            </Tbody>
                        </Table>
                    </TableCard>
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

export default ItemSelectionContent;

