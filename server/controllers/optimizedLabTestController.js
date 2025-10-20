const { Op } = require('sequelize');
const { Prescription, Appointment, Doctor, User, LabTest } = require('../models');

// Cache for lab test prices to avoid repeated database queries
let labTestPriceCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get lab test price cache
const getLabTestPriceCache = async () => {
  const now = Date.now();
  
  // Return cached data if it's still valid
  if (labTestPriceCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return labTestPriceCache;
  }
  
  // Fetch fresh data
  console.log('Refreshing lab test price cache...');
  const allLabTests = await LabTest.findAll({
    where: { isActive: true },
    attributes: ['name', 'price']
  });

  // Create a price lookup map for faster access
  const priceLookup = new Map();
  allLabTests.forEach(labTest => {
    const name = labTest.name.toLowerCase();
    priceLookup.set(name, labTest.price);
    
    // Add variations for better matching
    const words = name.split(' ');
    words.forEach(word => {
      if (word.length > 3) {
        priceLookup.set(word, labTest.price);
      }
    });
  });
  
  // Update cache
  labTestPriceCache = priceLookup;
  cacheTimestamp = now;
  
  return priceLookup;
};

// Optimized function to get prescription lab tests for patient
const getPatientPrescriptionLabTestsOptimized = async (req, res, next) => {
  try {
    // Set cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const patientId = req.user.patientId;
    const { page = 1, limit = 10 } = req.query;
    
    // Get price lookup cache
    const priceLookup = await getLabTestPriceCache();
    
    // Get prescriptions with lab tests for this patient
    const prescriptions = await Prescription.findAndCountAll({
      where: {
        patientId,
        tests: { [Op.ne]: null },
        [Op.or]: [
          { tests: { [Op.ne]: '' } },
          { tests: { [Op.ne]: '[]' } }
        ]
      },
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            {
              model: Doctor,
              as: 'doctor',
              include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    // Process prescriptions to extract lab tests
    const labTests = [];
    
    for (const prescription of prescriptions.rows) {
      try {
        let testsData = [];
        
        // Try to parse tests as JSON
        if (prescription.tests) {
          try {
            // Clean the JSON string by removing any leading bullet points or invalid characters
            let cleanTests = prescription.tests.trim();
            
            // Remove any leading bullet points or other invalid characters
            cleanTests = cleanTests.replace(/^[•\*\-\s]+/, '');
            
            testsData = JSON.parse(cleanTests);
          } catch (e) {
            // If not JSON, treat as string
            console.log(`Parsing prescription tests as plain text for prescription ${prescription.id}`);
            testsData = prescription.tests.split('\n').filter(test => test.trim());
            testsData = testsData.map(test => {
              // Remove bullet points and clean the test name
              const cleanName = test.replace(/^[•\*\-\s]+/, '').trim();
              return { name: cleanName, description: '', status: 'ordered' };
            });
          }
        }
        
        // Add each test with prescription context
        for (const test of testsData) {
          const testName = test.name || test;
          let testPrice = test.price || 0;
          let testDescription = test.description || '';
          
          // Use optimized price lookup
          if (!testPrice) {
            const normalizedTestName = testName.toLowerCase();
            
            // Direct match
            if (priceLookup.has(normalizedTestName)) {
              testPrice = priceLookup.get(normalizedTestName);
            } else {
              // Partial match
              for (const [key, price] of priceLookup.entries()) {
                if (key.includes(normalizedTestName) || normalizedTestName.includes(key)) {
                  testPrice = price;
                  break;
                }
              }
            }
            
            if (testPrice > 0) {
              console.log(`Found price for "${testName}": ${testPrice}`);
            } else {
              console.log(`No price found for test: "${testName}"`);
            }
          }
          
          // Get payments for this test
          const payments = await LabPayment.findAll({
            where: {
              prescriptionId: prescription.id,
              testName: testName
            }
          });

          // Create test object with payments for status determination
          const testWithPayments = {
            name: testName,
            price: testPrice,
            status: test.status || 'ordered', // Use status from parsed test object
            payments: payments.map(p => ({
              amount: parseFloat(p.amount || 0)
            })),
            results: prescription.testReports ? (() => {
              try {
                return JSON.parse(prescription.testReports);
              } catch (e) {
                return [];
              }
            })() : []
          };

          // Determine the correct status
          const currentStatus = determineAutomaticStatus(testWithPayments);

          const testObj = {
            id: `prescription-${prescription.id}-${testName}`,
            name: testName,
            description: testDescription,
            price: testPrice,
            status: currentStatus,
            type: 'prescription',
            prescriptionId: prescription.id,
            appointmentDate: prescription.appointment?.appointmentDate,
            doctorName: prescription.appointment?.doctor?.user ? 
              `${prescription.appointment.doctor.user.firstName} ${prescription.appointment.doctor.user.lastName}` : 
              'Unknown Doctor',
            createdAt: prescription.createdAt,
            testReports: prescription.testReports ? (() => {
              try {
                return JSON.parse(prescription.testReports);
              } catch (e) {
                console.log(`Error parsing testReports for prescription ${prescription.id}:`, e.message);
                return [];
              }
            })() : [],
            payments: payments.map(p => ({
              id: p.id,
              amount: parseFloat(p.amount),
              paymentMethod: p.paymentMethod,
              transactionId: p.transactionId,
              status: p.status,
              paidAt: p.paidAt,
              processedBy: p.processedBy,
              notes: p.notes
            }))
          };
          
          labTests.push(testObj);
        }
      } catch (error) {
        console.error(`Error processing prescription ${prescription.id}:`, error);
      }
    }
    
    // Return response
    res.json({
      success: true,
      data: {
        labTests,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(prescriptions.count / parseInt(limit)),
          totalRecords: prescriptions.count,
          hasNext: parseInt(page) < Math.ceil(prescriptions.count / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
    
  } catch (error) {
    console.error('Error in getPatientPrescriptionLabTestsOptimized:', error);
    next(error);
  }
};

module.exports = {
  getPatientPrescriptionLabTestsOptimized
};
