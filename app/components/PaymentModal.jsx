// components/PaymentModal.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export default function PaymentModal({
  isOpen, // Prop to control modal visibility
  onClose, // Callback to close the modal
  initialPayment = null, // For editing an existing payment
  initialStudentId = null, // For pre-filling student ID when adding new payment
  students, // List of all students for student ID lookup
  currentUser, // Current authenticated user for roles
  showCustomAlert, // Function to display custom alerts
  onPaymentSuccess, // Callback to refresh data after successful payment
}) {
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

  // Effect to initialize form state when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      if (initialPayment) {
        // Editing an existing payment
        setEditPaymentId(initialPayment.id);
        const mode = initialPayment.studentId && initialPayment.studentId.startsWith('CLASS-') ? 'class' : 'student';

        setFormState({
          paymentMode: mode,
          receiptNo: initialPayment.receiptNo || '',
          date: initialPayment.date || new Date().toISOString().split('T')[0],
          year: initialPayment.year || new Date().getFullYear(),
          studentId: mode === 'student' ? (initialPayment.studentId || '') : '',
          paymentClass: mode === 'class' ? (parseInt(initialPayment.studentId.split('-')[1]) || '') : '',
          paymentSection: mode === 'class' ? (initialPayment.studentId.split('-')[2] || '') : '',
          paymentSectors: [{
            id: generateUniqueId(),
            feeType: initialPayment.feeType || allFeeTypes[0],
            month: Array.isArray(initialPayment.month) ? initialPayment.month : (initialPayment.month ? [initialPayment.month] : []),
            amount: initialPayment.amount || '',
            description: initialPayment.description || '',
          }],
          feeType: initialPayment.feeType || allFeeTypes[0],
          month: Array.isArray(initialPayment.month) ? initialPayment.month : (initialPayment.month ? [initialPayment.month] : []),
          amount: initialPayment.amount || '',
          description: initialPayment.description || '',
        });

        if (mode === 'student' && initialPayment.studentId && !initialPayment.studentId.startsWith('CLASS-')) {
          const student = students.find(s => s.id === initialPayment.studentId);
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
        // Adding a new payment
        setEditPaymentId(null);
        const prefilledStudentId = initialStudentId || '';
        setFormState(prev => ({
          ...prev,
          receiptNo: '',
          date: new Date().toISOString().split('T')[0],
          year: new Date().getFullYear(),
          paymentMode: 'student', // Default to student payment for new entries
          studentId: prefilledStudentId,
          paymentClass: '',
          paymentSection: '',
          paymentSectors: [{ id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }],
          feeType: allFeeTypes[0],
          month: [],
          amount: '',
          description: '',
        }));

        if (prefilledStudentId) {
          const student = students.find(s => s.id && s.id.toLowerCase() === prefilledStudentId.toLowerCase());
          if (student) {
            setStudentInfo({
              name: student.name,
              guardian: student.guardian,
              class: student.class,
              section: student.section,
              roll: student.roll,
            });
            // Auto-fill tuition/vehicle fee for the first sector if applicable
            // This needs to be done after the formState is set, potentially in a separate effect or directly here.
            // For now, let's keep it simple and rely on the blur event or manual selection.
          } else {
            showCustomAlert('Student ID not found for pre-fill.', true);
            setStudentInfo(null);
          }
        } else {
          setStudentInfo(null);
        }
      }
    }
  }, [isOpen, initialPayment, initialStudentId, students, showCustomAlert]);

  const resetForm = useCallback(() => {
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
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose(); // Call the prop to close the modal
  }, [onClose, resetForm]);

  const handleFormChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;

    if (name === 'paymentMode') {
      setFormState(prev => ({ ...prev, [name]: value }));
      if (value === 'student') {
        setFormState(prev => ({
          ...prev,
          paymentMode: value,
          paymentClass: '',
          paymentSection: '',
          paymentSectors: prev.paymentSectors.length > 0 ? prev.paymentSectors : [{ id: generateUniqueId(), feeType: allFeeTypes[0], month: [], amount: '', description: '' }],
        }));
      } else { // class mode
        setFormState(prev => ({
          ...prev,
          paymentMode: value,
          studentId: '',
          paymentSectors: [],
        }));
        setStudentInfo(null);
      }
    } else {
      setFormState(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
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

  const handleStudentIdBlur = useCallback(() => {
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
  }, [formState.studentId, formState.paymentSectors, students, showCustomAlert]);

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
        if (!sector.feeType || sector.amount === '' || sector.amount === null || isNaN(sector.amount)) {
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
            break;
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
              break;
            }
          }
          if (!allPaymentsSuccessful) break;
        }
      }

    } else { // Class Payment Mode
      if (!formState.paymentClass || !formState.paymentSection) { showCustomAlert('Class and Section are required.', true); return; }
      if (!formState.receiptNo) { showCustomAlert('Receipt No. is required.', true); return; }
      if (formState.amount === '' || formState.amount === null || isNaN(formState.amount)) {
        showCustomAlert('Amount is required.', true); return;
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
      handleClose(); // Close modal on success
      onPaymentSuccess(); // Trigger data refresh in parent
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

  if (!isOpen) return null; // Don't render anything if modal is not open

  return (
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
                  disabled={!!editPaymentId || !!initialStudentId} // Disable mode change when editing or pre-filled
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
                  disabled={!!editPaymentId || !!initialStudentId} // Disable mode change when editing or pre-filled
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
                disabled={!!editPaymentId}
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
                  disabled={!!editPaymentId || !!initialStudentId} // Disable if editing or pre-filled
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
                    disabled={!!editPaymentId || !!initialStudentId}
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
                    disabled={!!editPaymentId || !!initialStudentId}
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
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md">Submit Payment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
