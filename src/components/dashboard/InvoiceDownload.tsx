import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Purchase {
  id: string;
  template_name: string;
  price: number;
  purchased_at: string;
}

interface InvoiceDownloadProps {
  purchase: Purchase;
  userName: string;
  userEmail: string;
}

export const InvoiceDownload = ({ purchase, userName, userEmail }: InvoiceDownloadProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateInvoice = () => {
    setGenerating(true);
    try {
      const invoiceDate = new Date(purchase.purchased_at).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric",
      });
      const invoiceNo = `ALPM-${purchase.id.slice(0, 8).toUpperCase()}`;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 40px; }
    .invoice { max-width: 700px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #d4a853; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 800; color: #1a1a2e; }
    .brand span { color: #d4a853; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 24px; color: #d4a853; margin-bottom: 4px; }
    .invoice-title p { font-size: 13px; color: #666; }
    .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .details div { flex: 1; }
    .details h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; }
    .details p { font-size: 13px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #1a1a2e; color: #fff; text-align: left; padding: 12px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #1a1a2e; background: #f9f7f2; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    .footer p { font-size: 12px; color: #999; }
    .footer .brand-sm { font-weight: 700; color: #1a1a2e; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">Album <span>Plus</span></div>
      <div class="invoice-title">
        <h2>INVOICE</h2>
        <p>${invoiceNo}</p>
        <p>${invoiceDate}</p>
      </div>
    </div>

    <div class="details">
      <div>
        <h4>Bill To</h4>
        <p><strong>${userName}</strong></p>
        <p>${userEmail}</p>
      </div>
      <div style="text-align: right;">
        <h4>From</h4>
        <p><strong>Album Plus</strong></p>
        <p>albumplus.in</p>
        <p>support@albumplus.in</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${purchase.template_name}</td>
          <td style="text-align:center;">1</td>
          <td style="text-align:right;">${purchase.price === 0 ? "Free" : `₹${purchase.price.toLocaleString("en-IN")}`}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" style="text-align:right;">Total</td>
          <td style="text-align:right;">${purchase.price === 0 ? "Free" : `₹${purchase.price.toLocaleString("en-IN")}`}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p class="brand-sm" style="margin-top: 8px;">Album Plus — Professional Album Design Software</p>
      <p style="margin-top: 4px;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>`;

      // Open in new window for printing/saving as PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
      }

      toast({ title: "Invoice generated", description: "Print or save as PDF from the print dialog." });
    } catch {
      toast({ title: "Failed to generate invoice", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={generateInvoice}
      disabled={generating}
      className="gap-1.5 text-accent hover:text-accent hover:bg-accent/10"
    >
      <FileText size={14} />
      Invoice
    </Button>
  );
};
