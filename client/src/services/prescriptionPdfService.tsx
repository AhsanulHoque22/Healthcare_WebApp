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
      
      // We pass userRole "patient" so UI knows how to render
      root.render(
        <div id="pdf-export-wrapper" style={{ padding: '0px' }}>
          <PrescriptionTemplate 
            prescriptionData={prescriptionData} 
            appointmentData={appointmentData} 
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
            margin:       [0.5, 0.5, 0.5, 0.5], // half inch margin
            filename:     `Prescription_${rxId}.pdf`,
            image:        { type: 'jpeg', quality: 1.0 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
          };

          // Generate and save
          await html2pdf().set(opt).from(exportWrapper).save();
          
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
