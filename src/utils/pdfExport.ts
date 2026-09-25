import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product } from '../data/products';
import { GRAN_FISH_LOGO_BASE64 } from './logoBase64';
import { EMBEDDED_PRODUCT_IMAGES } from './productImagesBase64';
import { calculateItemPricing, parseStandardWeight } from './pricing';

/**
 * Robust helper to trigger PDF download across desktop, mobile and iframe browsers
 */
export function triggerPdfDownload(doc: jsPDF, filename: string): boolean {
  try {
    // 1. Try standard doc.save()
    doc.save(filename);
    return true;
  } catch (saveError) {
    console.warn('Standard doc.save failed, trying blob trigger:', saveError);
  }

  try {
    // 2. Blob anchor trigger
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 2000);
    return true;
  } catch (blobError) {
    console.error('Blob PDF download failed:', blobError);
  }

  try {
    // 3. Fallback: Open in new window or iframe preview
    const dataUri = doc.output('datauristring');
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${dataUri}" frameborder="0" style="border:0; position:fixed; top:0; left:0; right:0; bottom:0; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      return true;
    }
  } catch (winError) {
    console.error('Window open fallback failed:', winError);
  }

  return false;
}

/**
 * Safe image loader with timeout for Cards PDF
 */
async function loadSingleImageBase64(url: string, timeoutMs = 2500): Promise<string | null> {
  return new Promise((resolve) => {
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(null);
      }
    }, timeoutMs);

    // Try HTML Image tag first
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const isPng = url.toLowerCase().endsWith('.png');
          const dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85);
          resolve(dataUrl);
          return;
        }
      } catch (e) {
        console.warn('Canvas export failed for image:', url, e);
      }
      resolve(null);
    };

    img.onerror = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      // Fallback to fetch
      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), 2000);
      fetch(url, { signal: controller.signal })
        .then((res) => res.blob())
        .then((blob) => {
          clearTimeout(fetchTimer);
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          clearTimeout(fetchTimer);
          resolve(null);
        });
    };

    img.src = url;
  });
}

/**
 * Sanitizes strings for jsPDF WinAnsi Helvetica font.
 * Replaces non-WinAnsi characters like double-tilde (≈) with ASCII tilde (~),
 * and eliminates any "H encoding artifacts so text never gets mangled.
 */
function cleanPdfText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/≈/g, '~')
    .replace(/"H\s*/g, '~ ')
    .trim();
}

/**
 * 1. Export Official Price Table PDF
 */
export async function exportPriceTablePDF(
  itemsToExport: Product[],
  prices: Record<string, number>,
  onStatusChange?: (msg: string) => void
): Promise<boolean> {
  if (!itemsToExport || itemsToExport.length === 0) {
    throw new Error('Nenhum item selecionado para exportação.');
  }

  onStatusChange?.('Formatando dados da tabela...');

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const margin = 12;
  const pageWidth = doc.internal.pageSize.getWidth();

  const drawHeader = (pageNum: number) => {
    try {
      if (GRAN_FISH_LOGO_BASE64) {
        doc.addImage(GRAN_FISH_LOGO_BASE64, 'PNG', margin, 8, 18, 18);
      }
    } catch (e) {
      console.warn('Error adding logo to table header', e);
    }

    const textX = margin + 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138); // Blue 900
    doc.text('GRAN FISH PESCADOS', textX, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text('TABELA OFICIAL DE PREÇOS ATACADO / DISTRIBUIÇÃO', textX, 19.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Emissão: ${today} | Total de Itens: ${itemsToExport.length} | Página ${pageNum}`, textX, 24.5);

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.6);
    doc.line(margin, 28, pageWidth - margin, 28);
  };

  // Map rows
  const tableRows = itemsToExport.map((p) => {
    const pricePerKg = prices[p.internalCode];
    const pricing = calculateItemPricing(pricePerKg, p.pctWeight, p.description);
    const weightInfo = parseStandardWeight(p.pctWeight, p.description, p.boxWeight);
    const hasImage = !!EMBEDDED_PRODUCT_IMAGES[p.internalCode];

    return [
      p.internalCode,
      hasImage ? '' : '-',
      cleanPdfText(p.description.toUpperCase()),
      cleanPdfText(p.species),
      cleanPdfText(weightInfo.tableLabel),
      cleanPdfText(weightInfo.boxWeightInfo.tableLabel),
      pricing.pricePerKg ? pricing.formattedPricePerKg : '-',
      pricing.formattedPackagePrice,
      cleanPdfText(p.ncm || '-')
    ];
  });

  drawHeader(1);

  // AutoTable invocation with compatibility check
  const autoTableConfig = {
    startY: 31,
    margin: { left: margin, right: margin, bottom: 15 },
    head: [['CÓD.', 'FOTO', 'DESCRIÇÃO DO PRODUTO', 'ESPÉCIE', 'PESO PCT', 'PESO CX', 'PREÇO / KG', 'PREÇO / PCT', 'NCM']],
    body: tableRows,
    theme: 'striped' as const,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      valign: 'middle' as const,
      textColor: [30, 41, 59] as [number, number, number],
      minCellHeight: 13.5
    },
    headStyles: {
      fillColor: [30, 58, 138] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold' as const,
      halign: 'center' as const,
      fontSize: 7.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' as const, fontStyle: 'bold' as const, textColor: [37, 99, 235] as [number, number, number] },
      1: { cellWidth: 14.5, halign: 'center' as const },
      2: { cellWidth: 'auto' as const, fontStyle: 'bold' as const },
      3: { cellWidth: 20, halign: 'left' as const },
      4: { cellWidth: 16, halign: 'center' as const },
      5: { cellWidth: 15, halign: 'center' as const },
      6: { cellWidth: 20, halign: 'right' as const, fontStyle: 'bold' as const, textColor: [30, 58, 138] as [number, number, number] },
      7: { cellWidth: 20, halign: 'right' as const, fontStyle: 'bold' as const, textColor: [22, 101, 52] as [number, number, number] },
      8: { cellWidth: 16, halign: 'center' as const }
    },
    didDrawCell: (data: any) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const rowItem = itemsToExport[data.row.index];
        if (rowItem) {
          const imgBase64 = EMBEDDED_PRODUCT_IMAGES[rowItem.internalCode];
          if (imgBase64) {
            try {
              // 60% larger image: 11.2mm maximum dimension, preserving natural aspect ratio
              const maxDim = 11.2;
              let renderW = maxDim;
              let renderH = maxDim;
              try {
                const props = doc.getImageProperties(imgBase64);
                if (props && props.width && props.height) {
                  const aspect = props.width / props.height;
                  if (aspect >= 1) {
                    renderW = maxDim;
                    renderH = maxDim / aspect;
                  } else {
                    renderH = maxDim;
                    renderW = maxDim * aspect;
                  }
                }
              } catch {
                // fallback to maxDim x maxDim
              }
              const x = data.cell.x + (data.cell.width - renderW) / 2;
              const y = data.cell.y + (data.cell.height - renderH) / 2;
              const format = imgBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
              doc.addImage(imgBase64, format, x, y, renderW, renderH);
            } catch (e) {
              console.warn('Failed to draw thumbnail in table PDF', e);
            }
          }
        }
      }
    },
    didDrawPage: (data: { pageNumber: number }) => {
      if (data.pageNumber > 1) {
        drawHeader(data.pageNumber);
      }
    }
  };

  if (typeof autoTable === 'function') {
    autoTable(doc, autoTableConfig);
  } else if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable(autoTableConfig);
  } else if ((autoTable as any)?.default) {
    (autoTable as any).default(doc, autoTableConfig);
  }

  // Draw accurate page numbering on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gran Fish Pescados - Valores e disponibilidade sujeitos a alteração sem aviso prévio. - Página ${i} de ${totalPages}`,
      margin,
      doc.internal.pageSize.getHeight() - 6
    );
  }

  onStatusChange?.('Concluindo download do arquivo...');
  const filename = `tabela_precos_gran_fish_${new Date().toISOString().slice(0, 10)}.pdf`;
  return triggerPdfDownload(doc, filename);
}

/**
 * 2. Export Cards / Catalog with Images PDF
 */
export async function exportCardsPDF(
  itemsToExport: Product[],
  prices: Record<string, number>,
  onStatusChange?: (msg: string) => void
): Promise<boolean> {
  if (!itemsToExport || itemsToExport.length === 0) {
    throw new Error('Nenhum item selecionado para exportação.');
  }

  onStatusChange?.('Carregando fotos dos produtos selecionados...');

  // Preload images safely in parallel
  const preloadedImages: Record<string, string[]> = {};
  const imageLoadTasks: Promise<void>[] = [];

  for (const product of itemsToExport) {
    if (product.images && product.images.length > 0) {
      preloadedImages[product.internalCode] = [];
      const productImages = product.images.slice(0, 3);
      for (const imgUrl of productImages) {
        const task = loadSingleImageBase64(imgUrl, 2500).then((base64) => {
          if (base64) {
            preloadedImages[product.internalCode].push(base64);
          }
        });
        imageLoadTasks.push(task);
      }
    }
  }

  // Await image loads with total timeout protection
  await Promise.allSettled(imageLoadTasks);

  onStatusChange?.('Montando fichas técnicas no PDF...');

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const margin = 14;
  const colCount = 2;
  const colSpacing = 8;
  const rowSpacing = 8;
  const w = (210 - (margin * 2) - (colSpacing * (colCount - 1))) / colCount;
  const h = 126;

  let currentX = margin;
  let currentY = 34;
  let colIndex = 0;
  let rowIndex = 0;

  const renderHeader = (pageNumber: number) => {
    try {
      if (GRAN_FISH_LOGO_BASE64) {
        doc.addImage(GRAN_FISH_LOGO_BASE64, 'PNG', margin, 8, 16, 16);
      }
    } catch (e) {
      console.warn('Error adding logo to cards header', e);
    }

    const textX = margin + 20;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('Catálogo de Produtos - Gran Fish Pescados', textX, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Tabela de Preços e Fichas Técnicas | ${itemsToExport.length} itens | Página ${pageNumber}`, textX, 20);

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, 26, 210 - margin, 26);
  };

  renderHeader(1);

  const drawGridCell = (cx: number, cy: number, cw: number, ch: number, label: string, value: string, isHighlighted = false) => {
    doc.setDrawColor(241, 245, 249);
    doc.setFillColor(isHighlighted ? 240 : 248, isHighlighted ? 253 : 250, isHighlighted ? 244 : 252);
    doc.roundedRect(cx, cy, cw, ch, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(isHighlighted ? 22 : 148, isHighlighted ? 101 : 163, isHighlighted ? 52 : 184);
    doc.text(label, cx + 3, cy + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isHighlighted ? 22 : 51, isHighlighted ? 101 : 65, isHighlighted ? 52 : 85);
    const splitValue = doc.splitTextToSize(value || '-', cw - 6);
    doc.text(splitValue[0], cx + 3, cy + 9);
  };

  itemsToExport.forEach((p) => {
    if (rowIndex === 2) {
      doc.addPage();
      const curPage = doc.getNumberOfPages();
      renderHeader(curPage);
      currentY = 34;
      rowIndex = 0;
      colIndex = 0;
      currentX = margin;
    }

    // Card background
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(currentX, currentY, w, h, 3, 3, 'FD');

    // Code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    doc.text(`CÓD. ${p.internalCode}`, currentX + 5, currentY + 6.5);

    // Description
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const splitTitle = doc.splitTextToSize(p.description.toUpperCase(), w - 10);
    doc.text(splitTitle.slice(0, 2), currentX + 5, currentY + 12);

    // Images
    const images = preloadedImages[p.internalCode];
    if (images && images.length > 0) {
      const imgCount = images.length;
      const spacing = 3;
      const totalSpacing = spacing * (imgCount - 1);
      const maxImgSize = 30;

      let imgSize = maxImgSize;
      if (imgCount * maxImgSize + totalSpacing > w - 10) {
        imgSize = (w - 10 - totalSpacing) / imgCount;
      }

      let imgX = currentX + 5;
      const imgY = currentY + 22;

      images.forEach((base64) => {
        try {
          const isPng = base64.toLowerCase().startsWith('data:image/png');
          let renderW = imgSize;
          let renderH = imgSize;
          try {
            const props = doc.getImageProperties(base64);
            if (props && props.width && props.height) {
              const aspect = props.width / props.height;
              if (aspect >= 1) {
                renderW = imgSize;
                renderH = imgSize / aspect;
              } else {
                renderH = imgSize;
                renderW = imgSize * aspect;
              }
            }
          } catch {
            // fallback
          }
          const posX = imgX + (imgSize - renderW) / 2;
          const posY = imgY + (imgSize - renderH) / 2;
          doc.addImage(base64, isPng ? 'PNG' : 'JPEG', posX, posY, renderW, renderH);
        } catch (imgError) {
          console.warn('Could not add image to card', imgError);
        }
        imgX += imgSize + spacing;
      });
    }

    // Spec Grid
    const gridY = currentY + 56;
    const cellW = (w - 10 - 4) / 2;
    const cellH = 12;

    const pricePerKg = prices[p.internalCode];
    const pricing = calculateItemPricing(pricePerKg, p.pctWeight, p.description);
    const weightInfo = parseStandardWeight(p.pctWeight, p.description, p.boxWeight);

    // Row 1: Espécie & NCM
    drawGridCell(currentX + 5, gridY, cellW, cellH, 'Espécie', cleanPdfText(p.species));
    drawGridCell(currentX + 5 + cellW + 4, gridY, cellW, cellH, 'NCM', cleanPdfText(p.ncm || '-'));

    // Row 2: Peso Caixa & Peso Pct
    drawGridCell(
      currentX + 5,
      gridY + 14,
      cellW,
      cellH,
      weightInfo.isStandard ? 'Peso Caixa' : 'Peso Cx. (Méd.)',
      cleanPdfText(weightInfo.boxWeightInfo.tableLabel)
    );
    drawGridCell(
      currentX + 5 + cellW + 4,
      gridY + 14,
      cellW,
      cellH,
      weightInfo.isStandard ? 'Peso Pacote' : 'Peso Médio',
      cleanPdfText(weightInfo.displayLabel)
    );

    // Row 3: Preço/KG & Preço/Pct (HIGHLIGHTED)
    drawGridCell(currentX + 5, gridY + 28, cellW, cellH, 'Preço / KG', pricing.pricePerKg ? pricing.formattedPricePerKg : 'Sob consulta', true);
    drawGridCell(currentX + 5 + cellW + 4, gridY + 28, cellW, cellH, 'Preço / Pct', pricing.formattedPackagePrice, true);

    // Row 4: EAN 13 & DUN 14
    drawGridCell(currentX + 5, gridY + 42, cellW, cellH, 'EAN 13', p.ean13);
    drawGridCell(currentX + 5 + cellW + 4, gridY + 42, cellW, cellH, 'DUN 14', p.dun14 || '-');

    // Advance layout
    colIndex++;
    currentX += w + colSpacing;
    if (colIndex === colCount) {
      colIndex = 0;
      rowIndex++;
      currentX = margin;
      currentY += h + rowSpacing;
    }
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gran Fish Pescados - Catálogo Comercial - Página ${i} de ${totalPages}`,
      margin,
      doc.internal.pageSize.getHeight() - 6
    );
  }

  onStatusChange?.('Concluindo download do arquivo...');
  const filename = `fichas_produtos_gran_fish_${new Date().toISOString().slice(0, 10)}.pdf`;
  return triggerPdfDownload(doc, filename);
}
