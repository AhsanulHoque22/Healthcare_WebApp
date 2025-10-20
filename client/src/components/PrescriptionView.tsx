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
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESCRIPTION', 105, 20, { align: 'center' });
    
    // Line under header
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    let yPos = 35;
    
    // Patient and Doctor Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (appointmentData) {
      doc.text(`Patient: ${appointmentData.patient?.user?.firstName || ''} ${appointmentData.patient?.user?.lastName || ''}`, 20, yPos);
      yPos += 6;
      doc.text(`Doctor: Dr. ${appointmentData.doctor?.user?.firstName || ''} ${appointmentData.doctor?.user?.lastName || ''}`, 20, yPos);
      yPos += 6;
      doc.text(`Date: ${new Date(appointmentData.appointmentDate).toLocaleDateString()}`, 20, yPos);
      yPos += 6;
      doc.text(`Appointment ID: ${appointmentData.id}`, 20, yPos);
      yPos += 10;
    }
    
    // Medicines
    if (medicines && Array.isArray(medicines) && medicines.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('MEDICINES PRESCRIBED:', 20, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      medicines.forEach((medicine: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${index + 1}. ${medicine.name} - ${medicine.dosage}mg`, 25, yPos);
        yPos += 5;
        doc.text(`   Schedule: ${medicine.morning}+${medicine.lunch}+${medicine.dinner} (${medicine.mealTiming} meal)`, 25, yPos);
        yPos += 5;
        if (medicine.notes) {
          const lines = doc.splitTextToSize(`   Notes: ${medicine.notes}`, 160);
          doc.text(lines, 25, yPos);
          yPos += lines.length * 5;
        }
        yPos += 3;
      });
      yPos += 5;
    }
    
    // Symptoms
    if (symptoms && Array.isArray(symptoms) && symptoms.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SYMPTOMS:', 20, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      symptoms.forEach((symptom: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const lines = doc.splitTextToSize(`${index + 1}. ${symptom.description || symptom}`, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5 + 2;
      });
      yPos += 5;
    }
    
    // Diagnosis
    if (diagnoses && Array.isArray(diagnoses) && diagnoses.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DIAGNOSIS:', 20, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      diagnoses.forEach((diagnosis: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        let text = `${index + 1}. ${diagnosis.description || diagnosis}`;
        if (diagnosis.date) {
          text += ` (Date: ${diagnosis.date})`;
        }
        const lines = doc.splitTextToSize(text, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5 + 2;
      });
      yPos += 5;
    }
    
    // Tests Ordered
    if (tests && Array.isArray(tests) && tests.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TESTS ORDERED:', 20, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      tests.forEach((test: any, index: number) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        let text = `${index + 1}. ${test.name || test}`;
        if (test.description) {
          text += ` - ${test.description}`;
        }
        if (test.status) {
          text += ` (Status: ${test.status})`;
        }
        const lines = doc.splitTextToSize(text, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5 + 2;
      });
      yPos += 5;
    }
    
    // Recommendations
    if (suggestions) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('RECOMMENDATIONS:', 20, yPos);
      yPos += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      if (typeof suggestions === 'object') {
        if (suggestions.exercises) {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.text('Exercises:', 25, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          const exerciseLines = doc.splitTextToSize(suggestions.exercises, 160);
          doc.text(exerciseLines, 25, yPos);
          yPos += exerciseLines.length * 5 + 3;
        }
        
        if (suggestions.followUps && Array.isArray(suggestions.followUps) && suggestions.followUps.length > 0) {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.text('Follow-up Instructions:', 25, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          suggestions.followUps.forEach((followUp: any) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const lines = doc.splitTextToSize(`• ${followUp.description}`, 160);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 5 + 2;
          });
          yPos += 3;
        }
        
        if (suggestions.emergencyInstructions && Array.isArray(suggestions.emergencyInstructions) && suggestions.emergencyInstructions.length > 0) {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(200, 0, 0);
          doc.text('⚠ Emergency Instructions:', 25, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          suggestions.emergencyInstructions.forEach((instruction: any) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            const lines = doc.splitTextToSize(`• ${instruction.description}`, 160);
            doc.text(lines, 25, yPos);
            yPos += lines.length * 5 + 2;
          });
        }
      } else {
        const lines = doc.splitTextToSize(suggestions, 165);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5;
      }
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('This is a computer-generated prescription', 105, 285, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `prescription-${appointmentData?.id || 'document'}-${new Date().toISOString().split('T')[0]}.pdf`;
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
