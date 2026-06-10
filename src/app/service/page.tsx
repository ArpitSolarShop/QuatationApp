"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box, Typography, TextField, Button, IconButton, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, Tooltip,
} from "@mui/material";
import {
  Add, Delete, Edit, Print, RestartAlt, ExpandMore, Person,
  AttachMoney, ListAlt, CleaningServices, Home,
} from "@mui/icons-material";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import {
  companies, defaultServiceItems, defaultServiceTerms,
  serviceGstRate, generateServiceRefNumber,
} from "@/lib/companyDetails";
import type { ServiceItem } from "@/lib/companyDetails";

export default function ServiceProposalBuilder() {
  const [selectedCompanyId, setSelectedCompanyId] = useState("krishnanuja");
  const company = useMemo(() => companies.find(c => c.id === selectedCompanyId) || companies[1] || companies[0], [selectedCompanyId]);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [proposalTitle, setProposalTitle] = useState("PROPOSAL FOR O&M SERVICES");

  const [items, setItems] = useState<ServiceItem[]>(JSON.parse(JSON.stringify(defaultServiceItems)));
  const [terms, setTerms] = useState<string[]>([...defaultServiceTerms]);
  const [gstRate, setGstRate] = useState(serviceGstRate);

  const [origin, setOrigin] = useState("");
  useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);

  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({ open: false, message: "", severity: "success" });
  const [editIdx, setEditIdx] = useState(-1);
  const [editTerm, setEditTerm] = useState("");

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `Service_Proposal_${clientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}` });

  const refNumber = useMemo(() => generateServiceRefNumber(company.id === "krishnanuja" ? "KRPL" : "ASS"), [company.id]);
  const currentDate = useMemo(() => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }).replace(/^(\d+)\s/, "$1 "), []);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.amount, 0), [items]);
  const gstAmount = useMemo(() => +(subtotal * gstRate / 100).toFixed(2), [subtotal, gstRate]);
  const grandTotal = useMemo(() => +(subtotal + gstAmount).toFixed(2), [subtotal, gstAmount]);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const updateItem = (idx: number, field: keyof ServiceItem, val: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = val;
    if (field === "rate" || field === "qty") {
      updated[idx].amount = parseFloat(updated[idx].qty) * (updated[idx].rate || 0);
      updated[idx].monthlyRate = +(updated[idx].amount / 12).toFixed(2);
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, { sno: items.length + 1, description: "", hsnSac: "998717", qty: "1", unit: "Year", rate: 0, amount: 0 }]);
  const deleteItem = (i: number) => setItems(items.filter((_, idx) => idx !== i).map((item, idx) => ({ ...item, sno: idx + 1 })));

  const handleReset = () => {
    setClientName(""); setClientPhone(""); setClientAddress("");
    setItems(JSON.parse(JSON.stringify(defaultServiceItems)));
    setTerms([...defaultServiceTerms]); setGstRate(serviceGstRate);
    setProposalTitle("PROPOSAL FOR O&M SERVICES");
  };

  const totalPages = 2;

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, height: { xs: "auto", md: "100vh" }, bgcolor: "#f1f5f9", overflow: { xs: "auto", md: "hidden" } }}>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-wrapper { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; margin: 0 !important; padding: 0 !important; visibility: visible !important; background: white !important; overflow: visible !important; }
          .print-page { visibility: visible !important; width: 210mm !important; max-width: 100% !important; padding: 15mm !important; margin: 0 auto !important; border: none !important; box-shadow: none !important; height: auto !important; min-height: 297mm !important; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          body, html { visibility: hidden; height: auto !important; overflow: visible !important; }
          .print-wrapper * { visibility: visible; }
        }
      `}</style>

      {/* LEFT PANEL */}
      <Box className="no-print" sx={{ width: { xs: "100%", md: 380 }, minWidth: { xs: "100%", md: 380 }, bgcolor: "white", borderRight: { md: "1px solid #e2e8f0" }, display: "flex", flexDirection: "column", overflow: "hidden", height: { xs: "auto", md: "100%" } }}>
        <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", bgcolor: "#0d47a1", color: "white" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: 16 }}>
              <CleaningServices sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} />Service Proposal
            </Typography>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" size="small" startIcon={<Home fontSize="small" />} sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" }, textTransform: "none", fontWeight: "bold" }}>Quotation</Button>
            </Link>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", p: 0 }}>
          {/* Company */}
          <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
            <FormControl fullWidth size="small">
              <InputLabel>Company</InputLabel>
              <Select value={selectedCompanyId} label="Company" onChange={(e) => setSelectedCompanyId(e.target.value)}>
                {companies.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Client Details */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44 }}>
              <Person sx={{ mr: 1, color: "#0d47a1", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#0d47a1">Client Details</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <TextField fullWidth label="Client / Company Name" value={clientName} onChange={(e) => setClientName(e.target.value)} required size="small" />
              <TextField fullWidth label="Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} size="small" />
              <TextField fullWidth label="Address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} size="small" multiline rows={2} />
              <TextField fullWidth label="Proposal Title" value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} size="small" />
            </AccordionDetails>
          </Accordion>

          {/* Service Items */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44 }}>
              <ListAlt sx={{ mr: 1, color: "#0d47a1", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#0d47a1">Service Items ({items.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1 }}>
              {items.map((item, i) => (
                <Box key={i} sx={{ p: 1, mb: 1, bgcolor: i % 2 === 0 ? "#f8fafc" : "white", borderRadius: 1, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold">Item {i + 1}</Typography>
                    <IconButton size="small" color="error" onClick={() => deleteItem(i)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                  </Box>
                  <TextField fullWidth label="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} size="small" sx={{ mb: 1 }} multiline />
                  <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                    <TextField label="HSN/SAC" value={item.hsnSac} onChange={(e) => updateItem(i, "hsnSac", e.target.value)} size="small" sx={{ flex: 1 }} />
                    <TextField label="Qty" value={item.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} size="small" sx={{ width: 60 }} />
                    <TextField label="Unit" value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} size="small" sx={{ width: 70 }} />
                  </Box>
                  <TextField fullWidth label="Rate (₹)" type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", parseFloat(e.target.value) || 0)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} size="small" />
                  {item.monthlyRate && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>Monthly: ₹{fmt(item.monthlyRate)}</Typography>}
                </Box>
              ))}
              <Button fullWidth variant="outlined" size="small" startIcon={<Add />} onClick={addItem} sx={{ mt: 1 }}>Add Service Item</Button>
            </AccordionDetails>
          </Accordion>

          {/* GST */}
          <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44 }}>
              <AttachMoney sx={{ mr: 1, color: "#0d47a1", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#0d47a1">Pricing</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
              <TextField label="GST Rate" type="number" value={gstRate} onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} size="small" />
              <Box sx={{ p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1, textAlign: "center" }}>
                <Typography variant="caption" sx={{ color: "#0d47a1", textTransform: "uppercase", fontWeight: 700 }}>Grand Total</Typography>
                <Typography variant="h5" fontWeight="900" color="#1b5e20">₹ {fmt(grandTotal)}</Typography>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Terms Editor */}
          <Accordion disableGutters sx={{ boxShadow: "none", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: "#f8fafc", minHeight: 44 }}>
              <ListAlt sx={{ mr: 1, color: "#0d47a1", fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight="bold" color="#0d47a1">Terms ({terms.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1 }}>
              {terms.map((t, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, p: 0.5, bgcolor: i % 2 === 0 ? "#f8fafc" : "white", borderRadius: 1, mb: 0.5 }}>
                  {editIdx === i ? (
                    <TextField fullWidth value={editTerm} onChange={(e) => setEditTerm(e.target.value)} size="small" multiline onBlur={() => { const u = [...terms]; u[i] = editTerm; setTerms(u); setEditIdx(-1); }} autoFocus />
                  ) : (
                    <Typography variant="caption" sx={{ flex: 1, cursor: "pointer" }} onClick={() => { setEditIdx(i); setEditTerm(t); }}>{i + 1}. {t.substring(0, 80)}...</Typography>
                  )}
                  <IconButton size="small" onClick={() => { setEditIdx(i); setEditTerm(t); }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setTerms(terms.filter((_, idx) => idx !== i))}><Delete sx={{ fontSize: 14 }} /></IconButton>
                </Box>
              ))}
              <Button fullWidth variant="outlined" size="small" startIcon={<Add />} onClick={() => setTerms([...terms, "New term"])} sx={{ mt: 1 }}>Add Term</Button>
            </AccordionDetails>
          </Accordion>
        </Box>

        {/* Actions */}
        <Box sx={{ p: 1.5, borderTop: "1px solid #e2e8f0", display: "flex", gap: 1 }}>
          <Tooltip title="Print Proposal"><Button variant="contained" size="small" startIcon={<Print />} onClick={() => handlePrint()} sx={{ flex: 1, bgcolor: "#0d47a1", "&:hover": { bgcolor: "#1565c0" } }}>Print</Button></Tooltip>
          <Tooltip title="Reset"><IconButton size="small" onClick={handleReset} color="error"><RestartAlt /></IconButton></Tooltip>
        </Box>
      </Box>

      {/* PREVIEW */}
      <Box className="print-wrapper" sx={{ flex: 1, overflow: "auto", p: { xs: 2, md: 3 }, display: "flex", justifyContent: "center", bgcolor: "#e2e8f0" }}>
        <Box ref={printRef} className="print-page" sx={{ width: "210mm", minHeight: "297mm", p: "15mm", bgcolor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontFamily: "'Segoe UI', sans-serif", fontSize: "11px", color: "#1e293b", boxSizing: "border-box" }}>

          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "4px solid #0d47a1", pb: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box component="img" src={origin ? `${origin}${company.logo}` : company.logo} alt="Logo" sx={{ maxHeight: 80 }} onError={(e: any) => { e.target.style.display = 'none'; }} />
              <Box>
                <Typography sx={{ fontSize: company.name.length > 25 ? "16px" : "24px", fontWeight: 900, color: "#0d47a1", letterSpacing: "-0.5px", lineHeight: 1.1, textTransform: "uppercase" }}>{company.name}</Typography>
                <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#64748b", mt: 0.5, letterSpacing: 1, textTransform: "uppercase" }}>{company.tagline}</Typography>
                <Box sx={{ fontSize: "9px", color: "#64748b", mt: 1 }}>
                  <Typography sx={{ color: "#0d47a1", fontWeight: 700, mb: 0.25, fontSize: "9px" }}>GSTIN: {company.gstin}{(company as any).cin ? ` | CIN: ${(company as any).cin}` : ''}</Typography>
                  <Typography sx={{ fontSize: "9px" }}><strong>Office:</strong> {company.headOffice}</Typography>
                  {(company as any).warehouse && <Typography sx={{ fontSize: "9px" }}><strong>Warehouse:</strong> {(company as any).warehouse}</Typography>}
                  <Typography sx={{ fontSize: "9px" }}>📞 +91 {company.phone}</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Box sx={{ bgcolor: "#0d47a1", color: "white", px: 2, py: 0.75, fontSize: "11px", fontWeight: 900, borderRadius: 1, mb: 1, textTransform: "uppercase", letterSpacing: 1 }}>Service Proposal</Box>
              <Typography sx={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>Date: {currentDate}</Typography>
              <Typography sx={{ fontSize: "10px", color: "#94a3b8" }}>Reference: {refNumber}</Typography>
            </Box>
          </Box>

          {/* Proposal Title */}
          <Box sx={{ textAlign: "center", mb: 3, py: 1.5, bgcolor: "#e3f2fd", borderRadius: 2, border: "1px solid #90caf9" }}>
            <Typography sx={{ fontSize: "16px", fontWeight: 900, color: "#0d47a1", textTransform: "uppercase", letterSpacing: 2 }}>{proposalTitle}</Typography>
          </Box>

          {/* Prepared For */}
          <Box className="avoid-break" sx={{ mb: 3, bgcolor: "#f8fafc", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
            <Typography sx={{ fontWeight: 700, color: "#0d47a1", mb: 1, textTransform: "uppercase", fontSize: "10px", letterSpacing: 1, borderBottom: "1px solid #e2e8f0", pb: 0.5 }}>Prepared For</Typography>
            <Typography sx={{ fontWeight: 900, color: "#1e40af", fontSize: "16px" }}>{clientName || "________________"}</Typography>
            {clientAddress && <Typography sx={{ color: "#475569", fontWeight: 500, fontSize: "11px", fontStyle: "italic", mt: 0.5 }}>{clientAddress}</Typography>}
            {clientPhone && <Typography sx={{ color: "#475569", fontWeight: 500, fontSize: "11px" }}>📞 {clientPhone}</Typography>}
          </Box>

          {/* Commercial Details */}
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 900, color: "#0d47a1", textTransform: "uppercase", fontSize: "11px", letterSpacing: 1, mb: 1, borderBottom: "2px solid #0d47a1", pb: 0.5, display: "inline-block" }}>Commercial Details</Typography>
          </Box>
          <Box sx={{ overflow: "hidden", borderRadius: 2, border: "1px solid #e2e8f0", mb: 3 }}>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#e3f2fd", color: "#0d47a1", borderBottom: "2px solid #90caf9" }}>
                  <th style={{ padding: "10px 8px", textAlign: "center", width: "40px" }}>S.No.</th>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>Description</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", width: "80px" }}>HSN/SAC</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", width: "40px" }}>Qty</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", width: "50px" }}>Unit</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", width: "110px" }}>Rate (INR)</th>
                  <th style={{ padding: "10px 8px", textAlign: "right", width: "110px" }}>Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700 }}>{item.sno}</td>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>
                      {item.description}
                      {item.monthlyRate ? <><br /><span style={{ fontSize: "9px", color: "#64748b" }}>(Monthly Rate: ₹{fmt(item.monthlyRate)})</span></> : null}
                    </td>
                    <td style={{ padding: "10px 8px", textAlign: "center", color: "#64748b" }}>{item.hsnSac}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 700 }}>{item.qty}</td>
                    <td style={{ padding: "10px 8px", textAlign: "center" }}>{item.unit}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600 }}>{fmt(item.rate)}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Totals */}
          <Box className="avoid-break" sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
            <Box sx={{ width: "50%", border: "1px solid #e2e8f0", borderRadius: 2, overflow: "hidden" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", p: "8px 12px", borderBottom: "1px solid #e2e8f0", bgcolor: "#f8fafc" }}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600 }}>Sub Total:</Typography>
                <Typography sx={{ fontSize: "11px", fontWeight: 700 }}>₹ {fmt(subtotal)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", p: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: "11px", fontWeight: 600 }}>{gstRate}% GST:</Typography>
                <Typography sx={{ fontSize: "11px", fontWeight: 700 }}>₹ {fmt(gstAmount)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", p: "10px 12px", bgcolor: "#0d47a1" }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 900, color: "white" }}>Grand Total:</Typography>
                <Typography sx={{ fontSize: "13px", fontWeight: 900, color: "white" }}>₹ {fmt(grandTotal)}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Terms & Conditions */}
          <Box className="avoid-break" sx={{ fontSize: "10px", borderTop: "1px solid #e2e8f0", pt: 2, mb: 3 }}>
            <Typography sx={{ fontWeight: 900, color: "#0d47a1", textTransform: "uppercase", mb: 1, letterSpacing: 1, fontSize: "11px" }}>Terms & Conditions</Typography>
            <Box component="ol" sx={{ pl: 2.5, color: "#475569", m: 0, "& li": { mb: 0.75, lineHeight: 1.5 } }}>
              {terms.map((term, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: term.replace(/^([^:]+):/, '<strong>$1:</strong>') }} />
              ))}
            </Box>
          </Box>

          {/* Footer / Page */}
          <Typography sx={{ fontSize: "9px", color: "#94a3b8", textAlign: "right", mb: 2 }}>Page: 1 of {totalPages}</Typography>

          {/* Signatures */}
          <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end", px: 2 }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography sx={{ fontSize: "10px", fontWeight: 700, color: "#1e3a5f", mb: 0.5 }}>Client Acceptance</Typography>
              <Box sx={{ width: 160, height: 60 }} />
              <Box sx={{ width: 160, height: 1, bgcolor: "#cbd5e1", mb: 0.5, mx: "auto" }} />
              <Typography sx={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Authorized Signatory</Typography>
              <Typography sx={{ fontSize: "9px", color: "#475569", fontWeight: 600 }}>{clientName || "Client"}</Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontSize: "14px", fontWeight: 900, color: "#0d47a1", mb: 0, textDecoration: "underline", textDecorationColor: "#0d47a1", textUnderlineOffset: 4 }}>For {company.name}</Typography>
              <Box component="img" src={origin ? `${origin}${(company as any).signature || '/signature.png'}` : ((company as any).signature || '/signature.png')} alt="Signature" sx={{ width: 200, height: 90, objectFit: "contain", display: "block", ml: "auto", my: 1 }} onError={(e: any) => e.target.style.display = 'none'} />
              <Box sx={{ width: 192, height: 1, bgcolor: "#cbd5e1", mb: 0.5, ml: "auto" }} />
              <Typography sx={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Authorized Signatory</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={notification.open} autoHideDuration={5000} onClose={() => setNotification(prev => ({ ...prev, open: false }))}><Alert severity={notification.severity}>{notification.message}</Alert></Snackbar>
    </Box>
  );
}
