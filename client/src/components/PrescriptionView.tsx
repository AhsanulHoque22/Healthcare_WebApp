import React from 'react';
import { DocumentArrowDownIcon, PrinterIcon } from '@heroicons/react/24/outline';
import PrescriptionTemplate from './PrescriptionTemplate';
import { generatePrescriptionPdf } from '../services/prescriptionPdfService';

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
  const handleInternalDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      await generatePrescriptionPdf({ prescriptionData, appointmentData });
    }
  };

  if (!prescriptionData) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-medium italic">No prescription data available for this appointment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">Digital Prescription</h3>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Valid & Verified Document</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
            title="Print Prescription"
          >
            <PrinterIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleInternalDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Download high-fidelity PDF
          </button>
        </div>
      </div>

      {/* The Actual Prescription Form */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[800px] mx-auto">
          <PrescriptionTemplate 
            prescriptionData={prescriptionData} 
            appointmentData={appointmentData} 
          />
        </div>
      </div>

      {/* Helper info for patients */}
      {userRole === 'patient' && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-4 items-start">
           <div className="bg-blue-600 p-1.5 rounded-lg text-white mt-0.5">
              <DocumentArrowDownIcon className="h-4 w-4" />
           </div>
           <div className="text-sm">
              <p className="text-blue-900 font-bold">Important Note</p>
              <p className="text-blue-700 leading-relaxed font-medium">
                You can download the high-fidelity PDF and present it at any pharmacy. 
                The QR code on the prescription allows pharmacists to verify its authenticity instantly.
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionView;
