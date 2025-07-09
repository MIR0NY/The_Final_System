// components/StudentFullInfoPage.jsx
'use client';

import React, { useCallback } from 'react';
import { monthOrder } from '@/lib/constants'; // Ensure monthOrder is exported from your constants

export default function StudentFullInfoPage({
  student,
  payments, // All payments passed down to filter for this student
  onBack, // Callback function to return to the previous page
  openEditStudentModal, // Function to open the student edit modal (from StudentsPage)
  openPaymentModal,     // Function to open the payment modal (from StudentsPage)
  currentUser,
  showCustomAlert, // For alerts if needed
  refreshData, // Passed down to ensure data refresh after payment from this page
}) {
  if (!student) {
    // Fallback if no student data is passed
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-gray-500 p-8">
        <p className="text-xl mb-4">No student selected for full information.</p>
        <button onClick={onBack} className="btn-secondary py-2 px-6 rounded-lg shadow-md">
          Back to Student List
        </button>
      </div>
    );
  }

  // Filter payments relevant to this specific student
  const studentPayments = payments.filter(p => p.studentId === student.id);

  // Re-usable logic for calculating due months (copied from StudentsPage for self-containment)
  const calculateStudentDueMonths = useCallback((studentData, allPaymentsData) => {
    if (studentData.status === 'transferred') return 'N/A (Transferred)';
    if (!studentData.admissionMonth) return 'N/A (No admission month)';

    const currentYear = new Date().getFullYear();
    const studentTuitionPayments = allPaymentsData.filter(p =>
      p.studentId === studentData.id &&
      p.feeType === 'TUITION FEE' &&
      p.year === currentYear
    );

    let lastPaidMonthIndex = -1;
    studentTuitionPayments.forEach(p => {
      const month = Array.isArray(p.month) ? p.month[0] : p.month;
      const monthIdx = monthOrder.indexOf(month);
      if (monthIdx > lastPaidMonthIndex) {
        lastPaidMonthIndex = monthIdx;
      }
    });

    const today = new Date();
    const currentMonthIdx = today.getMonth();
    const currentDay = today.getDate();

    let expectedPaidUpToIndex;
    if (currentDay < 10) {
      expectedPaidUpToIndex = currentMonthIdx - 1;
    } else {
      expectedPaidUpToIndex = currentMonthIdx;
    }

    if (expectedPaidUpToIndex < 0) { // If current month is Jan and day < 10, check Dec of last year
      expectedPaidUpToIndex = 11; // Index for December
      const lastYearPayments = allPaymentsData.filter(p => p.studentId === studentData.id && p.feeType === 'TUITION FEE' && p.year === currentYear - 1);
      const lastYearDecPaid = lastYearPayments.some(p => (Array.isArray(p.month) ? p.month.includes('December') : p.month === 'December'));
      // Only show December due if admission was by Dec and it's not paid last year
      if (!lastYearDecPaid && monthOrder.indexOf(studentData.admissionMonth) <= 11) {
          return 'December (Last Year Due)';
      }
    }

    const admissionMonthIndex = monthOrder.indexOf(studentData.admissionMonth);
    if (admissionMonthIndex === -1) {
      return 'N/A (Invalid admission month)';
    }

    const dueMonths = [];
    for (let i = admissionMonthIndex; i <= expectedPaidUpToIndex; i++) {
      if (i > lastPaidMonthIndex) {
        dueMonths.push(monthOrder[i]);
      }
    }

    if (dueMonths.length === 0) {
      return 'Up-to-date';
    } else {
      return dueMonths.join(', ') + ' (Due)';
    }
  }, [monthOrder]); // Dependency array for useCallback


  // Determine if the current user has permission to edit student or add payments
  const canEditStudents = currentUser?.role === 'Admin' || currentUser?.role === 'Accountant' || currentUser?.role === 'Accounts Officer';

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header with Back and Edit buttons */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200 flex-shrink-0">
        <button
          onClick={onBack}
          className="btn-secondary text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"
        >
          <i className="fas fa-arrow-left mr-2"></i> Back to Student List
        </button>
        <h2 className="text-3xl font-bold text-gray-800 flex-grow text-center">{student.name}'s Full Profile</h2>
        {canEditStudents && (
          <button
            onClick={() => openEditStudentModal(student)}
            className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center"
          >
            <i className="fas fa-edit mr-2"></i> Edit Student
          </button>
        )}
      </div>

      {/* Main content area: scrollable with student details and payment history */}
      <div className="flex-grow overflow-y-auto space-y-8 p-4">
        {/* Student Details Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
            <div><strong className="font-semibold">Student ID:</strong> {student.id || 'N/A'}</div>
            <div><strong className="font-semibold">Roll No:</strong> {student.roll || 'N/A'}</div>
            <div className="md:col-span-2"><strong className="font-semibold">Full Name:</strong> {student.name || 'N/A'}</div>
            <div><strong className="font-semibold">Class:</strong> {student.class || 'N/A'}</div>
            <div><strong className="font-semibold">Section:</strong> {student.section || 'N/A'}</div>
            <div className="md:col-span-2"><strong className="font-semibold">Address:</strong> {student.address || 'N/A'}</div>
            <div><strong className="font-semibold">Guardian:</strong> {student.guardian || 'N/A'}</div>
            <div><strong className="font-semibold">Contact:</strong> {student.contact || 'N/A'}</div>
            <div><strong className="font-semibold">Date of Birth:</strong> {student.dateOfBirth || 'N/A'}</div>
            <div><strong className="font-semibold">Blood Group:</strong> {student.bloodGroup || 'N/A'}</div>
            <div><strong className="font-semibold">Status:</strong> {student.status || 'N/A'}</div>
            <div><strong className="font-semibold">Admission Month:</strong> {student.admissionMonth || 'N/A'}</div>
            <div><strong className="font-semibold">Tuition Fee:</strong> ${student.tuitionFee?.toLocaleString() || 0}</div>
            <div><strong className="font-semibold">Vehicle No:</strong> {student.vehicleNo || 'N/A'}</div>
            <div><strong className="font-semibold">Vehicle Fee:</strong> ${student.vehicleFee?.toLocaleString() || 0}</div>
            <div><strong className="font-semibold">Station Name:</strong> {student.stationName || 'N/A'}</div>
            <div className="md:col-span-2">
                <p className={`text-lg font-semibold ${calculateStudentDueMonths(student, payments).includes('Due') || calculateStudentDueMonths(student, payments).includes(',') ? 'text-red-600' : 'text-green-600'}`}>
                    <strong className="font-semibold">Tuition Due Months:</strong> {calculateStudentDueMonths(student, payments)}
                </p>
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">Payment History</h3>
            {canEditStudents && (
              <button
                onClick={() => openPaymentModal(student.id)} // Call the openPaymentModal prop
                className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center"
              >
                <i className="fas fa-plus mr-2"></i> Add Payment for {student.name}
              </button>
            )}
          </div>
          {studentPayments.length > 0 ? (
            <div className="flex-grow min-h-0 overflow-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Receipt No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Fee Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentPayments
                        .sort((a,b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
                        .map(payment => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{payment.receiptNo || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{payment.date || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{payment.feeType || 'N/A'}</td>
                          <td className="px-6 py-4">{Array.isArray(payment.month) ? payment.month.join(', ') : (payment.month || 'N/A')}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">${payment.amount?.toLocaleString() || '0'}</td>
                          <td className="px-6 py-4">{payment.description || ''}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">No payments recorded for this student.</div>
          )}
        </div>
      </div>
    </div>
  );
}
