'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename columns to snake_case to match underscored: true convention
    await queryInterface.renameColumn('lab_test_orders', 'orderNumber', 'order_number');
    await queryInterface.renameColumn('lab_test_orders', 'patientId', 'patient_id');
    await queryInterface.renameColumn('lab_test_orders', 'doctorId', 'doctor_id');
    await queryInterface.renameColumn('lab_test_orders', 'appointmentId', 'appointment_id');
    await queryInterface.renameColumn('lab_test_orders', 'testIds', 'test_ids');
    await queryInterface.renameColumn('lab_test_orders', 'totalAmount', 'total_amount');
    await queryInterface.renameColumn('lab_test_orders', 'paidAmount', 'paid_amount');
    await queryInterface.renameColumn('lab_test_orders', 'dueAmount', 'due_amount');
    await queryInterface.renameColumn('lab_test_orders', 'paymentMethod', 'payment_method');
    await queryInterface.renameColumn('lab_test_orders', 'sampleCollectionDate', 'sample_collection_date');
    await queryInterface.renameColumn('lab_test_orders', 'expectedResultDate', 'expected_result_date');
    await queryInterface.renameColumn('lab_test_orders', 'resultUrl', 'result_url');
    await queryInterface.renameColumn('lab_test_orders', 'verifiedAt', 'verified_at');
    await queryInterface.renameColumn('lab_test_orders', 'verifiedBy', 'verified_by');
  },

  async down(queryInterface, Sequelize) {
    // Revert back to camelCase
    await queryInterface.renameColumn('lab_test_orders', 'order_number', 'orderNumber');
    await queryInterface.renameColumn('lab_test_orders', 'patient_id', 'patientId');
    await queryInterface.renameColumn('lab_test_orders', 'doctor_id', 'doctorId');
    await queryInterface.renameColumn('lab_test_orders', 'appointment_id', 'appointmentId');
    await queryInterface.renameColumn('lab_test_orders', 'test_ids', 'testIds');
    await queryInterface.renameColumn('lab_test_orders', 'total_amount', 'totalAmount');
    await queryInterface.renameColumn('lab_test_orders', 'paid_amount', 'paidAmount');
    await queryInterface.renameColumn('lab_test_orders', 'due_amount', 'dueAmount');
    await queryInterface.renameColumn('lab_test_orders', 'payment_method', 'paymentMethod');
    await queryInterface.renameColumn('lab_test_orders', 'sample_collection_date', 'sampleCollectionDate');
    await queryInterface.renameColumn('lab_test_orders', 'expected_result_date', 'expectedResultDate');
    await queryInterface.renameColumn('lab_test_orders', 'result_url', 'resultUrl');
    await queryInterface.renameColumn('lab_test_orders', 'verified_at', 'verifiedAt');
    await queryInterface.renameColumn('lab_test_orders', 'verified_by', 'verifiedBy');
  }
};