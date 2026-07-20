"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    CircularProgress,
    TextField,
    InputAdornment,
    Tooltip,
} from "@mui/material";
import { ArrowBack, Visibility, Delete, Search, WhatsApp, Edit } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Quotation = {
    id: string;
    quote_number: string | null;
    customer_name: string;
    customer_phone: string | null;
    capacity_kw: number | null;
    total_amount: number | null;
    status: string;
    created_at: string;
    pdf_url?: string;
    form_data?: any;
};

export default function QuotationsAdminPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const router = useRouter();

    const fetchQuotations = async () => {
        try {
            const res = await fetch("/api/quotations?limit=1000");
            const data = await res.json();
            if (data.success) {
                setQuotations(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch quotations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quotation?")) return;

        try {
            const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                fetchQuotations();
            }
        } catch (error) {
            console.error("Failed to delete quotation:", error);
        }
    };

    const handleEdit = (quotation: Quotation) => {
        // Navigate to home page with edit parameter
        router.push(`/?edit=${quotation.id}`);
    };

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return "-";
        return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "draft":
                return "warning";
            case "saved":
                return "default";
            case "Printed":
                return "secondary";
            case "Emailed":
                return "info";
            case "WhatsApp Sent":
            case "sent":
                return "success";
            case "accepted":
                return "success";
            case "rejected":
            case "Failed Delivery":
                return "error";
            default:
                return "default";
        }
    };

    const filteredQuotations = quotations.filter((q) => {
        // Search query filter (Name, Phone, Quote Number)
        const matchesSearch =
            q.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.customer_phone?.includes(searchQuery);

        // Date filter
        const qDate = new Date(q.created_at).getTime();
        let matchesDate = true;
        if (startDate) {
            matchesDate = matchesDate && qDate >= new Date(startDate).getTime();
        }
        if (endDate) {
            // Add 1 day to end date to include the entire day
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            matchesDate = matchesDate && qDate <= end.getTime();
        }

        return matchesSearch && matchesDate;
    });

    return (
        <Box sx={{ p: 3, bgcolor: "#f5f7fa", minHeight: "100vh" }}>
            <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Link href="/admin">
                            <IconButton>
                                <ArrowBack />
                            </IconButton>
                        </Link>
                        <Typography variant="h4" fontWeight="bold">
                            Quotations
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                            size="small"
                            type="date"
                            label="Start Date"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <TextField
                            size="small"
                            type="date"
                            label="End Date"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <TextField
                            size="small"
                            placeholder="Search name, phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ width: 250 }}
                        />
                    </Box>
                </Box>

                {/* Status Legend */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3, alignItems: "center", bgcolor: "white", p: 2, borderRadius: 2, border: "1px solid #e2e8f0" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: "bold" }}>Status Guide:</Typography>
                    <Chip label="Draft" size="small" color="warning" />
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>Not saved</Typography>
                    
                    <Chip label="Saved" size="small" color="default" />
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>Only saved</Typography>
                    
                    <Chip label="Printed" size="small" color="secondary" />
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>Printed to PDF</Typography>
                    
                    <Chip label="Emailed" size="small" color="info" />
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>Sent via Email</Typography>
                    
                    <Chip label="WhatsApp Sent" size="small" color="success" />
                    <Typography variant="caption" color="text.secondary">Sent via WhatsApp</Typography>
                </Box>

                {/* Quotations Table */}
                <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredQuotations.length === 0 ? (
                            <Box sx={{ textAlign: "center", p: 4 }}>
                                <Typography color="text.secondary">
                                    {searchQuery ? "No quotations match your search." : "No quotations found."}
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                                            <TableCell sx={{ fontWeight: "bold" }}>Quote No.</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Customer</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Phone</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Capacity</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                                            <TableCell sx={{ fontWeight: "bold" }} align="center">
                                                Actions
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredQuotations.map((quotation) => (
                                            <TableRow key={quotation.id} hover>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {quotation.quote_number || "-"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{quotation.customer_name}</TableCell>
                                                <TableCell>{quotation.customer_phone || "-"}</TableCell>
                                                <TableCell>{quotation.capacity_kw ? `${quotation.capacity_kw} KW` : "-"}</TableCell>
                                                <TableCell>{formatCurrency(quotation.total_amount)}</TableCell>
                                                <TableCell>
                                                    <Chip label={quotation.status} size="small" color={getStatusColor(quotation.status) as any} />
                                                </TableCell>
                                                <TableCell>{formatDate(quotation.created_at)}</TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Edit & Re-send">
                                                        <IconButton size="small" color="primary" onClick={() => handleEdit(quotation)}>
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="View PDF">
                                                        <IconButton size="small" onClick={() => quotation.pdf_url ? window.open(quotation.pdf_url, '_blank') : alert('PDF not available for this quotation.')}>
                                                            <Visibility fontSize="small" color={quotation.pdf_url ? "primary" : "inherit"} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Send via WhatsApp">
                                                        <IconButton size="small" color="success">
                                                            <WhatsApp fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(quotation.id)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Summary */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {filteredQuotations.length} of {quotations.length} quotations
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
