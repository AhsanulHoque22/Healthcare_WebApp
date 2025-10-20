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
        name: 'CBC blood test',
        description: 'Complete blood count',
        category: 'Blood Tests',
        price: 180.00,
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation required',
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
      }
    ];

    await queryInterface.bulkInsert('lab_tests', labTests, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('lab_tests', null, {});
  }
};
