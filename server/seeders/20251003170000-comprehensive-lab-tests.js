'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const labTests = [
      // Blood Tests
      {
        name: 'A1C test',
        description: 'Measures average blood sugar over 2-3 months',
        category: 'Blood Tests',
        price: 150.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ACE blood test',
        description: 'Angiotensin converting enzyme test',
        category: 'Blood Tests',
        price: 200.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ACTH blood test',
        description: 'Adrenocorticotropic hormone test',
        category: 'Blood Tests',
        price: 300.00,
        sampleType: 'Blood',
        preparationInstructions: 'Fasting may be required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Alanine transaminase (ALT) blood test',
        description: 'Liver function test',
        category: 'Blood Tests',
        price: 120.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Albumin blood (serum) test',
        description: 'Protein level measurement',
        category: 'Blood Tests',
        price: 100.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Basic metabolic panel',
        description: 'Comprehensive blood chemistry panel',
        category: 'Blood Tests',
        price: 250.00,
        sampleType: 'Blood',
        preparationInstructions: 'Fasting 8-12 hours required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Comprehensive metabolic panel',
        description: 'Extended blood chemistry panel',
        category: 'Blood Tests',
        price: 350.00,
        sampleType: 'Blood',
        preparationInstructions: 'Fasting 8-12 hours required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Imaging Tests
      {
        name: 'Abdominal CT scan',
        description: 'Computed tomography of abdomen',
        category: 'Imaging Tests',
        price: 800.00,
        sampleType: 'N/A',
        preparationInstructions: 'Fasting 4-6 hours, contrast may be required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Abdominal MRI scan',
        description: 'Magnetic resonance imaging of abdomen',
        category: 'Imaging Tests',
        price: 1200.00,
        sampleType: 'N/A',
        preparationInstructions: 'No metal objects, contrast may be required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Abdominal ultrasound',
        description: 'Ultrasound examination of abdomen',
        category: 'Imaging Tests',
        price: 400.00,
        sampleType: 'N/A',
        preparationInstructions: 'Fasting 6-8 hours for better visualization',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chest CT',
        description: 'Computed tomography of chest',
        category: 'Imaging Tests',
        price: 750.00,
        sampleType: 'N/A',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chest MRI',
        description: 'Magnetic resonance imaging of chest',
        category: 'Imaging Tests',
        price: 1100.00,
        sampleType: 'N/A',
        preparationInstructions: 'No metal objects, contrast may be required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Chest x-ray',
        description: 'Radiographic examination of chest',
        category: 'Imaging Tests',
        price: 150.00,
        sampleType: 'N/A',
        preparationInstructions: 'Remove jewelry and metal objects',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Urine Tests
      {
        name: 'Urinalysis',
        description: 'Complete urine analysis',
        category: 'Urine Tests',
        price: 80.00,
        sampleType: 'Urine',
        preparationInstructions: 'Clean catch midstream sample',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Urine culture',
        description: 'Bacterial culture of urine',
        category: 'Urine Tests',
        price: 120.00,
        sampleType: 'Urine',
        preparationInstructions: 'Clean catch midstream sample',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '24-hour urine protein',
        description: '24-hour urine protein collection',
        category: 'Urine Tests',
        price: 200.00,
        sampleType: 'Urine',
        preparationInstructions: '24-hour collection with preservative',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Cardiac Tests
      {
        name: 'Electrocardiogram',
        description: 'ECG/EKG heart rhythm test',
        category: 'Cardiac Tests',
        price: 200.00,
        sampleType: 'N/A',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Echocardiogram',
        description: 'Ultrasound of the heart',
        category: 'Cardiac Tests',
        price: 600.00,
        sampleType: 'N/A',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Stress echocardiography',
        description: 'Exercise stress test with echo',
        category: 'Cardiac Tests',
        price: 800.00,
        sampleType: 'N/A',
        preparationInstructions: 'Avoid caffeine, wear comfortable clothes',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Thyroid Tests
      {
        name: 'TSH test',
        description: 'Thyroid stimulating hormone',
        category: 'Hormone Tests',
        price: 150.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'T3 test',
        description: 'Triiodothyronine test',
        category: 'Hormone Tests',
        price: 180.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'T4 test',
        description: 'Thyroxine test',
        category: 'Hormone Tests',
        price: 180.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Cancer Screening
      {
        name: 'CA-125 blood test',
        description: 'Ovarian cancer marker',
        category: 'Cancer Screening',
        price: 300.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'PSA blood test',
        description: 'Prostate specific antigen',
        category: 'Cancer Screening',
        price: 250.00,
        sampleType: 'Blood',
        preparationInstructions: 'No ejaculation 48 hours before test',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mammogram',
        description: 'Breast cancer screening',
        category: 'Cancer Screening',
        price: 400.00,
        sampleType: 'N/A',
        preparationInstructions: 'No deodorant or powder on day of test',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Complete Blood Count (CBC)',
        description: 'Comprehensive blood analysis including RBC, WBC, platelets, hemoglobin levels',
        category: 'Hematology',
        price: 800.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required. Fasting not necessary.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Lipid Profile',
        description: 'Cholesterol, triglycerides, HDL, LDL analysis for cardiovascular health',
        category: 'Biochemistry',
        price: 1200.00,
        sampleType: 'Blood',
        preparationInstructions: '12-hour fasting required. Only water allowed.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Liver Function Test (LFT)',
        description: 'ALT, AST, bilirubin, alkaline phosphatase to assess liver health',
        category: 'Biochemistry',
        price: 1000.00,
        sampleType: 'Blood',
        preparationInstructions: '8-hour fasting recommended.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Kidney Function Test (KFT)',
        description: 'Creatinine, urea, uric acid to evaluate kidney function',
        category: 'Biochemistry',
        price: 900.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Thyroid Function Test (TFT)',
        description: 'TSH, T3, T4 levels to assess thyroid gland function',
        category: 'Endocrinology',
        price: 1500.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required. Take morning sample.',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Diabetes Panel (HbA1c + Glucose)',
        description: 'HbA1c and fasting glucose for diabetes monitoring',
        category: 'Endocrinology',
        price: 1100.00,
        sampleType: 'Blood',
        preparationInstructions: '8-hour fasting required for glucose test.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Urine Routine Examination',
        description: 'Complete urine analysis including protein, glucose, microscopy',
        category: 'Urology',
        price: 300.00,
        sampleType: 'Urine',
        preparationInstructions: 'Collect first morning urine sample in sterile container.',
        reportDeliveryTime: 12,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Stool Routine Examination',
        description: 'Microscopic examination for parasites, bacteria, blood',
        category: 'Microbiology',
        price: 400.00,
        sampleType: 'Stool',
        preparationInstructions: 'Collect fresh sample in sterile container. Avoid contamination.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Hepatitis B Surface Antigen (HBsAg)',
        description: 'Screening test for Hepatitis B virus infection',
        category: 'Serology',
        price: 600.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'HIV Screening Test',
        description: 'Antibody test for HIV-1 and HIV-2',
        category: 'Serology',
        price: 800.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required. Confidential testing.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Vitamin D (25-OH)',
        description: '25-hydroxyvitamin D level to assess vitamin D status',
        category: 'Endocrinology',
        price: 2000.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Vitamin B12',
        description: 'Serum vitamin B12 level measurement',
        category: 'Biochemistry',
        price: 1800.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'C-Reactive Protein (CRP)',
        description: 'Inflammatory marker to detect infection or inflammation',
        category: 'Immunology',
        price: 700.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Erythrocyte Sedimentation Rate (ESR)',
        description: 'Non-specific test for inflammation and infection',
        category: 'Hematology',
        price: 200.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Prostate Specific Antigen (PSA)',
        description: 'Screening test for prostate health in men',
        category: 'Oncology',
        price: 1500.00,
        sampleType: 'Blood',
        preparationInstructions: 'Avoid ejaculation 48 hours before test.',
        reportDeliveryTime: 48,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pregnancy Test (Beta hCG)',
        description: 'Quantitative pregnancy hormone test',
        category: 'Endocrinology',
        price: 500.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required. Best done after missed period.',
        reportDeliveryTime: 12,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Blood Group & Rh Typing',
        description: 'ABO blood group and Rh factor determination',
        category: 'Hematology',
        price: 300.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dengue NS1 Antigen',
        description: 'Early detection test for dengue fever',
        category: 'Serology',
        price: 1200.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required. Best within first 7 days of fever.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Malaria Parasite (MP)',
        description: 'Microscopic examination for malaria parasites',
        category: 'Microbiology',
        price: 400.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required. Best during fever episode.',
        reportDeliveryTime: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Widal Test',
        description: 'Serological test for typhoid fever',
        category: 'Serology',
        price: 350.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('lab_tests', labTests, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('lab_tests', null, {});
  }
};
