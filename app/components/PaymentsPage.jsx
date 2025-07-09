// components/PaymentsPage.jsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { allFeeTypes, studentFeeTypes, classFeeTypes, monthOrder } from '@/lib/constants';

const classData = {
    "6": ["GOLAP", "SHAPLA", "BELI", "SHEULY", "TAGAR", "BAKUL", "RAJANIGANDHA"],
    "7": ["DOYEL", "KOYEL", "MOYNA", "TIYA", "EAGLE", "KOKIL"],
    "8": ["SHITOLOKKHA", "MEGHNA", "PADMA", "JAMUNA"],
    "9": ["LAL", "SABUJ"],
    "10": ["AAM", "JAM"]
};

// Helper to generate unique IDs for payment sectors
let sectorIdCounter = 0;
const generateUniqueId = () => `sector-${sectorIdCounter++}-${Date.now()}`;

export default function PaymentsPage({
  payments,
  students,
  currentUser,
  showCustomAlert,
  refreshData
}) {
  const [filterPaymentId, setFilterPaymentId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [formState, setFormState] = useState({
    paymentMode: 'student', // 'student' or 'class'
    receiptNo: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    studentId: '',
    paymentClass: '',
    paymentSection: '',
    paymentSectors: [{ id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }],
    feeType: allFeeTypes[0], // For class payments, this will be used directly (single sector implied)
    month: [], // For class payments, this will be used directly (single sector implied)
    amount: '', // For class payments, this will be used directly (single sector implied)
    description: '', // For class payments, this will be used directly (single sector implied)
  });
  const [studentInfo, setStudentInfo] = useState(null);

  const filteredPayments = payments.filter(p => {
    const matchesFilter = !filterPaymentId ||
      (p.studentId && p.studentId.toLowerCase().includes(filterPaymentId.toLowerCase()));
    return matchesFilter;
  });

  const canEditPayments = currentUser?.role === 'Accounts Officer';

  // Make openModal callable from outside, accepting a studentId to pre-fill
  const openModal = useCallback((payment = null, prefillStudentId = null) => {
    if (payment) {
      setEditPaymentId(payment.id);
      // Determine payment mode based on studentId format
      const mode = payment.studentId && payment.studentId.startsWith('CLASS-') ? 'class' : 'student';

      setFormState({
        paymentMode: mode,
        receiptNo: payment.receiptNo || '',
        date: payment.date || new Date().toISOString().split('T')[0],
        year: payment.year || new Date().getFullYear(),
        studentId: mode === 'student' ? (payment.studentId || '') : '',
        paymentClass: mode === 'class' ? (parseInt(payment.studentId.split('-')[1]) || '') : '',
        paymentSection: mode === 'class' ? (payment.studentId.split('-')[2] || '') : '',
        // When editing, load the single payment into the first sector
        paymentSectors: [{
          id: generateUniqueId(), // New ID for the sector in the form
          feeType: payment.feeType || allFeeTypes[0],
          month: Array.isArray(payment.month) ? payment.month : (payment.month ? [payment.month] : []),
          amount: payment.amount || '',
          description: payment.description || '',
        }],
        // Also set for class mode for direct use
        feeType: payment.feeType || allFeeTypes[0],
        month: Array.isArray(payment.month) ? payment.month : (payment.month ? [payment.month] : []),
        amount: payment.amount || '',
        description: payment.description || '',
      });

      if (mode === 'student' && payment.studentId && !payment.studentId.startsWith('CLASS-')) {
        const student = students.find(s => s.id === payment.studentId);
        if (student) {
          setStudentInfo({
            name: student.name,
            guardian: student.guardian,
            class: student.class,
            section: student.section,
            roll: student.roll,
          });
        }
      } else {
        setStudentInfo(null);
      }
    } else {
      // Initialize for new payment
      setEditPaymentId(null);
      const initialStudentId = prefillStudentId || '';
      setFormState(prev => ({
        ...prev,
        receiptNo: '',
        date: new Date().toISOString().split('T')[0],
        year: new Date().getFullYear(),
        paymentMode: 'student', // Always default to student payment when adding new
        studentId: initialStudentId,
        paymentClass: '',
        paymentSection: '',
        paymentSectors: [{ id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }],
        feeType: allFeeTypes[0],
        month: [],
        amount: '',
        description: '',
      }));
      // If prefillStudentId is provided, immediately try to fetch student info
      if (initialStudentId) {
        const student = students.find(s => s.id && s.id.toLowerCase() === initialStudentId.toLowerCase());
        if (student) {
          setStudentInfo({
            name: student.name,
            guardian: student.guardian,
            class: student.class,
            section: student.section,
            roll: student.roll,
          });
          // Auto-fill tuition/vehicle fee for the first sector if applicable
          // This part needs to be careful as formState.paymentSectors might not be updated immediately
          // after setFormState. For now, we'll rely on the blur event or manual selection.
          // A more robust solution might involve a useEffect for initialStudentId.
        } else {
          showCustomAlert('Student ID not found for pre-fill.', true);
          setStudentInfo(null);
        }
      } else {
        setStudentInfo(null);
      }
    }
    setIsModalOpen(true);
  }, [students, showCustomAlert]); // Added dependencies to useCallback

  // Expose openModal via a ref so StudentsPage can call it
  const paymentModalRef = useRef(null);
  React.useImperativeHandle(paymentModalRef, () => ({
    openModal: openModal
  }));

  const closeModal = () => {
    setIsModalOpen(false);
    setEditPaymentId(null);
    setStudentInfo(null);
    setFormState({
      paymentMode: 'student',
      receiptNo: '',
      date: new Date().toISOString().split('T')[0],
      year: new Date().getFullYear(),
      studentId: '',
      paymentClass: '',
      paymentSection: '',
      paymentSectors: [{ id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }],
      feeType: allFeeTypes[0],
      month: [],
      amount: '',
      description: '',
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;

    if (name === 'paymentMode') {
      setFormState(prev => ({ ...prev, [name]: value }));
      // Reset student/class specific fields when mode changes
      if (value === 'student') {
        setFormState(prev => ({
          ...prev,
          paymentMode: value,
          paymentClass: '',
          paymentSection: '',
          // Ensure at least one sector for student mode
          paymentSectors: prev.paymentSectors.length > 0 ? prev.paymentSectors : [{ id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }],
        }));
      } else { // class mode
        setFormState(prev => ({
          ...prev,
          paymentMode: value,
          studentId: '',
          paymentSectors: [], // Clear sectors for class mode
        }));
        setStudentInfo(null);
      }
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
        // Handle select-multiple for top-level month (for class payments)
        ...(type === 'select-multiple' && name === 'month' && { [name]: Array.from(selectedOptions).map(option => option.value) }),
      }));
    }
  };

  const handleSectorChange = (sectorId, fieldName, value) => {
    setFormState(prev => ({
      ...prev,
      paymentSectors: prev.paymentSectors.map(sector =>
        sector.id === sectorId ? { ...sector, [fieldName]: value } : sector
      )
    }));
  };

  const addPaymentSector = () => {
    setFormState(prev => ({
      ...prev,
      paymentSectors: [
        ...prev.paymentSectors,
        { id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }
      ]
    }));
  };

  const removePaymentSector = (sectorId) => {
    if (formState.paymentSectors.length > 1) { // Prevent removing the last sector
      setFormState(prev => ({
        ...prev,
        paymentSectors: prev.paymentSectors.filter(sector => sector.id !== sectorId)
      }));
    } else {
      showCustomAlert('At least one payment sector is required.', true);
    }
  };


  const handleStudentIdBlur = () => {
    const studentId = formState.studentId;
    const student = students.find(s => s.id && s.id.toLowerCase() === studentId.toLowerCase());
    if (student) {
      setStudentInfo({
        name: student.name,
        guardian: student.guardian,
        class: student.class,
        section: student.section,
        roll: student.roll,
      });
      // Auto-fill tuition/vehicle fee for the first sector if applicable
      if (formState.paymentSectors.length > 0) {
        const firstSector = formState.paymentSectors[0];
        if (firstSector.feeType === 'TUITION FEE') {
          handleSectorChange(firstSector.id, 'amount', student.tuitionFee || '');
        } else if (firstSector.feeType === 'VEHICLE FEE') {
          handleSectorChange(firstSector.id, 'amount', student.vehicleFee || '');
        }
      }
    } else {
      setStudentInfo(null);
      showCustomAlert('Student ID not found.', true);
    }
  };

  const handleSectorFeeTypeChange = (sectorId, newFeeType) => {
    handleSectorChange(sectorId, 'feeType', newFeeType);
    handleSectorChange(sectorId, 'amount', ''); // Clear amount when fee type changes

    // Auto-fill amount if studentId is present and fee type is tuition/vehicle
    if (studentFeeTypes.includes(newFeeType) && formState.studentId) {
      const student = students.find(s => s.id && s.id.toLowerCase() === formState.studentId.toLowerCase());
      if (student) {
        if (newFeeType === 'TUITION FEE') {
          handleSectorChange(sectorId, 'amount', student.tuitionFee || '');
        } else if (newFeeType === 'VEHICLE FEE') {
          handleSectorChange(sectorId, 'amount', student.vehicleFee || '');
        }
      }
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    const commonPayload = {
      receiptNo: formState.receiptNo,
      year: formState.year,
      date: formState.date,
    };

    let allPaymentsSuccessful = true;
    let errorMessage = '';

    if (formState.paymentMode === 'student') {
      if (!formState.studentId) { showCustomAlert('Student ID is required.', true); return; }
      if (!formState.receiptNo) { showCustomAlert('Receipt No. is required.', true); return; }
      if (formState.paymentSectors.length === 0) { showCustomAlert('At least one payment sector is required.', true); return; }

      const student = students.find(s => s.id && s.id.toLowerCase() === formState.studentId.toLowerCase());
      if (!student) { showCustomAlert('Student with this ID not found.', true); return; }

      for (const sector of formState.paymentSectors) {
        if (!sector.feeType || sector.amount === '' || sector.amount === null || isNaN(sector.amount)) { // Check for empty, null, or NaN amount
          showCustomAlert('Fee Type and Amount are required for all payment sectors.', true);
          return;
        }
        if (studentFeeTypes.includes(sector.feeType) && sector.month.length === 0 && !['ADMISSION', 'RE-ADMISSION', 'HALF YEARLY EXAM', 'YEARLY EXAM'].includes(sector.feeType)) {
          showCustomAlert(`Please select at least one month for ${sector.feeType}.`, true);
          return;
        }

        const payload = {
          ...commonPayload,
          studentId: student.id,
          feeType: sector.feeType,
          amount: sector.amount,
          description: sector.description,
        };

        if (['ADMISSION', 'RE-ADMISSION', 'HALF YEARLY EXAM', 'YEARLY EXAM'].includes(sector.feeType)) {
          payload.month = 'N/A';
          const apiResponse = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!apiResponse.ok) {
            allPaymentsSuccessful = false;
            const errorData = await apiResponse.json();
            errorMessage = `Failed to save payment for ${sector.feeType}: ${errorData.error || apiResponse.statusText}`;
            break; // Stop on first error
          }
        } else {
          for (const month of sector.month) {
            const apiResponse = await fetch('/api/payments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, month }),
            });
            if (!apiResponse.ok) {
              allPaymentsSuccessful = false;
              const errorData = await apiResponse.json();
              errorMessage = `Failed to save payment for ${sector.feeType} (${month}): ${errorData.error || apiResponse.statusText}`;
              break; // Stop on first error
            }
          }
          if (!allPaymentsSuccessful) break;
        }
      }

    } else { // Class Payment Mode
      if (!formState.paymentClass || !formState.paymentSection) { showCustomAlert('Class and Section are required.', true); return; }
      if (!formState.receiptNo) { showCustomAlert('Receipt No. is required.', true); return; }
      if (formState.amount === '' || formState.amount === null || isNaN(formState.amount)) { // Check for empty, null, or NaN amount
        showCustomAlert('Fee Type and Amount are required.', true); return;
      }
      if (classFeeTypes.includes(formState.feeType) && formState.month.length === 0 && !['ADMISSION', 'RE-ADMISSION', 'HALF YEARLY EXAM', 'YEARLY EXAM'].includes(formState.feeType)) { showCustomAlert('Please select at least one month for class payment.', true); return; }

      const payload = {
        ...commonPayload,
        studentId: `CLASS-${formState.paymentClass}-${formState.paymentSection}`,
        feeType: formState.feeType,
        amount: formState.amount,
        description: formState.description,
      };

      if (['ADMISSION', 'RE-ADMISSION', 'HALF YEARLY EXAM', 'YEARLY EXAM'].includes(formState.feeType)) {
        payload.month = 'N/A';
        const apiResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!apiResponse.ok) {
          allPaymentsSuccessful = false;
          const errorData = await apiResponse.json();
          errorMessage = `Failed to save class payment for ${formState.feeType}: ${errorData.error || apiResponse.statusText}`;
        }
      } else {
        for (const month of formState.month) {
          const apiResponse = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, month }),
          });
          if (!apiResponse.ok) {
            allPaymentsSuccessful = false;
            const errorData = await apiResponse.json();
            errorMessage = `Failed to save class payment for ${formState.feeType} (${month}): ${errorData.error || apiResponse.statusText}`;
            break;
          }
        }
      }
    }

    if (allPaymentsSuccessful) {
      showCustomAlert('Payment(s) saved successfully!', false);
      closeModal();
      refreshData();
    } else {
      showCustomAlert(`Failed to save payment(s): ${errorMessage}`, true);
    }
  };

  const populateSectionDropdown = (selectedClass) => {
    if (selectedClass && classData[selectedClass]) {
      return classData[selectedClass].map(section => (
        <option key={section} value={section}>{section}</option>
      ));
    }
    return <option value="">Select Section</option>;
  };

  return (
    <section id="page-payments" className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Fee Payments</h2>
        {canEditPayments && (
          <button
            onClick={() => openModal()}
            className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center w-full md:w-auto"
          >
            <i className="fas fa-plus mr-2"></i> Add Payment
          </button>
        )}
      </div>
      {/* Main content area, now flex-grow to fill available height */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col flex-grow min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <input
            type="text"
            placeholder="Filter by Student ID or Class ID..."
            className="w-full p-2 border border-gray-300 rounded-lg col-span-1 md:col-span-3"
            value={filterPaymentId}
            onChange={(e) => setFilterPaymentId(e.target.value)}
          />
          <button
            onClick={() => setFilterPaymentId('')}
            className="btn-tertiary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
          >
            Clear Filter
          </button>
        </div>
        {/* Table Container - handles horizontal scrolling for the entire table */}
        <div className="flex-grow min-h-0 overflow-auto"> {/* Changed to overflow-auto for both x and y if needed */}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10"> {/* sticky top-0 for fixed header on scroll */}
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">Receipt No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Paid For (ID)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">Fee Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(payment => {
                  const monthsDisplay = Array.isArray(payment.month) ? payment.month.join(', ') : (payment.month || 'N/A');
                  const amountDisplay = payment.amount ? `$${payment.amount.toLocaleString()}` : '$0';
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{payment.receiptNo || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.date || 'N/A'}</td>
                      <td className="px-6 py-4">{payment.studentId || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.feeType || 'N/A'}</td>
                      <td className="px-6 py-4">{monthsDisplay}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{amountDisplay}</td>
                      <td className="px-6 py-4">{payment.description || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {canEditPayments && studentFeeTypes.includes(payment.feeType) && (
                          <button
                            onClick={() => openModal(payment)}
                            className="edit-payment-btn text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40 opacity-100">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 overflow-y-auto max-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editPaymentId ? 'Edit Payment' : 'Add New Payment'}</h2>
            <form onSubmit={handlePaymentSubmit}>
              {/* Payment Mode Toggle */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment For:</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="student"
                      checked={formState.paymentMode === 'student'}
                      onChange={handleFormChange}
                      className="form-radio h-4 w-4 text-indigo-600"
                      disabled={!!editPaymentId} // Disable mode change when editing
                    />
                    <span className="ml-2 text-gray-700">Student Payment</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="class"
                      checked={formState.paymentMode === 'class'}
                      onChange={handleFormChange}
                      className="form-radio h-4 w-4 text-indigo-600"
                      disabled={!!editPaymentId} // Disable mode change when editing
                    />
                    <span className="ml-2 text-gray-700">Class Payment</span>
                  </label>
                </div>
              </div>

              {/* Common fields for both modes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="receiptNo" className="block text-sm font-medium text-gray-700">Receipt No.</label>
                  <input
                    type="text"
                    id="receiptNo"
                    name="receiptNo"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formState.receiptNo}
                    onChange={handleFormChange}
                    required
                    disabled={!!editPaymentId} // Disable editing receiptNo
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Payment Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formState.date}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700">Payment Year</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formState.year}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>


              {/* Student Payment Fields */}
              {formState.paymentMode === 'student' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">Student ID</label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                      value={formState.studentId}
                      onChange={handleFormChange}
                      onBlur={handleStudentIdBlur}
                      required
                      disabled={!!editPaymentId} // Disable editing studentId
                    />
                  </div>
                  {studentInfo && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm"><strong className="font-semibold text-gray-800">Name:</strong> {studentInfo.name}</p>
                      <p className="text-sm"><strong className="font-semibold text-gray-800">Guardian:</strong> {studentInfo.guardian}</p>
                      <p className="text-sm"><strong className="font-semibold text-gray-800">Class:</strong> {studentInfo.class}-{studentInfo.section} | <strong className="font-semibold text-gray-800">Roll:</strong> {studentInfo.roll}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Sectors</h3>
                    {formState.paymentSectors.map((sector, index) => (
                      <div key={sector.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg relative">
                        {formState.paymentSectors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePaymentSector(sector.id)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            title="Remove this payment sector"
                          >
                            <i className="fas fa-times-circle"></i>
                          </button>
                        )}
                        <div className="md:col-span-2">
                          <label htmlFor={`feeType-${sector.id}`} className="block text-sm font-medium text-gray-700">Fee Type</label>
                          <select
                            id={`feeType-${sector.id}`}
                            name="feeType"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            value={sector.feeType}
                            onChange={(e) => handleSectorFeeTypeChange(sector.id, e.target.value)}
                            required
                          >
                            {allFeeTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`amount-${sector.id}`} className="block text-sm font-medium text-gray-700">Amount</label>
                          <input
                            type="number"
                            id={`amount-${sector.id}`}
                            name="amount"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            value={sector.amount}
                            onChange={(e) => handleSectorChange(sector.id, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            required
                          />
                        </div>
                        {studentFeeTypes.includes(sector.feeType) && !['ADMISSION', 'RE-ADMISSION', 'HALF YEARLY EXAM', 'YEARLY EXAM'].includes(sector.feeType) && (
                          <div className="md:col-span-4">
                            <label htmlFor={`month-${sector.id}`} className="block text-sm font-medium text-gray-700">Month(s) <span className="text-xs text-gray-500">(Hold Ctrl/Cmd to select multiple)</span></label>
                            <select
                              id={`month-${sector.id}`}
                              name="month"
                              multiple
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                              value={sector.month}
                              onChange={(e) => handleSectorChange(sector.id, 'month', Array.from(e.target.selectedOptions).map(option => option.value))}
                              required
                            >
                              {monthOrder.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="md:col-span-4">
                          <label htmlFor={`description-${sector.id}`} className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                          <textarea
                            id={`description-${sector.id}`}
                            name="description"
                            rows="1"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                            value={sector.description}
                            onChange={(e) => handleSectorChange(sector.id, 'description', e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPaymentSector}
                      className="btn-secondary text-indigo-600 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-100 transition duration-300 flex items-center"
                    >
                      <i className="fas fa-plus mr-2"></i> Add Another Payment Sector
                    </button>
                  </div>
                </div>
              )}

              {/* Class Payment Fields */}
              {formState.paymentMode === 'class' && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="paymentClass" className="block text-sm font-medium text-gray-700">Class</label>
                      <select
                        id="paymentClass"
                        name="paymentClass"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        value={formState.paymentClass}
                        onChange={handleFormChange}
                        required
                        disabled={!!editPaymentId}
                      >
                        <option value="">Select Class</option>
                        {Object.keys(classData).map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="paymentSection" className="block text-sm font-medium text-gray-700">Section</label>
                      <select
                        id="paymentSection"
                        name="paymentSection"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        value={formState.paymentSection}
                        onChange={handleFormChange}
                        required
                        disabled={!!editPaymentId}
                      >
                        <option value="">Select Section</option>
                        {populateSectionDropdown(formState.paymentClass)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                      <label htmlFor="feeType" className="block text-sm font-medium text-gray-700">Fee Type</label>
                      <select
                        id="feeType"
                        name="feeType"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        value={formState.feeType}
                        onChange={handleFormChange}
                        required
                        disabled={!!editPaymentId}
                      >
                        {allFeeTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        value={formState.amount}
                        onChange={handleFormChange}
                        required
                      />
                    </div>
                    {classFeeTypes.includes(formState.feeType) && (
                      <div className="md:col-span-2">
                        <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month(s) <span className="text-xs text-gray-500">(Hold Ctrl/Cmd to select multiple)</span></label>
                        <select
                          id="month"
                          name="month"
                          multiple
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                          value={formState.month}
                          onChange={handleFormChange}
                          required
                        >
                          {monthOrder.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">Payment Description</label>
                      <textarea
                        id="description"
                        name="description"
                        rows="2"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        value={formState.description}
                        onChange={handleFormChange}
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md">Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}