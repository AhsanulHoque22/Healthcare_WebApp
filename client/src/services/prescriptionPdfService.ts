import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import { getDepartmentLabel } from '../utils/departments';

export interface PrescriptionPdfData {
  prescriptionData: any;
  appointmentData: any;
}

export const generatePrescriptionPdf = async (data: PrescriptionPdfData) => {
  const { prescriptionData, appointmentData } = data;
  
  const parseJsonField = (field: any) => {
    if (!field) return null;
    if (typeof field !== 'string') return field;
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  };

  const medicines = parseJsonField(prescriptionData?.medicines);
  const symptoms = parseJsonField(prescriptionData?.symptoms);
  const diagnoses = parseJsonField(prescriptionData?.diagnosis || prescriptionData?.diagnoses);
  const tests = parseJsonField(prescriptionData?.tests);
  const suggestions = parseJsonField(prescriptionData?.suggestions);

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

  const calculateAge = (dob: string | Date | null) => {
    if (!dob) return '—';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} Y`;
  };

  const patientName = `${appointmentData?.patient?.user?.firstName || ''} ${appointmentData?.patient?.user?.lastName || ''}`.trim() || 'N/A';
  const patientAge = calculateAge(appointmentData?.patient?.user?.dateOfBirth || appointmentData?.patient?.dateOfBirth);
  const patientGender = (appointmentData?.patient?.user?.gender || appointmentData?.patient?.gender || '—').charAt(0).toUpperCase();
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

  if (symptoms && (Array.isArray(symptoms) ? symptoms.length > 0 : symptoms)) {
    leftY = drawSectionTitle('CHIEF COMPLAINTS', leftY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const list = Array.isArray(symptoms) ? symptoms : [symptoms];
    list.forEach(s => {
      const desc = s.description || s;
      const lines = doc.splitTextToSize(`• ${desc}`, leftColWidth - 8);
      doc.text(lines, margin + 2, leftY);
      leftY += lines.length * 4.5;
    });
    leftY += 4;
  }

  if (diagnoses && (Array.isArray(diagnoses) ? diagnoses.length > 0 : diagnoses)) {
    leftY = drawSectionTitle('DIAGNOSIS', leftY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 40);
    const list = Array.isArray(diagnoses) ? diagnoses : [diagnoses];
    list.forEach(d => {
      const desc = d.description || d;
      const lines = doc.splitTextToSize(`• ${desc}`, leftColWidth - 8);
      doc.text(lines, margin + 2, leftY);
      leftY += lines.length * 4.5;
    });
    leftY += 4;
  }

  if (tests && (Array.isArray(tests) ? tests.length > 0 : tests)) {
    leftY = drawSectionTitle('INVESTIGATIONS', leftY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const list = Array.isArray(tests) ? tests : [tests];
    list.forEach((t, i) => {
      const tName = t.name || t;
      const lines = doc.splitTextToSize(`${i+1}. ${tName}`, leftColWidth - 8);
      doc.text(lines, margin + 2, leftY);
      leftY += lines.length * 4.5;
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

  if (medicines && Array.isArray(medicines) && medicines.length > 0) {
    medicines.forEach((med: any, idx: number) => {
      if (rightY > 240) {
        doc.addPage();
        rightY = margin + 10;
        // Reinstate borders and vertical line if needed
      }

      // Index and Name
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text(`${idx + 1}. ${med.form || 'Tab.'} ${med.name} ${med.strength || med.dosage}`, rightColX, rightY);
      
      // Generic Name
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(`(${med.genericName || 'Generic N/A'})`, rightColX + 5, rightY + 4);
      
      // Sig/Instructions
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 50, 100);
      const schedule = `Sig: ${med.morning || 0}-${med.lunch || 0}-${med.dinner || 0} (${med.mealTiming || 'after meal'}) x ${med.duration || 0} Days`;
      doc.text(schedule, rightColX + 5, rightY + 9);
      
      // Details (Route, Disp)
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      const details = `ROUTE: ${med.route || 'PO'}    |    DISP: ${(parseInt(med.morning || 0) + parseInt(med.lunch || 0) + parseInt(med.dinner || 0)) * (parseInt(med.duration || 0))} UNITS`;
      doc.text(details, rightColX + 5, rightY + 13);

      if (med.notes) {
        doc.text(`Note: ${med.notes}`, rightColX + 5, rightY + 17);
        rightY += 17 + 8;
      } else {
        rightY += 13 + 8;
      }
    });
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
    
    const adviceText = typeof suggestions === 'string' ? suggestions : 
      `${suggestions.exercises || ''}\n${suggestions.followUps?.map((f:any)=>f.description).join(', ') || ''}`;
    
    const lines = doc.splitTextToSize(adviceText, rightColWidth - 5);
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
};
