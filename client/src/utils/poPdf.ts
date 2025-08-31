// src/utils/poPdf.ts
import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import dayjs from 'dayjs';

// Keep in sync with your app types
export type POItem = {
  id?: number;
  itemNo?: number;
  product?: string;
  description?: string;
  uom?: string;
  deliveryDate?: string;          // 'YYYY-MM-DD'
  qtyOrdered?: number;
  qty?: number;                   // legacy
  netPrice?: number;
  price?: number;                 // legacy
  storageLocation?: string;
  prReference?: string;
  poReference?: string;
};

export type PurchaseOrderLike = {
  id: number;
  number: string;
  vendor?: string;
  status?: string;
  total?: number;
  // header (common)
  documentDate?: string;          // 'YYYY-MM-DD'
  supplierCode?: string;
  currency?: string;
  paymentTerms?: string;
  plantLocation?: string;

  items?: POItem[];
};

const currency = (n: number | undefined, code?: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n as number) ? (n as number) : 0);

const num = (v: any) => (Number.isFinite(+v) ? +v : 0);

export function exportPurchaseOrderPDF(po: PurchaseOrderLike, {
  logoDataUrl, // optional Base64 logo (e.g., PNG/JPG)
}: { logoDataUrl?: string } = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const marginY = 40;

  // Header: Logo + Title + PO number
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', marginX, marginY, 120, 40); } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  const title = 'Purchase Order';
  doc.text(title, pageWidth - marginX - doc.getTextWidth(title), marginY + 14);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const rightTop = [
    `PO #: ${po.number || '-'}`,
    `Status: ${po.status || 'draft'}`,
    `Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`,
  ];
  rightTop.forEach((t, i) =>
    doc.text(t, pageWidth - marginX - doc.getTextWidth(t), marginY + 34 + i * 14)
  );

  // Supplier/Vendor & header fields box
  const headerStartY = marginY + 70;
  const headerRows: RowInput[] = [
    ['Supplier Code', po.vendor || '-'],
    ['Document Date', po.documentDate ? dayjs(po.documentDate).format('YYYY-MM-DD') : '-'],
    ['Currency', po.currency || '-'],
    ['Payment Terms', po.paymentTerms || '-'],
    ['Plant / Receiving Location', po.plantLocation || '-'],
  ];

  autoTable(doc, {
    startY: headerStartY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
    body: headerRows,
    columns: [
      { header: 'Field', dataKey: 'key' },
      { header: 'Value', dataKey: 'val' },
    ] as any,
  });

  // Items table
  const items = po.items || [];
  const body: RowInput[] = items.map((it) => {
    const qty = num(it.qtyOrdered ?? it.qty ?? 0);
    const price = num(it.netPrice ?? it.price ?? 0);
    const amount = qty * price;
    return [
      it.itemNo ?? '',
      it.product ?? '',
      it.uom ?? '',
      it.deliveryDate ? dayjs(it.deliveryDate).format('YYYY-MM-DD') : '',
      qty,
      price.toFixed(2),
      amount.toFixed(2),
      it.storageLocation ?? '',
      it.prReference ?? '',
      it.poReference ?? '',
    ];
  });

  const startY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 14
    : headerStartY + 120;

  autoTable(doc, {
    startY,
    margin: { left: marginX, right: marginX },
    theme: 'striped',
    headStyles: { fillColor: [45, 55, 72], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    head: [[
      'Item #', 'Material', 'UoM', 'Delivery',
      'Qty', 'Net Price', 'Line Total', 'Storage', 'PR Ref', 'PO Ref',
    ]],
    body,
    didDrawPage: (data) => {
      // Footer with page numbers
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(str, pageWidth - marginX, doc.internal.pageSize.getHeight() - 18, { align: 'right' });
    },
  });

  // Totals
  const subTotal = items.reduce((s, it) => {
    const q = num(it.qtyOrdered ?? it.qty);
    const p = num(it.netPrice ?? it.price);
    return s + q * p;
  }, 0);

  const currencyCode = po.currency || 'USD';
  const totalsStartY = (doc as any).lastAutoTable.finalY + 12;

  autoTable(doc, {
    startY: totalsStartY,
    theme: 'plain',
    styles: { fontSize: 11 },
    margin: { left: pageWidth - marginX - 220, right: marginX },
    body: [
      ['Subtotal', currency(subTotal, currencyCode)],
      // If you later want tax/shipping, add here…
      ['Total', currency(po.total ?? subTotal, currencyCode)],
    ],
    bodyStyles: { halign: 'right' },
    columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' } },
  });

  // filename
  const fileName = `PO_${po.number || po.id}.pdf`;
  doc.save(fileName);
}
