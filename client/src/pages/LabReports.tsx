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
  DocumentDuplicateIcon,
  QueueListIcon,
  ChartPieIcon,
  ShoppingBagIcon,
  ArrowsRightLeftIcon,
  ArrowRightIcon,
  Bars3Icon,
  UserIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';

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
      case 'approved': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'sample_processing': return 'bg-purple-100 text-purple-800 border border-purple-300';
      case 'sample_taken': return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'reported': return 'bg-amber-100 text-amber-800 border border-amber-300';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
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
      case 'approved': return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'sample_processing': return <ArrowPathIcon className="h-4 w-4" />;
      case 'sample_taken': return <PlayIcon className="h-4 w-4" />;
      case 'reported': return <ArrowDownTrayIcon className="h-4 w-4 text-amber-500" />;
      case 'completed': return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />;
      case 'confirmed': return <CheckCircleIcon className="h-4 w-4 text-emerald-500" />;
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
    const reportAvailableStatuses = ['reported', 'completed', 'confirmed', 'results_ready'];
    
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

  const statsCards = [
    { name: 'Total Tests', value: allTests.length, icon: QueueListIcon, color: 'text-indigo-600', bg: 'bg-indigo-500/5' },
    { name: 'Pending Payments', value: allTests.filter(t => (t.paymentStatus || t.status) !== 'paid' && t.status !== 'completed').length, icon: BanknotesIcon, color: 'text-rose-600', bg: 'bg-rose-500/5' },
    { name: 'Completed', value: allTests.filter(t => t.status === 'completed' || t.status === 'confirmed').length, icon: CheckCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-500/5' },
    { name: 'Processing', value: allTests.filter(t => t.status === 'sample_processing' || t.status === 'sample_taken').length, icon: ArrowPathIcon, color: 'text-amber-600', bg: 'bg-amber-500/5' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafbff] flex items-center justify-center noise-overlay">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Synchronizing Lab Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbff] relative overflow-hidden font-sans noise-overlay dot-grid selection:bg-indigo-100 selection:text-indigo-900">
      {/* Aurora Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] bg-indigo-500/[0.04] rounded-full blur-[140px] animate-aurora" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] bg-violet-500/[0.04] rounded-full blur-[120px] animate-aurora" style={{ animationDelay: '-10s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 space-y-12">
        {/* PREMIUM HEADER */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[40px] bg-slate-900 p-10 md:p-16 text-white shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 right-0 w-1/2 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/20 via-transparent to-transparent opacity-60" />
              <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-indigo-400/20 rounded-full blur-[100px]" />
            </div>
            
            <div className="relative z-10 md:flex items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/10 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Clinical Records
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] heading-display">
                  Diagnostic <br />
                  <span className="text-gradient bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">Matrix.</span>
                </h1>
                <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
                  Real-time synchronization of laboratory reports, payment statuses, and automated diagnostic insights.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-4">
                  <MagneticButton 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
                      queryClient.invalidateQueries({ queryKey: ['prescription-lab-tests'] });
                      toast.success('Lab Matrix Refreshed');
                    }}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-indigo-500/20 transition-all border border-white/10"
                  >
                    <ArrowPathIcon className="h-4 w-4" /> Sync Registry
                  </MagneticButton>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="w-64 h-64 rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-center relative group overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                   <SparklesIcon className="h-24 w-24 text-indigo-400 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Agentic Analysis Ready</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* STATS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, i) => (
            <Reveal key={stat.name} delay={i * 0.1}>
              <div className="premium-card bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-full opacity-30 group-hover:scale-110 transition-transform duration-700`} />
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center border border-slate-50 transition-transform group-hover:rotate-6`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.name}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* FILTERS ENGINE */}
        <Reveal variant="fadeIn" delay={0.4}>
          <div className="glass border-white/20 rounded-[32px] p-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 opacity-20" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1 border-r border-slate-100 pr-8">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-indigo-500" /> Filter Analysis
                 </h4>
                 <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{allTests.length} Protocols Loaded</span>
                 </div>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Protocol Type</label>
                  <div className="relative">
                    <select
                      value={testTypeFilter}
                      onChange={(e) => setTestTypeFilter(e.target.value as 'all' | 'prescribed' | 'ordered')}
                      className="w-full h-14 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="all">Comprehensive Analysis</option>
                      <option value="prescribed">Doctor Prescribed</option>
                      <option value="ordered">Patient Initiated</option>
                    </select>
                    <ArrowsRightLeftIcon className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Status</label>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-14 pl-5 pr-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Full Lifecycle</option>
                      <option value="ordered">Ordered</option>
                      <option value="approved">Approved</option>
                      <option value="sample_processing">Sample Processing</option>
                      <option value="sample_taken">Sample Taken</option>
                      <option value="reported">Reported</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <QueueListIcon className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 pb-20">
          <AnimatePresence mode="popLayout">
            {allTests.length === 0 ? (
              <Reveal variant="fadeIn" delay={0.5}>
                <div className="glass rounded-[40px] p-20 text-center border-white/20">
                  <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <BeakerIcon className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No diagnostic data found.</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                    Adjust your analysis filters or initiate a new diagnostic protocol to populate the matrix.
                  </p>
                </div>
              </Reveal>
            ) : (
              allTests.map((test, index) => {
                const totalAmount = getTotalAmount(test);
                const paidAmount = getPaidAmount(test);
                const remainingAmount = getRemainingAmount(test);
                const canPay = canMakePayment(test);

                return (
                  <Reveal key={test.id} delay={index * 0.05} variant="fadeUp">
                    <div className="premium-card bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700 overflow-hidden group">
                      {/* CARD HEADER STRIP */}
                      <div className="px-10 py-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-slate-200">
                              {test.type === 'prescription' ? 'RX' : 'LB'}
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                                {test.type === 'prescription' ? test.name : `Protocol #${test.orderNumber}`}
                              </h3>
                              <div className="flex flex-wrap gap-3 mt-3">
                                 <div className="px-3 py-1 bg-slate-900 rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em]">
                                    {formatStatus(test.status)}
                                 </div>
                                 <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                                    test.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                 }`}>
                                    Payment: {formatStatus(test.paymentStatus || 'not_paid')}
                                 </div>
                                 {test.sampleId && (
                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                                       ID: {test.sampleId}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Valuation</p>
                          <p className="text-3xl font-black text-slate-900 tracking-tight">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                      </div>

                      {/* CARD CONTENT BODY */}
                      <div className="p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                          
                          {/* TEST SCHEMA */}
                          <div className="lg:col-span-2 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                               <DocumentTextIcon className="h-4 w-4" /> Diagnostic Schema
                            </h4>
                            {test.type === 'prescription' ? (
                               <div className="space-y-6">
                                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                                     <p className="text-sm font-bold text-slate-900 mb-2">{test.name}</p>
                                     <p className="text-xs text-slate-500 leading-relaxed">{test.description || 'No additional diagnostic notes.'}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Clinician</p>
                                        <p className="text-xs font-bold text-slate-900">{test.doctorName}</p>
                                     </div>
                                     <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Protocol Date</p>
                                        <p className="text-xs font-bold text-slate-900">{new Date(test.appointmentDate).toLocaleDateString()}</p>
                                     </div>
                                  </div>
                               </div>
                            ) : (
                               <div className="grid grid-cols-1 gap-3">
                                  {test.testDetails?.map((testDetail: any, i: number) => (
                                     <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all">
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100">
                                              <BeakerIcon className="h-4 w-4 text-indigo-500" />
                                           </div>
                                           <div>
                                              <p className="text-xs font-bold text-slate-900">{testDetail.name}</p>
                                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{testDetail.category}</p>
                                           </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">{formatCurrency(testDetail.price)}</span>
                                     </div>
                                  ))}
                               </div>
                            )}
                          </div>

                          {/* FINANCIAL OVERVIEW */}
                          <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                               <BanknotesIcon className="h-4 w-4" /> Financial Matrix
                            </h4>
                            <div className="space-y-4">
                               <div className="flex justify-between py-1">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gross Total</span>
                                  <span className="text-xs font-black text-slate-900">{formatCurrency(totalAmount)}</span>
                               </div>
                               <div className="flex justify-between py-1">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synced Payments</span>
                                  <span className="text-xs font-black text-emerald-500">{formatCurrency(paidAmount)}</span>
                               </div>
                               <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                  <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Outstanding</span>
                                  <span className={`text-xl font-black ${remainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                     {formatCurrency(remainingAmount)}
                                  </span>
                               </div>
                               {remainingAmount > 0 && (
                                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[10px] font-bold text-rose-600 leading-tight">
                                     Finalizing the remaining balance will accelerate your diagnostic results.
                                  </div>
                               )}
                            </div>
                          </div>

                          {/* ACTIONS COMMAND CENTER */}
                          <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                               <PlayIcon className="h-4 w-4" /> Command Hub
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                               {canPay && remainingAmount > 0 && (
                                  <MagneticButton
                                    onClick={() => test.type === 'prescription' ? handlePrescriptionPayment(test) : handlePayment(test)}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                  >
                                    <BanknotesIcon className="h-5 w-5" /> Execute Payment
                                  </MagneticButton>
                               )}

                               {test.type === 'prescription' && test.status === 'ordered' && (
                                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                                     <ClockIcon className="h-5 w-5 text-amber-600 mx-auto mb-2 animate-pulse" />
                                     <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Protocol Sync Pending</p>
                                     <p className="text-[9px] text-amber-600 mt-1 font-bold">Waiting for registry approval.</p>
                                  </div>
                               )}

                               {canDownloadReports(test) && (
                                  <div className="space-y-2">
                                     {(test.type === 'prescription' ? test.testReports : (test.testReports || (test.resultUrl ? [{path: test.resultUrl, originalName: 'Diagnostic Report'}] : []))).map((report: any, i: number) => (
                                        <a
                                          key={i}
                                          href={report.path && (report.path.startsWith('http') || report.path.startsWith('https')) ? report.path : `/${report.path}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="w-full h-14 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" /> Access Report {i > 0 ? i + 1 : ''}
                                        </a>
                                     ))}
                                  </div>
                               )}

                               <button 
                                 onClick={() => handleDownloadInvoice(test)}
                                 className="w-full h-14 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                               >
                                 <DocumentDuplicateIcon className="h-4 w-4" /> Export Invoice
                               </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })
            )}
          </AnimatePresence>
        </div>
}

        <AnimatePresence>
          {showPaymentModal && selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPaymentModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
                
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Execute Payment</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Syncing Protocol #{selectedOrder.orderNumber}</p>
                    </div>
                    <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                      <Bars3Icon className="h-5 w-5 rotate-45" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                          <div className="absolute top-[-20%] right-[-10%] w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-4">Outstanding Balance</p>
                          <p className="text-3xl font-black">{formatCurrency(selectedOrder.dueAmount)}</p>
                          <div className="mt-4 flex flex-col gap-1">
                             <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Total Price</span>
                                <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                             </div>
                             <div className="flex justify-between text-[10px] font-bold text-emerald-400">
                                <span>Already Paid</span>
                                <span>{formatCurrency(selectedOrder.paidAmount)}</span>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Method</label>
                          <div className="grid grid-cols-1 gap-2">
                             {['cash', 'bkash', 'bank_card'].map((method) => (
                                <button
                                  key={method}
                                  onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: method })}
                                  className={`w-full h-12 px-5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all text-left flex items-center justify-between ${
                                    paymentForm.paymentMethod === method ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                                  }`}
                                >
                                  {method === 'cash' ? 'Pay at Counter' : method === 'bkash' ? 'bKash Online' : 'Bank Card'}
                                  {paymentForm.paymentMethod === method && <CheckCircleIcon className="h-4 w-4" />}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantum Amount</label>
                          <input
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="Enter amount..."
                          />
                       </div>

                       {(paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && (
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Transaction ID</label>
                             <input
                               type="text"
                               value={paymentForm.transactionId}
                               onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                               className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                               placeholder="e.g. TRANKX10293..."
                             />
                          </div>
                       )}

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Diagnostic Notes</label>
                          <textarea
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            className="w-full h-24 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            placeholder="Optional notes..."
                          />
                       </div>
                    </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 h-14 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                    >
                      Abort
                    </button>
                    <MagneticButton
                      onClick={processPayment}
                      disabled={paymentMutation.isPending || !paymentForm.amount || ((paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && !paymentForm.transactionId)}
                      className="flex-[2] h-14 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {paymentMutation.isPending ? 'Syncing...' : 'Finalize Payment'}
                    </MagneticButton>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPrescriptionPaymentModal && selectedPrescriptionTest && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPrescriptionPaymentModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
                
                <div className="p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Diagnostic Sync</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Syncing Protocol {selectedPrescriptionTest.name}</p>
                    </div>
                    <button onClick={() => setShowPrescriptionPaymentModal(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                      <Bars3Icon className="h-5 w-5 rotate-45" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="p-6 rounded-3xl bg-slate-900 text-white relative overflow-hidden group">
                          <div className="absolute top-[-20%] right-[-10%] w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-4">Required Balance</p>
                          <p className="text-3xl font-black">{formatCurrency(getRemainingAmount(selectedPrescriptionTest))}</p>
                          <div className="mt-4 flex flex-col gap-1">
                             <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                <span>Total Price</span>
                                <span>{formatCurrency(getTotalAmount(selectedPrescriptionTest))}</span>
                             </div>
                             <div className="flex justify-between text-[10px] font-bold text-emerald-400">
                                <span>Paid Amount</span>
                                <span>{formatCurrency(getPaidAmount(selectedPrescriptionTest))}</span>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Channel</label>
                          <div className="grid grid-cols-1 gap-2">
                             {['cash', 'bkash', 'bank_card'].map((method) => (
                                <button
                                  key={method}
                                  onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: method })}
                                  className={`w-full h-12 px-5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all text-left flex items-center justify-between ${
                                    paymentForm.paymentMethod === method ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'
                                  }`}
                                >
                                  {method === 'cash' ? 'Pay at Counter' : method === 'bkash' ? 'bKash Online' : 'Bank Card'}
                                  {paymentForm.paymentMethod === method && <CheckCircleIcon className="h-4 w-4" />}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Quantum Amount</label>
                          <input
                            type="number"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            placeholder="Enter amount..."
                          />
                       </div>

                       {(paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && (
                          <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Transaction Identity</label>
                             <input
                               type="text"
                               value={paymentForm.transactionId}
                               onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                               className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                               placeholder="e.g. TRANKX10293..."
                             />
                          </div>
                       )}

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Diagnostic Registry Notes</label>
                          <textarea
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                            className="w-full h-24 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                            placeholder="Clinical notes..."
                          />
                       </div>
                    </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => setShowPrescriptionPaymentModal(false)}
                      className="flex-1 h-14 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all"
                    >
                      Abort Sync
                    </button>
                    <MagneticButton
                      onClick={processPrescriptionPayment}
                      disabled={prescriptionPaymentMutation.isPending || !paymentForm.amount || ((paymentForm.paymentMethod === 'bkash' || paymentForm.paymentMethod === 'bank_card') && !paymentForm.transactionId)}
                      className="flex-[2] h-14 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {prescriptionPaymentMutation.isPending ? 'Syncing...' : 'Finalize Sync'}
                    </MagneticButton>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
}
      </div>
    </div>
  );
};

export default LabReports;