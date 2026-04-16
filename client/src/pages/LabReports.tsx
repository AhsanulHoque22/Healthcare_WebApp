import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../services/paymentService';
import { 
  BanknotesIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowPathIcon,
  SparklesIcon,
  FunnelIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

interface LabOrder {
  id: number;
  orderNumber: string;
  patientId: number;
  doctorId?: number;
  appointmentId?: number;
  testIds: number[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
  paymentMethod?: string;
  sampleCollectionDate?: string;
  expectedResultDate?: string;
  resultUrl?: string;
  sampleId?: string;
  testReports?: Array<{
    filename: string;
    originalName: string;
    path: string;
    uploadedAt: string;
  }>;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: number;
  createdAt: string;
  updatedAt: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  doctor?: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  appointment?: {
    appointmentDate: string;
    doctor: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
  payments?: Array<{
    id: number;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    status: string;
    paidAt: string;
    processedBy: number;
    notes?: string;
  }>;
  testDetails: Array<{
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
  }>;
}

interface PrescriptionLabTest {
  id: string;
  name: string;
  description: string;
  price: number;
  status: string;
  type: string;
  prescriptionId: number;
  appointmentDate: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  createdAt: string;
  testReports?: Array<{
    id: string;
    originalName: string;
    path: string;
    uploadedAt: string;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    status: string;
    paidAt: string;
    processedBy: number;
    notes?: string;
  }>;
}

const LabReports: React.FC = () => {
  const queryClient = useQueryClient();

  // State management
  const [statusFilter, setStatusFilter] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'prescribed' | 'ordered'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrescriptionPaymentModal, setShowPrescriptionPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [selectedPrescriptionTest, setSelectedPrescriptionTest] = useState<PrescriptionLabTest | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
    notes: ''
  });

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch lab test orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery<any>({
    queryKey: ['lab-orders'],
    queryFn: async () => {
      const response = await API.get('/lab-tests/orders?limit=100', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    },
    staleTime: 5000, // Cache for 5 seconds
    gcTime: 10000, // Keep in memory for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch prescription lab tests
  const { data: prescriptionLabTestsData, isLoading: prescriptionLoading } = useQuery<any>({
    queryKey: ['prescription-lab-tests'],
    queryFn: async () => {
      const response = await API.get('/lab-tests/prescription-tests?limit=100', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    },
    staleTime: 5000, // Cache for 5 seconds
    gcTime: 10000, // Keep in memory for 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Payment mutation for regular lab orders
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: { orderId: number; amount: number; paymentMethod: string; transactionId?: string; notes?: string }) => {
      const response = await API.post(`/lab-tests/orders/${paymentData.orderId}/payment`, paymentData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment processed successfully!');
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentForm({ amount: '', paymentMethod: 'cash', transactionId: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  });

  // Payment mutation for prescription lab tests
  const prescriptionPaymentMutation = useMutation({
    mutationFn: async (paymentData: { testId: string; amount: number; paymentMethod: string; transactionId?: string; notes?: string }) => {
      const response = await API.post(`/lab-tests/prescription-tests/${paymentData.testId}/payment`, paymentData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment processed successfully!');
      setShowPrescriptionPaymentModal(false);
      setSelectedPrescriptionTest(null);
      setPaymentForm({ amount: '', paymentMethod: 'cash', transactionId: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['prescription-lab-tests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  });

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-slate-100 text-slate-800 border border-slate-300';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'sample_processing': return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'sample_taken': return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'reported': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'confirmed': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'not_paid': return 'bg-red-100 text-red-800 border border-red-300';
      case 'partially_paid': return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'paid': return 'bg-green-100 text-green-800 border border-green-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  // Helper function to format status
  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered': return <ClockIcon className="h-4 w-4" />;
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'sample_processing': return <ArrowPathIcon className="h-4 w-4" />;
      case 'sample_taken': return <PlayIcon className="h-4 w-4" />;
      case 'reported': return <ArrowDownTrayIcon className="h-4 w-4" />;
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Helper function to check if payment is allowed
  const canMakePayment = (test: any) => {
    const paymentStatus = test.paymentStatus || 'not_paid';
    // Payment is only allowed if:
    // 1. Test is approved by admin (not 'ordered')
    // 2. Payment is not fully paid
    return paymentStatus !== 'paid' && test.status !== 'ordered';
  };

  // Helper function to check if reports are available for download
  const canDownloadReports = (test: any) => {
    // Check if test has reports and is in a status where reports should be available
    const hasReports = (test.testReports && test.testReports.length > 0) || 
                      (test.type === 'ordered' && test.resultUrl);
    const reportAvailableStatuses = ['reported', 'confirmed', 'results_ready', 'completed'];
    
    return hasReports && reportAvailableStatuses.includes(test.status);
  };

  // Helper function to get remaining amount
  const getRemainingAmount = (test: any) => {
    // For regular lab orders, use the dueAmount field directly
    if (test.type === 'ordered' && test.dueAmount !== undefined) {
      return parseFloat(String(test.dueAmount || 0));
    }
    
    // For prescription lab tests, calculate from payments
    const totalAmount = parseFloat(String(test.price || test.totalAmount || 0));
    const paidAmount = test.payments ? test.payments.reduce((sum: number, payment: any) => {
      return sum + parseFloat(String(payment.amount || 0));
    }, 0) : parseFloat(String(test.paidAmount || 0));
    
    return Math.max(0, totalAmount - paidAmount);
  };

  // Helper function to get paid amount
  const getPaidAmount = (test: any) => {
    // For regular lab orders, use the paidAmount field directly
    if (test.type === 'ordered' && test.paidAmount !== undefined) {
      return parseFloat(String(test.paidAmount || 0));
    }
    
    // For prescription lab tests, calculate from payments array
    if (test.payments && test.payments.length > 0) {
      return test.payments.reduce((sum: number, payment: any) => {
        return sum + parseFloat(String(payment.amount || 0));
      }, 0);
    }
    return parseFloat(String(test.paidAmount || 0));
  };

  // Helper function to get total amount
  const getTotalAmount = (test: any) => {
    return parseFloat(String(test.price || test.totalAmount || 0));
  };

  // Handle payment for regular lab orders
  const handlePayment = (order: LabOrder) => {
    setSelectedOrder(order);
    setPaymentForm({
      amount: order.dueAmount.toString(),
      paymentMethod: 'bkash',
      transactionId: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  // Handle payment for prescription lab tests
  const handlePrescriptionPayment = (test: PrescriptionLabTest) => {
    setSelectedPrescriptionTest(test);
    const remainingAmount = getRemainingAmount(test);
    setPaymentForm({
      amount: remainingAmount.toString(),
      paymentMethod: 'bkash',
      transactionId: '',
      notes: ''
    });
    setShowPrescriptionPaymentModal(true);
  };

  const handleDownloadInvoice = (test: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const cw = pageWidth - margin * 2;

    // helper
    const hLine = (y: number, r = 180, g = 180, b = 180, lw = 0.3) => {
      doc.setDrawColor(r, g, b); doc.setLineWidth(lw);
      doc.line(margin, y, pageWidth - margin, y);
    };
    const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const invoiceId = `LIV-INV-${test.id}-${Date.now().toString().slice(-5)}`;
    const total   = getTotalAmount(test);
    const paid    = getPaidAmount(test);
    const due     = getRemainingAmount(test);
    const isFullyPaid = paid >= total;

    // ── PAGE BORDER ───────────────────────────────────────────
    doc.setDrawColor(41, 98, 180); doc.setLineWidth(0.8);
    doc.rect(7, 7, pageWidth - 14, pageHeight - 14);
    doc.setLineWidth(0.3);
    doc.rect(9, 9, pageWidth - 18, pageHeight - 18);

    // ── HEADER BAND ───────────────────────────────────────────
    doc.setFillColor(41, 98, 180);
    doc.rect(margin, margin, cw, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20); doc.setFont('helvetica', 'bold');
    doc.text('LIVORA', margin + 5, margin + 11);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text('PREMIUM HEALTHCARE SOLUTIONS', margin + 5, margin + 17);

    const rx = pageWidth - margin - 5;
    doc.setFontSize(7.5);
    doc.text('Livora Digital Clinic, 123 Wellness Ave, Dhaka', rx, margin + 7, { align: 'right' });
    doc.text('Tel: +880 1234-567890  |  www.livora-health.app', rx, margin + 12, { align: 'right' });
    doc.text('info@livora-health.app', rx, margin + 17, { align: 'right' });

    // ── INVOICE LABEL & STATUS ────────────────────────────────
    let y = margin + 30;

    // Left: "TAX INVOICE"
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('LABORATORY INVOICE', margin, y + 5);

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
    doc.text('DATE', pageWidth - margin - 62, y + 14);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20);
    doc.text(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), pageWidth - margin - 62, y + 19);

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
      doc.text('UNPAID', pageWidth - margin - 15, y + 30, { align: 'center' });
    }

    y += 36;
    hLine(y, 41, 98, 180);
    y += 6;

    // ── BILL TO / ORDER INFO ──────────────────────────────────
    const col1 = margin;
    const col2 = margin + cw / 2 + 5;

    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(131, 145, 172);
    doc.text('BILL TO', col1, y);
    doc.text('ORDER DETAILS', col2, y);
    y += 5;

    const pName = test.type === 'ordered'
      ? `${test.patient?.user?.firstName || ''} ${test.patient?.user?.lastName || ''}`.trim()
      : (test.patientName || '—');
    const pEmail = test.type === 'ordered' ? (test.patient?.user?.email || '—') : (test.patientEmail || '—');

    const docName = test.doctorName ||
      (test.doctor ? `Dr. ${test.doctor.user.firstName} ${test.doctor.user.lastName}` : '—');
    const orderNo = test.type === 'ordered'
      ? (test.orderNumber || `ORD-${test.id}`)
      : `PRES-${test.prescriptionId || test.id}`;
    const orderDate = test.createdAt ? fmtDate(test.createdAt) : '—';
    const orderType = test.type === 'ordered' ? 'Self-Ordered' : 'Doctor Prescribed';

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(10, 10, 10);
    doc.text(pName || '—', col1, y);
    doc.text(orderNo, col2, y);

    y += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text(pEmail, col1, y);
    doc.text(`Date: ${orderDate}`, col2, y);

    y += 5;
    doc.text(`Type: ${orderType}`, col2, y);
    if (docName !== '—') {
      y += 5;
      doc.text(`Referring Doctor: ${docName}`, col2, y);
    }

    y += 10;
    hLine(y, 200, 215, 240);
    y += 5;

    // ── ITEMIZED TEST TABLE ───────────────────────────────────
    // Header row
    doc.setFillColor(233, 239, 252);
    doc.rect(margin, y, cw, 8, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 50, 120);
    doc.text('#', margin + 2, y + 5.5);
    doc.text('TEST NAME', margin + 10, y + 5.5);
    doc.text('CATEGORY', margin + 110, y + 5.5);
    doc.text('AMOUNT (BDT)', pageWidth - margin - 2, y + 5.5, { align: 'right' });
    y += 10;

    const tests_list = test.type === 'ordered' ? (test.testDetails || []) : [{ name: test.name, category: test.category || 'Lab Test', price: test.price }];

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

    // Sub-total
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60);
    doc.text('Sub-total', summaryX, y);
    doc.text(formatCurrency(total), summaryColR, y, { align: 'right' });

    y += 7;
    doc.text('Discount / Insurance', summaryX, y);
    doc.text(formatCurrency(0), summaryColR, y, { align: 'right' });

    y += 7;
    hLine(y, 200, 215, 240);
    y += 5;

    // Total
    doc.setFillColor(41, 98, 180);
    doc.rect(summaryX - 3, y - 2, pageWidth - margin - summaryX + 3, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT', summaryX, y + 4.5);
    doc.text(formatCurrency(total), summaryColR, y + 4.5, { align: 'right' });
    y += 13;

    // Paid
    doc.setFillColor(16, 185, 129, 0.15);
    doc.setTextColor(5, 100, 70);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text('AMOUNT PAID', summaryX, y);
    doc.text(formatCurrency(paid), summaryColR, y, { align: 'right' });

    y += 7;
    doc.setTextColor(due > 0 ? 180 : 20, due > 0 ? 30 : 100, due > 0 ? 30 : 50);
    doc.text('BALANCE DUE', summaryX, y);
    doc.text(formatCurrency(due), summaryColR, y, { align: 'right' });

    y += 12;

    // ── PAYMENT HISTORY ───────────────────────────────────────
    if (test.payments && test.payments.length > 0) {
      hLine(y, 200, 215, 240); y += 5;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(41, 98, 180);
      doc.text('PAYMENT TRANSACTION HISTORY', margin, y);
      y += 7;

      // table header
      doc.setFillColor(233, 239, 252);
      doc.rect(margin, y, cw, 7, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 50, 120);
      doc.text('DATE', margin + 2, y + 5);
      doc.text('METHOD', margin + 30, y + 5);
      doc.text('TRANSACTION ID', margin + 65, y + 5);
      doc.text('STATUS', margin + 128, y + 5);
      doc.text('AMOUNT', pageWidth - margin - 2, y + 5, { align: 'right' });
      y += 9;

      test.payments.forEach((p: any, idx: number) => {
        if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 255);
          doc.rect(margin, y - 1, cw, 7, 'F');
        }
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
        doc.text(fmtDate(p.paidAt), margin + 2, y + 4);
        doc.text((p.paymentMethod || '—').toUpperCase(), margin + 30, y + 4);
        doc.text(p.transactionId || 'N/A', margin + 65, y + 4);

        const st = (p.status || '').toUpperCase();
        doc.setTextColor(st === 'COMPLETED' ? 5 : 180, st === 'COMPLETED' ? 100 : 50, st === 'COMPLETED' ? 70 : 50);
        doc.text(st, margin + 128, y + 4);

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
      hLine(fy - 3, 41, 98, 180);
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140);
      doc.text('This is a computer-generated invoice and does not require a physical signature.', margin, fy + 2);
      doc.text('Livora Healthcare  |  www.livora-health.app  |  info@livora-health.app', margin, fy + 7);
      doc.text(`Page ${i} of ${pageCount}`, margin, fy + 12);
      doc.text('Thank you for choosing Livora Healthcare!', pageWidth - margin, fy + 7, { align: 'right' });
    }

    doc.save(`Livora-Invoice-${test.id}-${Date.now().toString().slice(-5)}.pdf`);
  };


  // Process payment for regular lab orders
  const processPayment = async () => {
    if (!selectedOrder || !paymentForm.amount) return;

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // For cash payments, don't process here - just show instruction
    if (paymentForm.paymentMethod === 'cash') {
      toast('Please pay the cash amount to the admin. Admin will process your payment.', {
        icon: '💡',
        duration: 4000,
      });
      setShowPaymentModal(false);
      return;
    }

    // Check if total paid amount (including current payment) meets 50% requirement for online payments
    const totalPaidAfterPayment = selectedOrder.paidAmount + amount;
    const minimumRequired = selectedOrder.totalAmount * 0.5;
    
    if (totalPaidAfterPayment < minimumRequired) {
      toast.error(`Minimum 50% payment required for sample processing. You need to pay at least ${formatCurrency(minimumRequired - selectedOrder.paidAmount)} more.`);
      return;
    }

    paymentMutation.mutate({
      orderId: selectedOrder.id,
      amount: amount,
      paymentMethod: paymentForm.paymentMethod,
      transactionId: paymentForm.transactionId,
      notes: paymentForm.notes
    });
  };

  // Process payment for prescription lab tests
  const processPrescriptionPayment = async () => {
    if (!selectedPrescriptionTest || !paymentForm.amount) return;

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // For cash payments, don't process here - just show instruction
    if (paymentForm.paymentMethod === 'cash') {
      toast('Please pay the cash amount to the admin. Admin will process your payment.', {
        icon: '💡',
        duration: 4000,
      });
      setShowPrescriptionPaymentModal(false);
      return;
    }

    const remainingAmount = getRemainingAmount(selectedPrescriptionTest);
    if (amount > remainingAmount) {
      toast.error(`Payment amount cannot exceed remaining amount of ${formatCurrency(remainingAmount)}`);
      return;
    }

    // Check if total paid amount (including current payment) meets 50% requirement for online payments
    const totalPaidAfterPayment = getPaidAmount(selectedPrescriptionTest) + amount;
    const minimumRequired = getTotalAmount(selectedPrescriptionTest) * 0.5;
    
    if (totalPaidAfterPayment < minimumRequired) {
      toast.error(`Minimum 50% payment required for sample processing. You need to pay at least ${formatCurrency(minimumRequired - getPaidAmount(selectedPrescriptionTest))} more.`);
      return;
    }

    prescriptionPaymentMutation.mutate({
      testId: selectedPrescriptionTest.id,
      amount: amount,
      paymentMethod: paymentForm.paymentMethod,
      transactionId: paymentForm.transactionId,
      notes: paymentForm.notes
    });
  };

  // Combine and filter all tests
  const getAllTests = () => {
    const allTests: any[] = [];


    // Add prescription lab tests
    if (prescriptionLabTestsData?.data?.labTests) {
      prescriptionLabTestsData.data.labTests.forEach((test: PrescriptionLabTest) => {
        allTests.push({
          ...test,
          type: 'prescription',
          orderNumber: `PRES-${test.prescriptionId}`,
          createdAt: test.createdAt
        });
      });
    }

    // Add regular lab orders
    if (ordersData?.data?.orders) {
      ordersData.data.orders.forEach((order: LabOrder) => {
        allTests.push({
          ...order,
          type: 'ordered',
          doctorName: order.appointment?.doctor ? 
            `${order.appointment.doctor.user.firstName} ${order.appointment.doctor.user.lastName}` : 
            'Self-Ordered',
          appointmentDate: order.createdAt,
          prescriptionId: null
        });
      });
    }

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


    return filteredTests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const allTests = getAllTests();
  const isLoading = ordersLoading || prescriptionLoading;

  // Debug logging
  console.log('Lab Reports Debug:', {
    statusFilter,
    testTypeFilter,
    ordersData: ordersData?.data?.orders?.length || 0,
    prescriptionData: prescriptionLabTestsData?.data?.labTests?.length || 0,
    allTests: allTests.length,
    reportedTests: allTests.filter(test => test.status === 'reported').length,
    allStatuses: Array.from(new Set(allTests.map(test => test.status))),
    firstFewTests: allTests.slice(0, 3).map(test => ({
      id: test.id,
      name: test.name || test.orderNumber,
      status: test.status,
      type: test.type
    }))
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400 opacity-20 mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium animate-pulse">Loading lab reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className={`mb-6 flex justify-between items-start ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ArrowDownTrayIcon className="h-7 w-7 text-purple-600" />
                  <SparklesIcon className="h-4 w-4 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Lab Reports
              </h1>
            </div>
            <p className="ml-1 text-gray-600 font-medium">View and manage your lab test reports and payments</p>
          </div>
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
              queryClient.invalidateQueries({ queryKey: ['prescription-lab-tests'] });
              toast.success('Data refreshed!');
            }}
            className="group relative bg-white/70 backdrop-blur-md hover:bg-white/90 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105 border border-white/20 animate-pulse"
          >
            <svg className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 mb-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-purple-600" />
                  Test Type
                </label>
                <select
                  value={testTypeFilter}
                  onChange={(e) => setTestTypeFilter(e.target.value as 'all' | 'prescribed' | 'ordered')}
                  className="w-full px-4 py-2.5 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 hover:scale-105 cursor-pointer"
                >
                  <option value="all">All Tests</option>
                  <option value="prescribed">Prescribed by Doctor</option>
                  <option value="ordered">Self-Ordered</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 hover:scale-105 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="ordered">Ordered</option>
                  <option value="approved">Approved</option>
                  <option value="verified">Verified</option>
                  <option value="payment_pending">Payment Pending</option>
                  <option value="payment_partial">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="reported">Reported</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="sample_collected">Sample Collected</option>
                  <option value="processing">Processing</option>
                  <option value="results_ready">Results Ready</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200/50 backdrop-blur-sm">
                  <div className="text-sm font-semibold text-purple-900">
                    {allTests.length} test{allTests.length !== 1 ? 's' : ''} found
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tests List */}
        {allTests.length === 0 ? (
          <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-12 text-center hover:shadow-xl transition-all duration-300">
              <div className="text-purple-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No lab tests found</h3>
              <p className="text-gray-600 font-medium">
                {statusFilter || testTypeFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t ordered any lab tests yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className={`space-y-6 ${pageLoaded ? 'animate-fade-in' : ''}`}>
            {allTests.map((test, index) => {
              const totalAmount = getTotalAmount(test);
              const paidAmount = getPaidAmount(test);
              const remainingAmount = getRemainingAmount(test);
              const canPay = canMakePayment(test);

              return (
                <div
                  key={test.id}
                  className="relative group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-2xl blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.01]">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-white/20 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {test.type === 'prescription' ? test.name : `Order #${test.orderNumber}`}
                            </h3>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getStatusBadgeColor(test.status)}`}>
                                {getStatusIcon(test.status)}
                                <span>{formatStatus(test.status)}</span>
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getPaymentStatusBadgeColor(test.paymentStatus || 'not_paid')}`}>
                                Payment: {formatStatus(test.paymentStatus || 'not_paid')}
                              </span>
                              {test.sampleId && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100/80 text-purple-800 border border-purple-300/50 backdrop-blur-sm">
                                  Sample ID: {test.sampleId}
                                </span>
                              )}
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100/80 text-gray-700 border border-gray-300/50 backdrop-blur-sm">
                                {test.type === 'prescription' ? 'Prescription' : 'Self-Ordered'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-600 mb-1">Total Amount</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {formatCurrency(totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Content */}
                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Test Details */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                          {test.type === 'prescription' ? 'Test Details' : 'Tests Included'}
                        </h4>
                        {test.type === 'prescription' ? (
                          <div className="space-y-3">
                            <div className="group">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</span>
                              <p className="text-sm text-gray-900 font-medium mt-1">{test.name}</p>
                            </div>
                            {test.description && (
                              <div className="group">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</span>
                                <p className="text-sm text-gray-900 font-medium mt-1">{test.description}</p>
                              </div>
                            )}
                            <div className="group">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</span>
                              <p className="text-sm text-gray-900 font-medium mt-1">{test.doctorName}</p>
                            </div>
                            <div className="group">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</span>
                              <p className="text-sm text-gray-900 font-medium mt-1">
                                {new Date(test.appointmentDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {test.testDetails?.map((testDetail: any, index: number) => (
                              <div key={index} className="relative group/item">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                                <div className="relative bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/40 hover:border-purple-200/60 transition-all duration-300">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-gray-900">{testDetail.name}</p>
                                      <p className="text-xs text-gray-600 mt-0.5">{testDetail.category}</p>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">
                                      {formatCurrency(testDetail.price)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payment Information */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                          Payment Information
                        </h4>
                        <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/40 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Total Amount</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Paid Amount</span>
                            <span className="text-sm font-bold text-green-600">{formatCurrency(paidAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-3 border-t border-white/40">
                            <span className="text-sm font-bold text-gray-900">Remaining</span>
                            <span className={`text-base font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(remainingAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                          Actions
                        </h4>
                        <div className="space-y-3">
                          {canPay && remainingAmount > 0 && (
                            <button
                              onClick={() => test.type === 'prescription' ? handlePrescriptionPayment(test) : handlePayment(test)}
                              className="group relative w-full overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105 animate-pulse"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              <BanknotesIcon className="h-5 w-5 relative z-10" />
                              <span className="relative z-10">
                                {paidAmount > 0 ? 'Pay Remaining' : 'Pay Now'}
                              </span>
                            </button>
                          )}

                          {test.type === 'prescription' && test.status === 'ordered' && (
                            <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-4 text-center backdrop-blur-sm">
                              <div className="flex items-center justify-center gap-2 text-amber-800">
                                <ClockIcon className="h-5 w-5 animate-pulse" />
                                <span className="text-sm font-bold">Waiting for Admin Approval</span>
                              </div>
                              <p className="text-xs text-amber-700 mt-2 font-medium">
                                Payment will be available once approved by admin
                              </p>
                            </div>
                          )}
                          
                          {/* Show download buttons for prescription tests with reports */}
                          {test.type === 'prescription' && canDownloadReports(test) && (
                            <div className="space-y-2">
                              {test.status === 'confirmed' && (
                                <div className="w-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl p-3 text-center backdrop-blur-sm">
                                  <div className="flex items-center justify-center gap-2 text-emerald-800">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    <span className="text-sm font-bold">Reports Finalized & Sent</span>
                                  </div>
                                </div>
                              )}
                              {test.testReports.map((report: any, index: number) => (
                                <a
                                  key={index}
                                  href={report.path && (report.path.startsWith('http') || report.path.startsWith('https')) ? report.path : `/${report.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105"
                                >
                                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                  <ArrowDownTrayIcon className="h-5 w-5 relative z-10" />
                                  <span className="relative z-10">Download {report.originalName || `Report ${index + 1}`}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => handleDownloadInvoice(test)}
                            className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <DocumentDuplicateIcon className="h-5 w-5 relative z-10" />
                            <span className="relative z-10">Download Invoice</span>
                          </button>
                          
                          {/* Show download buttons for regular lab orders with reports */}
                          {test.type === 'ordered' && canDownloadReports(test) && (
                            <div className="space-y-2">
                              {test.status === 'confirmed' && (
                                <div className="w-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-xl p-3 text-center backdrop-blur-sm">
                                  <div className="flex items-center justify-center gap-2 text-emerald-800">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    <span className="text-sm font-bold">Reports Finalized & Sent</span>
                                  </div>
                                </div>
                              )}
                              {/* Handle multiple files stored in testReports */}
                              {test.testReports && test.testReports.length > 0 ? (
                                test.testReports.map((report: any, index: number) => (
                                  <a
                                    key={index}
                                    href={report.path && (report.path.startsWith('http') || report.path.startsWith('https')) ? report.path : `/${report.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105"
                                  >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <ArrowDownTrayIcon className="h-5 w-5 relative z-10" />
                                    <span className="relative z-10">Download {report.originalName || `Report ${index + 1}`}</span>
                                  </a>
                                ))
                              ) : test.resultUrl && (
                                <a
                                  href={test.resultUrl && (test.resultUrl.startsWith('http') || test.resultUrl.startsWith('https')) ? test.resultUrl : (test.resultUrl.startsWith('/') ? test.resultUrl : `/${test.resultUrl}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group relative w-full overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 hover:scale-105"
                                >
                                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                  <ArrowDownTrayIcon className="h-5 w-5 relative z-10" />
                                  <span className="relative z-10">Download Report</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment Modal for Regular Lab Orders */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30"></div>
              <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 overflow-y-auto max-h-[95vh]">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                  Make Payment - Order #{selectedOrder.orderNumber}
                </h3>
              
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100/50">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                    <span className="font-bold text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Paid Amount</span>
                    <span className="font-bold text-green-600">{formatCurrency(selectedOrder.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-purple-200">
                    <span className="text-sm font-bold text-gray-900">Remaining</span>
                    <span className="font-bold text-red-600 text-lg">{formatCurrency(selectedOrder.dueAmount)}</span>
                  </div>
                </div>
            
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedOrder.dueAmount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/70 hover:shadow-md"
                    placeholder="Enter payment amount"
                  />
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Maximum: {formatCurrency(selectedOrder.dueAmount)}
                  </p>
                  {paymentForm.paymentMethod === 'cash' ? (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      💡 Cash payment will be processed by admin after you pay at the counter
                    </p>
                  ) : (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      Minimum 50% required for sample processing: {formatCurrency(selectedOrder.totalAmount * 0.5)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value, transactionId: '' })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:bg-white/70 hover:shadow-md cursor-pointer"
                  >
                    <option value="cash">Cash (Pay at Counter)</option>
                    <option value="bkash">Online Payment (bKash)</option>
                    <option value="bank_card">Online Payment (Bank Card)</option>
                  </select>
                </div>

                {(paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={paymentForm.transactionId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter transaction ID"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      Required for online payments. Please provide the transaction ID from your payment confirmation.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Add any notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={paymentMutation.isPending ||
                           !paymentForm.amount ||
                           ((paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && !paymentForm.transactionId)}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:scale-105 animate-pulse"
                >
                  {paymentMutation.isPending ? 'Processing...' : 'Make Payment'}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Payment Modal for Prescription Lab Tests */}
        {showPrescriptionPaymentModal && selectedPrescriptionTest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30"></div>
              <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 overflow-y-auto max-h-[95vh]">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                  Make Payment - {selectedPrescriptionTest.name}
                </h3>
                
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-2xl border border-purple-100/50">
                    <div className="flex justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                      <span className="font-bold text-gray-900">{formatCurrency(getTotalAmount(selectedPrescriptionTest))}</span>
                    </div>
                    <div className="flex justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Paid Amount</span>
                      <span className="font-bold text-green-600">{formatCurrency(getPaidAmount(selectedPrescriptionTest))}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-purple-200">
                      <span className="text-sm font-bold text-gray-900">Remaining</span>
                      <span className="font-bold text-red-600 text-lg">{formatCurrency(getRemainingAmount(selectedPrescriptionTest))}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Payment Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={getRemainingAmount(selectedPrescriptionTest)}
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter payment amount"
                    />
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      Maximum: {formatCurrency(getRemainingAmount(selectedPrescriptionTest))}
                    </p>
                    {paymentForm.paymentMethod === 'cash' ? (
                      <p className="text-xs text-blue-600 mt-2 font-medium">
                        💡 Cash payment will be processed by admin after you pay at the counter
                      </p>
                    ) : (
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        Minimum 50% required for sample processing: {formatCurrency(getTotalAmount(selectedPrescriptionTest) * 0.5)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value, transactionId: '' })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="cash">Cash (Pay at Counter)</option>
                      <option value="bkash">Online Payment (bKash)</option>
                      <option value="bank_card">Online Payment (Bank Card)</option>
                    </select>
                  </div>
                    
                {(paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && (
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={paymentForm.transactionId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                      className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter transaction ID"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      Required for online payments. Please provide the transaction ID from your payment confirmation.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-4 py-3 border border-purple-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="Add any notes..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowPrescriptionPaymentModal(false)}
                  className="flex-1 px-5 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-300 hover:shadow-md hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={processPrescriptionPayment}
                  disabled={prescriptionPaymentMutation.isPending ||
                           !paymentForm.amount ||
                           ((paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && !paymentForm.transactionId)}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:scale-105 animate-pulse"
                >
                  {prescriptionPaymentMutation.isPending ? 'Processing...' : 'Make Payment'}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabReports;