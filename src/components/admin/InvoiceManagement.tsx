import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { invoiceApi } from '@/lib/api';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';

export const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await invoiceApi.listAll();
        setInvoices(data || []);
      } catch (err) {
        console.error('Failed to load invoices', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoices();
  }, []);

  // Generate invoice PDF similar to INV-2025-0001-ultra-clean.pdf
  const handleDownloadPdf = (invoice: any) => {
    if (!invoice) return;

    try {
      const doc = new jsPDF('p', 'pt', 'a4');

      const marginLeft = 40;
      let y = 40;

      const addLine = (text: string, options: { bold?: boolean; size?: number } = {}) => {
        const { bold = false, size = 10 } = options;
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.text(text, marginLeft, y);
        y += size + 4;
      };

      const addRight = (text: string, options: { bold?: boolean; size?: number } = {}) => {
        const { bold = false, size = 10 } = options;
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        const pageWidth = doc.internal.pageSize.getWidth();
        const textWidth = doc.getTextWidth(text);
        doc.text(text, pageWidth - marginLeft - textWidth, y);
      };

      const formatCurrency = (v?: number) => `Rs ${Number(v || 0).toFixed(2)}`;

      const invoiceNumber = invoice.invoiceNumber || 'INV-XXXX';
      const createdAt = invoice.createdAt ? new Date(invoice.createdAt) : new Date();
      const status = (invoice.status || 'paid').toUpperCase();

      // Header
      addLine('INVOICE', { bold: true, size: 18 });
      y += 4;
      addLine(`Invoice # ${invoiceNumber}`, { bold: true, size: 12 });
      addRight(
        createdAt.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
        { size: 10 },
      );
      y += 4;
      addLine(`Status ${status}`, { size: 10 });

      y += 16;

      // Platform address (hard-coded as in sample)
      addLine('G2, Win-Win Towers, Siddhi Vinayak Nagar, Madhapur, Hyderabad, Telangana 500081', {
        size: 9,
      });
      addLine('Phone: 095158 88515 • support@shelfmerch.com', { size: 9 });

      y += 20;

      // Order/Payment table (simplified)
      const orderId =
        invoice.orderId?.orderNumber ||
        invoice.orderId?._id?.slice(-8) ||
        invoice.orderId ||
        '—';
      const storeName = invoice.storeId?.storeName || '—';
      const paymentMethod = invoice.paymentDetails?.method?.toUpperCase() || 'UPI';
      const txnId = invoice.paymentDetails?.transactionId || `TXN-${invoice._id?.slice(-10)}`;

      addLine(`Order ID: ${orderId}`, { size: 10, bold: true });
      addLine(`Store: ${storeName}`, { size: 10 });
      y += 6;
      addLine(`Payment: ${paymentMethod}`, { size: 10 });
      addLine(`Txn ID: ${txnId}`, { size: 10 });

      y += 6;
      addLine('Currency: INR', { size: 10 });

      y += 24;

      // Billing section
      addLine('BILLING', { bold: true, size: 12 });
      y += 8;

      // Bill From
      addLine('Bill From', { bold: true, size: 10 });
      addLine('ShelfMerch (Platform)', { size: 9 });
      addLine('G2, Win-Win Towers, Siddhi Vinayak Nagar, Madhapur,', { size: 9 });
      addLine('Hyderabad, Telangana 500081', { size: 9 });
      addLine('support@shelfmerch.com • 095158 88515', { size: 9 });

      y += 12;

      // Bill To
      addLine('Bill To', { bold: true, size: 10 });
      const merchantName = invoice.merchantId?.name || 'Merchant';
      const merchantEmail = invoice.merchantId?.email || '';
      const merchantPhone = invoice.merchantId?.phone || '';
      const storeCity = invoice.storeId?.city || '';
      const storeState = invoice.storeId?.state || '';

      addLine(merchantName, { size: 9 });
      addLine([storeCity, storeState].filter(Boolean).join(', ') || '—', { size: 9 });
      addLine(
        [merchantEmail, merchantPhone].filter(Boolean).join(' • ') || merchantEmail || merchantPhone || '—',
        { size: 9 },
      );

      y += 20;

      // Items header
      addLine('ITEMS', { bold: true, size: 12 });
      y += 10;

      // Items table (quick layout with manual columns)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Description', marginLeft, y);
      doc.text('Qty', marginLeft + 260, y);
      doc.text('Unit Price', marginLeft + 300, y);
      doc.text('Amount', marginLeft + 380, y);
      y += 10;
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y, marginLeft + 430, y);
      y += 12;

      doc.setFont('helvetica', 'normal');
      const items = Array.isArray(invoice.items) ? invoice.items : [];

      let subtotal = 0;
      items.forEach((item: any) => {
        const descParts = [item.productName || 'Product'];
        if (item.variant) {
          descParts.push(`Variant: ${item.variant}`);
        }
        const desc = descParts.join('\n');
        const qty = item.quantity || 1;
        const unitPrice = item.productionCost || 0;
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        // Description (multi-line if needed)
        const descLines = doc.splitTextToSize(desc, 240);
        descLines.forEach((line: string, idx: number) => {
          doc.text(line, marginLeft, y + idx * 11);
        });

        doc.text(String(qty), marginLeft + 260, y);
        doc.text(formatCurrency(unitPrice), marginLeft + 300, y);
        doc.text(formatCurrency(lineTotal), marginLeft + 380, y);

        y += descLines.length * 11 + 4;
      });

      if (!items.length) {
        addLine('No line items', { size: 9 });
        y += 4;
      }

      y += 10;

      // Totals
      const shipping = invoice.shippingCost || 0;
      const tax = invoice.tax || 0;
      const total = invoice.totalAmount || subtotal + shipping + tax;

      const rightColX = marginLeft + 380;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      doc.text('Subtotal', rightColX - 80, y);
      doc.text(formatCurrency(subtotal), rightColX, y, { align: 'right' });
      y += 14;

      doc.text('Shipping', rightColX - 80, y);
      doc.text(formatCurrency(shipping), rightColX, y, { align: 'right' });
      y += 14;

      doc.text('Tax', rightColX - 80, y);
      doc.text(formatCurrency(tax), rightColX, y, { align: 'right' });
      y += 16;

      doc.setFont('helvetica', 'bold');
      doc.text('Total', rightColX - 80, y);
      doc.text(formatCurrency(total), rightColX, y, { align: 'right' });
      y += 24;

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('System-generated invoice • For billing queries: support@shelfmerch.com', marginLeft, y);

      doc.save(`${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate invoice PDF', err);
      toast.error('Failed to generate PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
    const invNum = inv.invoiceNumber || '';
    const merchantEmail = inv.merchantId?.email || '';
    return matchesStatus && (
      invNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchantEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    totalRevenue: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Fulfillment Invoices</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paid}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search by invoice # or merchant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-bold">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{invoice.merchantId?.name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{invoice.merchantId?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.storeId?.storeName || 'N/A'}</TableCell>
                    <TableCell className="font-semibold">₹{invoice.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Invoice Details - {selectedInvoice?.invoiceNumber}</DialogTitle>
                          </DialogHeader>
                          {selectedInvoice && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6 bg-muted/30 p-4 rounded-lg">
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase">Merchant</Label>
                                  <p className="font-semibold">{selectedInvoice.merchantId?.name}</p>
                                  <p className="text-sm text-muted-foreground">{selectedInvoice.merchantId?.email}</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase">Store/Order</Label>
                                  <p className="font-semibold">{selectedInvoice.storeId?.storeName}</p>
                                  {selectedInvoice.orderId && (
                                    <Link to={`/admin/orders/${selectedInvoice.orderId?._id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                      Order #{selectedInvoice.orderId?.orderNumber || selectedInvoice.orderId?._id?.slice(-6)}
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground uppercase">Date Generated</Label>
                                  <p className="font-medium mt-1">{new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-bold mb-2 block">Line Items</Label>
                                <div className="border rounded-md overflow-hidden text-sm">
                                  <Table>
                                    <TableHeader className="bg-muted/50">
                                      <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Base Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedInvoice.items?.map((item: any, idx: number) => (
                                        <tr key={idx} className="border-b last:border-0 h-10 px-4">
                                          <td className="px-4 font-medium">{item.productName}</td>
                                          <td className="px-4 text-center">{item.quantity}</td>
                                          <td className="px-4 text-right">₹{item.productionCost?.toFixed(2)}</td>
                                          <td className="px-4 text-right font-semibold">₹{(item.productionCost * item.quantity).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1.5 pt-4 border-t">
                                <div className="flex justify-between w-full max-w-[200px] text-sm">
                                  <span>Production:</span>
                                  <span>₹{selectedInvoice.productionCost?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between w-full max-w-[200px] text-sm">
                                  <span>Shipping:</span>
                                  <span>₹{selectedInvoice.shippingCost?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between w-full max-w-[200px] text-sm">
                                  <span>Tax:</span>
                                  <span>₹{selectedInvoice.tax?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between w-full max-w-[200px] font-bold text-lg text-primary border-t pt-2 mt-2">
                                  <span>Total:</span>
                                  <span>₹{selectedInvoice.totalAmount?.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadPdf(selectedInvoice)}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
