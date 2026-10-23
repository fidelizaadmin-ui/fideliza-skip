import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PurchaseRecord, StoreRecord } from '@/types'

export interface SalesReportFilterParams {
  storeName: string
  periodLabel: string
  typeFilterLabel: string
  totalSalesCount: number
  totalSalesAmount: number
  totalRedemptionsCount: number
  purchases: PurchaseRecord[]
  storeInfo?: Partial<StoreRecord> | null
}

export function generateSalesReportPDF(params: SalesReportFilterParams): void {
  const {
    storeName,
    periodLabel,
    typeFilterLabel,
    totalSalesCount,
    totalSalesAmount,
    totalRedemptionsCount,
    purchases,
  } = params

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  let currentY = 16

  // Top header banner background (subtle primary gradient look)
  doc.setFillColor(225, 29, 72) // Rose-600
  doc.rect(14, currentY, pageWidth - 28, 22, 'F')

  // Brand and Title
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('FIDELIZA • RELATÓRIO DE VENDAS E MOVIMENTAÇÕES', 18, currentY + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `Loja: ${storeName || 'Minha Loja'} | Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    18,
    currentY + 16,
  )

  currentY += 28

  // Filters Box
  doc.setDrawColor(226, 232, 240)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, currentY, pageWidth - 28, 16, 2, 2, 'FD')

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('Filtros Aplicados:', 18, currentY + 6)

  doc.setFont('helvetica', 'normal')
  doc.text(`• Período: ${periodLabel}`, 18, currentY + 11)
  doc.text(`• Tipo de Movimentação: ${typeFilterLabel}`, 90, currentY + 11)
  doc.text(`• Total de Registros: ${purchases.length}`, 160, currentY + 11)

  currentY += 22

  // Summary KPI Cards (3 boxes)
  const cardWidth = (pageWidth - 28 - 8) / 3
  const cardHeight = 20

  // Card 1: Total Sales Amount
  doc.setFillColor(240, 253, 244) // Emerald-50
  doc.setDrawColor(187, 247, 208)
  doc.roundedRect(14, currentY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(22, 101, 52)
  doc.setFont('helvetica', 'bold')
  doc.text('VALOR TOTAL DE VENDAS', 18, currentY + 6)
  doc.setFontSize(12)
  doc.text(
    `R$ ${totalSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    18,
    currentY + 14,
  )

  // Card 2: Total Sales Count
  const card2X = 14 + cardWidth + 4
  doc.setFillColor(238, 242, 255) // Indigo-50
  doc.setDrawColor(199, 210, 254)
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(55, 48, 163)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSAÇÕES DE COMPRA', card2X + 4, currentY + 6)
  doc.setFontSize(12)
  doc.text(`${totalSalesCount} transações`, card2X + 4, currentY + 14)

  // Card 3: Total Redemptions Count
  const card3X = card2X + cardWidth + 4
  doc.setFillColor(254, 243, 199) // Amber-50
  doc.setDrawColor(253, 230, 138)
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2, 2, 'FD')
  doc.setFontSize(8)
  doc.setTextColor(146, 64, 14)
  doc.setFont('helvetica', 'bold')
  doc.text('RESGATES EFETUADOS', card3X + 4, currentY + 6)
  doc.setFontSize(12)
  doc.text(`${totalRedemptionsCount} resgates`, card3X + 4, currentY + 14)

  currentY += 26

  // Table header & rows
  const tableData = purchases.map((pc) => {
    const dateFormatted = `${new Date(pc.created).toLocaleDateString('pt-BR')} ${new Date(pc.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    const customer = pc.expand?.customer_id?.name || 'Cliente'
    const typeLabel = pc.type === 'purchase' ? 'Compra' : 'Resgate'
    const amountLabel = pc.amount ? `R$ ${Number(pc.amount).toFixed(2)}` : '-'

    let benefitLabel = '-'
    if (pc.stamps_earned) {
      benefitLabel = `+${pc.stamps_earned} selo(s)`
    } else if (pc.points_earned) {
      benefitLabel = `+${pc.points_earned} pts`
    } else if (pc.cashback_earned) {
      benefitLabel = `+R$ ${Number(pc.cashback_earned).toFixed(2)} cash`
    } else if (pc.points_spent) {
      benefitLabel = `-${pc.points_spent} pts resgatados`
    } else if (pc.cashback_spent) {
      benefitLabel = `-R$ ${Number(pc.cashback_spent).toFixed(2)} abatidos`
    }

    const notes = pc.notes || '-'
    return [dateFormatted, customer, typeLabel, amountLabel, benefitLabel, notes]
  })

  autoTable(doc, {
    startY: currentY,
    head: [['Data/Hora', 'Cliente', 'Operação', 'Valor', 'Benefício / Resgate', 'Observação']],
    body:
      tableData.length > 0 ? tableData : [['-', 'Nenhum registro encontrado', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 38 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 38 },
      5: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Página ${data.pageNumber}`
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(str, pageWidth - 14 - doc.getTextWidth(str), doc.internal.pageSize.getHeight() - 8)
      doc.text(
        'Fideliza • Sistema de Fidelidade Digital para Pequenos e Médios Negócios',
        14,
        doc.internal.pageSize.getHeight() - 8,
      )
    },
  })

  // Clean filename with timestamp
  const dateStamp = new Date().toISOString().slice(0, 10)
  const cleanName = (storeName || 'loja').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  doc.save(`relatorio_vendas_${cleanName}_${dateStamp}.pdf`)
}
