import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';
import QRCode from 'qrcode';
import { getDepartmentLabel } from '../utils/departments';

export interface PrescriptionPdfData {
  prescriptionData: any;
  appointmentData: any;
}

export const generatePrescriptionPdf = async (data: PrescriptionPdfData) => {
  try {
    const { prescriptionData, appointmentData } = data;
    console.log('[PDF Service] Starting generation for prescription:', prescriptionData?.id);
  
  const parseJsonField = (field: any) => {
    if (!field) return null;
    if (typeof field === 'object') return field; // already parsed
    if (typeof field !== 'string') return null;  // not a parseable type
    try {
      let parsed = JSON.parse(field);
      // Handle double-encoded JSON
      if (typeof parsed === 'string') {
        try {
          const deeper = JSON.parse(parsed);
          if (typeof deeper === 'object' && deeper !== null) {
            return deeper;
          }
        } catch {
          // single-encoded string value
        }
      }
      return parsed;
    } catch {
      return field; // return raw string
    }
  };

  // Safe array converter - always returns an array or null
  const toSafeArray = (val: any): any[] | null => {
    if (!val) return null;
    if (Array.isArray(val)) return val.length > 0 ? val : null;
    return [val]; // wrap single item
  };

  // Safe text extractor from an item
  const getItemText = (item: any, field: string = 'description'): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
      if (item[field] !== undefined && item[field] !== null) return String(item[field]);
      if (item.name !== undefined && item.name !== null) return String(item.name);
      if (item.description !== undefined && item.description !== null) return String(item.description);
      return '';
    }
    return String(item);
  };

  const rawMedicines = parseJsonField(prescriptionData?.medicines);
  const medicines = Array.isArray(rawMedicines) ? rawMedicines : null;

  const rawSymptoms = parseJsonField(prescriptionData?.symptoms) || appointmentData?.symptoms;
  const symptoms = toSafeArray(rawSymptoms);

  const rawDiagnoses = parseJsonField(prescriptionData?.diagnosis) || appointmentData?.diagnosis;
  const diagnoses = toSafeArray(rawDiagnoses);

  const rawSuggestions = parseJsonField(prescriptionData?.suggestions) || appointmentData?.notes;
  const suggestions = rawSuggestions; // can be string, object, or null

  const rawTests = parseJsonField(prescriptionData?.tests);
  const tests = toSafeArray(rawTests);
  
  const basicPrescription = appointmentData?.prescription;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ─────────────────────────────────────────────────────────
  // HELPER: draw a horizontal line
  const hLine = (y: number, color: [number, number, number] = [220, 230, 245], width = 0.3) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // ─────────────────────────────────────────────────────────
  // BACKGROUND WATERMARK (Digitally Generated)
  try {
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.saveGraphicsState();
    
    // Safety check for GState
    const GState = (doc as any).GState || (jsPDF as any).GState;
    if (GState) {
      doc.setGState(new GState({ opacity: 0.1 }));
    }
    
    doc.text('DIGITALLY GENERATED', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      angle: 45
    });
    doc.restoreGraphicsState();
  } catch (watermarkError) {
    console.warn('Failed to render watermark:', watermarkError);
  }

  // ─────────────────────────────────────────────────────────
  // PAGE BORDER
  doc.setDrawColor(41, 98, 180);
  doc.setLineWidth(0.5);
  doc.rect(7, 7, pageWidth - 14, pageHeight - 14);

  // ─────────────────────────────────────────────────────────
  // HEADER SECTION
  let y = margin + 5;
  
  // App Logo/Name
  try {
    doc.addImage('/logo.png', 'PNG', margin, margin, 12, 12);
  } catch (e) {
    // Fallback if image fails to load
    doc.setFillColor(41, 98, 180);
    doc.roundedRect(margin, margin, 12, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('L', margin + 6, margin + 8.5, { align: 'center' });
  }

  doc.setTextColor(41, 50, 100);
  doc.setFontSize(18);
  doc.text('LIVORA', margin + 15, margin + 7);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('PREMIUM HEALTHCARE NETWORK', margin + 15, margin + 11);

  // Doctor Info (Right Aligned)
  const doctorName = `${appointmentData?.doctor?.user?.firstName || 'DOC'} ${appointmentData?.doctor?.user?.lastName || ''}`.trim();
  const specialization = getDepartmentLabel(appointmentData?.doctor?.department || '') || 'Specialist Physician';
  const bmdc = appointmentData?.doctor?.bmdcRegistrationNumber ? `BMDC Reg: ${appointmentData.doctor.bmdcRegistrationNumber}` : 'Reg: N/A';
  
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${doctorName}`, pageWidth - margin, margin + 5, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(appointmentData?.doctor?.qualifications || 'MBBS, MD', pageWidth - margin, margin + 9, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setTextColor(41, 98, 180);
  doc.setFont('helvetica', 'bold');
  doc.text(specialization, pageWidth - margin, margin + 13, { align: 'right' });
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(bmdc, pageWidth - margin, margin + 17, { align: 'right' });

  y = margin + 22;
  hLine(y, [41, 98, 180], 0.8);

  // ─────────────────────────────────────────────────────────
  // PATIENT INFO BAR
  y += 5;
  doc.setFillColor(248, 250, 255);
  doc.roundedRect(margin, y, contentWidth, 15, 1, 1, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT NAME', margin + 3, y + 5);
  doc.text('AGE / SEX', margin + 60, y + 5);
  doc.text('WEIGHT', margin + 100, y + 5);
  doc.text('DATE', pageWidth - margin - 3, y + 5, { align: 'right' });


  const patientName = `${appointmentData?.patient?.user?.firstName || ''} ${appointmentData?.patient?.user?.lastName || ''}`.trim() || 'N/A';
  const patientAge = formatAge(calculateAge(appointmentData?.patient?.user?.dateOfBirth || appointmentData?.patient?.dateOfBirth));
  const patientGender = formatGender(appointmentData?.patient?.user?.gender || appointmentData?.patient?.gender);
  const patientWeight = appointmentData?.patient?.weight ? `${appointmentData.patient.weight} kg` : '—';
  const rxDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(patientName, margin + 3, y + 10);
  doc.text(`${patientAge} / ${patientGender}`, margin + 60, y + 10);
  doc.text(patientWeight, margin + 100, y + 10);
  doc.text(rxDate, pageWidth - margin - 3, y + 10, { align: 'right' });

  y += 22;

  // ─────────────────────────────────────────────────────────
  // CONTENT GRID (Chief Complaints | Medicines)
  const leftColWidth = 55;
  const rightColX = margin + leftColWidth + 5;
  const rightColWidth = contentWidth - leftColWidth - 5;

  // Left Column Content
  let leftY = y;
  
  const drawSectionTitle = (title: string, currentY: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 180);
    doc.text(title, margin, currentY);
    doc.setDrawColor(230, 240, 255);
    doc.line(margin, currentY + 1.5, margin + leftColWidth - 5, currentY + 1.5);
    return currentY + 6;
  };

  if (symptoms && symptoms.length > 0) {
    leftY = drawSectionTitle('CHIEF COMPLAINTS', leftY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    symptoms.forEach((s: any) => {
      const desc = getItemText(s);
      if (desc) {
        const lines = doc.splitTextToSize(`• ${desc}`, leftColWidth - 8);
        doc.text(lines, margin + 2, leftY);
        leftY += lines.length * 4.5;
      }
    });
    leftY += 4;
  }

  if (diagnoses && diagnoses.length > 0) {
    leftY = drawSectionTitle('DIAGNOSIS', leftY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 40);
    diagnoses.forEach((d: any) => {
      const desc = getItemText(d);
      if (desc) {
        const lines = doc.splitTextToSize(`• ${desc}`, leftColWidth - 8);
        doc.text(lines, margin + 2, leftY);
        leftY += lines.length * 4.5;
      }
    });
    leftY += 4;
  }

  if (tests && tests.length > 0) {
    leftY = drawSectionTitle('INVESTIGATIONS', leftY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    tests.forEach((t: any, i: number) => {
      const tName = getItemText(t, 'name');
      if (tName) {
        const lines = doc.splitTextToSize(`${i+1}. ${tName}`, leftColWidth - 8);
        doc.text(lines, margin + 2, leftY);
        leftY += lines.length * 4.5;
      }
    });
    leftY += 4;
  }

  // Vertical line separator
  doc.setDrawColor(240, 245, 255);
  doc.setLineWidth(0.5);
  doc.line(margin + leftColWidth, y, margin + leftColWidth, Math.max(leftY, 250));

  // Right Column (℞ Rx Symbol & Medicines)
  let rightY = y;
  doc.setTextColor(41, 50, 120);
  doc.setFontSize(35);
  doc.setFont('helvetica', 'bold');
  doc.text('Rx', rightColX, rightY + 5);
  
  rightY += 15;

  // Basic fallback if no structured medicines
  if (!medicines && basicPrescription) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(basicPrescription, rightColWidth - 5);
    doc.text(lines, rightColX, rightY);
    rightY += lines.length * 4.5 + 5;
  }

  if (Array.isArray(medicines) && medicines.length > 0) {
    (doc as any).autoTable({
      startY: rightY,
      head: [['Medicine', 'Dosage', 'Duration', 'Instructions']],
      body: medicines.map((m: any) => {
        if (!m) return ['Unknown', '-', '-', '-'];
        return [
          `${m.name || 'Unknown'} ${m.strength || ''}`,
          `${m.morning || 0}-${m.lunch || 0}-${m.dinner || 0}`,
          `${m.duration || 0} Days`,
          m.notes || '—'
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [41, 98, 180], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8 },
      margin: { left: rightColX },
      tableWidth: rightColWidth - 5
    });
    rightY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Advice/Suggestions at bottom right
  if (suggestions) {
    if (rightY > 220) { doc.addPage(); rightY = 20; }
    rightY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 180);
    doc.text('ADVICE & FOLLOW-UP', rightColX, rightY);
    doc.line(rightColX, rightY + 1.5, pageWidth - margin, rightY + 1.5);
    rightY += 6;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const adviceComponents: string[] = [];
    if (typeof suggestions === 'string') {
      adviceComponents.push(suggestions);
    } else if (typeof suggestions === 'object' && suggestions !== null) {
      if (suggestions.dietaryChanges) adviceComponents.push(`• Dietary Modifications: ${String(suggestions.dietaryChanges)}`);
      if (suggestions.lifestyleModifications) adviceComponents.push(`• Lifestyle Modifications: ${String(suggestions.lifestyleModifications)}`);
      if (suggestions.exercises) adviceComponents.push(`• Exercise Recommendations: ${String(suggestions.exercises)}`);
      if (Array.isArray(suggestions.followUps) && suggestions.followUps.length > 0) {
        adviceComponents.push(`• Follow-up visit: ${suggestions.followUps.map((f:any)=>getItemText(f)).filter(Boolean).join(', ')}`);
      }
      if (Array.isArray(suggestions.emergencyInstructions) && suggestions.emergencyInstructions.length > 0) {
        adviceComponents.push(`• EMERGENCY: ${suggestions.emergencyInstructions.map((e:any)=>getItemText(e)).filter(Boolean).join(', ')}`);
      }
    }
    
    const adviceText = adviceComponents.join('\n');
    const lines = doc.splitTextToSize(adviceText.trim() || 'No specific advice', rightColWidth - 5);
    doc.text(lines, rightColX + 2, rightY);
  }

  // ─────────────────────────────────────────────────────────
  // FOOTER (QR, Signature, Validation)
  const finalY = pageHeight - 35;
  hLine(finalY, [200, 220, 240]);

  // QR Code
  try {
    const qrText = `RX-${prescriptionData?.id}-VERIFIED-LIVORA`;
    const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 60 });
    doc.addImage(qrDataUrl, 'PNG', margin, finalY + 4, 20, 20);
  } catch (e) {
    console.error('Failed to add QR to PDF', e);
  }

  doc.setFontSize(6);
  doc.setTextColor(180, 180, 180);
  doc.text('SCAN TO VERIFY PRESCRIPTION AUTHENTICITY', margin + 22, finalY + 8);
  doc.text(`UID: RX-${prescriptionData?.id}-${appointmentData?.id}`, margin + 22, finalY + 11);
  doc.text('GENERATED BY LIVORA TRUSTED CLINICAL NETWORK', margin + 22, finalY + 14);

  // Signature Area
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - margin - 45, finalY + 16, pageWidth - margin, finalY + 16);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. ${doctorName}`, pageWidth - margin - 22.5, finalY + 20, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Authorized Signature', pageWidth - margin - 22.5, finalY + 24, { align: 'center' });

  // Paging
  doc.setFontSize(6);
  doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 5, { align: 'center' });

  const sanitizeFileName = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const safePatientName = sanitizeFileName(patientName);
  const fileName = `Prescription_${safePatientName}_${new Date().getTime()}.pdf`;
  
  try {
    doc.save(fileName);
  } catch (saveError) {
    console.error('Final PDF save failed:', saveError);
    // Fallback filename if the complex one fails
    doc.save('Prescription_Download.pdf');
  }
} catch (error) {
  console.error('[PDF Service] Generation crashed:', error);
  throw error;
}
};
