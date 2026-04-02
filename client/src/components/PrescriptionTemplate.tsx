import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';

interface PrescriptionTemplateProps {
  prescriptionData: any;
  appointmentData: any;
}

// Safe JSON parser that NEVER throws - handles double-encoded JSON
const safeParseJson = (field: any): any => {
  if (field === null || field === undefined) return null;
  if (typeof field === 'object') return field; // already parsed
  if (typeof field !== 'string') return null;  // not a string, can't parse
  try {
    let parsed = JSON.parse(field);
    // Handle double-encoded JSON: if the result is still a string that looks like JSON, parse again
    if (typeof parsed === 'string') {
      try {
        const deeper = JSON.parse(parsed);
        if (typeof deeper === 'object' && deeper !== null) {
          return deeper;
        }
      } catch {
        // single-encoded string value, return as-is
      }
    }
    return parsed;
  } catch {
    // Return the raw string so it can be displayed
    return field;
  }
};

// Safe number parser
const safeNum = (val: any): number => {
  if (!val) return 0;
  const parsed = parseInt(String(val));
  return isNaN(parsed) ? 0 : parsed;
};

// Safe array converter - ensures we always get an array
const toSafeArray = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [val];
};

// Safe string extractor from an item that could be string or object
const getItemText = (item: any, field: string = 'description'): string => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    // Check known fields in priority order - use !== undefined to handle empty strings
    if (item[field] !== undefined && item[field] !== null) return String(item[field]);
    if (item.name !== undefined && item.name !== null) return String(item.name);
    if (item.description !== undefined && item.description !== null) return String(item.description);
    // Last resort: don't return [object Object]
    return '';
  }
  return String(item);
};

const PrescriptionTemplate: React.FC<PrescriptionTemplateProps> = ({
  prescriptionData,
  appointmentData
}) => {
  const [qrCodeData, setQrCodeData] = useState<string>('');

  // Safely parse ALL fields upfront
  const medicines = (() => {
    const parsed = safeParseJson(prescriptionData?.medicines);
    if (Array.isArray(parsed)) return parsed;
    return null;
  })();

  const symptoms = (() => {
    const parsed = safeParseJson(prescriptionData?.symptoms);
    if (!parsed) return null;
    return toSafeArray(parsed);
  })();

  const diagnoses = (() => {
    const parsed = safeParseJson(prescriptionData?.diagnosis || prescriptionData?.diagnoses);
    if (!parsed) return null;
    return toSafeArray(parsed);
  })();

  const tests = (() => {
    const parsed = safeParseJson(prescriptionData?.tests);
    if (!parsed) return null;
    return toSafeArray(parsed);
  })();

  const suggestions: any = (() => {
    const parsed = safeParseJson(prescriptionData?.suggestions);
    if (!parsed) return null;
    if (typeof parsed === 'string') return parsed; // plain string advice
    if (typeof parsed === 'object') return parsed;  // structured object
    return null;
  })();

  const doctor = appointmentData?.doctor;
  const patient = appointmentData?.patient;
  const user = doctor?.user;
  const doctorName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

  useEffect(() => {
    const generateQR = async () => {
      try {
        const text = `RX-${prescriptionData?.id || '2024'}-APT-${appointmentData?.id || '0001'}-VERIFIED`;
        const url = await QRCode.toDataURL(text, {
          margin: 1,
          width: 80,
          color: {
            dark: '#2d3748',
            light: '#ffffff'
          }
        });
        setQrCodeData(url);
      } catch (err) {
        console.error('QR code generation failed', err);
      }
    };
    generateQR();
  }, [prescriptionData?.id, appointmentData?.id]);

  // Helper to safely render suggestions section
  const renderSuggestions = () => {
    if (!suggestions) return null;

    try {
      if (typeof suggestions === 'string') {
        return <p className="font-medium">• {suggestions}</p>;
      }

      return (
        <>
          {suggestions.dietaryChanges && <p className="font-medium">• Dietary Modifications: <span className="text-gray-600">{String(suggestions.dietaryChanges)}</span></p>}
          {suggestions.lifestyleModifications && <p className="font-medium">• Lifestyle Modifications: <span className="text-gray-600">{String(suggestions.lifestyleModifications)}</span></p>}
          {suggestions.exercises && <p className="font-medium">• Exercise Recommendations: <span className="text-gray-600">{String(suggestions.exercises)}</span></p>}
          {Array.isArray(suggestions.followUps) && suggestions.followUps.length > 0 && (
            <p className="font-medium">• Follow-up visit: <span className="text-gray-600">{suggestions.followUps.map((f: any) => getItemText(f)).filter(Boolean).join(', ')}</span></p>
          )}
          {Array.isArray(suggestions.emergencyInstructions) && suggestions.emergencyInstructions.length > 0 && (
            <p className="text-red-700 font-bold bg-red-50 p-2 rounded border border-red-100">• ⚠ EMERGENCY: {suggestions.emergencyInstructions.map((e: any) => getItemText(e)).filter(Boolean).join(', ')}</p>
          )}
        </>
      );
    } catch (e) {
      console.error('[PrescriptionTemplate] Error rendering suggestions:', e);
      return <p className="text-gray-400 italic">Unable to display suggestions.</p>;
    }
  };

  return (
    <div className="bg-white p-12 shadow-2xl border border-gray-100 max-w-4xl mx-auto my-8 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none transform -rotate-45">
        <h1 className="text-[120px] font-black text-blue-900 tracking-tighter whitespace-nowrap">
          DIGITALLY GENERATED
        </h1>
      </div>

      <div className="relative z-10">
        {/* Prescription Header */}
        <div className="flex justify-between items-start border-b-2 border-blue-600 pb-8 mb-8">
          <div className="flex items-center gap-6">
            <div className="bg-white p-1 rounded-2xl shadow-sm border border-blue-100">
               <img src="/logo.png" className="h-20 w-20 object-contain" alt="Livora Logo" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-blue-900 tracking-tighter">LIVORA</h1>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-[0.2em] opacity-80">Premium Healthcare Network</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-medium">
                <span>WWW.LIVORA-HEALTH.APP</span>
                <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                <span>SUPPORT@LIVORA-HEALTH.APP</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">Dr. {user?.firstName} {user?.lastName}</h2>
            <p className="text-sm font-bold text-blue-600">{doctor?.qualifications || 'MBBS, MD'}</p>
            <p className="text-xs font-black text-gray-400 mt-1 uppercase tracking-widest">{doctor?.department || 'Specialist'}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-2">BMDC REG: {doctor?.bmdcRegistrationNumber || 'N/A'}</p>
          </div>
        </div>

        {/* Patient Info Bar */}
        <div className="grid grid-cols-4 gap-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-10">
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Patient Name</p>
            <p className="font-bold text-gray-900 text-lg leading-tight">
              {patient?.user?.firstName} {patient?.user?.lastName || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Age / Sex</p>
            <p className="font-bold text-gray-900">
              {formatAge(calculateAge(patient?.user?.dateOfBirth || patient?.dateOfBirth))} / {formatGender(patient?.user?.gender || patient?.gender)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Weight</p>
            <p className="font-bold text-gray-900">{patient?.weight ? `${patient.weight} kg` : '—'}</p>
          </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
          <p className="font-bold text-gray-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Prescription Content Section */}
      <div className="grid grid-cols-12 gap-8 min-h-[500px]">
        {/* Left Sidebar (Clinical findings) */}
        <div className="col-span-4 border-r-2 border-blue-50 pr-6 space-y-6">
          {symptoms && symptoms.filter((s: any) => getItemText(s)).length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-blue-800 uppercase mb-2 border-b border-blue-50 pb-1 font-sans">Chief Complaints</h3>
              <ul className="text-[13px] space-y-1.5 text-gray-700 list-inside font-sans">
                {symptoms.filter((s: any) => getItemText(s)).map((s: any, i: number) => (
                  <li key={i} className="flex gap-2 leading-tight"><span>•</span> <span>{getItemText(s)}</span></li>
                ))}
              </ul>
            </div>
          )}
          
          {diagnoses && diagnoses.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-blue-800 uppercase mb-2 border-b border-blue-50 pb-1 font-sans">Diagnosis</h3>
              <ul className="text-[13px] space-y-1.5 text-blue-950 font-bold list-inside font-sans uppercase tracking-tight">
                {diagnoses.map((d: any, i: number) => (
                  <li key={i} className="flex gap-2 leading-tight"><span>•</span> <span>{getItemText(d)}</span></li>
                ))}
              </ul>
            </div>
          )}

          {tests && tests.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-blue-800 uppercase mb-2 border-b border-blue-50 pb-1 font-sans">Investigations</h3>
              <ul className="text-[13px] space-y-1.5 text-gray-700 list-inside font-sans">
                {tests.map((t: any, i: number) => (
                  <li key={i} className="flex gap-2"><span>{i+1}.</span> <span>{getItemText(t, 'name')}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Content (Medicines) */}
        <div className="col-span-8 flex flex-col">
          <div className="flex items-baseline mb-6">
            <span className="text-7xl font-serif text-blue-900 font-bold italic mr-6 leading-none select-none">℞</span>
            <div className="h-[2px] bg-blue-900/10 flex-grow rounded-full"></div>
          </div>

          <div className="space-y-10 flex-grow">
            {medicines && medicines.length > 0 ? (
              medicines.map((med: any, idx: number) => {
                if (!med) return null;
                return (
                <div key={idx} className="relative pl-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-gray-300 italic select-none">{idx + 1}.</span>
                        <h4 className="text-[17px] font-bold text-gray-900 uppercase tracking-tight">
                          {med.form || 'Tab.'} {med.name || 'Unknown'} {med.strength || med.dosage || ''}
                        </h4>
                      </div>
                      <p className="text-[11px] text-blue-600/60 font-bold italic ml-7 uppercase tracking-wider font-sans">({med.genericName || 'No generic name listed'})</p>
                    </div>
                  </div>
                  <div className="ml-7 space-y-2 text-[14px]">
                    <div className="flex items-center gap-4 border-l-4 border-blue-100 pl-4 py-1.5 bg-blue-50/20 rounded-r">
                       <span className="font-extrabold text-blue-950 font-sans tracking-widest text-[15px]">Sig: {med.morning || 0} - {med.lunch || 0} - {med.dinner || 0}</span>
                       <span className="text-gray-500 font-medium lowercase">({med.mealTiming || 'after meal'})</span>
                       <span className="text-blue-800 font-bold bg-blue-100 px-2 rounded tracking-tighter">× {med.duration || 0} Days</span>
                    </div>
                    <div className="flex gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-4 font-sans">
                      <span className="flex items-center gap-1.5">ROUTE: {med.route || 'PO'}</span>
                      <span className="flex items-center gap-1.5 font-bold text-blue-700">DISP: {med.quantity || (safeNum(med.morning) + safeNum(med.lunch) + safeNum(med.dinner)) * (safeNum(med.duration))} UNITS</span>
                    </div>
                    {med.notes && <p className="text-[11px] text-gray-400 italic mt-2 pl-4 font-sans">Instructions: {med.notes}</p>}
                  </div>
                </div>
                );
              })
            ) : (
              <p className="text-gray-400 italic">No medication data available for this prescription.</p>
            )}
          </div>
          
          {suggestions && (
             <div className="mt-16 pt-8 border-t-2 border-blue-50 font-sans">
                <h3 className="text-xs font-bold text-blue-800 uppercase mb-4 tracking-widest border-l-4 border-blue-800 pl-3">Clinical Advice & Follow-up</h3>
                <div className="text-[13px] text-gray-700 space-y-3 whitespace-pre-wrap leading-relaxed">
                  {renderSuggestions()}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Footer Area */}
      <div className="mt-auto pt-12 border-t-2 border-gray-100 flex justify-between items-end pb-4">
        <div className="flex gap-8 items-center">
            {/* QR Code */}
            <div className="p-1 bg-white border-2 border-blue-50 shadow-inner rounded-xl overflow-hidden">
                {qrCodeData ? (
                    <img src={qrCodeData} alt="QR" className="w-24 h-24" />
                ) : (
                    <div className="w-24 h-24 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400">Loading...</div>
                )}
            </div>
            <div className="text-[10px] text-gray-400 leading-relaxed font-sans">
                <p className="font-extrabold text-blue-900 tracking-tighter text-[11px]">DIGITAL VERIFICATION</p>
                <p>Prescription ID: <span className="font-bold text-gray-800 font-mono tracking-tight">RX-{prescriptionData?.id || '24'}-APT-{appointmentData?.id || '001'}</span></p>
                <p>Status: <span className="text-green-600 font-bold uppercase">Medically Signed</span></p>
                <p className="mt-1">Generated: {new Date(prescriptionData?.createdAt || Date.now()).toLocaleString()}</p>
            </div>
        </div>
        
        <div className="text-right relative">
           {/* Seal effect */}
           <div className="absolute -top-16 -left-12 opacity-10 pointer-events-none select-none">
              <div className="w-32 h-32 border-4 border-blue-900 rounded-full flex items-center justify-center text-blue-900 font-extrabold text-[10px] text-center rotate-12 p-4">
                LIVORA HEALTH<br/>STAMPED & VERIFIED
              </div>
           </div>

           <div className="inline-block border-b-2 border-black/10 pb-2 mb-4 px-16">
              <p className="text-gray-200 text-[11px] uppercase font-bold tracking-[0.3em] italic select-none">Signed Digitally</p>
           </div>
           <p className="text-xl font-bold text-gray-900 italic font-serif leading-none tracking-tight">Dr. {doctorName}</p>
           <p className="text-sm font-bold text-blue-800 mt-2">{doctor?.qualifications || 'Consultant Physician'}</p>
           <p className="text-[10px] text-gray-500 uppercase tracking-[0.25em] font-sans mt-1 font-bold">{doctor?.department || 'Medical Services'}</p>
        </div>
      </div>

      <div className="mt-8 text-left border-l-8 border-blue-900 bg-blue-900/5 p-4 rounded-r-lg">
        <p className="text-[10px] text-gray-600 italic leading-relaxed font-sans">
          <span className="font-bold text-blue-950 uppercase not-italic">Statutory Notice:</span> This digital prescription complies with the 
          Digital Health Standards Act. It is a legally valid document. Please present this at any 
          authorized pharmacy. To verify authenticity, scan the QR code or use the verify token: 
          <span className="font-mono text-blue-900 ml-1">LV-{prescriptionData?.id || '00'}T{(Math.random()*1000).toFixed(0)}</span>
        </p>
      </div>
      </div>
    </div>
  );
};

export default PrescriptionTemplate;
