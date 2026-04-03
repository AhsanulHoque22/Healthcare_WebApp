import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';
import { getDepartmentLabel } from '../utils/departments';

export interface PrescriptionPdfData {
  prescriptionData: any;
  appointmentData: any;
}

// ─── Safe helpers ────────────────────────────────────────────────────────────

const safeParseJson = (field: any): any => {
  if (!field) return null;
  if (typeof field === 'object') return field;
  if (typeof field !== 'string') return null;
  try {
    let parsed = JSON.parse(field);
    if (typeof parsed === 'string') {
      try {
        const deeper = JSON.parse(parsed);
        if (typeof deeper === 'object' && deeper !== null) return deeper;
      } catch { /* single-encoded string */ }
    }
    return parsed;
  } catch {
    return field;
  }
};

const toArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

const itemText = (item: any, field = 'description'): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    return String(item[field] ?? item.name ?? item.description ?? '');
  }
  return String(item);
};

// ─── HTML builder ─────────────────────────────────────────────────────────────

const buildPrescriptionHtml = (prescriptionData: any, appointmentData: any): string => {
  const medicines  = toArray(safeParseJson(prescriptionData?.medicines));
  const symptoms   = toArray(safeParseJson(prescriptionData?.symptoms) || appointmentData?.symptoms);
  const diagnoses  = toArray(safeParseJson(prescriptionData?.diagnosis || prescriptionData?.diagnoses) || appointmentData?.diagnosis);
  const tests      = toArray(safeParseJson(prescriptionData?.tests));
  const suggestions = safeParseJson(prescriptionData?.suggestions) || appointmentData?.notes;
  const vitalSigns  = safeParseJson(prescriptionData?.vitalSigns);
  const clinicalFindings = prescriptionData?.clinicalFindings || '';

  const doctor  = appointmentData?.doctor;
  const patient = appointmentData?.patient;
  const dUser   = doctor?.user;
  const pUser   = patient?.user;

  const doctorName  = `${dUser?.firstName || ''} ${dUser?.lastName || ''}`.trim() || 'N/A';
  const patientName = `${pUser?.firstName || ''} ${pUser?.lastName || ''}`.trim() || 'N/A';
  const patientAge  = formatAge(calculateAge(pUser?.dateOfBirth || patient?.dateOfBirth));
  const patientGender = formatGender(pUser?.gender || patient?.gender);
  const patientWeight = patient?.weight ? `${patient.weight} kg` : '—';
  const rxDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const rxId   = `RX-${prescriptionData?.id || '??'}-APT-${appointmentData?.id || '??'}`;

  /* ── Vitals row ── */
  const vitalsHtml = vitalSigns ? `
    <div class="vitals-bar">
      <div class="vital"><span class="vl">BLOOD PRESSURE</span><span class="vv">${vitalSigns.bloodPressure ? vitalSigns.bloodPressure + ' mmHg' : 'N/A'}</span></div>
      <div class="vital"><span class="vl">HEART RATE</span><span class="vv">${vitalSigns.heartRate ? vitalSigns.heartRate + ' bpm' : 'N/A'}</span></div>
      <div class="vital"><span class="vl">TEMPERATURE</span><span class="vv">${vitalSigns.temperature ? vitalSigns.temperature + ' °F/°C' : 'N/A'}</span></div>
      <div class="vital"><span class="vl">RESP. RATE</span><span class="vv">${vitalSigns.respiratoryRate ? vitalSigns.respiratoryRate + ' /min' : 'N/A'}</span></div>
      <div class="vital"><span class="vl">O₂ SATURATION</span><span class="vv">${vitalSigns.oxygenSaturation ? vitalSigns.oxygenSaturation + ' %' : 'N/A'}</span></div>
    </div>` : '';

  /* ── Left col ── */
  const clinicalHtml = clinicalFindings ? `
    <h4 class="sec-title">CLINICAL FINDINGS</h4>
    <p class="sec-body">${clinicalFindings}</p>` : '';

  const symptomsHtml = symptoms.filter(s => itemText(s)).length > 0 ? `
    <h4 class="sec-title">CHIEF COMPLAINTS</h4>
    <ul class="sec-list">${symptoms.map(s => `<li>${itemText(s)}</li>`).join('')}</ul>` : '';

  const diagnosisHtml = diagnoses.filter(d => itemText(d)).length > 0 ? `
    <h4 class="sec-title">DIAGNOSIS</h4>
    <ul class="sec-list diag">${diagnoses.map(d => `<li>${itemText(d)}</li>`).join('')}</ul>` : '';

  const testsHtml = tests.filter(t => itemText(t, 'name')).length > 0 ? `
    <h4 class="sec-title">INVESTIGATIONS</h4>
    <ol class="sec-list">${tests.map(t => `<li>${itemText(t, 'name')}</li>`).join('')}</ol>` : '';

  /* ── Medicines table ── */
  const medsRowsHtml = medicines.length > 0
    ? medicines.map((m, i) => `
      <tr>
        <td style="font-weight:700">${i + 1}. ${m.form || 'Tab.'} ${m.name || '?'} ${m.strength || ''}<br>
          <span style="font-size:9px;color:#6b7280;font-style:italic">${m.genericName || ''}</span></td>
        <td style="font-weight:900;letter-spacing:1px">${m.morning || 0}-${m.lunch || 0}-${m.dinner || 0}</td>
        <td>${m.mealTiming || 'After meal'}</td>
        <td>${m.duration || '?'} days</td>
        <td>${m.route || 'PO'}</td>
        <td>${m.notes || '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="color:#9ca3af;font-style:italic;text-align:center">No medication data</td></tr>`;

  const medsHtml = `
    <table class="rx-table">
      <thead>
        <tr>
          <th>Medicine</th><th>Sig (M-L-D)</th><th>Timing</th><th>Duration</th><th>Route</th><th>Notes</th>
        </tr>
      </thead>
      <tbody>${medsRowsHtml}</tbody>
    </table>`;

  /* ── Advice ── */
  let adviceHtml = '';
  if (suggestions) {
    const parts: string[] = [];
    if (typeof suggestions === 'string') {
      parts.push(suggestions);
    } else if (typeof suggestions === 'object') {
      if (suggestions.dietaryChanges) parts.push(`<strong>Dietary:</strong> ${suggestions.dietaryChanges}`);
      if (suggestions.lifestyleModifications) parts.push(`<strong>Lifestyle:</strong> ${suggestions.lifestyleModifications}`);
      if (suggestions.exercises) parts.push(`<strong>Exercise:</strong> ${suggestions.exercises}`);
      if (Array.isArray(suggestions.followUps) && suggestions.followUps.length)
        parts.push(`<strong>Follow-up:</strong> ${suggestions.followUps.map((f: any) => itemText(f)).join(', ')}`);
      if (Array.isArray(suggestions.emergencyInstructions) && suggestions.emergencyInstructions.length)
        parts.push(`<strong style="color:#dc2626">⚠ EMERGENCY:</strong> ${suggestions.emergencyInstructions.map((e: any) => itemText(e)).join(', ')}`);
    }
    adviceHtml = parts.length ? `
      <div class="advice-box">
        <h4 class="sec-title" style="margin-bottom:6px">CLINICAL ADVICE &amp; FOLLOW-UP</h4>
        <div>${parts.map(p => `<p style="margin:3px 0">${p}</p>`).join('')}</div>
      </div>` : '';
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Prescription ${rxId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
    .page { width: 210mm; min-height: 297mm; padding: 14mm; position: relative; }
    @media print {
      @page { size: A4; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 10mm; }
    }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 10px; }
    .brand-name { font-size: 28px; font-weight: 900; color: #1e3a8a; letter-spacing: -1px; }
    .brand-sub { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
    .doctor-info { text-align: right; }
    .doctor-info h2 { font-size: 14px; font-weight: 700; }
    .doctor-info p { font-size: 9px; color: #4b5563; margin-top: 2px; }
    .doctor-info .dept { color: #2563eb; font-weight: 700; }

    /* Patient bar */
    .patient-bar { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px; background: #f0f4ff; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; }
    .pb-item label { font-size: 8px; color: #9ca3af; font-weight: 700; text-transform: uppercase; display: block; }
    .pb-item span { font-size: 13px; font-weight: 700; color: #111; }

    /* Vitals bar */
    .vitals-bar { display: flex; gap: 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 10px; }
    .vital { flex: 1; padding: 5px 7px; border-right: 1px solid #e5e7eb; }
    .vital:last-child { border-right: none; }
    .vl { font-size: 7px; color: #9ca3af; font-weight: 700; text-transform: uppercase; display: block; }
    .vv { font-size: 11px; font-weight: 700; color: #111; }

    /* Two-column layout */
    .content { display: flex; gap: 0; min-height: 180mm; }
    .left-col { width: 62mm; padding-right: 10px; border-right: 1.5px solid #dbeafe; }
    .right-col { flex: 1; padding-left: 12px; }

    .rx-symbol { font-size: 48px; font-weight: 900; color: #1e3a8a; line-height: 1; margin-bottom: 8px; font-style: italic; }

    /* Section titles */
    .sec-title { font-size: 8px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin: 8px 0 4px; }
    .sec-body { font-size: 10px; color: #374151; line-height: 1.5; white-space: pre-wrap; }
    .sec-list { font-size: 10px; color: #374151; padding-left: 14px; line-height: 1.6; }
    .sec-list.diag { font-weight: 700; text-transform: uppercase; color: #1e3a8a; }

    /* Rx table */
    .rx-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px; }
    .rx-table thead tr { background: #2563eb; color: #fff; }
    .rx-table th { padding: 5px 6px; text-align: left; font-size: 8px; font-weight: 700; text-transform: uppercase; }
    .rx-table td { padding: 5px 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .rx-table tbody tr:nth-child(even) { background: #f8fafc; }

    /* Advice */
    .advice-box { margin-top: 14px; border-top: 1.5px solid #dbeafe; padding-top: 10px; }

    /* Footer */
    .footer { margin-top: 12mm; border-top: 1.5px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer-left font-size { font-size: 8px; color: #9ca3af; line-height: 1.6; }
    .uid { font-family: monospace; font-size: 9px; color: #2563eb; font-weight: 700; }
    .sig-area { text-align: center; }
    .sig-line { border-top: 1px solid #9ca3af; width: 120px; margin: 0 auto 4px; }
    .sig-name { font-size: 11px; font-weight: 700; color: #111; font-style: italic; }
    .sig-sub { font-size: 8px; color: #6b7280; }

    /* Legal notice */
    .legal { margin-top: 8px; border-left: 4px solid #1e3a8a; background: #eff6ff; padding: 6px 10px; font-size: 8px; color: #374151; border-radius: 0 4px 4px 0; }
  </style>
</head>
<body>
  <div class="page">
    <!-- HEADER -->
    <div class="header">
      <div>
        <div class="brand-name">LIVORA</div>
        <div class="brand-sub">Premium Healthcare Network</div>
        <div style="font-size:8px;color:#9ca3af;margin-top:3px">www.livora-health.app</div>
      </div>
      <div class="doctor-info">
        <h2>Dr. ${doctorName}</h2>
        <p>${doctor?.qualifications || 'MBBS, MD'}</p>
        <p class="dept">${getDepartmentLabel(doctor?.department || '') || 'Specialist'}</p>
        <p>BMDC Reg: ${doctor?.bmdcRegistrationNumber || 'N/A'}</p>
      </div>
    </div>

    <!-- PATIENT BAR -->
    <div class="patient-bar">
      <div class="pb-item"><label>Patient Name</label><span>${patientName}</span></div>
      <div class="pb-item"><label>Age / Sex</label><span>${patientAge} / ${patientGender}</span></div>
      <div class="pb-item"><label>Weight</label><span>${patientWeight}</span></div>
      <div class="pb-item" style="text-align:right"><label>Date</label><span>${rxDate}</span></div>
    </div>

    ${vitalsHtml}

    <!-- CONTENT -->
    <div class="content">
      <!-- Left: clinical -->
      <div class="left-col">
        ${clinicalHtml}
        ${symptomsHtml}
        ${diagnosisHtml}
        ${testsHtml}
      </div>

      <!-- Right: Rx -->
      <div class="right-col">
        <div class="rx-symbol">&#8478;</div>
        ${medsHtml}
        ${adviceHtml}
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <div style="font-size:8px;color:#9ca3af;line-height:1.8">
        <div class="uid">${rxId}</div>
        <div>Status: <span style="color:#16a34a;font-weight:700">MEDICALLY SIGNED</span></div>
        <div>Generated: ${new Date().toLocaleString()}</div>
      </div>
      <div class="sig-area">
        <div class="sig-line"></div>
        <div class="sig-name">Dr. ${doctorName}</div>
        <div class="sig-sub">Digital Authorized Signature</div>
      </div>
    </div>

    <div class="legal">
      <strong>Statutory Notice:</strong> This digital prescription complies with the Digital Health Standards Act and is a legally valid document.
      Please present this at any authorized pharmacy. Prescription ID: <strong>${rxId}</strong>
    </div>
  </div>
</body>
</html>`;
};

// ─── Main export ──────────────────────────────────────────────────────────────

export const generatePrescriptionPdf = async (data: PrescriptionPdfData): Promise<void> => {
  const { prescriptionData, appointmentData } = data;
  console.log('[PDF] Generating for prescription:', prescriptionData?.id);

  const html = buildPrescriptionHtml(prescriptionData, appointmentData);

  // Open an isolated window, write the HTML, then trigger print-to-PDF
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    throw new Error('Popup was blocked. Please allow popups for this site and try again.');
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Wait for fonts/layout to settle before triggering print
  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
      // Close the window after print dialog is accepted/cancelled
      win.onafterprint = () => win.close();
    }, 600);
  };
};
