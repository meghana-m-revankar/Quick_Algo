export const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const buildInvoiceNumber = (payment) => {
  const txn = payment?.txnid || "NA";
  const stamp = payment?.paidAt || payment?.createdAt || "";
  const d = stamp ? new Date(stamp) : null;
  const ymd =
    d && !Number.isNaN(d.getTime())
      ? `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
          d.getDate()
        ).padStart(2, "0")}`
      : "00000000";
  return `INV-${ymd}-${txn}`;
};

export const safeText = (v) =>
  v === null || v === undefined || v === "" ? "-" : String(v);

export const extractInvoiceFeatures = (payment) => {
  const sf = payment?.subscriptionFeatures || null;
  if (!sf || typeof sf !== "object") return [];

  const features = [];

  if (sf.duration !== undefined && sf.duration !== null) {
    features.push({ feature: "Duration", value: `${sf.duration} month(s)` });
  }

  if (sf.backtest?.enabled !== undefined) {
    features.push({
      feature: "Backtest",
      value: sf.backtest.enabled
        ? `Enabled (${sf.backtest.creditsCount || 0} credits)`
        : "Disabled",
    });
  }

  if (sf.apiAccess !== undefined) {
    features.push({
      feature: "API Access",
      value: sf.apiAccess ? "Enabled" : "Disabled",
    });
  }

  if (sf.manualTrade !== undefined) {
    features.push({
      feature: "Manual Trade",
      value: sf.manualTrade ? "Enabled" : "Disabled",
    });
  }

  if (sf.manualTradeAllow !== undefined) {
    features.push({
      feature: "Manual Trade Allowed",
      value: sf.manualTradeAllow ? "Yes" : "No",
    });
  }

  if (sf.manualTradeExitButton !== undefined) {
    features.push({
      feature: "Manual Trade Exit Button",
      value: sf.manualTradeExitButton ? "Enabled" : "Disabled",
    });
  }

  if (sf.maxLots !== undefined) {
    features.push({
      feature: "Max Lots",
      value: sf.maxLots > 0 ? String(sf.maxLots) : "Unlimited",
    });
  }

  if (sf.liveCharts?.enabled !== undefined) {
    features.push({
      feature: "Live Charts",
      value: sf.liveCharts.enabled
        ? `Enabled (${sf.liveCharts.chartsCount || 0} charts)`
        : "Disabled",
    });
  }

  if (sf.createStrategy !== undefined) {
    features.push({
      feature: "Create Strategy",
      value: sf.createStrategy ? "Enabled" : "Disabled",
    });
  }

  if (sf.maxBrokerAddLimitCount !== undefined) {
    features.push({
      feature: "Max Broker Add Limit",
      value:
        sf.maxBrokerAddLimitCount > 0
          ? String(sf.maxBrokerAddLimitCount)
          : "Unlimited",
    });
  }

  if (sf.optionChain?.buy !== undefined) {
    features.push({
      feature: "Option Chain Buy",
      value: sf.optionChain.buy ? "Enabled" : "Disabled",
    });
  }
  if (sf.optionChain?.sell !== undefined) {
    features.push({
      feature: "Option Chain Sell",
      value: sf.optionChain.sell ? "Enabled" : "Disabled",
    });
  }

  if (sf.topGainerLoser !== undefined) {
    features.push({
      feature: "Top Gainer & Loser",
      value: sf.topGainerLoser ? "Enabled" : "Disabled",
    });
  }

  if (sf.setupAlgo !== undefined) {
    features.push({
      feature: "Setup Algo",
      value: sf.setupAlgo ? "Enabled" : "Disabled",
    });
  }

  return features;
};

export const fetchImageAsDataUrl = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return typeof dataUrl === "string" ? dataUrl : null;
  } catch {
    return null;
  }
};

const formatLongDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getBillingPeriodText = ({ payment, invoiceDate }) => {
  const startCandidate = payment?.paidAt || payment?.createdAt || invoiceDate;
  const endCandidate = payment?.subscriptionExpiryDate || null;

  if (startCandidate && endCandidate) {
    return `${formatLongDate(startCandidate)} – ${formatLongDate(endCandidate)}`;
  }

  const d = startCandidate ? new Date(startCandidate) : null;
  if (!d || Number.isNaN(d.getTime())) return "-";
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${formatLongDate(start)} – ${formatLongDate(end)}`;
};

const COLORS = {
  brand: [40, 180, 202],
  dark: [17, 24, 39],
  body: [55, 65, 81],
  footer: [107, 114, 128],
  white: [255, 255, 255],
};

const TAX_INVOICE_APPENDIX = {
  title: "FINAL – TAX INVOICE / ACCOUNT SUMMARY",
  sections: [
    {
      heading: "Seller Details",
      lines: [
        "Company Name: Quickalgoplus Private Limited",
        "Corporate Identification Number (CIN): U72900MP2021PTC054536",
        "GSTIN: 23AAACQ7173R1ZV",
        "PAN: AAACQ7173R",
        "Registered Office Address: TT Nagar, Pipliya Kumar, Indore – 452010, Madhya Pradesh, India",
        "Email: info@quickalgoplus.in",
        "Phone: +91 83570 00107",
        "Website: https://quickalgoplus.in",
      ],
    },
    {
      heading: "Place of Supply",
      lines: ["State: Madhya Pradesh", "State Code: 23"],
    },
    {
      heading: "Invoice Type",
      lines: ["[X] Tax Invoice", "[ ] Proforma Invoice"],
    },
    {
      heading: "Nature of Service",
      lines: ["Algo Software – Online Software as a Service (SaaS)"],
    },
    {
      heading: "Research Analyst (RA) Signal Access",
      lines: ["(As per Section 12 & Section 13 of the CGST Act, 2017)"],
    },
    {
      heading: "GST Applicability Note",
      lines: [
        "GST @ 18% is applicable on the above services, irrespective of whether the client is registered under GST or not, as this constitutes a taxable supply under Indian GST laws.",
      ],
    },
    {
      heading: "Declaration",
      lines: [
        "This is a computer-generated tax invoice and does not require a physical signature.",
      ],
    },
    {
      heading: "Regulatory Disclaimer (SEBI / NSE / BSE)",
      lines: [
        "Quickalgoplus Private Limited provides only software and technology-based services.",
        "We do not provide any investment advice, recommendations, or portfolio management services.",
        "All trades are executed solely at the discretion of the user.",
        "Market risks are borne entirely by the user.",
        "NSE, BSE, Broker, Quickalgoplus, and SEBI are not responsible for any profit or loss arising from the use of this software or related services.",
      ],
    },
    {
      heading: "Important Risk & Commercial Terms",
      lines: [
        "- No guaranteed profit or assured returns.",
        "- All trading losses are the sole responsibility of the user.",
        "- No refund or compensation for trading losses.",
        "- If the service is discontinued due to technical, broker, exchange, or regulatory reasons, no refund shall be applicable.",
        "- Once the subscription is activated, it is strictly non-refundable and non-transferable under any circumstances.",
      ],
    },
    {
      heading: "Billing Period",
      lines: ["This Account Summary is for the billing period:", "__BILLING_PERIOD__"],
    },
    {
      heading: "Privacy Policy",
      lines: [
        "https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/PrivacyPolicy.md",
      ],
    },
  ],
};

/**
 * Shared PDF invoice generator (used by both customer + admin apps).
 * Pass companyDetails from `/getcinf` result.
 */
export const downloadInvoicePdf = async ({ payment, companyDetails }) => {
  const jspdfModule = await import("jspdf");
  const JsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

  const autotableModule = await import("jspdf-autotable");
  const autoTable =
    autotableModule.default || autotableModule.autoTable || autotableModule;

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const M = 40;
  const TOP = 44;
  const BOTTOM = 52;
  const contentWidth = pageWidth - M * 2;
  const BORDER = [226, 232, 240];
  const BG = [248, 250, 252];

  const invoiceNo = buildInvoiceNumber(payment);
  const invoiceDate = payment?.paidAt || payment?.createdAt;
  const billingPeriod = getBillingPeriodText({ payment, invoiceDate });
  const planFeatures = extractInvoiceFeatures(payment);

  let cursorY = TOP;

  const ensureSpace = (needed = 20) => {
    if (cursorY + needed <= pageHeight - BOTTOM) return;
    doc.addPage();
    cursorY = TOP;
  };

  const roundedRect = (x, y, w, h, r = 10, style = "S") => {
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(x, y, w, h, r, r, style);
      return;
    }
    doc.rect(x, y, w, h, style);
  };

  const drawCard = (height) => {
    ensureSpace(height);
    doc.setDrawColor(...BORDER);
    doc.setFillColor(...BG);
    roundedRect(M, cursorY, contentWidth, height, 12, "FD");
    const yStart = cursorY;
    cursorY += height + 14;
    return yStart;
  };

  // Logo (centered)
  const logoUrl = companyDetails?.companyLogo;
  const logoDataUrl = await fetchImageAsDataUrl(logoUrl);
  if (logoDataUrl) {
    ensureSpace(70);
    const logoW = 130;
    const logoH = 46;
    const x = (pageWidth - logoW) / 2;
    try {
      doc.addImage(logoDataUrl, "PNG", x, cursorY, logoW, logoH);
    } catch {
      try {
        doc.addImage(logoDataUrl, "JPEG", x, cursorY, logoW, logoH);
      } catch {
        // ignore
      }
    }
    cursorY += logoH + 14;
  } else {
    cursorY += 6;
  }

  // Header card (seller + invoice meta)
  {
    const companyName = safeText(companyDetails?.companyName || "Invoice");
    const companyLines = [
      companyDetails?.addressStreet,
      companyDetails?.gstn ? `GSTIN: ${companyDetails.gstn}` : null,
      companyDetails?.cin ? `CIN: ${companyDetails.cin}` : null,
      companyDetails?.isoCertificateNumber
        ? `ISO: ${companyDetails.isoCertificateNumber}`
        : null,
    ].filter(Boolean);

    const rightLines = [
      "TAX INVOICE",
      `Invoice No: ${invoiceNo}`,
      `Invoice Date: ${formatDate(invoiceDate)}`,
      `Billing Period: ${billingPeriod}`,
    ];

    const innerPad = 14;
    const colGap = 14;
    const usableW = contentWidth - innerPad * 2;
    const leftColW = Math.floor(usableW * 0.62);
    const rightColW = usableW - leftColW - colGap;

    // Measure wrapped text to avoid overlap
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const nameLines = doc.splitTextToSize(String(companyName), leftColW);
    const nameLineH = 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const bodyLineH = 13;
    const leftBodyLines = companyLines.flatMap((l) =>
      doc.splitTextToSize(String(l), leftColW)
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const rightTitleLines = doc.splitTextToSize(String(rightLines[0]), rightColW);
    const rightTitleH = 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const rightMetaLines = rightLines
      .slice(1)
      .flatMap((l) => doc.splitTextToSize(String(l), rightColW));
    const rightMetaH = 13;

    const leftH = nameLines.length * nameLineH + 6 + leftBodyLines.length * bodyLineH;
    const rightH =
      rightTitleLines.length * rightTitleH + 6 + rightMetaLines.length * rightMetaH;

    const cardH = 14 + Math.max(leftH, rightH) + 14;
    const yCard = drawCard(cardH);

    const xL = M + innerPad;
    const xRRight = pageWidth - M - innerPad;
    const yStart = yCard + 22;

    // Left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.dark);
    nameLines.forEach((line, idx) => {
      doc.text(String(line), xL, yStart + idx * nameLineH);
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.body);
    const leftBodyStartY = yStart + nameLines.length * nameLineH + 6;
    leftBodyLines.forEach((line, idx) => {
      doc.text(String(line), xL, leftBodyStartY + idx * bodyLineH);
    });

    // Right
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLORS.brand);
    rightTitleLines.forEach((line, idx) => {
      doc.text(String(line), xRRight, yStart + idx * rightTitleH, {
        align: "right",
      });
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.body);
    const rightMetaStartY = yStart + rightTitleLines.length * rightTitleH + 6;
    rightMetaLines.forEach((line, idx) => {
      doc.text(String(line), xRRight, rightMetaStartY + idx * rightMetaH, {
        align: "right",
      });
    });
  }

  // Billed To card
  {
    const pan = payment?.billingDetails?.pan || "";
    const gstin = payment?.billingDetails?.gstin || "";
    const billedLines = [
      payment?.firstname ? payment.firstname : null,
      payment?.email ? payment.email : null,
      payment?.phone ? `Phone: ${payment.phone}` : null,
      pan ? `PAN: ${pan}` : null,
      gstin ? `GSTIN: ${gstin}` : null,
    ].filter(Boolean);

    const cardH = 16 + 18 + Math.max(1, billedLines.length) * 13 + 14;
    const yCard = drawCard(cardH);

    const xL = M + 14;
    let y = yCard + 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text("Billed To", xL, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.body);
    billedLines.forEach((line, idx) => {
      doc.text(String(line), xL, y + 16 + idx * 13);
    });
  }

  // Items table
  {
    const baseAmount =
      typeof payment?.baseAmount === "number" ? payment.baseAmount : null;
    const gstAmount =
      typeof payment?.gstAmount === "number" ? payment.gstAmount : null;
    const amount =
      typeof payment?.amount === "number"
        ? payment.amount
        : Number(payment?.amount || 0);
    const currency = payment?.currency || "INR";
    const itemDesc =
      payment?.productinfo ||
      (payment?.planType
        ? `${payment.planType.charAt(0).toUpperCase() + payment.planType.slice(1)} Plan`
        : "Subscription");

    ensureSpace(140);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: M, right: M },
      styles: {
        fontSize: 10,
        cellPadding: 7,
        textColor: COLORS.dark,
        lineColor: BORDER,
        lineWidth: 0.6,
      },
      headStyles: { fillColor: COLORS.brand, textColor: COLORS.white },
      alternateRowStyles: { fillColor: BG },
      head: [["Description", "Plan", "Amount"]],
      body: [
        [
          itemDesc,
          safeText(payment?.planType),
          `${currency} ${Number(baseAmount ?? amount).toLocaleString("en-IN")}`,
        ],
      ],
      theme: "grid",
    });
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 14;
  }

  // Features table
  if (planFeatures.length > 0) {
    ensureSpace(160);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: M, right: M },
      styles: {
        fontSize: 10,
        cellPadding: 7,
        textColor: COLORS.dark,
        lineColor: BORDER,
        lineWidth: 0.6,
      },
      headStyles: { fillColor: COLORS.dark, textColor: COLORS.white },
      alternateRowStyles: { fillColor: BG },
      head: [["Plan Features", "Value"]],
      body: planFeatures.map((f) => [safeText(f.feature), safeText(f.value)]),
      theme: "grid",
      columnStyles: { 0: { cellWidth: 220 } },
    });
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 14;
  }

  // Summary + Payment details (tables -> safer spacing + auto page breaks)
  {
    const baseAmount =
      typeof payment?.baseAmount === "number" ? payment.baseAmount : null;
    const gstAmount =
      typeof payment?.gstAmount === "number" ? payment.gstAmount : null;
    const amount =
      typeof payment?.amount === "number"
        ? payment.amount
        : Number(payment?.amount || 0);
    const currency = payment?.currency || "INR";

    const computedBase =
      baseAmount !== null ? baseAmount : gstAmount !== null ? amount - gstAmount : amount;
    const computedGst = gstAmount !== null ? gstAmount : 0;

    ensureSpace(200);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: M, right: M },
      styles: {
        fontSize: 10,
        cellPadding: 7,
        textColor: COLORS.dark,
        lineColor: BORDER,
        lineWidth: 0.6,
      },
      headStyles: { fillColor: COLORS.dark, textColor: COLORS.white },
      alternateRowStyles: { fillColor: BG },
      head: [["Summary", ""]],
      body: [
        ["Subtotal", `${currency} ${Number(computedBase).toLocaleString("en-IN")}`],
        ["GST (18%)", `${currency} ${Number(computedGst).toLocaleString("en-IN")}`],
        ["Total", `${currency} ${Number(amount).toLocaleString("en-IN")}`],
        ["Billing Period", billingPeriod],
      ],
      theme: "grid",
      columnStyles: { 0: { cellWidth: 180 } },
    });
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 10;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: M, right: M },
      styles: {
        fontSize: 10,
        cellPadding: 7,
        textColor: COLORS.dark,
        lineColor: BORDER,
        lineWidth: 0.6,
      },
      headStyles: { fillColor: COLORS.dark, textColor: COLORS.white },
      alternateRowStyles: { fillColor: BG },
      head: [["Payment Details", ""]],
      body: [
        ["Transaction ID", safeText(payment?.txnid)],
        ["Status", safeText(payment?.status)],
        ["Paid At", formatDateTime(payment?.paidAt)],
        payment?.paymentId ? ["Payment ID", safeText(payment?.paymentId)] : null,
        payment?.bankRefNum ? ["Bank Ref", safeText(payment?.bankRefNum)] : null,
        payment?.subscriptionExpiryDate
          ? ["Subscription Expiry", formatDateTime(payment?.subscriptionExpiryDate)]
          : null,
      ].filter(Boolean),
      theme: "grid",
      columnStyles: { 0: { cellWidth: 180 } },
    });
    cursorY = (doc.lastAutoTable?.finalY || cursorY) + 6;
  }

  // Appendix on a fresh page (clean layout)
  doc.addPage();
  cursorY = TOP;

  const bottomY = pageHeight - BOTTOM;
  const writeSectionTitle = (text) => {
    ensureSpace(40);
    doc.setFillColor(...COLORS.dark);
    doc.setDrawColor(...BORDER);
    roundedRect(M, cursorY, contentWidth, 26, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...COLORS.white);
    doc.text(String(text), M + 12, cursorY + 17);
    cursorY += 44; // extra gap below main title
  };

  const writeHeading = (text) => {
    ensureSpace(34);
    doc.setFillColor(...COLORS.brand);
    doc.setDrawColor(...BORDER);
    roundedRect(M, cursorY, contentWidth, 22, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLORS.white);
    doc.text(String(text), M + 12, cursorY + 15);
    cursorY += 34; // more breathing room
  };

  const writeParagraph = (text) => {
    if (!text) return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.body);

    const raw = String(text);
    const isBullet = raw.startsWith("- ");
    const indent = isBullet ? 12 : 0;
    const prefix = isBullet ? "• " : "";
    const wrapped = doc.splitTextToSize(prefix + raw.replace(/^- /, ""), contentWidth - indent);
    const h = wrapped.length * 12;
    ensureSpace(h + 6);
    doc.text(wrapped, M + indent, cursorY);
    cursorY += h + 6;
  };

  writeSectionTitle(TAX_INVOICE_APPENDIX.title);
  TAX_INVOICE_APPENDIX.sections.forEach((section) => {
    writeHeading(section.heading);
    section.lines.forEach((line) => {
      if (line === "__BILLING_PERIOD__") writeParagraph(billingPeriod);
      else writeParagraph(line);
    });
    cursorY += 10;
    if (cursorY > bottomY) {
      doc.addPage();
      cursorY = TOP;
    }
  });

  // Footer on every page (note + page numbers)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.footer);
    doc.text(
      "This is a system generated invoice. No signature required.",
      M,
      pageHeight - 30
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - M, pageHeight - 30, {
      align: "right",
    });
  }

  doc.save(`${invoiceNo}.pdf`);
};

