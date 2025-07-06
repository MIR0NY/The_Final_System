// components/PaymentsPage.jsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { allFeeTypes, studentFeeTypes, classFeeTypes, monthOrder } from '@/lib/constants';

const classData = {
    "6": ["GOLAP", "SHAPLA", "BELI", "SHEULY", "TAGAR", "BAKUL", "RAJANIGANDHA"],
    "7": ["DOYEL", "KOYEL", "MOYNA", "TIYA", "EAGLE", "KOKIL"],
    "8": ["SHITOLOKKHA", "MEGHNA", "PADMA", "JAMUNA"],
    "9": ["LAL", "SABUJ"],
    "10": ["AAM", "JAM"]
};

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
    receiptNo: '',
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    feeType: allFeeTypes[0],
    month: [],
    amount: '',
    description: '',
    studentId: '',
    paymentClass: '',
    paymentSection: '',
  });
  const [studentInfo, setStudentInfo] = useState(null);

  const filteredPayments = payments.filter(p => {
    const matchesFilter = !filterPaymentId ||
      (p.studentId && p.studentId.toLowerCase().includes(filterPaymentId.toLowerCase()));
    return matchesFilter;
  });

  const canEditPayments = currentUser?.role === 'Accounts Officer';

  const openModal = (payment = null) => {
    if (payment) {
      setEditPaymentId(payment.id);
      setFormState({
        receiptNo: payment.receiptNo || '',
        date: payment.date || new Date().toISOString().split('T')[0],
        year: payment.year || new Date().getFullYear(),
        feeType: payment.feeType || allFeeTypes[0],
        month: Array.isArray(payment.month) ? payment.month : (payment.month ? [payment.month] : []),
        amount: payment.amount || '',
        description: payment.description || '',
        studentId: payment.studentId && payment.studentId.startsWith('CLASS-') ? '' : payment.studentId || '',
        paymentClass: payment.studentId && payment.studentId.startsWith('CLASS-') ? parseInt(payment.studentId.split('-')[1]) : '',
        paymentSection: payment.studentId && payment.studentId.startsWith('CLASS-') ? payment.studentId.split('-')[2] : '',
      });
      if (payment.studentId && !payment.studentId.startsWith('CLASS-')) {
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
      setEditPaymentId(null);
      setFormState({
        receiptNo: '',
        date: new Date().toISOString().split('T')[0],
        year: new Date().getFullYear(),
        feeType: allFeeTypes[0],
        month: [],
        amount: '',
        description: '',
        studentId: '',
        paymentClass: '',
        paymentSection: '',
      });
      setStudentInfo(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditPaymentId(null);
    setStudentInfo(null);
    setFormState({
      receiptNo: '',
      date: new Date().toISOString().split('T')[0],
      year: new Date().getFullYear(),
      feeType: allFeeTypes[0],
      month: [],
      amount: '',
      description: '',
      studentId: '',
      paymentClass: '',
      paymentSection: '',
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      setFormState(prev => ({ ...prev, [name]: Array.from(selectedOptions).map(option => option.value) }));
    } else if (type === 'number') {
      setFormState(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
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
      if (formState.feeType === 'TUITION FEE') {
        setFormState(prev => ({ ...prev, amount: student.tuitionFee || '' }));
      } else if (formState.feeType === 'VEHICLE FEE') {
        setFormState(prev => ({ ...prev, amount: student.vehicleFee || '' }));
      }
    } else {
      setStudentInfo(null);
      showCustomAlert('Student ID not found.', true);
    }
  };

  const handleFeeTypeChange = (e) => {
    const newFeeType = e.target.value;
    setFormState(prev => ({ ...prev, feeType: newFeeType, amount: '' }));
    setStudentInfo(null);
    if (studentFeeTypes.includes(newFeeType) && formState.studentId) {
      const student = students.find(s => s.id && s.id.toLowerCase() === formState.studentId.toLowerCase());
      if (student) {
        if (newFeeType === 'TUITION FEE') {
          setFormState(prev => ({ ...prev, amount: student.tuitionFee || '' }));
        } else if (newFeeType === 'VEHICLE FEE') {
          setFormState(prev => ({ ...prev, amount: student.vehicleFee || '' }));
        }
      }
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      receiptNo: formState.receiptNo,
      year: formState.year,
      date: formState.date,
      feeType: formState.feeType,
      amount: formState.amount,
      description: formState.description,
    };

    let apiResponse;

    if (studentFeeTypes.includes(formState.feeType)) {
      if (!formState.studentId) { showCustomAlert('Student ID is required.', true); return; }
      if (!formState.receiptNo) { showCustomAlert('Receipt No. is required.', true); return; }

      const student = students.find(s => s.id && s.id.toLowerCase() === formState.studentId.toLowerCase());
      if (!student) { showCustomAlert('Student with this ID not found.', true); return; }

      payload.studentId = student.id;

      if (formState.feeType === 'ADMISSION' || formState.feeType === 'RE-ADMISSION' || formState.feeType === 'HALF YEARLY EXAM' || formState.feeType === 'YEARLY EXAM') {
        payload.month = 'N/A';
        apiResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        if (formState.month.length === 0) { showCustomAlert('Please select at least one month.', true); return; }
        for (const month of formState.month) {
          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, month }),
          });
        }
        apiResponse = { ok: true };
      }

    } else if (classFeeTypes.includes(formState.feeType)) {
      if (!formState.paymentClass || !formState.paymentSection) { showCustomAlert('Class and Section are required.', true); return; }
      if (!formState.receiptNo) { showCustomAlert('Receipt No. is required.', true); return; }
      if (formState.month.length === 0) { showCustomAlert('Please select at least one month.', true); return; }

      payload.studentId = `CLASS-${formState.paymentClass}-${formState.paymentSection}`;
      for (const month of formState.month) {
        await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, month }),
        });
      }
      apiResponse = { ok: true };
    }

    if (apiResponse && apiResponse.ok) {
      showCustomAlert('Payment saved successfully!', false);
      closeModal();
      refreshData();
    } else {
      const errorData = await apiResponse.json();
      showCustomAlert(`Failed to save payment: ${errorData.error || apiResponse.statusText}`, true);
    }
  };

  const Row = useCallback(({ index, style }) => {
    const payment = filteredPayments[index];
    if (!payment) return null;

    const monthsDisplay = Array.isArray(payment.month) ? payment.month.join(', ') : (payment.month || 'N/A');
    const amountDisplay = payment.amount ? `$${payment.amount.toLocaleString()}` : '$0';

    return (
      <div style={style} className="flex items-center hover:bg-gray-50 border-b border-gray-200 min-w-[900px]"> {/* Added min-w to match header */}
        <div className="px-6 py-4 flex-shrink-0 w-[10%] table-cell-nowrap">{payment.receiptNo || 'N/A'}</div>
        <div className="px-6 py-4 flex-shrink-0 w-[10%] table-cell-nowrap">{payment.date || 'N/A'}</div>
        <div className="px-6 py-4 flex-shrink-0 w-[10%] table-cell-nowrap">{payment.studentId || 'N/A'}</div>
        <div className="px-6 py-4 flex-shrink-0 w-[10%] table-cell-nowrap">{payment.feeType || 'N/A'}</div>
        <div className="px-6 py-4 flex-shrink-0 w-[10%] table-cell-nowrap">{monthsDisplay}</div>
        <div className="px-6 py-4 flex-shrink-0 w-[10%] font-medium text-gray-900 table-cell-nowrap">{amountDisplay}</div>
        <div className="px-6 py-4 flex-grow w-[30%] overflow-hidden text-ellipsis whitespace-nowrap">{payment.description || ''}</div>
        <div className="px-6 py-4 flex-shrink-0 w-[10%] table-cell-nowrap">
          {canEditPayments && studentFeeTypes.includes(payment.feeType) && (
            <button
              onClick={() => openModal(payment)}
              className="edit-payment-btn text-indigo-600 hover:text-indigo-900 font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    );
  }, [filteredPayments, canEditPayments, openModal]);

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
        {/* Unified table container for horizontal scroll */}
        <div className="flex flex-col flex-grow min-h-0 overflow-x-auto">
          {/* Table Header */}
          <div className="flex-shrink-0">
            <table className="min-w-[900px] divide-y divide-gray-200"> {/* Added min-w */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Receipt No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Paid For (ID)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Fee Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[30%]">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]">Actions</th>
                </tr>
              </thead>
            </table>
          </div>
          {/* Table Body with React Window */}
          <div className="flex-grow min-h-0 relative border-b border-gray-200">
            {filteredPayments.length > 0 ? (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={filteredPayments.length}
                    itemSize={56}
                    width={width}
                    className="bg-white"
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">No payments found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal (remains unchanged) */}
      {isModalOpen && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40 opacity-100">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 overflow-y-auto max-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editPaymentId ? 'Edit Payment' : 'Add New Payment'}</h2>
            <form onSubmit={handlePaymentSubmit}>
              <div>
                <label htmlFor="feeType" className="block text-sm font-medium text-gray-700">Fee Type</label>
                <select
                  id="feeType"
                  name="feeType"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  value={formState.feeType}
                  onChange={handleFeeTypeChange}
                  disabled={!!editPaymentId}
                  required
                >
                  {allFeeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {studentFeeTypes.includes(formState.feeType) && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        required={studentFeeTypes.includes(formState.feeType)}
                      />
                    </div>
                    <div>
                      <label htmlFor="receiptNo" className="block text-sm font-medium text-gray-700">Receipt No.</label>
                      <input
                        type="text"
                        id="receiptNo"
                        name="receiptNo"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        value={formState.receiptNo}
                        onChange={handleFormChange}
                        required={studentFeeTypes.includes(formState.feeType)}
                      />
                    </div>
                  </div>
                  {studentInfo && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm"><strong className="font-semibold text-gray-800">Name:</strong> {studentInfo.name}</p>
                      <p className="text-sm"><strong className="font-semibold text-gray-800">Guardian:</strong> {studentInfo.guardian}</p>
                      <p className="text-sm"><strong className="font-semibold text-gray-800">Class:</strong> {studentInfo.class}-{studentInfo.section} | <strong className="font-semibold text-gray-800">Roll:</strong> {studentInfo.roll}</p>
                    </div>
                  )}
                </div>
              )}

              {classFeeTypes.includes(formState.feeType) && (
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
                        required={classFeeTypes.includes(formState.feeType)}
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
                        required={classFeeTypes.includes(formState.feeType)}
                      >
                        <option value="">Select Section</option>
                        {populateSectionDropdown(formState.paymentClass)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="receiptNo" className="block text-sm font-medium text-gray-700">Receipt No.</label>
                      <input
                        type="text"
                        id="receiptNo"
                        name="receiptNo"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        value={formState.receiptNo}
                        onChange={handleFormChange}
                        required={classFeeTypes.includes(formState.feeType)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                <div className="md:col-span-2">
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month(s) <span className="text-xs text-gray-500">(Hold Ctrl/Cmd to select multiple)</span></label>
                  <select
                    id="month"
                    name="month"
                    multiple
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    value={formState.month}
                    onChange={handleFormChange}
                    required={!['ADMISSION', 'RE-ADMISSION', 'HALF YEARLY EXAM', 'YEARLY EXAM'].includes(formState.feeType)}
                  >
                    {monthOrder.map(m => (
                      <option key={m} value={m}>{m}</option>
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
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}