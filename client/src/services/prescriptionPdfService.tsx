import React from 'react';
import { createRoot } from 'react-dom/client';
import PrescriptionTemplate from '../components/PrescriptionTemplate';
import html2pdf from 'html2pdf.js';

export interface PrescriptionPdfData {
  prescriptionData: any;
  appointmentData: any;
}

export const generatePrescriptionPdf = async (data: PrescriptionPdfData): Promise<void> => {
  return new Promise((resolve, reject) => {
    const { prescriptionData, appointmentData } = data;
    console.log('[PDF] Generating high-fidelity PDF from component for:', prescriptionData?.id);

    try {
      // 1. Create a container that is part of the document flow but hidden
      const container = document.createElement('div');
      container.id = `pdf-gen-container-${Date.now()}`;
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '794px'; // Standard A4 pixel width at 96dpi
      container.style.height = 'auto';
      container.style.zIndex = '-9999';
      container.style.visibility = 'hidden';
      container.style.overflow = 'hidden';
      container.style.backgroundColor = 'white';
      
      document.body.appendChild(container);

      // 2. Render the React component inside the app context
      const root = createRoot(container);
      
      root.render(
        <div id="pdf-export-wrapper" className="bg-white">
          <PrescriptionTemplate 
            prescriptionData={prescriptionData} 
            appointmentData={appointmentData} 
            isPdf={true}
          />
        </div>
      );

      // 3. Wait for render to commit, images to load, and fonts to settle
      // Use a generous timeout to ensure all assets are ready for high-fidelity capture
      setTimeout(async () => {
        try {
          const exportWrapper = container.querySelector('#pdf-export-wrapper');
          if (!exportWrapper) throw new Error("Wrapper not found");

          const rxId = `RX-${prescriptionData?.id || 'APT'}-${appointmentData?.id || ''}`;
          
          const opt = {
            margin:       0,
            filename:     `Prescription_${rxId}.pdf`,
            image:        { type: 'jpeg' as const, quality: 1.0 },
            html2canvas:  { 
              scale: 2, 
              useCORS: true, 
              letterRendering: true,
              backgroundColor: '#ffffff',
              scrollY: 0,
              windowWidth: 794
            },
            jsPDF: { 
              unit: 'px' as const, 
              format: [794, 1123] as [number, number], 
              orientation: 'portrait' as const,
              compress: true
            }
          };

          // Generate and save
          await html2pdf().set(opt).from(exportWrapper as HTMLElement).save();
          
          // 4. Cleanup
          setTimeout(() => {
            root.unmount();
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
          }, 500);
          
          resolve();
        } catch (pdfError) {
          console.error('[PDF] html2pdf generation failed:', pdfError);
          // Cleanup on fail
          root.unmount();
          if (document.body.contains(container)) {
            document.body.removeChild(container);
          }
          reject(pdfError);
        }
      }, 1500);
    } catch (error) {
      console.error('[PDF] Setup wrapper failed:', error);
      reject(error);
    }
  });
};
