import React from 'react';
import { DocumentTextIcon, BeakerIcon, ClipboardDocumentListIcon, CheckIcon, ExclamationTriangleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

interface PrescriptionViewProps {
  prescriptionData: any;
  appointmentData?: any;
  onDownload?: () => void;
  userRole?: 'doctor' | 'patient' | 'admin';
}

const PrescriptionView: React.FC<PrescriptionViewProps> = ({ 
  prescriptionData,
  appointmentData,
  onDownload,
  userRole = 'patient'
}) => {
  const parseJsonField = (field: string) => {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  };

  const medicines = parseJsonField(prescriptionData?.medicines);
  const symptoms = parseJsonField(prescriptionData?.symptoms);
  const diagnoses = parseJsonField(prescriptionData?.diagnosis);
  const tests = parseJsonField(prescriptionData?.tests);
  const suggestions = parseJsonField(prescriptionData?.suggestions);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // ─────────────────────────────────────────────────────────
    // HELPER: draw a horizontal line
    const hLine = (y: number, color: [number, number, number] = [200, 200, 200]) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // ─────────────────────────────────────────────────────────
    // PAGE BORDER  (thin double border)
    doc.setDrawColor(41, 98, 180);
    doc.setLineWidth(0.8);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    doc.setLineWidth(0.3);
    doc.rect(9, 9, pageWidth - 18, pageHeight - 18);

    // ─────────────────────────────────────────────────────────
    // HEADER BAND
    doc.setFillColor(41, 98, 180);   // deep blue
    doc.rect(margin, margin, contentWidth, 22, 'F');

    // Clinic name – left
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LIVORA', margin + 5, margin + 10);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM HEALTHCARE SOLUTIONS', margin + 5, margin + 16);

    // Clinic contact – right
    doc.setFontSize(7.5);
    const rightX = pageWidth - margin - 5;
    doc.text('Livora Digital Clinic, 123 Wellness Ave, Dhaka', rightX, margin + 7, { align: 'right' });
    doc.text('Tel: +880 1234-567890   |   Emergency: +880 1900-000000', rightX, margin + 12, { align: 'right' });
    doc.text('www.livora-health.app   |   info@livora-health.app', rightX, margin + 17, { align: 'right' });

    // ─────────────────────────────────────────────────────────
    // DOCTOR CREDENTIALS BLOCK
    let y = margin + 28;

    const doctorName = `${appointmentData?.doctor?.user?.firstName || 'N/A'} ${appointmentData?.doctor?.user?.lastName || ''}`.trim();
    const specialization = appointmentData?.doctor?.department || 'General Physician';
    const experience     = appointmentData?.doctor?.experience ? `${appointmentData.doctor.experience} yrs exp.` : '';
    const bmdc           = appointmentData?.doctor?.bmdcRegistrationNumber ? `BMDC Reg: ${appointmentData.doctor.bmdcRegistrationNumber}` : '';
    const qualification  = appointmentData?.doctor?.qualifications || '';

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dr. ${doctorName}`, margin + 3, y);

    y += 5.5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 180);
    doc.text(specialization, margin + 3, y);

    y += 4.5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const credParts = [qualification, experience, bmdc].filter(Boolean).join('   |   ');
    if (credParts) doc.text(credParts, margin + 3, y);

    // "PRESCRIPTION" label – right side of doctor block
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(pageWidth - margin - 45, margin + 25, 45, 16, 2, 2, 'FD');
    doc.setTextColor(41, 98, 180);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESCRIPTION', pageWidth - margin - 22.5, margin + 31, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const rxDate = appointmentData?.appointmentDate
      ? new Date(appointmentData.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.text(`Date: ${rxDate}`, pageWidth - margin - 22.5, margin + 37, { align: 'center' });

    // ─────────────────────────────────────────────────────────
    // SEPARATOR
    y += 6;
    hLine(y, [41, 98, 180]);

    // ─────────────────────────────────────────────────────────
    // PATIENT INFO BAND
    y += 4;
    doc.setFillColor(248, 250, 255);
    doc.rect(margin, y, contentWidth, 18, 'FD');

    // Patient details (3-column inside band)
    const col1x = margin + 3;
    const col2x = margin + contentWidth / 3 + 3;
    const col3x = margin + (contentWidth * 2) / 3 + 3;

    const patientName = `${appointmentData?.patient?.user?.firstName || ''} ${appointmentData?.patient?.user?.lastName || ''}`.trim() || 'N/A';
    const patientAge  = appointmentData?.patient?.age || appointmentData?.patient?.dateOfBirth
      ? `${appointmentData.patient.age || '—'} yrs`
      : '—';
    const patientGender = appointmentData?.patient?.gender
      ? appointmentData.patient.gender.charAt(0).toUpperCase() + appointmentData.patient.gender.slice(1)
      : '—';
    const patientPhone = appointmentData?.patient?.user?.phone || '—';
    const patientBlood = appointmentData?.patient?.bloodType || '—';
    const apptSerial   = appointmentData?.serialNumber ? `#${appointmentData.serialNumber}` : '—';
    const apptId       = appointmentData?.id ? `APT-${appointmentData.id}` : '—';

    const bandTop = y + 5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('PATIENT NAME', col1x, bandTop);
    doc.text('AGE / GENDER', col2x, bandTop);
    doc.text('SERIAL / ID', col3x, bandTop);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 10, 10);
    doc.text(patientName, col1x, bandTop + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${patientAge}   ${patientGender}`, col2x, bandTop + 5);
    doc.text(`${apptSerial}   ${apptId}`, col3x, bandTop + 5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Ph: ${patientPhone}`, col1x, bandTop + 10);
    doc.text(`Blood Group: ${patientBlood}`, col2x, bandTop + 10);

    // ─────────────────────────────────────────────────────────
    // BODY CONTENT  – single column, sequential
    y += 24;
    const sectionTitleStyle = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 98, 180);
    };
    const bodyTextStyle = () => {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
    };

    const checkPageBreak = (needed: number) => {
      if (y + needed > pageHeight - 28) {
        doc.addPage();
        // re-draw thin border on new page
        doc.setDrawColor(41, 98, 180);
        doc.setLineWidth(0.8);
        doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
        doc.setLineWidth(0.3);
        doc.rect(9, 9, pageWidth - 18, pageHeight - 18);
        y = 18;
      }
    };

    // ── CHIEF COMPLAINTS ───────────────────────────────────────
    if (symptoms && (Array.isArray(symptoms) ? symptoms.length > 0 : symptoms)) {
      checkPageBreak(16);
      sectionTitleStyle();
      doc.text('CHIEF COMPLAINTS', margin + 2, y);
      hLine(y + 1.5, [41, 98, 180]);
      y += 6;
      bodyTextStyle();
      if (Array.isArray(symptoms)) {
        symptoms.forEach((s: any) => {
          checkPageBreak(6);
          const desc = s.description || s;
          const lines = doc.splitTextToSize(`• ${desc}`, contentWidth - 6);
          doc.text(lines, margin + 6, y);
          y += lines.length * 4.5 + 1;
        });
      } else {
        doc.text(`• ${symptoms}`, margin + 6, y);
        y += 6;
      }
      y += 3;
    }

    // ── DIAGNOSIS ──────────────────────────────────────────────
    if (diagnoses && (Array.isArray(diagnoses) ? diagnoses.length > 0 : diagnoses)) {
      checkPageBreak(16);
      sectionTitleStyle();
      doc.text('DIAGNOSIS', margin + 2, y);
      hLine(y + 1.5, [41, 98, 180]);
      y += 6;
      bodyTextStyle();
      if (Array.isArray(diagnoses)) {
        diagnoses.forEach((d: any) => {
          checkPageBreak(6);
          const desc = d.description || d;
          const lines = doc.splitTextToSize(`• ${desc}`, contentWidth - 6);
          doc.text(lines, margin + 6, y);
          y += lines.length * 4.5 + 1;
        });
      } else {
        doc.text(`• ${diagnoses}`, margin + 6, y);
        y += 6;
      }
      y += 3;
    }

    // ── Rx – MEDICINES ─────────────────────────────────────────
    checkPageBreak(20);

    // Rx header bar
    doc.setFillColor(41, 98, 180);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Rx', margin + 4, y + 6);
    doc.setFontSize(8);
    doc.text('MEDICINES PRESCRIBED', margin + 16, y + 6);
    y += 12;

    if (medicines && Array.isArray(medicines) && medicines.length > 0) {
      // Table header
      const colS  = margin;
      const colN  = margin + 7;
      const colD  = margin + 75;
      const colSc = margin + 100;
      const colDu = margin + 128;
      const colMT = margin + 148;

      doc.setFillColor(233, 239, 252);
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 50, 120);
      doc.text('#', colS + 1, y + 5);
      doc.text('MEDICINE (Generic Name)', colN, y + 5);
      doc.text('DOSAGE', colD, y + 5);
      doc.text('SCHEDULE', colSc, y + 5);
      doc.text('DURATION', colDu, y + 5);
      doc.text('TIMING', colMT, y + 5);
      y += 8;

      medicines.forEach((med: any, idx: number) => {
        checkPageBreak(9);

        const rowH = 9;
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 255);
          doc.rect(margin, y - 1, contentWidth, rowH, 'F');
        }

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(10, 10, 10);
        doc.text(`${idx + 1}.`, colS + 1, y + 5.5);

        // Medicine name + dosage
        const medName = med.name || '—';
        const dosageVal = med.dosage ? `${med.dosage}${med.unit || 'mg'}` : '—';
        const nameLines = doc.splitTextToSize(medName, 64);
        doc.setFont('helvetica', 'bold');
        doc.text(nameLines, colN, y + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(dosageVal, colD, y + 5.5);

        // Schedule: morning-lunch-dinner
        const m = med.morning ?? 0;
        const l = med.lunch   ?? 0;
        const d = med.dinner  ?? 0;
        const schedStr = `${m} - ${l} - ${d}`;
        doc.text(schedStr, colSc, y + 5.5);

        const dur = med.duration ? `${med.duration} days` : '—';
        doc.text(dur, colDu, y + 5.5);

        const mt = med.mealTiming || '—';
        doc.text(mt, colMT, y + 5.5);

        y += rowH;

        // Notes below if any
        if (med.notes) {
          checkPageBreak(5);
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          const noteLines = doc.splitTextToSize(`   ↳ Note: ${med.notes}`, contentWidth - 10);
          doc.text(noteLines, colN, y);
          y += noteLines.length * 4 + 1;
        }
      });
    } else {
      bodyTextStyle();
      doc.text('No medicines prescribed.', margin + 4, y + 5);
      y += 10;
    }

    y += 5;

    // ── INVESTIGATIONS / TESTS ────────────────────────────────
    if (tests && (Array.isArray(tests) ? tests.length > 0 : tests)) {
      checkPageBreak(16);
      sectionTitleStyle();
      doc.text('INVESTIGATIONS / LAB TESTS', margin + 2, y);
      hLine(y + 1.5, [41, 98, 180]);
      y += 6;
      bodyTextStyle();
      if (Array.isArray(tests)) {
        tests.forEach((t: any, idx: number) => {
          checkPageBreak(6);
          const tName = t.name || t;
          doc.text(`${idx + 1}. ${tName}`, margin + 6, y);
          y += 5.5;
        });
      } else {
        doc.text(`• ${tests}`, margin + 6, y);
        y += 6;
      }
      y += 3;
    }

    // ── ADVICE / RECOMMENDATIONS ──────────────────────────────
    const hasAdvice = suggestions && (
      typeof suggestions === 'string' ||
      (typeof suggestions === 'object' && (suggestions.exercises || (suggestions.followUps && suggestions.followUps.length > 0) || (suggestions.emergencyInstructions && suggestions.emergencyInstructions.length > 0)))
    );
    if (hasAdvice) {
      checkPageBreak(16);
      sectionTitleStyle();
      doc.text('ADVICE & RECOMMENDATIONS', margin + 2, y);
      hLine(y + 1.5, [41, 98, 180]);
      y += 6;
      bodyTextStyle();

      if (typeof suggestions === 'string') {
        const lines = doc.splitTextToSize(`• ${suggestions}`, contentWidth - 6);
        doc.text(lines, margin + 6, y);
        y += lines.length * 4.5 + 3;
      } else if (typeof suggestions === 'object') {
        if (suggestions.exercises) {
          checkPageBreak(8);
          const lines = doc.splitTextToSize(`• Exercises/Lifestyle: ${suggestions.exercises}`, contentWidth - 6);
          doc.text(lines, margin + 6, y);
          y += lines.length * 4.5 + 2;
        }
        if (suggestions.followUps && Array.isArray(suggestions.followUps)) {
          suggestions.followUps.forEach((fu: any) => {
            checkPageBreak(6);
            const lines = doc.splitTextToSize(`• Follow-up: ${fu.description || fu}`, contentWidth - 6);
            doc.text(lines, margin + 6, y);
            y += lines.length * 4.5 + 1;
          });
        }
        if (suggestions.emergencyInstructions && Array.isArray(suggestions.emergencyInstructions)) {
          checkPageBreak(6);
          doc.setTextColor(180, 30, 30);
          suggestions.emergencyInstructions.forEach((ei: any) => {
            checkPageBreak(6);
            const lines = doc.splitTextToSize(`⚠ Emergency: ${ei.description || ei}`, contentWidth - 6);
            doc.text(lines, margin + 6, y);
            y += lines.length * 4.5 + 1;
          });
          doc.setTextColor(30, 30, 30);
        }
      }
      y += 3;
    }

    // ─────────────────────────────────────────────────────────
    // FOOTER – on EVERY page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 22;

      hLine(footerY - 2, [41, 98, 180]);

      // Signature block – right
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.3);
      doc.line(pageWidth - margin - 50, footerY + 6, pageWidth - margin, footerY + 6);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Dr. ${doctorName}`, pageWidth - margin - 25, footerY + 10, { align: 'center' });
      doc.text('Authorised Signature & Stamp', pageWidth - margin - 25, footerY + 14, { align: 'center' });

      // Footer left text
      doc.setFontSize(6.5);
      doc.setTextColor(140, 140, 140);
      doc.text('This is a computer-generated prescription. Valid without a physical signature.', margin, footerY + 6);
      doc.text('Livora Healthcare  |  www.livora-health.app  |  For queries: info@livora-health.app', margin, footerY + 11);
      doc.text(`Page ${i} of ${pageCount}`, margin, footerY + 16);
    }

    // Save the PDF
    const fileName = `Rx-${doctorName.replace(/\s/g, '_')}-${appointmentData?.id || 'NA'}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Prescription Details</h3>
          {(userRole === 'patient' || userRole === 'doctor') && (
            <button
              onClick={handleDownloadPDF}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <DocumentTextIcon className="h-4 w-4" />
              Download as PDF
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600">Complete prescription information</p>
      </div>

      <div className="space-y-6">
        {/* Medicines Section */}
        {medicines && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Medicines Prescribed
            </h4>
            {Array.isArray(medicines) ? (
              <div className="space-y-3">
                {medicines.map((medicine: any, index: number) => (
                  <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-900">{medicine.name} {medicine.dosage}mg</h5>
                        <div className="text-sm text-blue-700 mt-1">
                          <span>Schedule: {medicine.morning}+{medicine.lunch}+{medicine.dinner} ({medicine.mealTiming} meal)</span>
                        </div>
                        {medicine.notes && (
                          <p className="text-sm text-blue-600 mt-2">{medicine.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">{medicines}</p>
              </div>
            )}
          </div>
        )}

        {/* Symptoms Section */}
        {symptoms && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5" />
              Patient Symptoms
            </h4>
            {Array.isArray(symptoms) ? (
              <div className="space-y-2">
                {symptoms.map((symptom: any, index: number) => (
                  <div key={index} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-yellow-800">{symptom.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800">{symptoms}</p>
              </div>
            )}
          </div>
        )}

        {/* Diagnosis Section */}
        {diagnoses && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5" />
              Diagnosis
            </h4>
            {Array.isArray(diagnoses) ? (
              <div className="space-y-3">
                {diagnoses.map((diagnosis: any, index: number) => (
                  <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-600">{diagnosis.date}</span>
                    </div>
                    <p className="text-purple-800">{diagnosis.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-purple-800">{diagnoses}</p>
              </div>
            )}
          </div>
        )}

        {/* Tests Section */}
        {tests && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5" />
              Tests Ordered
            </h4>
            {Array.isArray(tests) ? (
              <div className="space-y-3">
                {tests.map((test: any, index: number) => (
                  <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-medium text-green-900">{test.name}</h5>
                        {test.description && (
                          <p className="text-sm text-green-700 mt-1">{test.description}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        test.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' :
                        test.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        test.status === 'done' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800">{tests}</p>
              </div>
            )}
          </div>
        )}

        {/* Suggestions Section */}
        {suggestions && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              Recommendations & Instructions
            </h4>
            {typeof suggestions === 'object' ? (
              <div className="space-y-4">
                {suggestions.exercises && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h5 className="font-medium text-orange-900 mb-2">Exercises</h5>
                    <p className="text-orange-800">{suggestions.exercises}</p>
                  </div>
                )}
                {suggestions.followUps && Array.isArray(suggestions.followUps) && suggestions.followUps.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Follow-up Instructions</h5>
                    <div className="space-y-2">
                      {suggestions.followUps.map((followUp: any, index: number) => (
                        <div key={index} className="text-blue-800 text-sm">• {followUp.description}</div>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.emergencyInstructions && Array.isArray(suggestions.emergencyInstructions) && suggestions.emergencyInstructions.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Emergency Instructions
                    </h5>
                    <div className="space-y-2">
                      {suggestions.emergencyInstructions.map((instruction: any, index: number) => (
                        <div key={index} className="text-red-800 text-sm">• {instruction.description}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-orange-800">{suggestions}</p>
              </div>
            )}
          </div>
        )}

        {/* Test Reports Section */}
        {prescriptionData?.testReports && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5" />
              Test Reports
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800">{prescriptionData.testReports}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionView;
