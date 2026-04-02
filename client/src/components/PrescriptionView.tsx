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

// Error Boundary to prevent white screen crashes
class PrescriptionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PrescriptionView] Render crash caught by Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentArrowDownIcon className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-amber-900 mb-2">Prescription Preview Unavailable</h3>
          <p className="text-amber-700 text-sm mb-4">
            The prescription data for this appointment could not be displayed in the preview.
            You can still try downloading the PDF.
          </p>
          <p className="text-xs text-amber-500 font-mono">{this.state.error}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const PrescriptionView: React.FC<PrescriptionViewProps> = ({ 
  prescriptionData,
  appointmentData,
  onDownload,
  userRole = 'patient'
}) => {
  const handleInternalDownload = async () => {
    try {
      if (onDownload) {
        onDownload();
      } else {
        await generatePrescriptionPdf({ prescriptionData, appointmentData });
      }
    } catch (error) {
      console.error('Download error:', error);
      import('react-hot-toast').then(({ toast }) => {
        toast.error('Failed to generate PDF. Please try again.');
      });
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

      {/* The Actual Prescription Form - wrapped in Error Boundary */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[800px] mx-auto">
          <PrescriptionErrorBoundary>
            <PrescriptionTemplate 
              prescriptionData={prescriptionData} 
              appointmentData={appointmentData} 
            />
          </PrescriptionErrorBoundary>
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
