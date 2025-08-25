import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CFormCheck, CFormSwitch } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilHome, cilBrush, cilChevronLeft, cilChevronRight } from '@coreui/icons';
import ModificationModal from '../components/model/ModificationModal'
import { useDispatch, useSelector } from 'react-redux';
import { fetchTaxes } from '../store/slices/taxSlice';
import CatalogTable from './CatalogTable';
import axiosInstance from '../helpers/axiosInstance';
import { setTableItems as setTableItemsRedux } from '../store/slices/selectedVersionSlice';
import { setSelectVersionNew } from '../store/slices/selectVersionNewSlice';
import { isAdmin } from '../helpers/permissions';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const ItemSelectionContent = ({ selectVersion, selectedVersion, formData, setFormData, setSelectedVersion }) => {
    const { t } = useTranslation();
    const api_url = import.meta.env.VITE_API_URL;
    const dispatch = useDispatch();
    const [selectedStyleData, setSelectedStyleData] = useState(null);
    const [tableItems, setTableItems] = useState([]);
    const [addOnTop, setAddOnTop] = useState(false);
    const [groupEnabled, setGroupEnabled] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const collections = selectVersion?.manufacturerData?.collectionsstyles || [];
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
    const isUserAdmin = isAdmin(authUser);
    const [customItemError, setCustomItemError] = useState('');
    const [itemModificationID, setItemModificationID] = useState('');
    const [modificationItems, setModificationItems] = useState('');
    const [userGroupMultiplier, setUserGroupMultiplier] = useState(1.0);



    const filteredItems = tableItems.filter(item =>
        typeof item.code === 'string' && item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        typeof item.description === 'string' && item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );





    const [fetchedCollections, setFetchedCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(true);
    const [carouselCurrentIndex, setCarouselCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4); // Desktop default
    useEffect(() => {
        if (selectVersion) {
            dispatch(setSelectVersionNew(selectVersion));
        }
    }, [selectVersion]);

    // Fetch user group multiplier on mount
    useEffect(() => {
        const fetchUserMultiplier = async () => {
            try {
                const response = await axiosInstance.get('/api/user/multiplier', { headers: getAuthHeaders() });
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

    const updateManufacturerData = () => {
        try {
            const cabinetPartsTotal = filteredItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
            const customItemsTotal = customItems.reduce((sum, item) => sum + item.price, 0);
            const modificationsTotal = totalModificationsCost;
            // Respect per-row assembly toggle; only count rows with includeAssemblyFee when assembled
            const assemblyFeeTotal = isAssembled
                ? filteredItems.reduce((sum, item) => {
                    const unitFee = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
                    const qty = Number(item?.qty || 1);
                    return sum + unitFee * qty;
                }, 0)
                : 0;
            const styleTotal = cabinetPartsTotal + assemblyFeeTotal + customItemsTotal + modificationsTotal;
            const cabinets = customItems?.reduce((sum, item) => sum + item.price, 0) +
                filteredItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0)
            const discountAmount = (styleTotal * discountPercent) / 100;
            const totalAfterDiscount = styleTotal - discountAmount;
            const taxAmount = (totalAfterDiscount * defaultTaxValue) / 100;
            const grandTotal = totalAfterDiscount + taxAmount;

            const updatedManufacturersData = formData.manufacturersData.map(manufacturer => {
                if (manufacturer.versionName === selectVersion?.versionName) {
                    const matchedCustomItems = customItems.filter(
                        (item) => item.selectVersion === selectVersion?.versionName
                    );
                    const matchedItems = filteredItems.filter(
                        (item) => item.selectVersion === selectVersion?.versionName
                    );
                    return {
                        ...manufacturer,
                        selectedStyle: selectVersion?.selectedStyle,
                        items: matchedItems,
                        customItems: matchedCustomItems,
                        summary: {
                            cabinets: parseFloat((Number(cabinets) || 0).toFixed(2)),
                            // Use the correctly computed assemblyFeeTotal
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
                }
                return manufacturer;
            });

            setFormData(prev => ({
                ...prev,
                manufacturersData: updatedManufacturersData
            }));
        } catch (error) {
            console.log("err::::::", error)
        }
    };

    useEffect(() => {
        updateManufacturerData();
    }, [tableItems, customItems, discountPercent, isAssembled]);

    useEffect(() => {
        dispatch(fetchTaxes());
    }, [dispatch]);


    useEffect(() => {
        const fetchCollections = async () => {
            const manufacturerId = selectVersion?.manufacturerData?.id;
            if (!manufacturerId) {
                return; // Don't make API call if no manufacturer ID
            }
            
            setCollectionsLoading(true);
            try {
                const response = await axiosInstance.get(`/api/manufacturers/${manufacturerId}/styleswithcatalog`, {
                    headers: getAuthHeaders()
                });
                setFetchedCollections(response.data); // Adjust based on actual structure
            } catch (error) {
                console.error('Error fetching styles with catalog:', error);
            } finally {
                setCollectionsLoading(false);
            }
        };

        fetchCollections();
    }, [selectVersion?.manufacturerData?.id]);

    // Handle responsive items per page
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 767) {
                setItemsPerPage(2); // Mobile: 2 items per page
            } else if (window.innerWidth <= 992) {
                setItemsPerPage(3); // Tablet: 3 items per page
            } else {
                setItemsPerPage(4); // Desktop: 4 items per page
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
        const uniqueStyles = Array.from(
            new Map(fetchedCollections.map(item => [item.style, item])).values()
        );
        const maxIndex = Math.max(0, uniqueStyles.length - itemsPerPage);
        setCarouselCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = () => {
        setCarouselCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    const canGoNext = () => {
        const uniqueStyles = Array.from(
            new Map(fetchedCollections.map(item => [item.style, item])).values()
        );
        return carouselCurrentIndex < uniqueStyles.length - itemsPerPage;
    };

    const canGoPrev = () => {
        return carouselCurrentIndex > 0;
    };


    const defaultTax = taxes.find(tax => tax.isDefault);
    const defaultTaxValue = parseFloat(defaultTax?.value || '0');

    useEffect(() => {
        if (selectVersion?.selectedStyle && collections.length) {
            const match = fetchedCollections.find(col => col.id === selectVersion.selectedStyle);
            setSelectedStyleData(match);
        }
    }, [selectVersion]);

    const handleDelete = (index) => {
        setTableItems(prev => {
            const updatedItems = prev.filter((_, i) => i !== index);
            dispatch(setSelectVersionNew(updatedItems)); // Update Redux as well
            return updatedItems;
        });
    };

    const handleCatalogSelect = (e) => {
        const code = e.target.value;
        const item = fetchedCollections.find(cd => `${cd.code} -- ${cd.description}` === code);
        if (item) {
            const basePrice = Number(item.price) || 0;
            const assemblyCost = item.styleVariantsAssemblyCost;
            let assemblyFee = 0;

            if (assemblyCost) {
                const feePrice = parseFloat(assemblyCost.price || 0);
                const feeType = assemblyCost.type;

                if (feeType === 'flat' || feeType === 'fixed') {
                    assemblyFee = feePrice;
                } else if (feeType === 'percentage') {
                    // percentage based on base price, not multiplied price
                    assemblyFee = (basePrice * feePrice) / 100;
                }
            }
            const multipliedPrice = basePrice * Number(userGroupMultiplier || 1);
            const qty = 1;
            const total = multipliedPrice * qty + assemblyFee * qty;
            const newItem = {
                id: item.id,
                code: item.code,
                description: item.description,
                qty,
                originalPrice: basePrice,
                appliedMultiplier: Number(userGroupMultiplier || 1),
                price: multipliedPrice,
                assemblyFee,
                total,
                selectVersion: selectVersion?.versionName
            };

            setTableItems(prev => {
                const updatedItems = addOnTop ? [newItem, ...prev] : [...prev, newItem];
                dispatch(setTableItemsRedux(updatedItems));  // Send the full list to Redux
                return updatedItems;
            });

        }
    };

    const updateQty = (index, newQty) => {
        setTableItems(prev => {
            if (newQty < 1) return prev;
            const updated = prev.map((item, i) => {
                if (i !== index) return item;
                return {
                    ...item,
                    qty: newQty,
                    total: newQty * Number(item.price || 0) + (Number(item.includeAssemblyFee ? item.assemblyFee || 0 : 0) * newQty),
                };
            });
            dispatch(setTableItemsRedux(updated)); // Sync Redux
            return updated;
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
            setTableItems(updatedTableItems);
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
        { id: 1, name: "Modification A" }
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
            const styleData = collections.find(c => c.id === newStyleId);
            setSelectedStyleData(styleData);
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
        const updatedItems = [...tableItems];
        const item = updatedItems[index];

        const newAssemblyFee = isChecked ? Number(item.assemblyFee || 0) : 0;
        const qty = Number(item.qty || 1);
        const newHinge = isChecked ? (item.hingeSide === "N/A" ? "" : item.hingeSide) : "N/A";
        const newExposed = isChecked ? (item.exposedSide === "N/A" ? "" : item.exposedSide) : "N/A";

        updatedItems[index] = {
            ...item,
            includeAssemblyFee: isChecked,
            isRowAssembled: isChecked,
            hingeSide: newHinge,
            exposedSide: newExposed,
            total: qty * Number(item.price || 0) + (newAssemblyFee * qty),
        };

        setTableItems(updatedItems);
        dispatch(setTableItemsRedux(updatedItems));
    };

    const updateHingeSide = (index, selectedSide) => {
        setTableItems(prevItems => {
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
        setTableItems(prevItems => {
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

    useEffect(() => {
        let nextUpdated = null;
        setTableItems(prevItems => {
            const updated = prevItems.map(item => {
                // Force includeAssemblyFee to follow global assembled toggle
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
            dispatch(setTableItemsRedux(nextUpdated));
        }
    }, [isAssembled]);

    // Apply multiplier to existing table items when loaded (idempotent)
    useEffect(() => {
        if (!tableItems?.length) return;
        if (!userGroupMultiplier || userGroupMultiplier === 1) return;
        const updated = tableItems.map((item) => {
            const prevApplied = Number(item.appliedMultiplier || 0) || null;
            const currentPrice = Number(item.price) || 0;
            const base = item.originalPrice != null
                ? Number(item.originalPrice)
                : prevApplied && prevApplied > 0
                    ? currentPrice / prevApplied
                    : currentPrice;
            const price = Number(base) * Number(userGroupMultiplier || 1);
            const unitAssembly = item?.includeAssemblyFee ? Number(item?.assemblyFee || 0) : 0;
            const qty = Number(item?.qty || 1);
            return {
                ...item,
                originalPrice: item.originalPrice != null ? item.originalPrice : base,
                appliedMultiplier: Number(userGroupMultiplier || 1),
                price,
                total: qty * price + unitAssembly * qty,
            };
        });
        setTableItems(updated);
        // Dispatch after local state update; effect runs post-render
        dispatch(setTableItemsRedux(updated));
    }, [userGroupMultiplier]);


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
                        <div style={{ minWidth: '250px', flex: '0 0 auto' }}>
                            <h5>{t('proposalUI.currentStyle')}</h5>
                            <div className="d-flex gap-4 align-items-start mt-3">
                                <div style={{ width: '100px' }}>
                                    <img
                                        src={
                                            selectedStyleData.styleVariants?.[0]?.image
                                                ? `${api_url}/uploads/manufacturer_catalogs/${selectedStyleData.styleVariants[0].image}`
                                                : "/images/nologo.png"
                                        }
                                        alt="Selected Style"
                                        style={{
                                            width: '110%',
                                            height: '240px',
                                            objectFit: 'contain',
                                            borderRadius: '10px',
                                            backgroundColor: '#f8f9fa',
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
                                            onChange={(e) => setIsAssembled(e.target.checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                width: '1px',
                                backgroundColor: '#ccc',
                                marginInline: '16px',
                            }}
                        />

                        <div style={{ flex: 1 }} className="other-styles-mobile">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0">{t('proposalUI.otherStyles')}</h5>
                                {/* Carousel controls */}
                                <div className="d-flex gap-2">
                                    <button
                                        className={`btn btn-outline-secondary btn-sm ${!canGoPrev() ? 'disabled' : ''}`}
                                        onClick={prevSlide}
                                        disabled={!canGoPrev()}
                                        style={{ padding: '0.25rem 0.5rem' }}
                                    >
                                        <CIcon icon={cilChevronLeft} size="sm" />
                                    </button>
                                    <button
                                        className={`btn btn-outline-secondary btn-sm ${!canGoNext() ? 'disabled' : ''}`}
                                        onClick={nextSlide}
                                        disabled={!canGoNext()}
                                        style={{ padding: '0.25rem 0.5rem' }}
                                    >
                                        <CIcon icon={cilChevronRight} size="sm" />
                                    </button>
                                </div>
                            </div>
                            <div
                                style={{
                                    maxHeight: '300px',
                                    overflowY: 'hidden',
                                    paddingRight: '8px',
                                }}
                            >

                                {collectionsLoading ? (
                                    <div className="py-4 text-muted">{t('proposalUI.loadingStyles')}</div>
                                ) : fetchedCollections.length === 0 ? (
                                    <div className="py-4 text-muted">{t('proposalUI.noStyles')}</div>
                                ) : (
                                    <div className="styles-carousel-container">
                                        <div 
                                            className="styles-carousel-track"
                                            style={{
                                                display: 'flex',
                                                gap: '1rem',
                                                transform: `translateX(-${carouselCurrentIndex * (100 / itemsPerPage)}%)`,
                                                transition: 'transform 0.3s ease-in-out',
                                                width: `${(Array.from(new Map(fetchedCollections.map(item => [item.style, item])).values()).length / itemsPerPage) * 100}%`
                                            }}
                                        >
                                            {Array.from(
                                                new Map(
                                                    fetchedCollections.map(item => [item.style, item]) // Deduplicate by `style`
                                                ).values()
                                            ).map((styleItem, index) => {
                                                const variant = styleItem.styleVariants?.[0]; // First variant (for image)

                                                return (
                                                    <div
                                                        key={`style-${styleItem.id}-${index}`}
                                                        className="style-carousel-item text-center"
                                                        style={{ 
                                                            minWidth: `calc(${100 / itemsPerPage}% - 0.75rem)`,
                                                            cursor: 'pointer',
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                        onClick={() => handleStyleSelect(styleItem.id)}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
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
                                                                height: '220px',
                                                                objectFit: 'contain',
                                                                borderRadius: '10px',
                                                                backgroundColor: '#f8f9fa',
                                                                border: styleItem.id === selectedStyleData?.id ? '3px solid #1a73e8' : '1px solid #e9ecef',
                                                            }}
                                                        />
                                                        <div
                                                            className="mt-2 p-2 rounded"
                                                            style={{
                                                                backgroundColor: styleItem.id === selectedStyleData?.id ? '#d0e6ff' : '#ffffff',
                                                                border: styleItem.id === selectedStyleData?.id ? '2px solid #1a73e8' : '1px solid #ced4da',
                                                                fontWeight: styleItem.id === selectedStyleData?.id ? '600' : 'normal',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                                {styleItem.style}
                                                            </div>
                                                            <strong style={{ color: '#28a745' }}>${styleItem.price}</strong>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
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
                            {selectVersion?.customItems?.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td>{item.name}</td>
                                    <td>${(Number(item.price) || 0).toFixed(2)}</td>

                                    <td>{item.taxable ? t('common.yes') : t('common.no')}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-danger text-white"
                                            onClick={() => handleDeleteCustomItem(idx)}
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

            {/* Totals Summary */}
            <div className="mt-5 mb-5 d-flex justify-content-center totals-summary-mobile">
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

            <ModificationModal
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

export default ItemSelectionContent;
