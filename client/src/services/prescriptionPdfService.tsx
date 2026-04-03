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
      // 1. Create a hidden container attached to the document body
      // It must be attached so that html2canvas can compute external CSS safely
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '800px'; 
      container.style.background = '#ffffff';
      document.body.appendChild(container);

      // 2. Render the React component synchronously 
      const root = createRoot(container);
      
      // We pass isPdf true so component knows to skip web-only shadows/borders
      root.render(
        <div id="pdf-export-wrapper" style={{ margin: '0px', padding: '0px', width: '794px' }}>
          <PrescriptionTemplate 
            prescriptionData={prescriptionData} 
            appointmentData={appointmentData} 
            isPdf={true}
          />
        </div>
      );

      // 3. Wait for render to commit, images to load, and fonts to settle
      setTimeout(async () => {
        try {
          const exportWrapper = container.querySelector('#pdf-export-wrapper');
          if (!exportWrapper) throw new Error("Wrapper not found");

          const rxId = `RX-${prescriptionData?.id || 'APT'}-${appointmentData?.id || ''}`;
          
          const opt = {
            margin:       [0, 0, 0, 0] as [number, number, number, number], // ZERO MARGIN
            filename:     `Prescription_${rxId}.pdf`,
            image:        { type: 'jpeg' as const, quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 794 },
            jsPDF:        { unit: 'px' as const, format: [794, 1123] as [number, number], orientation: 'portrait' as const }
          };

          // Generate and save
          await html2pdf().set(opt).from(exportWrapper as HTMLElement).save();
          
          // 4. Cleanup
          root.unmount();
          document.body.removeChild(container);
          
          resolve();
        } catch (pdfError) {
          root.unmount();
          if (document.body.contains(container)) document.body.removeChild(container);
          console.error('[PDF] html2pdf generation failed:', pdfError);
          reject(pdfError);
        }
      }, 1000); // 1000ms delay to ensure complex QR codes & avatars paint correctly
    } catch (error) {
      console.error('[PDF] Setup wrapper failed:', error);
      reject(error);
    }
  });
};
