import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../services/paymentService';
import { 
  BeakerIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CalendarIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

interface LabTest {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  sampleType: string;
  preparationInstructions: string;
  reportDeliveryTime: number;
}

interface LabOrder {
  id: number;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  sampleCollectionDate: string;
  expectedResultDate: string;
  resultUrl: string;
  notes: string;
  createdAt: string;
  verifiedAt: string;
  sampleId?: string;
  testDetails: LabTest[];
  payments: Array<{
    id: number;
    amount: number;
    paymentMethod: string;
    status: string;
    paidAt: string;
    transactionId: string;
  }>;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  verifier?: {
    firstName: string;
    lastName: string;
  };
}

interface PrescriptionLabTest {
  id: string;
  name: string;
  description: string;
  status: string;
  paymentStatus: string;
  type: string;
  prescriptionId: number;
  appointmentDate: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  doctorName: string;
  createdAt: string;
  price?: number;
  sampleId?: string;
  payments?: Array<{
    id: number;
    amount: number;
    paymentMethod: string;
    status: string;
    paidAt: string;
    transactionId: string;
    processedBy: number;
    notes?: string;
  }>;
  testReports: Array<{
    filename: string;
    originalName: string;
    path: string;
    uploadedAt: string;
  }>;
}

const AdminLabReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'prescribed' | 'ordered'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Prescription lab test management states
  const [selectedPrescriptionTest, setSelectedPrescriptionTest] = useState<PrescriptionLabTest | null>(null);
  const [showPrescriptionUploadModal, setShowPrescriptionUploadModal] = useState(false);
  const [showPaymentProcessingModal, setShowPaymentProcessingModal] = useState(false);
  const [selectedTestForPayment, setSelectedTestForPayment] = useState<any>(null);
  const [paymentProcessingData, setPaymentProcessingData] = useState({
    paidAmount: 0,
    transactionId: '',
    paymentMethod: 'offline',
    notes: ''
  });
  
  // Cash payment modal states
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [selectedTestForCashPayment, setSelectedTestForCashPayment] = useState<any>(null);
  const [cashPaymentData, setCashPaymentData] = useState({
    amount: '',
    notes: ''
  });

  // Payment history modal states
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedTestForPaymentHistory, setSelectedTestForPaymentHistory] = useState<any>(null);

  // Tab and section states
  const [activeTab, setActiveTab] = useState('pending');
  const [prescriptionPaymentData, setPrescriptionPaymentData] = useState({
    paymentMethod: '',
    amount: '',
    transactionId: '',
    notes: ''
  });
  const [prescriptionStatusData, setPrescriptionStatusData] = useState({
    status: ''
  });
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  
  const queryClient = useQueryClient();

  // Search functionality removed



  // Fetch all lab orders for admin
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-lab-orders', statusFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      console.log('🔍 Fetching admin lab orders with params:', { statusFilter, dateFrom, dateTo, page });
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const response = await API.get(`/admin/lab-orders?${params}`);
      console.log('📊 Admin lab orders response:', response.data);
      return response.data;
    },
  });

  // Fetch prescription lab tests for admin
  const { data: prescriptionLabTestsData, isLoading: prescriptionTestsLoading } = useQuery({
    queryKey: ['admin-prescription-lab-tests', statusFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      console.log('🔍 Fetching admin prescription lab tests with params:', { statusFilter, dateFrom, dateTo, page });
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const response = await API.get(`/admin/prescription-lab-tests?${params}`);
      console.log('📊 Admin prescription lab tests response:', response.data);
      return response.data;
    },
  });


  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes, sampleCollectionDate, expectedResultDate }: any) => {
      const response = await API.put(`/admin/lab-orders/${orderId}/status`, {
        status,
        notes,
        sampleCollectionDate,
        expectedResultDate
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });


  // Upload results mutation
  const uploadResultsMutation = useMutation({
    mutationFn: async ({ orderId, files, notes }: { orderId: number; files: FileList | null; notes: string }) => {
      const formData = new FormData();
      
      // Handle multiple files or single file
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file) {
            formData.append('files', file);
          }
        }
      }
      
      if (notes) formData.append('notes', notes);
      
      const response = await API.post(`/admin/lab-orders/${orderId}/upload-results`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      toast.success(data.message || 'Lab results uploaded successfully');
      setUploadedFiles(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload results');
    },
  });

  // Prescription lab test mutations
  const updatePrescriptionStatusMutation = useMutation({
    mutationFn: async ({ testId, status }: { testId: string; status: string }) => {
      const response = await API.put(`/admin/prescription-lab-tests/${testId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      toast.success('Test status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const processPrescriptionPaymentMutation = useMutation({
    mutationFn: async ({ testId, paymentData }: { testId: string; paymentData: any }) => {
      const response = await API.post(`/admin/prescription-lab-tests/${testId}/payment`, paymentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      toast.success('Payment processed successfully');
      setPrescriptionPaymentData({ paymentMethod: '', amount: '', transactionId: '', notes: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const uploadPrescriptionResultsMutation = useMutation({
    mutationFn: async ({ testId, files }: { testId: string; files: FileList }) => {
      const formData = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          formData.append('files', file);
        }
      }
      
      const response = await API.post(`/admin/prescription-lab-tests/${testId}/upload-results`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      toast.success('Test results uploaded successfully');
      setShowPrescriptionUploadModal(false);
      setUploadedFiles(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload results');
    },
  });

  // Confirm lab order reports mutation
  const confirmLabOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      console.log('🚀 confirmLabOrderMutation called with orderId:', orderId);
      console.log('🚀 Making API call to:', `/admin/lab-orders/${orderId}/confirm-reports`);
      const response = await API.post(`/admin/lab-orders/${orderId}/confirm-reports`);
      console.log('✅ confirmLabOrderMutation API response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ confirmLabOrderMutation SUCCESS:', data);
      console.log('🔄 Invalidating queries...');
      
      // Invalidate all related queries with exact matching
      queryClient.invalidateQueries({ 
        queryKey: ['admin-lab-orders'],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin'],
        exact: false 
      });
      
      // Force refetch with a small delay
      setTimeout(() => {
        console.log('🔄 Force refetching queries...');
        queryClient.refetchQueries({ 
          queryKey: ['admin-lab-orders'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['admin-prescription-lab-tests'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['admin'],
          exact: false 
        });
        console.log('✅ Force refetch completed');
      }, 100);
      
      console.log('✅ Queries invalidated, showing toast');
      toast.success('Reports confirmed and sent to patient - moved to completed section');
    },
    onError: (error: any) => {
      console.error('❌ confirmLabOrderMutation error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      console.error('❌ Full error object:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to confirm reports');
    },
  });

  // Confirm prescription lab test reports mutation
  const confirmPrescriptionMutation = useMutation({
    mutationFn: async (testId: string) => {
      console.log('🚀 confirmPrescriptionMutation called with testId:', testId);
      console.log('🚀 Making API call to:', `/admin/prescription-lab-tests/${testId}/confirm-reports`);
      
      try {
        const response = await API.post(`/admin/prescription-lab-tests/${testId}/confirm-reports`, {}, {
          timeout: 10000 // 10 second timeout
        });
        console.log('✅ confirmPrescriptionMutation API response:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ confirmPrescriptionMutation API error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ confirmPrescriptionMutation SUCCESS:', data);
      console.log('🔄 Invalidating queries...');
      
      // Invalidate all related queries with exact matching
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin-lab-orders'],
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['admin'],
        exact: false 
      });
      
      // Force refetch with a small delay
      setTimeout(() => {
        console.log('🔄 Force refetching queries...');
        queryClient.refetchQueries({ 
          queryKey: ['admin-prescription-lab-tests'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['admin-lab-orders'],
          exact: false 
        });
        queryClient.refetchQueries({ 
          queryKey: ['admin'],
          exact: false 
        });
        console.log('✅ Force refetch completed');
      }, 100);
      
      console.log('✅ Queries invalidated, showing toast');
      toast.success('Test reports confirmed and sent to patient - moved to completed section');
    },
    onError: (error: any) => {
      console.error('❌ confirmPrescriptionMutation error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error headers:', error.response?.headers);
      console.error('❌ Full error object:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to confirm reports');
    },
  });

  // Revert lab order reports mutation
  const revertLabOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await API.post(`/admin/lab-orders/${orderId}/revert-reports`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      toast.success('Reports reverted back to reported status');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revert reports');
    },
  });

  // Revert prescription lab test reports mutation
  const revertPrescriptionMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await API.post(`/admin/prescription-lab-tests/${testId}/revert-reports`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      toast.success('Test reports reverted back to reported status');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revert reports');
    },
  });

  // Payment processing mutation (new system)
  const processNewPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await API.post('/admin/process-payment', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prescription-lab-tests'], exact: false });
      toast.success('Payment processed successfully');
      setShowPaymentProcessingModal(false);
      setSelectedTestForPayment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  // Update to sample processing mutation
  const updateToSampleProcessingMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await API.put(`/admin/tests/${testId}/sample-processing`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prescription-lab-tests'], exact: false });
      toast.success('Test status updated to sample processing');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update test status');
    },
  });

  // Update to sample taken mutation
  const updateToSampleTakenMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await API.put(`/admin/tests/${testId}/sample-taken`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prescription-lab-tests'], exact: false });
      toast.success('Test status updated to sample taken');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update test status');
    },
  });

  // Approve test mutation
  const approveTestMutation = useMutation({
    mutationFn: async (testId: string) => {
      const response = await API.post(`/admin/prescription-lab-tests/${testId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prescription-lab-tests'], exact: false });
      toast.success('Test approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve test');
    },
  });

  const handleDownloadInvoice = (test: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const cw = pageWidth - margin * 2;

    // helper functions
    const hLine = (y: number, r = 180, g = 180, b = 180, lw = 0.3) => {
      doc.setDrawColor(r, g, b); doc.setLineWidth(lw);
      doc.line(margin, y, pageWidth - margin, y);
    };
    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    
    const totalAmount = test.totalAmount || test.price || 0;
    const paidAmount = test.paidAmount || 0;
    const dueAmount = totalAmount - paidAmount;
    const isFullyPaid = paidAmount >= totalAmount;
    const invoiceId = `LIV-ADM-INV-${test.id}-${Date.now().toString().slice(-5)}`;

    // ── PAGE BORDER ───────────────────────────────────────────
    doc.setDrawColor(41, 98, 180); doc.setLineWidth(0.8);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    doc.setLineWidth(0.3);
    doc.rect(9, 9, pageWidth - 18, pageHeight - 18);

    // ── HEADER BAND ───────────────────────────────────────────
    doc.setFillColor(31, 41, 55); // Dark Slate for Admin
    doc.rect(margin, margin, cw, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('LIVORA', margin + 5, margin + 11);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('HEALTHCARE ADMINISTRATIVE PANEL', margin + 5, margin + 17);

    const rx = pageWidth - margin - 5;
    doc.setFontSize(7.5);
    doc.text('Livora Digital Clinic, 123 Wellness Ave, Dhaka', rx, margin + 7, { align: 'right' });
    doc.text('System Record  |  Internal Document ID: ' + test.id, rx, margin + 12, { align: 'right' });
    doc.text('Generated by Admin: ' + (localStorage.getItem('userName') || 'System'), rx, margin + 17, { align: 'right' });

    // ── INVOICE LABEL & STATUS ────────────────────────────────
    let y = margin + 30;

    // Left: label
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL LABORATORY INVOICE', margin, y + 5);

    // Right: Invoice meta box
    doc.setFillColor(248, 250, 255);
    doc.setDrawColor(200, 215, 240); doc.setLineWidth(0.3);
    doc.rect(pageWidth - margin - 65, y - 2, 65, 22, 'FD');

    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 98, 180);
    doc.text('INVOICE NO', pageWidth - margin - 62, y + 4);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
    doc.text(invoiceId, pageWidth - margin - 62, y + 9);

    doc.setFont('helvetica', 'bold'); doc.setTextColor(41, 98, 180);
    doc.text('ORDER STATUS', pageWidth - margin - 62, y + 14);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
    doc.text(formatStatus(test.status), pageWidth - margin - 62, y + 19);

    // PAID watermark badge
    if (isFullyPaid) {
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.roundedRect(pageWidth - margin - 30, y + 24, 30, 9, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('PAID', pageWidth - margin - 15, y + 30, { align: 'center' });
    } else {
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(pageWidth - margin - 30, y + 24, 30, 9, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('DUE', pageWidth - margin - 15, y + 30, { align: 'center' });
    }

    y += 36;
    hLine(y, 41, 98, 180);
    y += 6;

    // ── PATIENT & ORDER INFO ──────────────────────────────────
    const col1 = margin;
    const col2 = margin + cw / 2 + 5;

    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(131, 145, 172);
    doc.text('PATIENT INFORMATION', col1, y);
    doc.text('ORDER METADATA', col2, y);
    y += 5;

    const pName = test.patientName || (test.patient?.user ? `${test.patient.user.firstName} ${test.patient.user.lastName}` : '—');
    const pEmail = test.patientEmail || test.patient?.user?.email || '—';
    const pPhone = test.patientPhone || test.patient?.user?.phone || '—';
    const orderNo = test.orderNumber || (test.type === 'prescription' ? `PRES-${test.prescriptionId}` : `ORD-${test.id}`);
    const orderDate = test.createdAt ? fmtDate(test.createdAt) : '—';
    const orderType = test.type === 'ordered' ? 'Patient Self-Ordered' : 'Doctor Prescribed';
    const docName = test.doctorName || (test.doctor ? `Dr. ${test.doctor.user.firstName} ${test.doctor.user.lastName}` : 'N/A');

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 10, 10);
    doc.text(pName, col1, y);
    doc.text(orderNo, col2, y);

    y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text(pEmail, col1, y);
    doc.text(`Recorded Date: ${orderDate}`, col2, y);

    y += 5;
    doc.text(`Phone: ${pPhone}`, col1, y);
    doc.text(`Order Type: ${orderType}`, col2, y);
    
    y += 5;
    doc.text(`Physician: ${docName}`, col2, y);

    y += 10;
    hLine(y, 200, 215, 240);
    y += 5;

    // ── ITEMIZED TEST TABLE ───────────────────────────────────
    doc.setFillColor(233, 239, 252);
    doc.rect(margin, y, cw, 8, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 50, 120);
    doc.text('#', margin + 2, y + 5.5);
    doc.text('TEST DESCRIPTION / SERVICE', margin + 10, y + 5.5);
    doc.text('CATEGORY', margin + 110, y + 5.5);
    doc.text('PRICE', pageWidth - margin - 2, y + 5.5, { align: 'right' });
    y += 10;

    const tests_list = (test.type === 'ordered' && test.testDetails) ? test.testDetails : [{ name: test.name, category: test.category || 'Laboratory', price: test.price || test.totalAmount }];

    tests_list.forEach((td: any, idx: number) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 255);
        doc.rect(margin, y - 1, cw, 8, 'F');
      }
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
      doc.text(`${idx + 1}`, margin + 2, y + 5);
      const nameLines = doc.splitTextToSize(td.name || '—', 90);
      doc.text(nameLines, margin + 10, y + 5);
      doc.text(td.category || '—', margin + 110, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(td.price || 0), pageWidth - margin - 2, y + 5, { align: 'right' });
      y += 8;
    });

    y += 4;
    hLine(y, 200, 215, 240);
    y += 6;

    // ── FINANCIAL SUMMARY ─────────────────────────────────────
    const summaryX = pageWidth - margin - 75;
    const summaryColR = pageWidth - margin;

    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text('Sub-total Amount', summaryX, y);
    doc.text(formatCurrency(totalAmount), summaryColR, y, { align: 'right' });

    y += 7;
    doc.text('Adjustments / Discounts', summaryX, y);
    doc.text(formatCurrency(0), summaryColR, y, { align: 'right' });

    y += 7;
    hLine(y, 200, 215, 240);
    y += 5;

    doc.setFillColor(31, 41, 55);
    doc.rect(summaryX - 3, y - 2, pageWidth - margin - summaryX + 3, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('BILLABLE TOTAL', summaryX, y + 4.5);
    doc.text(formatCurrency(totalAmount), summaryColR, y + 4.5, { align: 'right' });
    y += 13;

    doc.setFillColor(16, 185, 129, 0.15);
    doc.setTextColor(5, 100, 70);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PAYMENTS RECEIVED', summaryX, y);
    doc.text(formatCurrency(paidAmount), summaryColR, y, { align: 'right' });

    y += 7;
    doc.setTextColor(dueAmount > 0 ? 180 : 20, dueAmount > 0 ? 30 : 100, dueAmount > 0 ? 30 : 50);
    doc.text('OUTSTANDING BALANCE', summaryX, y);
    doc.text(formatCurrency(dueAmount), summaryColR, y, { align: 'right' });

    y += 12;

    // ── PAYMENT LOGS ──────────────────────────────────────────
    if (test.payments && test.payments.length > 0) {
      hLine(y, 200, 215, 240); y += 5;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(31, 41, 55);
      doc.text('AUDITABLE PAYMENT LOGS', margin, y);
      y += 7;

      doc.setFillColor(233, 239, 252);
      doc.rect(margin, y, cw, 7, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 50, 120);
      doc.text('DATE/TIME', margin + 2, y + 5);
      doc.text('TRANSACTION METHOD', margin + 40, y + 5);
      doc.text('TRANSACTION ID', margin + 80, y + 5);
      doc.text('STATUS', margin + 140, y + 5);
      doc.text('AMOUNT', pageWidth - margin - 2, y + 5, { align: 'right' });
      y += 9;

      test.payments.forEach((p: any, idx: number) => {
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 255);
          doc.rect(margin, y - 1, cw, 7, 'F');
        }
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        doc.text(new Date(p.paidAt).toLocaleString(), margin + 2, y + 4);
        doc.text(p.paymentMethod.toUpperCase(), margin + 40, y + 4);
        doc.text(p.transactionId || 'N/A', margin + 80, y + 4);
        doc.text(p.status.toUpperCase(), margin + 140, y + 4);
        doc.setTextColor(30, 30, 30); doc.setFont('helvetica', 'bold');
        doc.text(formatCurrency(p.amount), pageWidth - margin - 2, y + 4, { align: 'right' });
        y += 7;
      });
    }

    // ── FOOTER ────────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const fy = pageHeight - 20;
        hLine(fy - 3, 31, 41, 55);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140);
        doc.text('OFFICIAL ADMINISTRATIVE RECORD - LIVORA HEALTHCARE SOLUTIONS', margin, fy + 2);
        doc.text('This document is electronically generated by the Livora Administrative Panel.', margin, fy + 7);
        doc.text(`Page ${i} of ${pageCount}`, margin, fy + 12);
        doc.text('Confidential Record', pageWidth - margin, fy + 7, { align: 'right' });
    }

    doc.save(`Official-Invoice-${test.id}.pdf`);
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'ordered': 'bg-slate-100 text-slate-800 border border-slate-300',
      'approved': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      'sample_processing': 'bg-purple-100 text-purple-800 border border-purple-300',
      'sample_taken': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
      'reported': 'bg-blue-100 text-blue-800 border border-blue-300',
      'confirmed': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      'cancelled': 'bg-red-100 text-red-800 border border-red-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    const colors = {
      'not_paid': 'bg-red-100 text-red-800 border border-red-300',
      'partially_paid': 'bg-orange-100 text-orange-800 border border-orange-300',
      'paid': 'bg-green-100 text-green-800 border border-green-300'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper functions for test categorization
  const categorizeTests = (tests: any[]) => {
    const categories = {
      pending: [] as any[],      // ordered, approved (waiting for payment/processing)
      inProgress: [] as any[],   // sample_processing, sample_taken
      readyForResults: [] as any[], // reported (results uploaded, waiting for confirmation)
      completed: [] as any[]     // confirmed (results sent to patients)
    };

    console.log('🔍 Categorizing tests:', tests.length, 'total tests');
    console.log('Test statuses:', tests.map(t => ({ id: t.id, name: t.name, status: t.status, type: t.type })));

    tests.forEach(test => {
      console.log(`Processing test: ${test.name} with status: "${test.status}" (type: ${typeof test.status})`);
      if (test.status === 'confirmed') {
        categories.completed.push(test);
        console.log(`✅ Added ${test.name} to completed`);
      } else if (test.status === 'reported') {
        categories.readyForResults.push(test);
        console.log(`✅ Added ${test.name} to readyForResults`);
      } else if (test.status === 'sample_processing' || test.status === 'sample_taken') {
        categories.inProgress.push(test);
        console.log(`✅ Added ${test.name} to inProgress`);
      } else {
        categories.pending.push(test);
        console.log(`✅ Added ${test.name} to pending (status: "${test.status}")`);
      }
    });

    console.log('📊 Final categories:', {
      pending: categories.pending.length,
      inProgress: categories.inProgress.length,
      readyForResults: categories.readyForResults.length,
      completed: categories.completed.length
    });

    return categories;
  };



  // Test card component
  const TestCard = ({ test }: { test: any }) => (
    <div className="relative group animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
      <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 w-full min-h-[400px] flex flex-col">
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2 break-words">{test.name}</h3>
            <div className="text-sm text-gray-700 space-y-1.5">
              <p className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Patient:</span> 
                <span className="font-medium break-words">{test.patientName}</span>
              </p>
              <p className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Doctor:</span> 
                <span className="font-medium break-words">{test.doctorName}</span>
              </p>
              <p className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Email:</span> 
                <span className="font-medium break-all text-xs">{test.patientEmail}</span>
              </p>
              <p className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 uppercase text-xs tracking-wide">Phone:</span> 
                <span className="font-medium break-words">{test.patientPhone}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2 flex-shrink-0">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${getStatusBadgeColor(test.status)} whitespace-nowrap`}>
              {formatStatus(test.status)}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${getPaymentStatusBadgeColor(test.paymentStatus || 'not_paid')} whitespace-nowrap`}>
              {test.paymentStatus === 'paid' ? 'Paid' : 
               test.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Not Paid'}
            </span>
            {test.sampleId && (
              <span className="bg-purple-100/80 text-purple-800 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-purple-200/50 whitespace-nowrap">
                ID: {test.sampleId}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/40 space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Total Amount</span>
            <span className="text-sm font-bold text-gray-900">৳{test.totalAmount || test.price || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Paid Amount</span>
            <span className="text-sm font-bold text-green-600">৳{test.paidAmount || 0}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-white/40">
            <span className="text-sm font-bold text-gray-900">Remaining</span>
            <span className="text-base font-bold text-red-600">৳{(test.totalAmount || test.price || 0) - (test.paidAmount || 0)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full mt-auto">
          {test.status === 'ordered' && (
            <button
              onClick={() => handleApproveTest(test)}
              disabled={approveTestMutation.isPending}
              className="group relative px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{approveTestMutation.isPending ? 'Approving...' : 'Approve Test'}</span>
            </button>
          )}
          
          {test.status === 'approved' && (test.paidAmount || 0) >= (test.totalAmount || test.price || 0) * 0.5 && (
            <button
              onClick={() => handleSampleProcessingClick(test)}
              disabled={updateToSampleProcessingMutation.isPending}
              className="group relative px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{updateToSampleProcessingMutation.isPending ? 'Processing...' : 'Start Sample Processing'}</span>
            </button>
          )}

          {test.status === 'sample_processing' && (
            <button
              onClick={() => handleSampleTakenClick(test)}
              disabled={updateToSampleTakenMutation.isPending}
              className="group relative px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{updateToSampleTakenMutation.isPending ? 'Processing...' : 'Mark Sample Taken'}</span>
            </button>
          )}

          {test.status === 'sample_taken' && Number(test.paidAmount || 0) >= Number(test.totalAmount || test.price || 0) && (
            <button
              onClick={() => handleUploadPrescriptionResults(test)}
              className="group relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">Upload Results</span>
            </button>
          )}

        {/* Show uploaded files for reported tests */}
        {test.status === 'reported' && test.testReports && test.testReports.length > 0 && (
          <div className="mb-3 w-full">
            <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
            <div className="space-y-2 w-full">
              {test.testReports.map((file: any, index: number) => (
                <div key={index} className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/50 w-full">
                  <div className="flex items-start space-x-3 w-full">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between w-full">
                        <div className="flex-1 min-w-0 pr-2">
                          <p 
                            className="text-sm text-gray-900 break-all" 
                            title={file.originalName || file.filename}
                          >
                            {file.originalName || file.filename}
                          </p>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              // Handle file download (using Cloudinary URL)
                              if (file.path && (file.path.startsWith('http') || file.path.startsWith('https'))) {
                                window.open(file.path, '_blank');
                              } else {
                                const link = document.createElement('a');
                                link.href = `/uploads/lab-results/${file.filename}`;
                                link.download = file.originalName || file.filename;
                                link.click();
                              }
                            }}
                            className="px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg flex items-center space-x-1 transition-colors whitespace-nowrap"
                          >
                            <ArrowDownTrayIcon className="h-3 w-3" />
                            <span>Download / View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          {test.status === 'reported' && (
            <button
              onClick={() => handleConfirmReports(test)}
              disabled={confirmLabOrderMutation.isPending || confirmPrescriptionMutation.isPending}
              className="group relative px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{(confirmLabOrderMutation.isPending || confirmPrescriptionMutation.isPending) ? 'Confirming...' : 'Confirm & Send Results'}</span>
            </button>
          )}

          {test.status === 'confirmed' && (
            <button
              onClick={() => handleRevertReports(test)}
              disabled={revertLabOrderMutation.isPending || revertPrescriptionMutation.isPending}
              className="group relative px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-orange-700 hover:to-red-700 disabled:opacity-50 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{(revertLabOrderMutation.isPending || revertPrescriptionMutation.isPending) ? 'Reverting...' : 'Go Back to In Progress'}</span>
            </button>
          )}

          <button
            onClick={() => handlePaymentProcessingClick(test)}
            className="group relative px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-xl text-sm font-semibold hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 hover:shadow-md border border-blue-200/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10">Payment Processing</span>
          </button>

          {(test.totalAmount || test.price || 0) > (test.paidAmount || 0) && (
            <button
              onClick={() => handleCashPaymentClick(test)}
              className="group relative px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 hover:shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">Record Cash Payment</span>
            </button>
          )}

          <button
            onClick={() => handleDownloadInvoice(test)}
            className="group relative px-4 py-2 bg-gradient-to-r from-gray-700 to-slate-700 text-white rounded-xl text-sm font-semibold hover:from-gray-800 hover:to-slate-800 transition-all duration-300 hover:shadow-lg overflow-hidden flex items-center gap-2"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <DocumentDuplicateIcon className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Download Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );


  // Prescription lab test helper functions
  const getPrescriptionStatusBadgeColor = (status: string) => {
    const colors = {
      'ordered': 'bg-gray-100 text-gray-800',
      'approved': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'done': 'bg-purple-100 text-purple-800',
      'reported': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPrescriptionStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Prescription lab test handlers

  const handleUploadPrescriptionResults = (test: PrescriptionLabTest) => {
    setSelectedPrescriptionTest(test);
    setUploadedFiles(null);
    setShowPrescriptionUploadModal(true);
  };


  const handlePrescriptionUploadSubmit = () => {
    if (selectedPrescriptionTest && uploadedFiles && uploadedFiles.length > 0) {
      uploadPrescriptionResultsMutation.mutate({
        testId: selectedPrescriptionTest.id,
        files: uploadedFiles
      });
    }
  };

  // Helper function to get filtered and combined lab tests for admin
  const getFilteredAdminLabTests = () => {
    const allTests: any[] = [];
    
    console.log('=== Getting Filtered Admin Lab Tests ===');
    console.log('Prescription data:', prescriptionLabTestsData);
    console.log('Orders data:', ordersData);
    console.log('Prescription tests count:', prescriptionLabTestsData?.data?.labTests?.length || 0);
    console.log('Orders count:', ordersData?.data?.orders?.length || 0);
    
    // Add prescription lab tests
    if (prescriptionLabTestsData?.data?.labTests) {
      console.log('Processing prescription tests:', prescriptionLabTestsData.data.labTests.length);
      prescriptionLabTestsData.data.labTests.forEach((test: PrescriptionLabTest) => {
        console.log('Prescription test patient:', test.patientName);
        console.log('Prescription test ID:', test.id, 'Status:', test.status);
        allTests.push({
          ...test,
          type: 'prescription',
          orderNumber: `PRES-${test.prescriptionId}`,
          totalAmount: test.price || 0,
          paidAmount: test.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
          dueAmount: (test.price || 0) - (test.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0),
          createdAt: test.createdAt,
          testDetails: [{ name: test.name, description: test.description, price: test.price || 0 }],
          patientName: test.patientName,
          patientEmail: test.patientEmail,
          patientPhone: test.patientPhone
        });
      });
    }
    
    // Add regular lab orders
    if (ordersData?.data?.orders) {
      console.log('Processing regular orders:', ordersData.data.orders.length);
      ordersData.data.orders.forEach((order: LabOrder) => {
        const patientName = order.patient?.user?.firstName + ' ' + order.patient?.user?.lastName || 'Unknown Patient';
        console.log('Order patient:', patientName);
        allTests.push({
          ...order,
          type: 'ordered',
          doctorName: order.doctor?.user?.firstName + ' ' + order.doctor?.user?.lastName || 'Unknown Doctor',
          appointmentDate: order.createdAt,
          prescriptionId: null,
          patientName: patientName,
          patientEmail: order.patient?.user?.email || 'Unknown Email',
          patientPhone: order.patient?.user?.phone || 'Unknown Phone'
        });
      });
    }
    
    // Debug logs removed for performance
    
    // Apply filters
    let filteredTests = allTests;
    
    if (testTypeFilter !== 'all') {
      filteredTests = filteredTests.filter(test => 
        testTypeFilter === 'prescribed' ? test.type === 'prescription' : test.type === 'ordered'
      );
    }
    
    if (statusFilter) {
      filteredTests = filteredTests.filter(test => test.status === statusFilter);
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredTests = filteredTests.filter(test => {
        const patientName = test.patientName?.toLowerCase() || '';
        const patientEmail = test.patientEmail?.toLowerCase() || '';
        const patientPhone = test.patientPhone?.toLowerCase() || '';
        const patientId = test.patient?.id?.toString() || test.patientId?.toString() || '';
        const testId = test.id?.toString() || '';
        
        return patientName.includes(query) || 
               patientEmail.includes(query) || 
               patientPhone.includes(query) || 
               patientId.includes(query) ||
               testId.includes(query);
      });
    }
    
    if (dateFrom && dateTo) {
      filteredTests = filteredTests.filter(test => {
        const testDate = new Date(test.appointmentDate || test.createdAt);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        return testDate >= fromDate && testDate <= toDate;
      });
    }
    
    // Debug logs removed for performance
    
    return filteredTests;
  };

  const filteredTests = getFilteredAdminLabTests();

  // Comprehensive debugging - expose data to window for inspection
  if (typeof window !== 'undefined') {
    (window as any).prescriptionLabTestsData = prescriptionLabTestsData;
    (window as any).ordersData = ordersData;
    (window as any).filteredTests = filteredTests;
    (window as any).testCategories = categorizeTests(filteredTests);
    
    console.log('🔍 ===== DATA DEBUGGING INFO =====');
    console.log('🔍 Orders data:', ordersData);
    console.log('🔍 Prescription lab tests data:', prescriptionLabTestsData);
    console.log('🔍 Filtered tests:', filteredTests);
    console.log('🔍 Test categories:', categorizeTests(filteredTests));
    console.log('🔍 Orders count:', ordersData?.data?.orders?.length || 0);
    console.log('🔍 Prescription tests count:', prescriptionLabTestsData?.data?.labTests?.length || 0);
    console.log('🔍 Total filtered tests:', filteredTests.length);
    console.log('🔍 Tests by status:', filteredTests.reduce((acc, test) => {
      acc[test.status] = (acc[test.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    console.log('🔍 ===== END DATA DEBUGGING =====');
  }

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'ordered': 'verified',
      'verified': 'payment_pending',
      'payment_pending': 'payment_completed',
      'payment_partial': 'payment_completed',
      'payment_completed': 'sample_collection_scheduled',
      'sample_collection_scheduled': 'sample_collected',
      'sample_collected': 'processing',
      'processing': 'results_ready',
      'results_ready': 'completed'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const canUpdateStatus = (status: string) => {
    return ['ordered', 'verified', 'payment_completed', 'sample_collection_scheduled', 'sample_collected', 'processing'].includes(status);
  };

  const canProcessPayment = (order: LabOrder) => {
    return ['verified', 'payment_pending', 'payment_partial'].includes(order.status) && order.dueAmount > 0;
  };

  const canUploadResults = (order: LabOrder) => {
    return order.status === 'processing' && order.dueAmount <= 0;
  };

  const handleStatusUpdate = (order: LabOrder, newStatus: string) => {
    const updateData: any = { orderId: order.id, status: newStatus };
    
    if (newStatus === 'sample_collection_scheduled') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      updateData.sampleCollectionDate = tomorrow.toISOString().split('T')[0];
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 3);
      updateData.expectedResultDate = expectedDate.toISOString().split('T')[0];
    }
    
    updateStatusMutation.mutate(updateData);
  };

  // Missing function definitions for unified view


  // Confirm handlers
  const handleConfirmReports = (test: any) => {
    console.log('🚀 ===== CONFIRM REPORTS CLICKED =====');
    console.log('🚀 Full test object:', test);
    console.log('🚀 Test type:', test.type);
    console.log('🚀 Test ID:', test.id);
    console.log('🚀 Test name:', test.name);
    console.log('🚀 Current status:', test.status);
    console.log('🚀 Test has sampleId:', !!test.sampleId, 'SampleId:', test.sampleId);
    console.log('🚀 Test prescriptionId:', test.prescriptionId);
    console.log('🚀 Test testReports:', test.testReports);
    console.log('🚀 Auth token present:', !!localStorage.getItem('token'));
    console.log('🚀 API default headers:', API.defaults.headers.common);
    
    // Check if this is a prescription test by looking for sampleId pattern
    const isPrescriptionTest = test.sampleId && test.sampleId.startsWith('SMP-');
    console.log('🚀 Is prescription test (by sampleId):', isPrescriptionTest);
    console.log('🚀 Is prescription test (by type):', test.type === 'prescription');
    
    console.log('🔍 DECISION LOGIC:');
    console.log('🔍 test.type === "prescription":', test.type === 'prescription');
    console.log('🔍 isPrescriptionTest:', isPrescriptionTest);
    console.log('🔍 Final condition (type === prescription || isPrescriptionTest):', test.type === 'prescription' || isPrescriptionTest);
    
    if (test.type === 'prescription' || isPrescriptionTest) {
      // Use the test ID directly from the test object instead of constructing it
      const testId = test.id; // This should already be in the correct format
      console.log('📝 ===== CALLING PRESCRIPTION MUTATION =====');
      console.log('📝 Using test.id directly:', testId);
      console.log('📝 Original test.name:', test.name);
      console.log('📝 Mutation state:', {
        isPending: confirmPrescriptionMutation.isPending,
        isError: confirmPrescriptionMutation.isError,
        error: confirmPrescriptionMutation.error
      });
      console.log('📝 About to call confirmPrescriptionMutation.mutate with:', testId);
      confirmPrescriptionMutation.mutate(testId);
      console.log('📝 confirmPrescriptionMutation.mutate called');
    } else {
      console.log('📝 ===== CALLING LAB ORDER MUTATION =====');
      console.log('📝 Using orderId:', test.id);
      console.log('📝 Mutation state:', {
        isPending: confirmLabOrderMutation.isPending,
        isError: confirmLabOrderMutation.isError,
        error: confirmLabOrderMutation.error
      });
      console.log('📝 About to call confirmLabOrderMutation.mutate with:', test.id);
      confirmLabOrderMutation.mutate(test.id);
      console.log('📝 confirmLabOrderMutation.mutate called');
    }
    console.log('🚀 ===== END CONFIRM REPORTS =====');
  };

  // Revert handlers
  const handleRevertReports = (test: any) => {
    // Check if this is a prescription test by looking for sampleId pattern
    const isPrescriptionTest = test.sampleId && test.sampleId.startsWith('SMP-');
    
    if (test.type === 'prescription' || isPrescriptionTest) {
      // Construct the correct test ID format for prescription tests
      const testId = `prescription-${test.prescriptionId}-${encodeURIComponent(test.name)}`;
      revertPrescriptionMutation.mutate(testId);
    } else {
      revertLabOrderMutation.mutate(test.id);
    }
  };

  // Manual refresh function for testing
  const handleManualRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    
    try {
      // Invalidate all admin queries with partial matching
      await queryClient.invalidateQueries({ 
        queryKey: ['admin-lab-orders'],
        exact: false 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      
      // Force refetch all admin queries
      await queryClient.refetchQueries({ 
        queryKey: ['admin-lab-orders'],
        exact: false 
      });
      await queryClient.refetchQueries({ 
        queryKey: ['admin-prescription-lab-tests'],
        exact: false 
      });
      
      console.log('✅ Manual refresh completed');
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Expose handler functions to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).handleConfirmReports = handleConfirmReports;
    (window as any).handleRevertReports = handleRevertReports;
    (window as any).confirmPrescriptionMutation = confirmPrescriptionMutation;
    (window as any).confirmLabOrderMutation = confirmLabOrderMutation;
    (window as any).handleManualRefresh = handleManualRefresh;
    
    // Add test function to manually test API endpoints
    (window as any).testConfirmEndpoint = async (testId: string) => {
      console.log('🧪 Testing confirm endpoint with testId:', testId);
      try {
        const response = await API.post(`/admin/prescription-lab-tests/${testId}/confirm-reports`, {}, {
          timeout: 5000
        });
        console.log('✅ Test endpoint success:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Test endpoint error:', error);
        return error;
      }
    };
    
    // Add function to check current data state
    (window as any).checkCurrentData = () => {
      console.log('🔍 ===== CURRENT DATA STATE =====');
      console.log('🔍 Orders data:', ordersData);
      console.log('🔍 Prescription data:', prescriptionLabTestsData);
      console.log('🔍 Filtered tests:', filteredTests);
      console.log('🔍 Categories:', categorizeTests(filteredTests));
      console.log('🔍 Active tab:', activeTab);
      
      // Check for any tests with confirmed status
      const confirmedTests = filteredTests.filter(test => test.status === 'confirmed');
      console.log('🔍 Confirmed tests found:', confirmedTests.length);
      confirmedTests.forEach(test => {
        console.log(`🔍 Confirmed test: ${test.name} (${test.type}) - Status: "${test.status}"`);
      });
      
      return {
        ordersData,
        prescriptionLabTestsData,
        filteredTests,
        categories: categorizeTests(filteredTests),
        confirmedTests,
        activeTab
      };
    };
    
    // Add simple server test
    (window as any).testServer = async () => {
      console.log('🧪 Testing server connection...');
      try {
        const response = await API.get('/admin/stats', { timeout: 3000 });
        console.log('✅ Server is responding:', response.status);
        return response.data;
      } catch (error) {
        console.error('❌ Server test failed:', error);
        return error;
      }
    };
    
    // Add function to test with the current test
    (window as any).testCurrentConfirm = () => {
      const testId = 'prescription-7-Diabetes Panel (HbA1c + Glucose)'; // Without URL encoding
      console.log('🧪 Testing with current test ID (no encoding):', testId);
      return (window as any).testConfirmEndpoint(testId);
    };
    
    // Add function to check current test status
    (window as any).checkTestStatus = () => {
      console.log('🔍 ===== CHECKING TEST STATUS =====');
      console.log('🔍 All prescription tests:', prescriptionLabTestsData?.data?.labTests?.map((t: any) => ({ id: t.id, name: t.name, status: t.status })));
      console.log('🔍 All filtered tests:', filteredTests.map((t: any) => ({ id: t.id, name: t.name, status: t.status })));
      console.log('🔍 Test categories:', categorizeTests(filteredTests));
      console.log('🔍 Diabetes Panel test:', filteredTests.find((t: any) => t.name.includes('Diabetes Panel')));
      return {
        prescriptionTests: prescriptionLabTestsData?.data?.labTests,
        filteredTests: filteredTests,
        categories: categorizeTests(filteredTests),
        diabetesTest: filteredTests.find((t: any) => t.name.includes('Diabetes Panel'))
      };
    };
  }


  const handlePaymentProcessingSubmit = () => {
    if (selectedTestForPayment && paymentProcessingData.paidAmount > 0) {
      processNewPaymentMutation.mutate({
        testId: selectedTestForPayment.id,
        ...paymentProcessingData
      });
    }
  };

  const handleApproveTest = (test: any) => {
    approveTestMutation.mutate(test.id);
  };

  const handleSampleProcessingClick = (test: any) => {
    updateToSampleProcessingMutation.mutate(test.id);
  };

  const handleSampleTakenClick = (test: any) => {
    updateToSampleTakenMutation.mutate(test.id);
  };

  // Handle cash payment entry
  const handleCashPaymentClick = (test: any) => {
    const totalAmount = parseFloat(test.totalAmount || test.price || 0);
    const currentPaidAmount = parseFloat(test.paidAmount || 0);
    const dueAmount = Math.max(0, totalAmount - currentPaidAmount); // Ensure non-negative
    
    // Debug logging removed - issue was in backend price retrieval
    
    setSelectedTestForCashPayment({
      ...test,
      totalAmount,
      paidAmount: currentPaidAmount,
      dueAmount: dueAmount
    });
    setCashPaymentData({ amount: '', notes: '' });
    setShowCashPaymentModal(true);
  };

  // Handle payment processing (payment history) click
  const handlePaymentProcessingClick = (test: any) => {
    setSelectedTestForPaymentHistory(test);
    setShowPaymentHistoryModal(true);
  };

  // Process cash payment
  const processCashPaymentMutation = useMutation({
    mutationFn: async ({ testId, amount, notes }: { testId: string, amount: number, notes: string }) => {
      if (testId.startsWith('order-')) {
        // Regular lab order
        const orderId = testId.replace('order-', '');
        return API.post('/admin/lab-orders/cash-payment', {
          orderId,
          amount,
          notes
        });
      } else {
        // Prescription lab test
        return API.post('/admin/prescription-tests/cash-payment', {
          testId,
          amount,
          notes
        });
      }
    },
    onSuccess: () => {
      toast.success('Cash payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prescription-lab-tests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
      setShowCashPaymentModal(false);
      setSelectedTestForCashPayment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record cash payment');
    }
  });

  // Handle cash payment submission
  const handleCashPaymentSubmit = () => {
    if (!selectedTestForCashPayment || !cashPaymentData.amount) return;

    const amount = parseFloat(cashPaymentData.amount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate 50% minimum requirement
    const totalAmount = parseFloat(selectedTestForCashPayment.totalAmount || selectedTestForCashPayment.price || 0);
    const currentPaidAmount = parseFloat(selectedTestForCashPayment.paidAmount || 0);
    const remainingAmount = Math.max(0, totalAmount - currentPaidAmount); // Ensure non-negative
    const totalPaidAfterPayment = currentPaidAmount + amount;
    const minimumRequired = totalAmount * 0.5;

    // Debug logging removed - validation logic is now correct

    // Validate amount is positive
    if (amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    // Validate amount doesn't exceed remaining amount
    if (amount > remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining amount of ৳${remainingAmount.toFixed(2)}`);
      return;
    }

    // Validate 50% minimum requirement (only if this is the first payment or if current payment is less than 50%)
    if (totalPaidAfterPayment < minimumRequired) {
      const additionalNeeded = minimumRequired - currentPaidAmount;
      toast.error(`Minimum 50% payment required. You need at least ৳${additionalNeeded.toFixed(2)} more to proceed to sample processing.`);
      return;
    }

    processCashPaymentMutation.mutate({
      testId: selectedTestForCashPayment.id,
      amount,
      notes: cashPaymentData.notes
    });
  };

  const handleRemoveReport = async (testId: string, reportIndex: number) => {
    try {
      // Parse testId to determine if it's a prescription test or regular order
      const isPrescription = testId.startsWith('prescription-');
      
      if (isPrescription) {
        // For prescription tests, we need to update the prescription's testReports
        const testIdParts = testId.split('-');
        const prescriptionId = testIdParts[1];
        
        const response = await API.delete(`/admin/prescription-lab-tests/${testId}/reports/${reportIndex}`);
        
        if (response.data.success) {
          toast.success('Report removed successfully');
          // Invalidate all queries that start with 'admin-prescription-lab-tests'
          queryClient.invalidateQueries({ 
            queryKey: ['admin-prescription-lab-tests'],
            exact: false 
          });
        }
      } else {
        // For regular lab orders
        const response = await API.delete(`/admin/lab-orders/${testId}/reports/${reportIndex}`);
        
        if (response.data.success) {
          toast.success('Report removed successfully');
          queryClient.invalidateQueries({ queryKey: ['admin-lab-orders'] });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove report');
    }
  };

  const canViewResults = (test: any) => {
    return test.status === 'results_ready' || test.status === 'completed' || test.status === 'reported';
  };

  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400 opacity-20 mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading lab tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start animate-fade-in-down">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg">
                  <BeakerIcon className="h-7 w-7 text-purple-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Lab Test Management
              </h1>
            </div>
            <p className="ml-1 text-gray-600 font-medium">
              Manage lab test orders, prescription lab tests, verify tests, process payments, and upload results
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`group relative bg-white/70 backdrop-blur-md text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 border border-white/20 ${
              isRefreshing 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-white/90 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-200 border-t-purple-600"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="relative group animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 mb-2 transition-all duration-300 hover:shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Test Type
              </label>
              <select
                value={testTypeFilter}
                onChange={(e) => setTestTypeFilter(e.target.value as 'all' | 'prescribed' | 'ordered')}
                className="w-full px-4 py-2.5 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 cursor-pointer"
              >
                <option value="all">All Tests</option>
                <option value="prescribed">Prescribed by Doctor</option>
                <option value="ordered">Ordered by Patient</option>
              </select>
            </div>
          
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="ordered">Ordered</option>
                <option value="verified">Verified</option>
                <option value="approved">Approved</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="payment_partial">Payment Partial</option>
                <option value="payment_completed">Payment Completed</option>
                <option value="sample_collection_scheduled">Sample Collection Scheduled</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="sample_processing">Sample Processing</option>
                <option value="sample_taken">Sample Taken</option>
                <option value="processing">Processing</option>
                <option value="reported">Reported</option>
                <option value="results_ready">Results Ready</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 cursor-pointer"
              />
            </div>
          
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 cursor-pointer"
              />
            </div>
            </div>
        
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-white/40">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-semibold text-gray-700">Quick filters:</span>
                <button
                  onClick={() => {
                    const today = new Date();
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    setDateFrom(yesterday.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full hover:from-purple-200 hover:to-pink-200 transition-all duration-300 border border-purple-200/50 font-medium"
                >
                  Last 2 Days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setDateFrom(weekAgo.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full hover:from-purple-200 hover:to-pink-200 transition-all duration-300 border border-purple-200/50 font-medium"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const monthAgo = new Date(today);
                    monthAgo.setDate(monthAgo.getDate() - 30);
                    setDateFrom(monthAgo.toISOString().split('T')[0]);
                    setDateTo(today.toISOString().split('T')[0]);
                  }}
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full hover:from-purple-200 hover:to-pink-200 transition-all duration-300 border border-purple-200/50 font-medium"
                >
                  Last 30 Days
                </button>
              </div>
              
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setStatusFilter('');
                  setTestTypeFilter('all');
                  setSearchQuery('');
                }}
                className="px-5 py-2 text-sm bg-white/70 text-gray-700 rounded-xl hover:bg-white/90 transition-all duration-300 border border-gray-300/50 font-medium hover:shadow-md"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="relative group animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by patient name, email, phone number, or patient ID..."
                  className="w-full pl-12 pr-4 py-3 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all duration-300 flex items-center gap-2 font-medium"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-3 text-sm text-purple-600 font-medium">
                Searching: "{searchQuery}" - {filteredTests.length} result{filteredTests.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="relative group animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="border-b border-white/40">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'pending', name: 'Pending', count: categorizeTests(filteredTests).pending.length, color: 'text-yellow-600 border-yellow-600', bgColor: 'bg-yellow-100' },
                  { id: 'inProgress', name: 'In Progress', count: categorizeTests(filteredTests).inProgress.length, color: 'text-blue-600 border-blue-600', bgColor: 'bg-blue-100' },
                  { id: 'readyForResults', name: 'Ready for Results', count: categorizeTests(filteredTests).readyForResults.length, color: 'text-purple-600 border-purple-600', bgColor: 'bg-purple-100' },
                  { id: 'completed', name: 'Completed', count: categorizeTests(filteredTests).completed.length, color: 'text-green-600 border-green-600', bgColor: 'bg-green-100' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-300 ${
                      activeTab === tab.id
                        ? `${tab.color}`
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-bold ${
                        activeTab === tab.id 
                          ? `${tab.bgColor} ${tab.color.replace('border-', 'text-')}` 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

        <div className="p-6">
                {/* Section-specific search and date filters */}
                  
                  {/* Date filters for current section */}
                  {(dateFrom || dateTo) && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {dateFrom && dateTo 
                          ? `Filtering from ${new Date(dateFrom).toLocaleDateString()} to ${new Date(dateTo).toLocaleDateString()}`
                          : dateFrom 
                          ? `From ${new Date(dateFrom).toLocaleDateString()}`
                          : `Until ${new Date(dateTo).toLocaleDateString()}`
                        }
                      </span>
                      <button
                        onClick={() => {
                          setDateFrom('');
                          setDateTo('');
                        }}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Clear dates
                      </button>
                    </div>
                  )}
                </div>

          {/* Tab Content */}
          {(() => {
            const categories = categorizeTests(filteredTests);
            // Get current tab's tests
            const currentTests = categories[activeTab as keyof typeof categories];

            if (currentTests.length === 0) {
              const hasActiveSearch = false; // Search functionality removed
              const totalResults = filteredTests.length;
              
              return (
                <div className="relative group animate-fade-in-up">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                  <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-12 text-center">
                    <div className="text-purple-400 mb-6">
                      <BeakerIcon className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No {activeTab === 'pending' ? 'Pending' : activeTab === 'inProgress' ? 'In Progress' : activeTab === 'readyForResults' ? 'Ready for Results' : 'Completed'} Tests
                    </h3>
                    <p className="text-gray-600 font-medium">
                      {hasActiveSearch ? (
                        <>
                          No tests found in this tab matching your search criteria.
                          {totalResults > 0 && (
                            <span className="block mt-2 text-sm text-blue-600">
                              Found {totalResults} result{totalResults !== 1 ? 's' : ''} in other tabs. Try switching tabs to see them.
                            </span>
                          )}
                        </>
                      ) : (
                        `No tests in ${activeTab === 'pending' ? 'pending' : activeTab === 'inProgress' ? 'progress' : activeTab === 'readyForResults' ? 'ready for results' : 'completed'} status.`
                      )}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
                {currentTests.map((test, index) => (
                  <TestCard key={`${test.type}-${test.id || test.prescriptionId}-${index}`} test={test} />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Legacy content for debugging - remove this section */}
      {false && (
          <div className="space-y-4">
          {filteredTests.map((test, index) => (
            <div key={`${test.type}-${test.id || test.prescriptionId}-${index}`} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                      {test.type === 'prescription' ? test.name : `Order #${test.orderNumber}`}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span><strong>Patient:</strong> {test.patientName}</span>
                      <span><strong>Doctor:</strong> {test.doctorName}</span>
                      <span>Date: {new Date(test.appointmentDate || test.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        test.type === 'prescription' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {test.type === 'prescription' ? 'Prescription' : 'Patient Order'}
                        </span>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(test.status)}`}>
                      {formatStatus(test.status)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusBadgeColor(test.paymentStatus || 'not_paid')}`}>
                      Payment: {formatStatus(test.paymentStatus || 'not_paid')}
                    </span>
                    {test.sampleId && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300">
                        Sample: {test.sampleId}
                      </span>
                    )}
                  </div>
                  </div>

                {/* Test Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {test.type === 'prescription' ? 'Test Details:' : 'Tests Included:'}
                  </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {test.type === 'prescription' ? (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="font-medium text-gray-900">{test.name}</h5>
                        <p className="text-sm text-gray-600">{test.description}</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(test.price || 0)}</p>
                      </div>
                    ) : (
                      test.testDetails.map((testDetail: any, testIndex: number) => (
                        <div key={testIndex} className="bg-gray-50 p-3 rounded-lg">
                          <h5 className="font-medium text-gray-900">{testDetail.name}</h5>
                          <p className="text-sm text-gray-600">{testDetail.description}</p>
                          <p className="text-sm font-medium text-green-600">৳{testDetail.price}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Payment Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-semibold">{formatCurrency(test.totalAmount || test.price || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Paid Amount</p>
                      <p className="font-semibold">{formatCurrency(test.paidAmount || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Due Amount</p>
                      <p className="font-semibold">{formatCurrency(test.dueAmount || (test.totalAmount || test.price || 0) - (test.paidAmount || 0))}</p>
                      </div>
                    </div>
                  </div>

                {/* Management Actions */}
                  <div className="border-t pt-4">
                    <div className="flex flex-wrap gap-2">
                    
                    {/* Approval button - only show if test is ordered and not yet approved */}
                    {test.status === 'ordered' && (
                        <button
                      onClick={() => handleApproveTest(test)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        Approve Test
                        </button>
                      )}

                    {/* Payment Processing button - show payment history for all tests */}
                        <button
                      onClick={() => handlePaymentProcessingClick(test)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                          Payment Processing
                        </button>

                    {/* Cash Payment button - always show if there's a due amount */}
                    {(test.dueAmount || (test.totalAmount || test.price || 0) - (test.paidAmount || 0)) > 0 && (
                        <button
                      onClick={() => handleCashPaymentClick(test)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <BanknotesIcon className="h-4 w-4" />
                          Record Cash Payment
                        </button>
                    )}

                    {/* Sample Processing button - only show if test is approved AND at least 50% is paid AND not yet processing */}
                    {test.status === 'approved' && 
                     ((test.paymentStatus || 'not_paid') === 'paid' || (test.paymentStatus || 'not_paid') === 'partially_paid') && 
                     (test.paidAmount || 0) >= (test.totalAmount || test.price || 0) * 0.5 &&
                     test.status !== 'sample_processing' && test.status !== 'sample_taken' && test.status !== 'reported' && test.status !== 'confirmed' && (
                        <button
                      onClick={() => handleSampleProcessingClick(test)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <BeakerIcon className="h-4 w-4" />
                          Start Sample Processing
                        </button>
                    )}

                    {/* Sample Processing Status and Sample Taken button */}
                    {test.status === 'sample_processing' && (
                        <div className="space-y-2">
                          <div className="bg-purple-50 border border-purple-200 rounded-md p-3 text-center">
                            <div className="flex items-center justify-center space-x-2 text-purple-800 mb-2">
                              <BeakerIcon className="h-4 w-4" />
                              <span className="text-sm font-medium">Sample Processing Started</span>
                            </div>
                          </div>
                        <button
                      onClick={() => handleSampleTakenClick(test)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                          Mark Sample Taken
                        </button>
                        </div>
                    )}

                    {/* Sample Taken Status and Upload Results button */}
                    {test.status === 'sample_taken' && test.status !== 'confirmed' && (
                        <div className="space-y-2">
                          
                          {/* Upload Results button - only show if payment is 100% complete */}
                          {(test.paymentStatus === 'paid' || Number(test.paidAmount || 0) >= Number(test.totalAmount || test.price || 0)) ? (
                        <button
                      onClick={() => handleUploadPrescriptionResults(test)}
                              className="w-full btn-secondary flex items-center justify-center gap-2 text-sm"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4" />
                          Upload Results
                        </button>
                          ) : (
                            <div className="w-full bg-yellow-50 border border-yellow-200 rounded-md p-3 text-center">
                              <span className="text-xs text-yellow-700 font-medium">
                                Complete payment to upload results
                              </span>
                              <p className="text-xs text-yellow-600 mt-1">
                                Paid: ৳{test.paidAmount || 0} / ৳{test.totalAmount || test.price || 0}
                              </p>
                            </div>
                          )}
                        </div>
                    )}

                    {/* Confirm Reports button - only show if test has reports and is not already confirmed */}
                    {((test.type === 'ordered' && canViewResults(test)) || 
                      (test.type === 'prescription' && test.testReports && test.testReports.length > 0 && test.testReports.some((report: any) => report.filename && report.originalName && report.path && report.originalName !== 'Poster.pdf'))) && 
                      test.status !== 'confirmed' ? (
                        <div className="space-y-2">
                        <button
                          onClick={() => handleConfirmReports(test)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Confirm & Send to Patient
                        </button>
                        </div>
                    ) : null}
                    
                    {/* View Results button */}
                    {(test.type === 'ordered' && canViewResults(test)) || 
                     (test.type === 'prescription' && test.testReports && test.testReports.length > 0 && test.testReports.some((report: any) => report.filename && report.originalName && report.path && report.originalName !== 'Poster.pdf')) ? (
                      <div className="flex flex-wrap gap-2">
                        {test.type === 'ordered' ? (
                        <button
                            onClick={() => window.open(test.resultUrl, '_blank')}
                            className="btn-outline flex items-center gap-2 text-sm"
                        >
                            <EyeIcon className="h-4 w-4" />
                            View Results
                        </button>
                        ) : (
                          test.testReports
                            .filter((report: any) => report.filename && report.originalName && report.path && report.originalName !== 'Poster.pdf') // Filter out invalid reports
                            .map((report: any, reportIndex: number) => (
                            <div key={reportIndex} className="flex items-center gap-2">
                              <a
                                href={`/${report.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-outline flex items-center gap-2 text-sm"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Download {report.originalName}
                              </a>
                              <button
                                onClick={() => handleRemoveReport(test.id, reportIndex)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                title="Remove this report"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}


      {/* Upload Results Modal for Prescription Lab Tests */}
      {showPrescriptionUploadModal && selectedPrescriptionTest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Upload Test Results - {selectedPrescriptionTest.name}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Result Files (Multiple files allowed)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.dcm,.dicom,.nii,.nifti,.mhd,.raw,.img,.hdr,.vti,.vtp,.stl,.obj,.ply,.xyz,.txt,.csv,.xlsx,.xls,.doc,.docx,.rtf,.odt,.ods,.odp"
                  onChange={(e) => setUploadedFiles(e.target.files)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, Images (JPG, PNG, GIF, BMP, TIFF), DICOM, Medical imaging (NII, NIFTI, MHD), Documents (DOC, DOCX, XLS, XLSX), and more. Max size: 50MB per file
                </p>
              </div>

              {uploadedFiles && uploadedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files ({uploadedFiles.length}):</h4>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles(null)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <XCircleIcon className="h-3 w-3" />
                      Clear All
                    </button>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {Array.from(uploadedFiles).map((file, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-gray-400 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = Array.from(uploadedFiles).filter((_, i) => i !== index);
                            const newFileList = new DataTransfer();
                            newFiles.forEach(file => newFileList.items.add(file));
                            setUploadedFiles(newFileList.files.length > 0 ? newFileList.files : null);
                          }}
                          className="ml-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                          title="Remove file"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPrescriptionUploadModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrescriptionUploadSubmit}
                  disabled={!uploadedFiles || uploadedFiles.length === 0 || uploadPrescriptionResultsMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploadPrescriptionResultsMutation.isPending ? 'Uploading...' : 'Upload Results'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentProcessingModal && selectedTestForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 w-full overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Process Payment</h3>
                <button
                  onClick={() => setShowPaymentProcessingModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100/50">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    Test: {selectedTestForPayment.name}
                  </label>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-bold">{formatCurrency(selectedTestForPayment.totalAmount || selectedTestForPayment.price || 0)}</span>
                    </p>
                    <p className="text-sm font-medium text-gray-700 flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedTestForPayment.paidAmount || 0)}</span>
                    </p>
                    <p className="text-sm font-bold text-gray-900 flex justify-between pt-2 border-t border-purple-200">
                      <span>Due Amount:</span>
                      <span className="text-red-600">{formatCurrency((selectedTestForPayment.totalAmount || selectedTestForPayment.price || 0) - (selectedTestForPayment.paidAmount || 0))}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentProcessingData.paymentMethod}
                    onChange={(e) => setPaymentProcessingData({ ...paymentProcessingData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  >
                    <option value="offline">Offline Payment</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Paid Amount *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedTestForPayment.totalAmount || selectedTestForPayment.price || 0}
                    step="0.01"
                    value={paymentProcessingData.paidAmount}
                    onChange={(e) => setPaymentProcessingData({ ...paymentProcessingData, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter paid amount"
                  />
                </div>

                {paymentProcessingData.paymentMethod === 'online' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={paymentProcessingData.transactionId}
                      onChange={(e) => setPaymentProcessingData({ ...paymentProcessingData, transactionId: e.target.value })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter transaction ID"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={paymentProcessingData.notes}
                    onChange={(e) => setPaymentProcessingData({ ...paymentProcessingData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    placeholder="Add any notes..."
                  />
                </div>

              {paymentProcessingData.paidAmount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Payment Rules:</strong>
                  </p>
                  <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                    <li>Minimum 50% payment required to proceed</li>
                    <li>Full payment required to access results</li>
                    <li>Partial payment allows sample processing only</li>
                  </ul>
                </div>
              )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowPaymentProcessingModal(false)}
                    className="flex-1 px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-300 hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentProcessingSubmit}
                    disabled={paymentProcessingData.paidAmount <= 0 || 
                             (paymentProcessingData.paymentMethod === 'online' && !paymentProcessingData.transactionId) ||
                             processNewPaymentMutation.isPending}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                  >
                    {processNewPaymentMutation.isPending ? 'Processing...' : 'Process Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Payment Modal */}
      {showCashPaymentModal && selectedTestForCashPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 w-full overflow-y-auto max-h-[95vh]">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Record Cash Payment - {selectedTestForCashPayment.name}
              </h3>
            
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100/50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                      <span className="font-bold text-gray-900">৳{selectedTestForCashPayment.totalAmount || selectedTestForCashPayment.price || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold text-gray-700">Paid Amount</span>
                      <span className="font-bold text-green-600">৳{selectedTestForCashPayment.paidAmount || 0}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-purple-200">
                      <span className="text-sm font-bold text-gray-900">Remaining</span>
                      <span className="font-bold text-red-600 text-lg">৳{selectedTestForCashPayment.dueAmount || 0}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Cash Amount Received
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedTestForCashPayment.dueAmount || 0}
                    value={cashPaymentData.amount}
                    onChange={(e) => setCashPaymentData({ ...cashPaymentData, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter cash amount received"
                  />
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Maximum: ৳{selectedTestForCashPayment.dueAmount || 0}
                  </p>
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    Minimum 50% required for sample processing: ৳{((selectedTestForCashPayment.totalAmount || selectedTestForCashPayment.price || 0) * 0.5).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={cashPaymentData.notes}
                    onChange={(e) => setCashPaymentData({ ...cashPaymentData, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Add any notes about this cash payment..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowCashPaymentModal(false);
                    setSelectedTestForCashPayment(null);
                  }}
                  className="flex-1 px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-300 hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCashPaymentSubmit}
                  disabled={processCashPaymentMutation.isPending || !cashPaymentData.amount}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                >
                  {processCashPaymentMutation.isPending ? 'Recording...' : 'Record Cash Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistoryModal && selectedTestForPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[95vh]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment History - {selectedTestForPaymentHistory.name}
            </h3>
            
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-medium">৳{selectedTestForPaymentHistory.totalAmount || selectedTestForPaymentHistory.price || 0}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Paid Amount:</span>
                  <span className="font-medium text-green-600">৳{selectedTestForPaymentHistory.paidAmount || 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Remaining:</span>
                  <span className="font-medium text-red-600">৳{(selectedTestForPaymentHistory.totalAmount || selectedTestForPaymentHistory.price || 0) - (selectedTestForPaymentHistory.paidAmount || 0)}</span>
                </div>
              </div>

              {/* Payment History List */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Records:</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedTestForPaymentHistory.payments && selectedTestForPaymentHistory.payments.length > 0 ? (
                    selectedTestForPaymentHistory.payments.map((payment: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.paymentMethod === 'cash' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payment.paymentMethod === 'cash' ? 'Cash Payment' : 'Online Payment'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                          <span className="font-semibold text-green-600">৳{payment.amount}</span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          {payment.transactionId && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Transaction ID:</span>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{payment.transactionId}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Date:</span>
                            <span>{new Date(payment.paidAt).toLocaleString()}</span>
                          </div>
                          {payment.notes && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium">Notes:</span>
                              <span>{payment.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BanknotesIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No payment records found</p>
                      <p className="text-sm">Payments will appear here once made by the patient</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentHistoryModal(false);
                  setSelectedTestForPaymentHistory(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminLabReports;
