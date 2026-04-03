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
      // 1. Create a container that is part of the document flow but off-screen
      const container = document.createElement('div');
      container.id = `pdf-generator-${Date.now()}`;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px'; 
      container.style.height = 'auto'; // allow the container to grow to fit the prescription
      container.style.backgroundColor = 'white';
      
      document.body.appendChild(container);

      // 2. Render the React component inside the app context
      const root = createRoot(container);
      
      root.render(
        <div id="pdf-export-wrapper" style={{ width: '794px', backgroundColor: 'white' }}>
          <PrescriptionTemplate 
            prescriptionData={prescriptionData} 
            appointmentData={appointmentData} 
            isPdf={true}
          />
        </div>
      );

      // 3. Wait for render, images, and fonts to settle
      // Ensure fonts are ready before PDF generation
      if (typeof (document as any).fonts?.ready !== 'undefined') {
        await (document as any).fonts.ready;
      }
      
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
              scale: 3, // higher scale for sharper results
              useCORS: true, 
              logging: false, // minimize noise
              letterRendering: true,
              backgroundColor: '#ffffff',
              scrollY: 0,
              windowWidth: 794 // Lock window width for Tailwind consistency
            },
            jsPDF: { 
              unit: 'mm' as const, 
              format: 'a4' as const, 
              orientation: 'portrait' as const,
              compress: true,
              precision: 16 // Increase precision to avoid rounding errors
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };

          // Generate and save
          await html2pdf().set(opt).from(exportWrapper as HTMLElement).save();
          
          // 4. Final Cleanup
          setTimeout(() => {
            root.unmount();
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
          }, 1000);
          
          resolve();
        } catch (pdfError) {
          console.error('[PDF] High-fidelity generation failed:', pdfError);
          root.unmount();
          if (document.body.contains(container)) document.body.removeChild(container);
          reject(pdfError);
        }
      }, 2000); // Increased timeout significantly to ensure complex layouts stabilize
    } catch (error) {
      console.error('[PDF] Setup wrapper failed:', error);
      reject(error);
    }
  });
};
