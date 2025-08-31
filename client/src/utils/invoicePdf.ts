// src/utils/invoicePdf.ts
import jsPDF from 'jspdf'
import autoTable, { RowInput } from 'jspdf-autotable'
import dayjs from 'dayjs'

export type InvoiceItem = {
  id?: number
  itemNo?: number
  description?: string
  materialCode?: string
  uom?: string
  qty?: number
  qtyInvoiced?: number
  price?: number
  netPrice?: number
  deliveryDate?: string
}

export type InvoiceLike = {
  id: number
  number: string
  status?: string
  customer?: string
  companyName?: string

  invoiceDate?: string   // 'YYYY-MM-DD'
  dueDate?: string       // 'YYYY-MM-DD'
  paymentTerms?: string
  currency?: string

  // header % tax (from your UI)
  tax?: number           // e.g. 5 => 5%

  subtotal?: number
  total?: number

  items?: InvoiceItem[]
}

const N = (v: any) => (Number.isFinite(+v) ? +v : 0)
const fmt = (n: number | undefined, code?: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(N(n))

export function exportInvoicePDF(
  inv: InvoiceLike,
  opts: { logoDataUrl?: string } = {}
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const mx = 40

  // Header
  if (opts.logoDataUrl) {
    try { doc.addImage(opts.logoDataUrl, 'PNG', mx, mx, 120, 40) } catch {}
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  const title = 'Invoice'
  doc.text(title, pageWidth - mx - doc.getTextWidth(title), mx + 14)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const rightTop = [
    `Invoice #: ${inv.number || '-'}`,
    `Status: ${inv.status || 'draft'}`,
    `Generated: ${dayjs().format('YYYY-MM-DD HH:mm')}`,
  ]
  rightTop.forEach((t, i) =>
    doc.text(t, pageWidth - mx - doc.getTextWidth(t), mx + 34 + i * 14)
  )

  // Parties + header data
  const startY = mx + 70
  const headerRows: RowInput[] = [
    ['Customer', inv.customer || '-'],
    ['Invoice Date', inv.invoiceDate ? dayjs(inv.invoiceDate).format('YYYY-MM-DD') : '-'],
    ['Due Date', inv.dueDate ? dayjs(inv.dueDate).format('YYYY-MM-DD') : '-'],
    ['Payment Terms', inv.paymentTerms || '-'],
    ['Currency', inv.currency || '-'],
  ]
  autoTable(doc, {
    startY,
    theme: 'grid',
    margin: { left: mx, right: mx },
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [245, 245, 245], textColor: 20, fontStyle: 'bold' },
    body: headerRows,
    columns: [{ header: 'Field', dataKey: 'k' }, { header: 'Value', dataKey: 'v' }] as any,
  })

  // Items
  const items = inv.items || []
  const body: RowInput[] = items.map((it) => {
    const qty = N(it.qtyInvoiced ?? it.qty)
    const price = N(it.netPrice ?? it.price)
    const amount = qty * price
    return [
      it.itemNo ?? '',
      it.materialCode ?? '',
      it.description ?? '',
      it.uom ?? '',
      it.deliveryDate ? dayjs(it.deliveryDate).format('YYYY-MM-DD') : '',
      qty,
      price.toFixed(2),
      amount.toFixed(2),
    ]
  })

  const itemsStartY = (doc as any).lastAutoTable?.finalY
    ? (doc as any).lastAutoTable.finalY + 14
    : startY + 120

  autoTable(doc, {
    startY: itemsStartY,
    theme: 'striped',
    margin: { left: mx, right: mx },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [45, 55, 72], textColor: 255, fontStyle: 'bold' },
    head: [['Item #', 'Material', 'Description', 'UoM', 'Delivery', 'Qty', 'Unit Price', 'Line Total']],
    body,
    didDrawPage: () => {
      // footer
      const txt = `Page ${doc.getNumberOfPages()}`
      doc.setFontSize(9)
      doc.setTextColor(120)
      doc.text(txt, pageWidth - mx, pageHeight - 18, { align: 'right' })
    },
  })

  // Totals (recompute safe)
  const subtotal = items.reduce((s, it) => s + N(it.qtyInvoiced ?? it.qty) * N(it.netPrice ?? it.price), 0)
  const taxPct = N(inv.tax)
  const taxAmt = Math.round((subtotal * taxPct) as number) / 100
  const total = N(inv.total ?? subtotal + taxAmt)
  const currency = inv.currency || 'USD'

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 12,
    theme: 'plain',
    margin: { left: pageWidth - mx - 260, right: mx },
    styles: { fontSize: 11 },
    body: [
      ['Subtotal', fmt(subtotal, currency)],
      [`Tax (${taxPct || 0}%)`, fmt(taxAmt, currency)],
      ['Total', fmt(total, currency)],
    ],
    bodyStyles: { halign: 'right' },
    columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' } },
  })

  const fileName = `INV_${inv.number || inv.id}.pdf`
  doc.save(fileName)
}
