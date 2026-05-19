"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  Print,
  Save,
  RestartAlt,
  SolarPower,
  BatteryChargingFull,
  SettingsInputComponent,
  Water,
  AdminPanelSettings,
  ExpandMore,
  Person,
  Settings,
  AttachMoney,
  ListAlt,
  WhatsApp,
  Email,
  AddCircle,
} from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import {
  companies,
  defaultTerms,
  defaultComponents,
  gstConfig,
  defaultSubsidy,
  getSubsidyForCapacity,
  calculateSavings,
  generateQuoteNumber,
} from "@/lib/companyDetails";
import type { QuotationComponent } from "@/types";

// System type configuration
const systemTypes = [
  { id: "On-grid", name: "On-grid", icon: <SolarPower fontSize="small" />, color: "#4CAF50" },
  { id: "Off-grid", name: "Off-grid", icon: <BatteryChargingFull fontSize="small" />, color: "#FF9800" },
  { id: "Hybrid", name: "Hybrid", icon: <SettingsInputComponent fontSize="small" />, color: "#2196F3" },
  { id: "VFD/Drive", name: "VFD/Drive", icon: <Water fontSize="small" />, color: "#9C27B0" },
];

// Panel types
const panelTypes = [
  { value: "Monoperc", label: "Monoperc" },
  { value: "Bifacial", label: "Bifacial" },
  { value: "Topcon", label: "Topcon" },
  { value: "Topcon Bifacial", label: "Topcon Bifacial" },
  { value: "HJT", label: "HJT" },
  { value: "DCR", label: "DCR" },
  { value: "NDCR", label: "NDCR" },
];

// Solar panel brands
const panelBrands = ["Adani", "Tata", "Waaree", "Reliance", "Premier", "Emvee", "Vikram Solar", "Goldi Solar", "RenewSys", "Jakson", "Longi", "Jinko", "Canadian Solar", "Other"];

// Inverter brands
const inverterBrands = ["Polycab", "Shakti", "Growatt", "Sungrow", "Huawei", "Deye", "Servotech", "Luminous", "GoodWe", "Solis", "Solax", "Sofar Solar", "Other"];

export default function QuotationBuilder() {
  // Company Selection
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0].id);
  const activeCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId) || companies[0], [selectedCompanyId]);

  // Customer Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  // System Configuration
  const [selectedSystemType, setSelectedSystemType] = useState("On-grid");
  const [capacityKw, setCapacityKw] = useState<number>(3);
  const [phase, setPhase] = useState<number>(1);

  // Panel Configuration
  const [panelWattage, setPanelWattage] = useState<number>(620);
  const [panelBrand, setPanelBrand] = useState("Adani");
  const [customPanelBrand, setCustomPanelBrand] = useState("");
  const [panelType, setPanelType] = useState("Monoperc");
  const [panelWarranty, setPanelWarranty] = useState("25 Years"); // New Warranty State
  const effectivePanelBrand = panelBrand === "Other" ? customPanelBrand : panelBrand;

  // Inverter Configuration
  const [inverterBrand, setInverterBrand] = useState("Polycab");
  const [customInverterBrand, setCustomInverterBrand] = useState("");
  const [inverterModel, setInverterModel] = useState("3 KW On-Grid String");
  const [inverterWarranty, setInverterWarranty] = useState("5 Years"); // New Warranty State
  const [batteryWarranty, setBatteryWarranty] = useState("5 Years"); // Battery Warranty State
  const [customBatteryWarranty, setCustomBatteryWarranty] = useState(""); // Custom Battery Warranty
  const effectiveBatteryWarranty = batteryWarranty === "Other" ? customBatteryWarranty : batteryWarranty;
  const [inverterModelEdited, setInverterModelEdited] = useState(false); // Track if user manually edited inverter model
  const effectiveInverterBrand = inverterBrand === "Other" ? customInverterBrand : inverterBrand;

  // Pricing
  const [priceInput, setPriceInput] = useState<number>(180000); // Now represents Price Included GST
  const [gstRate, setGstRate] = useState<number>(gstConfig.compositeRate);
  const [centralSubsidy, setCentralSubsidy] = useState<number>(defaultSubsidy.central);
  const [stateSubsidy, setStateSubsidy] = useState<number>(defaultSubsidy.state);

  // Extra Costs (Optional)
  const [extraStructureEnabled, setExtraStructureEnabled] = useState(false);
  const [extraStructureRate, setExtraStructureRate] = useState<number>(5); // Rate per watt

  const [extraPanelsEnabled, setExtraPanelsEnabled] = useState(false);
  const [extraPanelCount, setExtraPanelCount] = useState<number>(1);
  const [extraPanelPrice, setExtraPanelPrice] = useState<number>(15000); // Per panel price

  const [extraWireEnabled, setExtraWireEnabled] = useState(false);
  const [extraWireLength, setExtraWireLength] = useState<number>(10); // in meters
  const [extraWireRate, setExtraWireRate] = useState<number>(50); // Per meter rate

  // Components (Bill of Materials)
  const [components, setComponents] = useState<QuotationComponent[]>([]);
  const [terms, setTerms] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" | "warning" }>({ open: false, message: "", severity: "success" });
  const [editComponentDialog, setEditComponentDialog] = useState(false);
  const [editingComponent, setEditingComponent] = useState<QuotationComponent | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [addComponentDialog, setAddComponentDialog] = useState(false);
  const [newComponent, setNewComponent] = useState<QuotationComponent>({ name: "", description: "", quantity: "1 Nos", make: "Standard", sort_order: 0 });

  const printRef = useRef<HTMLDivElement>(null);

  // Calculate number of panels needed
  const numberOfPanels = useMemo(() => Math.ceil((capacityKw * 1000) / (panelWattage || 1)), [capacityKw, panelWattage]);
  const actualSystemSize = useMemo(() => +((numberOfPanels * (panelWattage || 0)) / 1000).toFixed(2), [numberOfPanels, panelWattage]);

  // Load default components when system type changes
  useEffect(() => {
    const defaults = defaultComponents[selectedSystemType as keyof typeof defaultComponents];
    if (defaults) {
      const updatedDefaults = defaults.map((c, i) => {
        if (i === 0) return { ...c, description: `${panelWattage}Wp (${panelType}) Modules`, quantity: `${numberOfPanels.toString().padStart(2, '0')} Nos`, make: effectivePanelBrand, sort_order: i };
        if (i === 1) return { ...c, description: inverterModel, make: effectiveInverterBrand, sort_order: i };
        return { ...c, sort_order: i };
      });
      setComponents(updatedDefaults);
    }
    const defaultTermsList = defaultTerms[selectedSystemType as keyof typeof defaultTerms];
    if (defaultTermsList) setTerms(defaultTermsList.slice(0, 8));
  }, [selectedSystemType, panelWattage, effectivePanelBrand, panelType, numberOfPanels, effectiveInverterBrand, inverterModel]);

  // Update inverter model when capacity changes (only if not manually edited)
  useEffect(() => {
    if (!inverterModelEdited) {
      const inverterCapacity = Math.max(1, Math.floor(capacityKw));
      setInverterModel(`${inverterCapacity} KW ${selectedSystemType} String`);
    }
  }, [capacityKw, selectedSystemType, inverterModelEdited]);

  // Handle Subsidy Logic: No subsidy for NDCR/Off-grid, capacity-based for others
  useEffect(() => {
    if (panelType === "NDCR" || selectedSystemType === "Off-grid") {
      setCentralSubsidy(0);
      setStateSubsidy(0);
    } else {
      // Use capacity-based subsidy: ≤2 KW = ₹60,000 central, ≥3 KW = ₹78,000 central
      const subsidy = getSubsidyForCapacity(capacityKw);
      setCentralSubsidy(subsidy.central);
      setStateSubsidy(subsidy.state);
    }
  }, [panelType, selectedSystemType, capacityKw]);

  // Calculate extra costs
  const extraCosts = useMemo(() => {
    const structureCost = extraStructureEnabled ? (actualSystemSize * 1000 * extraStructureRate) : 0;
    const panelsCost = extraPanelsEnabled ? (extraPanelCount * extraPanelPrice) : 0;
    const wireCost = extraWireEnabled ? (extraWireLength * extraWireRate) : 0;
    return { structureCost, panelsCost, wireCost, total: structureCost + panelsCost + wireCost };
  }, [extraStructureEnabled, extraStructureRate, actualSystemSize, extraPanelsEnabled, extraPanelCount, extraPanelPrice, extraWireEnabled, extraWireLength, extraWireRate]);

  // Calculate GST and totals (Reverse calculation from Inclusive Price)
  const calculations = useMemo(() => {
    // Reverse calculate base price from the input (which is GST inclusive)
    // Formula: Inclusive = Base * (1 + Rate)  =>  Base = Inclusive / (1 + Rate)
    const derivedBasePrice = priceInput / (1 + gstRate / 100);

    // Add extra costs (assuming they act as taxable base additions) to the derived base
    const totalTaxableValue = derivedBasePrice + extraCosts.total;

    const gstAmount = +(totalTaxableValue * (gstRate / 100)).toFixed(2);
    const totalAmount = +(totalTaxableValue + gstAmount).toFixed(2);

    const savings = calculateSavings(actualSystemSize, totalAmount, centralSubsidy, stateSubsidy);
    const effectiveCost = Math.max(0, totalAmount - centralSubsidy - stateSubsidy);

    return {
      basePrice: totalTaxableValue, // This is the total taxable base used for calculation
      originalBasePrice: derivedBasePrice, // This is the base price of the system only
      extraCostsTotal: extraCosts.total,
      gstRate,
      gstAmount,
      totalAmount,
      ...savings,
      effectiveCost,
      systemPriceIncGst: priceInput // Keep track of the input
    };
  }, [priceInput, extraCosts.total, gstRate, actualSystemSize, centralSubsidy, stateSubsidy]);

  const quoteNumber = useMemo(() => {
    if (!customerName) return "";
    const initials = customerName.split(" ").map((n) => n.charAt(0).toUpperCase()).join("");
    return generateQuoteNumber(initials);
  }, [customerName]);

  const currentDate = useMemo(() => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }), []);

  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Quotation_${customerName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}` });

  const handleEditComponent = (index: number) => { setEditingComponent({ ...components[index] }); setEditingIndex(index); setEditComponentDialog(true); };
  const handleSaveComponentEdit = () => { if (editingComponent && editingIndex >= 0) { const updated = [...components]; updated[editingIndex] = editingComponent; setComponents(updated); } setEditComponentDialog(false); setEditingComponent(null); setEditingIndex(-1); };
  const handleDeleteComponent = (index: number) => setComponents(components.filter((_, i) => i !== index));
  const handleAddComponent = () => { if (newComponent.name) { setComponents([...components, { ...newComponent, sort_order: components.length }]); setNewComponent({ name: "", description: "", quantity: "1 Nos", make: "Standard", sort_order: 0 }); setAddComponentDialog(false); } };

  const handleReset = () => { setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); setCapacityKw(3); setPhase(1); setPanelWattage(620); setPanelBrand("Adani"); setPriceInput(180000); setInverterModel("3 KW On-Grid String"); setInverterModelEdited(false); };

  const saveToDatabase = async () => {
    if (!customerName) return;
    try {
      await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          system_type_name: selectedSystemType,
          capacity_kw: actualSystemSize,
          phase,
          brand: effectivePanelBrand,
          base_price: calculations.basePrice,
          gst_rate: gstRate,
          central_subsidy: centralSubsidy,
          state_subsidy: stateSubsidy,
          terms,
          components,
          salesperson: activeCompany.authorizedSignatory
        })
      });
      console.log("Quotation auto-saved to database");
    } catch (error) {
      console.error("Auto-save failed", error);
    }
  };

  // Get quotation data for sharing
  const getQuotationData = () => ({
    customerName,
    systemSize: actualSystemSize,
    panelBrand: effectivePanelBrand,
    panelWattage,
    panelType,
    inverterModel,
    totalAmount: calculations.totalAmount,
    effectiveCost: calculations.effectiveCost,
    centralSubsidy,
    stateSubsidy
  });

  // WhatsApp handler - generates PDF, uploads to Supabase, sends via DoubleTick
  const handleSendWhatsApp = async () => {
    if (!customerName) { setNotification({ open: true, message: "Customer name is required", severity: "error" }); return; }
    if (!customerPhone) { setNotification({ open: true, message: "Customer phone is required for WhatsApp", severity: "error" }); return; }

    setLoading(true);
    setNotification({ open: true, message: "Generating PDF and sending to WhatsApp...", severity: "info" });

    try {
      // Prepare quote data for PDF generation
      const quoteData = {
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress || ""
        },
        selectedProduct: {
          systemType: selectedSystemType,
          capacity: actualSystemSize,
          phase: phase,
          panelBrand: effectivePanelBrand,
          panelWattage: panelWattage,
          panelType: panelType,
          panelWarranty: panelWarranty,
          inverterBrand: inverterModel,
          inverterWarranty: inverterWarranty,
          batteryWarranty: effectiveBatteryWarranty,
        },
        calculations: {
          basePrice: calculations.originalBasePrice,
          extraCosts: extraCosts.total,
          subtotal: calculations.basePrice,
          gstAmount: calculations.gstAmount,
          total: calculations.totalAmount,
          discount: 0,
          grandTotal: calculations.totalAmount,
          centralSubsidy,
          stateSubsidy,
          effectiveCost: calculations.effectiveCost
        },
        savings: calculations,
        taxRate: gstRate / 100,
        components,
        terms,
        companyDetails: activeCompany
      };

      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData)
      });

      const result = await response.json();

      if (response.ok) {
        saveToDatabase(); // Auto-save
        setNotification({ open: true, message: "Quotation PDF sent to WhatsApp successfully!", severity: "success" });
      } else {
        throw new Error(result.message || "Failed to send WhatsApp");
      }
    } catch (error: any) {
      console.error("WhatsApp error:", error);
      setNotification({ open: true, message: error.message, severity: "error" });
    }
    finally { setLoading(false); }
  };



  // Email handler
  const [customerEmail, setCustomerEmail] = useState("");
  const handleSendEmail = async () => {
    const emailToUse = customerEmail || prompt("Enter customer email address:");
    if (!emailToUse) { setNotification({ open: true, message: "Email address is required", severity: "error" }); return; }
    if (customerEmail !== emailToUse) setCustomerEmail(emailToUse);

    setLoading(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, quotationData: getQuotationData() })
      });
      const result = await response.json();
      if (result.success) {
        if (result.useMailto) {
          window.open(result.mailtoLink, "_blank");
          setNotification({ open: true, message: "Email client opened with quotation details", severity: "success" });
        } else {
          setNotification({ open: true, message: "Email sent successfully!", severity: "success" });
        }
      } else throw new Error(result.message || "Failed to send email");
    } catch (error: any) { setNotification({ open: true, message: error.message, severity: "error" }); }
    finally { setLoading(false); }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, height: { xs: "auto", md: "100vh" }, bgcolor: "#f1f5f9", overflow: { xs: "auto", md: "hidden" } }}>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          
          /* Wrapper resets body/container layout */
          .print-wrapper { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            visibility: visible !important;
            background: white !important;
            overflow: visible !important;
          }

          /* The actual A4 Page - Keep formatting! */
          .print-page { 
            visibility: visible !important;
            width: 210mm !important;
            max-width: 100% !important;
            padding: 15mm !important; 
            margin: 0 auto !important;
            border: none !important; 
            box-shadow: none !important;
            height: auto !important;
            min-height: 297mm !important;
          }

          /* Smart Page Breaks */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }

          body, html { 
            visibility: hidden; 
            height: auto !important; 
            overflow: visible !important; 
          }
          
          .print-wrapper * { visibility: visible; }
        }
      `}</style>
      {/* LEFT EDIT PANEL */}
      <Box className="no-print" sx={{ width: { xs: "100%", md: 380 }, minWidth: { xs: "100%", md: 380 }, bgcolor: "white", borderRight: { xs: "none", md: "1px solid #e2e8f0" }, borderBottom: { xs: "1px solid #e2e8f0", md: "none" }, display: "flex", flexDirection: "column", overflow: "hidden", height: { xs: "auto", md: "100%" } }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", bgcolor: "#1e3a5f", color: "white" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 16 }}>
              <SolarPower sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} />
              Quotation Builder
            </Typography>
            <Link href="/admin">
              <IconButton size="small" sx={{ color: "white" }}><AdminPanelSettings fontSize="small" /></IconButton>
            </Link>
          </Box>
        </Box>

        {/* Scrollable Form */}
        <Box sx={{ flex: 1, overflow: "auto", p: 0 }}>
          {/* Company Selection */}
          <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select value={selectedCompanyId} label="Company" onChange={(e) => setSelectedCompanyId(e.target.value)}>
                {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* System Type */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <SolarPower sx={{ mr: 1, color: "#1e3a5f", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#1e3a5f">System Type</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {systemTypes.map((type) => (
                  <Chip
                    key={type.id}
                    label={type.name}
                    icon={type.icon}
                    onClick={() => setSelectedSystemType(type.id)}
                    variant={selectedSystemType === type.id ? "filled" : "outlined"}
                    sx={{ bgcolor: selectedSystemType === type.id ? type.color : "transparent", color: selectedSystemType === type.id ? "white" : "inherit", "& .MuiChip-icon": { color: selectedSystemType === type.id ? "white" : type.color } }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Customer Details */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <Person sx={{ mr: 1, color: "#1e3a5f", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#1e3a5f">Customer Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <TextField fullWidth label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required size="small" />
              <TextField fullWidth label="Mobile Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} size="small" />
              <TextField fullWidth label="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} size="small" multiline rows={2} />
            </AccordionDetails>
          </Accordion>

          {/* System Configuration */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <Settings sx={{ mr: 1, color: "#1e3a5f", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#1e3a5f">System Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label="Capacity (KW)" type="number" value={capacityKw} onChange={(e) => setCapacityKw(e.target.value === "" ? 0 : parseFloat(e.target.value))} inputProps={{ step: 0.1, min: 0 }} size="small" sx={{ flex: 1 }} />
                <TextField label="Wattage (Wp)" type="number" value={panelWattage} onChange={(e) => setPanelWattage(e.target.value === "" ? 0 : parseInt(e.target.value))} inputProps={{ step: 5, min: 0 }} size="small" sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label="Panels" value={numberOfPanels} InputProps={{ readOnly: true }} size="small" sx={{ flex: 1, "& input": { fontWeight: "bold", color: "#1e3a5f" } }} />
                <TextField label="Actual (KW)" value={actualSystemSize} InputProps={{ readOnly: true }} size="small" sx={{ flex: 1, "& input": { fontWeight: "bold", color: "#1e3a5f" } }} />
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Brand</InputLabel>
                  <Select value={panelBrand} label="Brand" onChange={(e) => setPanelBrand(e.target.value)}>
                    {panelBrands.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Type</InputLabel>
                  <Select value={panelType} label="Type" onChange={(e) => setPanelType(e.target.value)}>
                    {panelTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              {panelBrand === "Other" && <TextField fullWidth label="Custom Brand" value={customPanelBrand} onChange={(e) => setCustomPanelBrand(e.target.value)} size="small" />}
              <Box sx={{ display: "flex", gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Inverter</InputLabel>
                  <Select value={inverterBrand} label="Inverter" onChange={(e) => setInverterBrand(e.target.value)}>
                    {inverterBrands.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Phase</InputLabel>
                  <Select value={phase} label="Phase" onChange={(e) => setPhase(Number(e.target.value))}>
                    <MenuItem value={1}>1Φ</MenuItem>
                    <MenuItem value={3}>3Φ</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {inverterBrand === "Other" && <TextField fullWidth label="Custom Inverter Brand" value={customInverterBrand} onChange={(e) => setCustomInverterBrand(e.target.value)} size="small" />}

              <TextField 
                fullWidth 
                label="Inverter Model (Wattage/Capacity)" 
                value={inverterModel} 
                onChange={(e) => {
                  setInverterModel(e.target.value);
                  setInverterModelEdited(true); // Mark as manually edited
                }}
                size="small"
                placeholder="e.g., 5 KW On-Grid String"
              />

              <Box sx={{ display: "flex", gap: 1 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Panel Warranty</InputLabel>
                  <Select value={panelWarranty} label="Panel Warranty" onChange={(e) => setPanelWarranty(e.target.value)}>
                    <MenuItem value="25 Years">25 Years</MenuItem>
                    <MenuItem value="30 Years">30 Years</MenuItem>
                    <MenuItem value="10 Years">10 Years</MenuItem>
                    <MenuItem value="12 Years">12 Years</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                {panelWarranty === "Other" && <TextField label="Custom Panel Warranty" size="small" sx={{ flex: 1 }} onChange={(e) => setPanelWarranty(e.target.value)} />}

                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel>Inverter Warranty</InputLabel>
                  <Select value={inverterWarranty} label="Inverter Warranty" onChange={(e) => setInverterWarranty(e.target.value)}>
                    <MenuItem value="5 Years">5 Years</MenuItem>
                    <MenuItem value="7 Years">7 Years</MenuItem>
                    <MenuItem value="8 Years">8 Years</MenuItem>
                    <MenuItem value="10 Years">10 Years</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                {inverterWarranty === "Other" && <TextField label="Custom Inverter Warranty" size="small" sx={{ flex: 1 }} onChange={(e) => setInverterWarranty(e.target.value)} />}
              </Box>

              {(selectedSystemType === "Hybrid" || selectedSystemType === "Off-grid") && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Battery Warranty</InputLabel>
                    <Select value={batteryWarranty} label="Battery Warranty" onChange={(e) => setBatteryWarranty(e.target.value)}>
                      <MenuItem value="1 Year">1 Year</MenuItem>
                      <MenuItem value="2 Years">2 Years</MenuItem>
                      <MenuItem value="3 Years">3 Years</MenuItem>
                      <MenuItem value="4 Years">4 Years</MenuItem>
                      <MenuItem value="5 Years">5 Years</MenuItem>
                      <MenuItem value="6 Years">6 Years</MenuItem>
                      <MenuItem value="7 Years">7 Years</MenuItem>
                      <MenuItem value="8 Years">8 Years</MenuItem>
                      <MenuItem value="10 Years">10 Years</MenuItem>
                      <MenuItem value="12 Years">12 Years</MenuItem>
                      <MenuItem value="Other">Other (Custom)</MenuItem>
                    </Select>
                  </FormControl>
                  {batteryWarranty === "Other" && (
                    <TextField
                      label="Custom Battery Warranty"
                      size="small"
                      sx={{ flex: 1 }}
                      placeholder="e.g. 15 Years"
                      value={customBatteryWarranty}
                      onChange={(e) => setCustomBatteryWarranty(e.target.value)}
                    />
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Pricing */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <AttachMoney sx={{ mr: 1, color: "#1e3a5f", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#1e3a5f">Pricing</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <TextField fullWidth label="System Price (Incl. GST)" type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" />
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label="GST Rate" type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} size="small" sx={{ flex: 1 }} />
                <TextField label="GST Amount" value={`₹ ${formatCurrency(calculations.gstAmount)}`} InputProps={{ readOnly: true }} size="small" sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField label="Central Subsidy" type="number" value={centralSubsidy} onChange={(e) => setCentralSubsidy(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" sx={{ flex: 1 }} />
                <TextField label="State Subsidy" type="number" value={stateSubsidy} onChange={(e) => setStateSubsidy(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ p: 1.5, bgcolor: "#dbeafe", borderRadius: 1, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#1e40af", textTransform: "uppercase", fontWeight: 700 }}>Effective Cost</Typography>
                <Typography variant="h5" fontWeight="900" color="#16a34a">₹ {formatCurrency(calculations.effectiveCost)}</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Extra Costs (Optional) */}
          <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#fef3c7", minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <AddCircle sx={{ mr: 1, color: "#d97706", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#92400e">
                Extra Costs {extraCosts.total > 0 && <Chip size="small" label={`₹${formatCurrency(extraCosts.total)}`} sx={{ ml: 1, height: 18, bgcolor: "#fbbf24", color: "#78350f", fontSize: "10px" }} />}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              {/* Extra Structure Cost */}
              <Box sx={{ p: 1.5, bgcolor: extraStructureEnabled ? "#fef3c7" : "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={extraStructureEnabled} onChange={(e) => setExtraStructureEnabled(e.target.checked)} />}
                  label={<Typography variant="body2" fontWeight="bold">Extra Structure Cost</Typography>}
                />
                {extraStructureEnabled && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center" }}>
                    <TextField label="Rate/Watt" type="number" value={extraStructureRate} onChange={(e) => setExtraStructureRate(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" sx={{ width: 100 }} />
                    <Typography variant="caption" color="text.secondary">× {actualSystemSize * 1000}W =</Typography>
                    <Typography variant="body2" fontWeight="bold" color="#d97706">₹{formatCurrency(extraCosts.structureCost)}</Typography>
                  </Box>
                )}
              </Box>

              {/* Extra Panels Cost */}
              <Box sx={{ p: 1.5, bgcolor: extraPanelsEnabled ? "#fef3c7" : "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={extraPanelsEnabled} onChange={(e) => setExtraPanelsEnabled(e.target.checked)} />}
                  label={<Typography variant="body2" fontWeight="bold">Extra Panels</Typography>}
                />
                {extraPanelsEnabled && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField label="Qty" type="number" value={extraPanelCount} onChange={(e) => setExtraPanelCount(e.target.value === "" ? 0 : parseInt(e.target.value))} inputProps={{ min: 0 }} size="small" sx={{ width: 70 }} />
                    <Typography variant="caption">×</Typography>
                    <TextField label="Price/Panel" type="number" value={extraPanelPrice} onChange={(e) => setExtraPanelPrice(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" sx={{ width: 110 }} />
                    <Typography variant="caption">=</Typography>
                    <Typography variant="body2" fontWeight="bold" color="#d97706">₹{formatCurrency(extraCosts.panelsCost)}</Typography>
                  </Box>
                )}
              </Box>

              {/* Extra Wire Cost */}
              <Box sx={{ p: 1.5, bgcolor: extraWireEnabled ? "#fef3c7" : "#f8fafc", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={extraWireEnabled} onChange={(e) => setExtraWireEnabled(e.target.checked)} />}
                  label={<Typography variant="body2" fontWeight="bold">Extra Wire</Typography>}
                />
                {extraWireEnabled && (
                  <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField label="Length (m)" type="number" value={extraWireLength} onChange={(e) => setExtraWireLength(e.target.value === "" ? 0 : parseFloat(e.target.value))} inputProps={{ min: 0 }} size="small" sx={{ width: 90 }} />
                    <Typography variant="caption">×</Typography>
                    <TextField label="Rate/m" type="number" value={extraWireRate} onChange={(e) => setExtraWireRate(e.target.value === "" ? 0 : parseFloat(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" sx={{ width: 100 }} />
                    <Typography variant="caption">=</Typography>
                    <Typography variant="body2" fontWeight="bold" color="#d97706">₹{formatCurrency(extraCosts.wireCost)}</Typography>
                  </Box>
                )}
              </Box>

              {extraCosts.total > 0 && (
                <Box sx={{ p: 1, bgcolor: "#fbbf24", borderRadius: 1, textAlign: "center" }}>
                  <Typography variant="caption" fontWeight="bold" color="#78350f">Total Extra: ₹{formatCurrency(extraCosts.total)}</Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Components */}
          <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44, "& .MuiAccordionSummary-content": { my: 0.5 } }}>
              <ListAlt sx={{ mr: 1, color: "#1e3a5f", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#1e3a5f">Components ({components.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {components.map((comp, index) => (
                  <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.75, bgcolor: index % 2 === 0 ? "#f8fafc" : "white", borderRadius: 1, fontSize: 12 }}>
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                      <Typography variant="caption" fontWeight="bold" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comp.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{comp.quantity}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleEditComponent(index)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteComponent(index)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                  </Box>
                ))}
              </Box>
              <Button fullWidth variant="outlined" size="small" startIcon={<Add />} onClick={() => setAddComponentDialog(true)} sx={{ mt: 1 }}>Add Component</Button>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ p: 1.5, borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Print Quotation">
              <Button variant="contained" size="small" startIcon={<Print />} onClick={() => { saveToDatabase(); handlePrint(); }} sx={{ flex: 1, bgcolor: "#eab308", "&:hover": { bgcolor: "#ca8a04" } }}>Print</Button>
            </Tooltip>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Send via WhatsApp">
              <Button variant="contained" size="small" startIcon={<WhatsApp />} onClick={handleSendWhatsApp} disabled={loading} sx={{ flex: 1, bgcolor: "#25D366", "&:hover": { bgcolor: "#128C7E" } }}>WhatsApp</Button>
            </Tooltip>
            <Tooltip title="Send via Email">
              <Button variant="contained" size="small" startIcon={<Email />} onClick={handleSendEmail} disabled={loading} sx={{ flex: 1, bgcolor: "#EA4335", "&:hover": { bgcolor: "#C5221F" } }}>Email</Button>
            </Tooltip>
            <Tooltip title="Reset Form">
              <IconButton size="small" onClick={handleReset} color="error"><RestartAlt /></IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* CENTER PREVIEW */}
      <Box className="print-wrapper" sx={{ flex: 1, width: "100%", overflow: "auto", p: { xs: 2, md: 3 }, display: "flex", justifyContent: "center", bgcolor: "#e2e8f0" }}>
        <Box ref={printRef} className="print-page" sx={{ width: "210mm", minHeight: "297mm", p: "15mm", bgcolor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontFamily: "'Segoe UI', sans-serif", fontSize: "11px", color: "#1e293b", boxSizing: "border-box" }}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "4px solid #eab308", pb: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box component="img" src={origin ? `${origin}${activeCompany.logo}` : activeCompany.logo} alt="Logo" sx={{ maxHeight: 80 }} onError={(e: any) => { e.target.style.display = 'none'; }} />
              <Box>
                <Typography sx={{ fontSize: activeCompany.name.length > 25 ? "18px" : "26px", fontWeight: 900, color: "#1e3a5f", letterSpacing: "-0.5px", lineHeight: 1, textTransform: "uppercase" }}>{activeCompany.name}</Typography>
                <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#64748b", mt: 0.5, letterSpacing: 1, textTransform: "uppercase" }}>{activeCompany.tagline}</Typography>
                <Box sx={{ fontSize: "10px", color: "#64748b", mt: 1 }}>
                  <Typography sx={{ color: "#1d4ed8", fontWeight: 700, mb: 0.25, fontSize: "10px" }}>GSTIN: {activeCompany.gstin}{activeCompany.cin ? ` | CIN: ${activeCompany.cin}` : ''}</Typography>
                  <Typography sx={{ fontSize: "10px" }}><strong>HO:</strong> {activeCompany.headOffice}</Typography>
                  {activeCompany.warehouse && <Typography sx={{ fontSize: "10px" }}><strong>WH:</strong> {activeCompany.warehouse}</Typography>}
                  <Typography sx={{ fontSize: "10px" }}><strong>Contact:</strong> {activeCompany.phone}{activeCompany.email ? ` | Email: ${activeCompany.email}` : ''}</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Box sx={{ bgcolor: "#eab308", color: "white", px: 2, py: 0.75, fontSize: "16px", fontWeight: 900, borderRadius: 1, mb: 1, textTransform: "uppercase", letterSpacing: 2 }}>Quotation</Box>
              <Typography sx={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Date: {currentDate}</Typography>
              {quoteNumber && <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>Quote No: {quoteNumber}</Typography>}
            </Box>
          </Box>

          {/* Customer & System Overview */}
          <Box className="avoid-break" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <Typography sx={{ fontWeight: 700, color: "#1e3a5f", mb: 1, textTransform: "uppercase", fontSize: "10px", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", pb: 0.5 }}>Customer Details</Typography>
              <Typography sx={{ fontWeight: 900, color: "#1e40af", fontSize: "16px", wordBreak: "break-word" }}>{customerName || "________________"}</Typography>
              {customerAddress && <Typography sx={{ color: "#475569", fontWeight: 500, fontSize: "11px", fontStyle: "italic", wordBreak: "break-word" }}>{customerAddress}</Typography>}
              {customerPhone && <Typography sx={{ color: "#475569", fontWeight: 500, fontSize: "11px" }}>Mo No: {customerPhone}</Typography>}
            </Box>
            <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <Typography sx={{ fontWeight: 700, color: "#1e3a5f", mb: 1, textTransform: "uppercase", fontSize: "10px", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", pb: 0.5 }}>System Overview</Typography>
              <Box sx={{ fontSize: "11px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}><span>System Size:</span> <strong>{actualSystemSize} KW ({phase === 1 ? "Single Phase" : "Three Phase"})</strong></Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25, wordBreak: "break-word" }}><span>Modules:</span> <strong style={{ textAlign: "right", maxWidth: "60%" }}>{effectivePanelBrand} {panelWattage}Wp ({panelType})</strong></Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25, color: "#475569" }}><span>Module Warranty:</span> <strong>{panelWarranty}</strong></Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25, wordBreak: "break-word" }}><span>Inverter:</span> <strong style={{ textAlign: "right", maxWidth: "60%" }}>{effectiveInverterBrand} {inverterModel}</strong></Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25, color: "#475569" }}><span>Inverter Warranty:</span> <strong>{inverterWarranty}</strong></Box>
                {(selectedSystemType === "Hybrid" || selectedSystemType === "Off-grid") && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25, color: "#475569" }}><span>Battery Warranty:</span> <strong>{effectiveBatteryWarranty}</strong></Box>
                )}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Type:</span> <strong>{selectedSystemType}</strong></Box>
              </Box>
            </Box>
          </Box>

          {/* Components Table */}
          <Box sx={{ overflow: "hidden", borderRadius: 2, border: "1px solid #e2e8f0", mb: 3 }}>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", color: "#1e3a5f", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 6px", textAlign: "center", width: "30px" }}>S.N</th>
                  <th style={{ padding: "10px 6px", textAlign: "left", width: "25%" }}>Components</th>
                  <th style={{ padding: "10px 6px", textAlign: "left" }}>Description</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", width: "60px" }}>Qty</th>
                  <th style={{ padding: "10px 6px", textAlign: "center", width: "80px" }}>Make</th>
                </tr>
              </thead>
              <tbody>
                {components.map((comp, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 1 ? "#f8fafc80" : "white", borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700 }}>{index + 1}</td>
                    <td style={{ padding: "8px 6px", fontWeight: 700, color: "#1e293b" }}>{comp.name}</td>
                    <td style={{ padding: "8px 6px", color: index < 2 ? "#1e293b" : "#475569" }}>{comp.description}</td>
                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700 }}>{comp.quantity}</td>
                    <td style={{ padding: "8px 6px", textAlign: "center", fontWeight: 700, color: "#1e40af" }}>{comp.make}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>



          {/* Pricing & Subsidy */}
          <Box className="avoid-break" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              {calculations.totalSubsidy > 0 && (
                <Box sx={{ bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", p: 2, borderRadius: 2, mb: 2 }}>
                  <Typography sx={{ fontWeight: 900, color: "#166534", fontSize: "10px", textTransform: "uppercase", mb: 1, letterSpacing: 1 }}>PM Surya Ghar Subsidy</Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "12px", py: 0.5, borderBottom: "1px solid #bbf7d0" }}><span>Central Subsidy:</span><strong>₹ {formatCurrency(centralSubsidy)}/-</strong></Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "12px", py: 0.5, borderBottom: "1px solid #bbf7d0" }}><span>State Subsidy:</span><strong>₹ {formatCurrency(stateSubsidy)}/-</strong></Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "14px", pt: 1.5, fontWeight: 900, color: "#166534", textTransform: "uppercase" }}><span>Total Benefit:</span><span style={{ fontSize: "18px" }}>₹ {formatCurrency(calculations.totalSubsidy)}/-</span></Box>
                </Box>
              )}
              <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", p: 2, borderRadius: 2, fontSize: "10px" }}>
                <Typography sx={{ fontWeight: 900, color: "#1e3a5f", textTransform: "uppercase", mb: 1, borderBottom: "1px solid #bfdbfe", pb: 0.5 }}>Bank Details</Typography>
                <p style={{ margin: "4px 0" }}><strong>A/c Name:</strong> {activeCompany.bank.accountName}</p>
                {activeCompany.bank.accountNumber && <p style={{ margin: "4px 0" }}><strong>A/c No:</strong> {activeCompany.bank.accountNumber} | <strong>IFSC:</strong> {activeCompany.bank.ifsc}</p>}
                {activeCompany.bank.name && <p style={{ margin: "4px 0" }}><strong>Bank:</strong> {activeCompany.bank.name}{activeCompany.bank.branch ? `, ${activeCompany.bank.branch}` : ''}</p>}
                <Box sx={{ mt: 1.5, pt: 1, borderTop: "1px dashed #cbd5e1", textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 700, color: "#1e3a5f", fontSize: "10px", mb: 0.5 }}>Scan to Pay</Typography>
                  <a href={`upi://pay?pa=${activeCompany.bank.upiId}&pn=${encodeURIComponent(activeCompany.name)}&am=${calculations.totalAmount}&cu=INR`} style={{ textDecoration: "none" }}>
                    <Box component="img" src={origin ? `${origin}/payment.png` : "/payment.png"} alt="Payment QR" sx={{ width: 100, height: 100, objectFit: "contain", mixBlendMode: "multiply", mx: "auto", display: "block", cursor: "pointer" }} onError={(e: any) => e.target.style.display = 'none'} />
                  </a>
                  <Typography sx={{ fontSize: "8px", color: "#64748b", mt: 0.25 }}>Click or Scan with UPI App</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ bgcolor: "#f8fafc", p: 2.5, borderRadius: 2, border: "1px solid #bfdbfe" }}>
              <Typography sx={{ fontWeight: 700, color: "#1e3a5f", fontSize: "10px", textTransform: "uppercase", mb: 1.5, letterSpacing: 1, borderBottom: "1px solid #bfdbfe", pb: 0.5 }}>Investment Summary</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "11px", py: 0.3, color: "#64748b" }}><span>Base Price:</span><span>₹ {formatCurrency(calculations.originalBasePrice)}</span></Box>
              {extraCosts.structureCost > 0 && <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "11px", py: 0.3, color: "#d97706" }}><span>+ Extra Structure:</span><span>₹ {formatCurrency(extraCosts.structureCost)}</span></Box>}
              {extraCosts.panelsCost > 0 && <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "11px", py: 0.3, color: "#d97706" }}><span>+ Extra Panels ({extraPanelCount}):</span><span>₹ {formatCurrency(extraCosts.panelsCost)}</span></Box>}
              {extraCosts.wireCost > 0 && <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "11px", py: 0.3, color: "#d97706" }}><span>+ Extra Wire ({extraWireLength}m):</span><span>₹ {formatCurrency(extraCosts.wireCost)}</span></Box>}
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "11px", py: 0.3, color: "#64748b", borderBottom: "1px solid #e2e8f0", pb: 0.75, mb: 0.5 }}><span>GST (@ {gstRate}%):</span><span>₹ {formatCurrency(calculations.gstAmount)}</span></Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 900, color: "#1e3a5f", pt: 1 }}><span style={{ fontSize: "11px", textTransform: "uppercase" }}>Total Amount:</span><span style={{ color: "#1e40af" }}>₹ {formatCurrency(calculations.totalAmount)}</span></Box>
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "#dbeafe", border: "1px solid #93c5fd", borderRadius: 1.5, textAlign: "center" }}>
                <Typography sx={{ fontSize: "9px", color: "#1e40af", textTransform: "uppercase", fontWeight: 900, letterSpacing: 1, mb: 0.5 }}>{calculations.totalSubsidy > 0 ? "Effective Cost After Subsidy" : "Effective Cost"}</Typography>
                <Typography sx={{ fontSize: "24px", fontWeight: 900, color: "#16a34a", letterSpacing: "-1px" }}>₹ {formatCurrency(calculations.effectiveCost)}*</Typography>
              </Box>
            </Box>
          </Box>


          {/* Savings Table */}
          <Box sx={{ overflow: "hidden", mb: 3 }}>
            <Typography sx={{ fontWeight: 700, color: "#1e3a5f", fontSize: "10px", textTransform: "uppercase", mb: 1, letterSpacing: 1, borderBottom: "1px solid #e2e8f0", pb: 0.5 }}>Breakdown of Savings & Financials</Typography>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", color: "#64748b" }}>
                  <th style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0", width: "40px" }}>S.No</th>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Content</th>
                  <th style={{ padding: "8px", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>Amount / Details</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>1</td><td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>Proposed Solar Plant Size</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>{actualSystemSize} KW</td></tr>
                <tr><td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>2</td><td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>Annual Units Generation (approx.)</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>{calculations.annualUnits} Units</td></tr>
                <tr><td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>3</td><td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}>Average Grid Electricity Rate</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", borderBottom: "1px solid #e2e8f0" }}>Rs. 6.5 / Unit</td></tr>
                <tr><td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>4</td><td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}><strong>Annual Savings</strong></td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", color: "#16a34a", borderBottom: "1px solid #e2e8f0" }}>Rs. {formatCurrency(calculations.annualSavings)}</td></tr>
                <tr style={{ backgroundColor: "#f0fdf4" }}><td style={{ padding: "8px", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>5</td><td style={{ padding: "8px", borderBottom: "1px solid #e2e8f0" }}><strong>Subsidy Applicable</strong> (Central + State)</td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", color: "#166534", borderBottom: "1px solid #e2e8f0" }}>Total: ₹ {formatCurrency(calculations.totalSubsidy)}</td></tr>
                <tr><td style={{ padding: "8px", textAlign: "center" }}>6</td><td style={{ padding: "8px" }}><strong>Return on Investment (ROI)</strong></td><td style={{ padding: "8px", textAlign: "right", fontWeight: "bold", color: "#ea580c" }}>{calculations.roiYears} Years</td></tr>
              </tbody>
            </table>
          </Box>

          {/* Terms */}
          <Box className="avoid-break" sx={{ fontSize: "10px", borderTop: "1px solid #e2e8f0", pt: 2 }}>
            <Typography sx={{ fontWeight: 900, color: "#1e293b", textTransform: "uppercase", mb: 1, letterSpacing: 1 }}>Terms and Conditions</Typography>
            <Box component="ul" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 32px", pl: 2, color: "#64748b", m: 0 }}>
              {terms.map((term, i) => <li key={i} dangerouslySetInnerHTML={{ __html: term.replace(/^([^:]+):/, '<strong>$1:</strong>') }} />)}
            </Box>
          </Box>

          {/* Signature */}
          <Box sx={{ mt: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-end", px: 2 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box sx={{ width: 160, height: 1, bgcolor: "#cbd5e1", mb: 0.5, mx: "auto" }} />
              <Typography sx={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Customer Signature</Typography>
            </Box>
            <Box sx={{ textAlign: "right", position: "relative" }}>
              <Typography sx={{ fontSize: "14px", fontWeight: 900, color: "#1e3a5f", mb: 0, textDecoration: "underline", textDecorationColor: "#eab308", textUnderlineOffset: 4 }}>For Arpit Solar Shop</Typography>
              <Box component="img" src={origin ? `${origin}/signature.png` : "/signature.png"} alt="Authorized Signatory" sx={{ width: 120, height: 60, objectFit: "contain", display: "block", ml: "auto", my: 1 }} onError={(e: any) => e.target.style.display = 'none'} />
              <Box sx={{ width: 192, height: 1, bgcolor: "#cbd5e1", mb: 0.5, ml: "auto" }} />
              <Typography sx={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Authorized Signatory</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Edit Component Dialog */}
      <Dialog open={editComponentDialog} onClose={() => setEditComponentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Component</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField fullWidth label="Component Name" value={editingComponent?.name || ""} onChange={(e) => setEditingComponent((prev) => prev && { ...prev, name: e.target.value })} />
          <TextField fullWidth label="Description" value={editingComponent?.description || ""} onChange={(e) => setEditingComponent((prev) => prev && { ...prev, description: e.target.value })} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="Quantity" value={editingComponent?.quantity || ""} onChange={(e) => setEditingComponent((prev) => prev && { ...prev, quantity: e.target.value })} />
            <TextField fullWidth label="Make" value={editingComponent?.make || ""} onChange={(e) => setEditingComponent((prev) => prev && { ...prev, make: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setEditComponentDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleSaveComponentEdit}>Save</Button></DialogActions>
      </Dialog>

      {/* Add Component Dialog */}
      <Dialog open={addComponentDialog} onClose={() => setAddComponentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Component</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <TextField fullWidth label="Component Name" value={newComponent.name} onChange={(e) => setNewComponent((prev) => ({ ...prev, name: e.target.value }))} />
          <TextField fullWidth label="Description" value={newComponent.description} onChange={(e) => setNewComponent((prev) => ({ ...prev, description: e.target.value }))} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField fullWidth label="Quantity" value={newComponent.quantity} onChange={(e) => setNewComponent((prev) => ({ ...prev, quantity: e.target.value }))} />
            <TextField fullWidth label="Make" value={newComponent.make} onChange={(e) => setNewComponent((prev) => ({ ...prev, make: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setAddComponentDialog(false)}>Cancel</Button><Button variant="contained" onClick={handleAddComponent}>Add</Button></DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={5000} onClose={() => setNotification((prev) => ({ ...prev, open: false }))}><Alert severity={notification.severity}>{notification.message}</Alert></Snackbar>
    </Box>
  );
}
