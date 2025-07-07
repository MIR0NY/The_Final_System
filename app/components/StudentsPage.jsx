// components/StudentsPage.jsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { monthOrder, classData } from '@/lib/constants';

export default function StudentsPage({
  students,
  payments,
  currentUser,
  showCustomAlert,
  refreshData,
}) {
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [formState, setFormState] = useState({
    id: '',
    name: '',
    class: '',
    section: '',
    roll: '',
    address: '',
    guardian: '',
    contact: '',
    tuitionFee: '',
    vehicleNo: '',
    vehicleFee: '',
    stationName: '',
    dateOfBirth: '',
    bloodGroup: '',
    status: 'active',
    admissionMonth: monthOrder[new Date().getMonth()]
  });

  const calculateStudentDueMonths = useCallback((student, allPayments) => {
      if (student.status === 'transferred') return 'N/A (Transferred)';
      if (!student.admissionMonth) return 'N/A (No admission month)';

      const currentYear = new Date().getFullYear();
      const studentTuitionPayments = allPayments.filter(p =>
          p.studentId === student.id &&
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

      if (expectedPaidUpToIndex < 0) {
          expectedPaidUpToIndex = 11;
          const lastYearPayments = allPayments.filter(p => p.studentId === student.id && p.feeType === 'TUITION FEE' && p.year === currentYear - 1);
          const lastYearDecPaid = lastYearPayments.some(p => (Array.isArray(p.month) ? p.month.includes('December') : p.month === 'December'));
          if (!lastYearDecPaid && monthOrder.indexOf(student.admissionMonth) <= 11) {
              return 'December (Last Year Due)';
          }
      }

      const admissionMonthIndex = monthOrder.indexOf(student.admissionMonth);
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
  }, [monthOrder]);

  const filteredStudents = students.filter(student => {
    const isClassTeacher = currentUser?.role === 'Class Teacher';
    const matchesRoleAssignment = isClassTeacher
      ? (student.class == currentUser.assignedClass && student.section === currentUser.assignedSection)
      : true;

    const matchesFilter = (!filterClass || student.class == parseInt(filterClass)) &&
                          (!filterSection || student.section === filterSection);

    return matchesRoleAssignment && matchesFilter && student.status !== 'transferred';
  });

const canEditStudents = currentUser?.role === 'Admin' || currentUser?.role === 'Accountant' || currentUser?.role === 'Accounts Officer';;

  const openModal = (student = null) => {
    if (student) {
      setEditStudentId(student.id);
      setFormState({
        id: student.id || '',
        name: student.name || '',
        class: student.class || '',
        section: student.section || '',
        roll: student.roll || '',
        address: student.address || '',
        guardian: student.guardian || '',
        contact: student.contact || '',
        tuitionFee: student.tuitionFee || '',
        vehicleNo: student.vehicleNo || '',
        vehicleFee: student.vehicleFee || '',
        stationName: student.stationName || '',
        dateOfBirth: student.dateOfBirth || '',
        bloodGroup: student.bloodGroup || '',
        status: student.status || 'active',
        admissionMonth: student.admissionMonth || monthOrder[new Date().getMonth()]
      });
    } else {
      setEditStudentId(null);
      setFormState({
        id: '', name: '', class: '', section: '', roll: '', address: '',
        guardian: '', contact: '', tuitionFee: '', vehicleNo: '', vehicleFee: '',
        stationName: '', dateOfBirth: '', bloodGroup: '', status: 'active',
        admissionMonth: monthOrder[new Date().getMonth()]
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditStudentId(null);
    setFormState({
      id: '', name: '', class: '', section: '', roll: '', address: '',
      guardian: '', contact: '', tuitionFee: '', vehicleNo: '', vehicleFee: '',
      stationName: '', dateOfBirth: '', bloodGroup: '', status: 'active',
      admissionMonth: monthOrder[new Date().getMonth()]
    });
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormState(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      id: formState.id.toUpperCase(),
      name: formState.name,
      class: parseInt(formState.class),
      section: formState.section,
      roll: parseInt(formState.roll),
      address: formState.address || null,
      guardian: formState.guardian || null,
      contact: formState.contact || null,
      tuitionFee: parseFloat(formState.tuitionFee) || 0,
      vehicleNo: formState.vehicleNo || null,
      vehicleFee: parseFloat(formState.vehicleFee) || null,
      stationName: formState.stationName || null,
      dateOfBirth: formState.dateOfBirth || null,
      bloodGroup: formState.bloodGroup || null,
      status: formState.status || 'active',
      admissionMonth: formState.admissionMonth || null,
    };

    try {
      let apiResponse;
      if (editStudentId) {
        apiResponse = await fetch(`/api/students/${editStudentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const existingStudent = students.find(s => s.id === payload.id);
        if (existingStudent) {
          showCustomAlert('Student ID already exists!', true);
          return;
        }
        apiResponse = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (apiResponse.ok) {
        showCustomAlert('Student saved successfully!', false);
        closeModal();
        refreshData();
      } else {
        const errorData = await apiResponse.json();
        showCustomAlert(`Failed to save student: ${errorData.error || apiResponse.statusText}`, true);
      }
    } catch (error) {
      console.error('Error saving student:', error);
      showCustomAlert(`Error saving student: ${error.message}`, true);
    }
  };

  const findLastPaidMonth = useCallback((studentId, feeType) => {
      const studentPayments = payments.filter(p => p.studentId === studentId);
      const relevantPayments = studentPayments.filter(p => p.feeType === feeType && monthOrder.includes(Array.isArray(p.month) ? p.month[0] : p.month));
      if (relevantPayments.length === 0) return 'N/A';

      relevantPayments.sort((a, b) => {
          const monthA = Array.isArray(a.month) ? monthOrder.indexOf(a.month[0]) : monthOrder.indexOf(a.month);
          const monthB = Array.isArray(b.month) ? monthOrder.indexOf(b.month[0]) : monthOrder.indexOf(b.month);
          if (a.year !== b.year) return b.year - a.year;
          return monthB - monthA;
      });
      return Array.isArray(relevantPayments[0].month) ? relevantPayments[0].month[0] : relevantPayments[0].month;
  }, [payments, monthOrder]);

  const calculateTotal = useCallback((studentId, feeType) => {
      const studentPayments = payments.filter(p => p.studentId === studentId);
      return studentPayments.filter(p => p.feeType === feeType).reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const checkFeePaid = useCallback((studentId, feeType) => {
      const studentPayments = payments.filter(p => p.studentId === studentId);
      return studentPayments.some(p => p.feeType === feeType) ? 'Yes' : 'No';
  }, [payments]);


  const StudentCard = useCallback(({ student }) => {
    const studentDueMonths = calculateStudentDueMonths(student, payments);
    const canEdit = currentUser?.role === 'Accounts Officer';

    return (
      // Card styling for responsive width and fixed height
      <div className="bg-white rounded-lg shadow-md p-4 space-y-2 border border-gray-200 h-[280px] flex flex-col justify-between">
        <div className="flex justify-between items-start flex-shrink-0">
          <div className="flex-grow">
            <p className="font-bold text-lg leading-tight">{student.name || 'N/A'} <span className="font-normal text-sm text-gray-500">({student.id || 'N/A'})</span></p>
            <p className="text-sm text-gray-600 leading-tight">Class: {student.class || 'N/A'}-{student.section || 'N/A'} | Roll: {student.roll || 'N/A'}</p>
            <p className="text-sm text-gray-600 leading-tight">Status: {student.status || 'N/A'} | Blood: {student.bloodGroup || 'N/A'}</p>
            <p className={`text-sm font-semibold leading-tight ${studentDueMonths.includes('Due') || studentDueMonths.includes(',') ? 'text-red-600' : 'text-green-600'}`}>Due: {studentDueMonths}</p>
          </div>
          {canEdit && (
            <button
              onClick={() => openModal(student)}
              className="edit-student-btn text-indigo-600 hover:text-indigo-900 font-medium text-sm ml-2 flex-shrink-0"
            >
              Edit
            </button>
          )}
        </div>
        <div className="border-t pt-2 space-y-1 text-sm overflow-hidden flex-grow"> {/* flex-grow to fill remaining height */}
          <p><strong className="font-medium">Address:</strong> {student.address || 'N/A'}</p>
          <p><strong className="font-medium">Tuition Last Paid:</strong> {findLastPaidMonth(student.id, 'TUITION FEE')} (${calculateTotal(student.id, 'TUITION FEE').toLocaleString()})</p>
          <p><strong className="font-medium">Vehicle Last Paid:</strong> {findLastPaidMonth(student.id, 'VEHICLE FEE')} (${calculateTotal(student.id, 'VEHICLE FEE').toLocaleString()})</p>
          <p><strong className="font-medium">Station:</strong> {student.stationName || 'N/A'}</p>
        </div>
      </div>
    );
  }, [payments, currentUser, calculateStudentDueMonths, findLastPaidMonth, calculateTotal, openModal]);


  const populateSectionDropdown = (selectedClass) => {
    if (selectedClass && classData[selectedClass]) {
      return classData[selectedClass].map(section => (
        <option key={section} value={section}>{section}</option>
      ));
    }
    return <option value="">All Sections</option>;
  };

  return (
    <section id="page-students" className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Student Details</h2>
        {canEditStudents && (
          <button
            onClick={() => openModal()}
            className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center w-full md:w-auto"
          >
            <i className="fas fa-user-plus mr-2"></i> Add Student
          </button>
        )}
      </div>
      <div className="bg-white p-6 rounded-xl  shadow-lg border border-gray-200 flex flex-col flex-grow min-h-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <select
            id="filter-class"
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={filterClass}
            onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); }}
            disabled={currentUser?.role === 'Class Teacher'}
          >
            <option value="">All Classes</option>
            {Object.keys(classData).map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            id="filter-section"
            name="filterSection"
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            disabled={currentUser?.role === 'Class Teacher'}
          >
            {populateSectionDropdown(filterClass)}
          </select>
          <button
            onClick={() => { setFilterClass(''); setFilterSection(''); }}
            className={`btn-tertiary text-white col-span-2 font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-700 transition duration-300 sm:col-span-1 md:col-start-4 ${currentUser?.role === 'Class Teacher' ? 'hidden' : ''}`}
          >
            Clear Filters
          </button>
        </div>
        {filteredStudents.length > 0 ? (
          <div
            id="students-card-view"
            // Using auto-fit for responsive columns with minmax width
            className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 flex-grow overflow-y-auto container"
          >
            {filteredStudents.map(student => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500">No active students found matching filters.</div>
        )}
      </div>

      {/* Student Modal (remains unchanged) */}
      {isModalOpen && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40 opacity-100">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 overflow-y-auto max-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{editStudentId ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleStudentSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-gray-700">Student ID</label>
                  <input
                    type="text"
                    id="id"
                    name="id"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.id}
                    onChange={handleFormChange}
                    required
                    disabled={!!editStudentId}
                  />
                </div>
                <div>
                  <label htmlFor="roll" className="block text-sm font-medium text-gray-700">Roll No.</label>
                  <input
                    type="number"
                    id="roll"
                    name="roll"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.roll}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="class" className="block text-sm font-medium text-gray-700">Class</label>
                  <select
                    id="class"
                    name="class"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.class}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Class</option>
                    {Object.keys(classData).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    id="section"
                    name="section"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.section}
                    onChange={handleFormChange}
                  >
                    <option value="">Select Section</option>
                    {populateSectionDropdown(formState.class)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows="2"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.address}
                    onChange={handleFormChange}
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="guardian" className="block text-sm font-medium text-gray-700">Guardian's Name</label>
                  <input
                    type="text"
                    id="guardian"
                    name="guardian"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.guardian}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    id="contact"
                    name="contact"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.contact}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="tuitionFee" className="block text-sm font-medium text-gray-700">Tuition Fee</label>
                  <input
                    type="number"
                    id="tuitionFee"
                    name="tuitionFee"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.tuitionFee}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="vehicleFee" className="block text-sm font-medium text-gray-700">Vehicle Fee (Optional)</label>
                  <input
                    type="number"
                    id="vehicleFee"
                    name="vehicleFee"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.vehicleFee}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="vehicleNo" className="block text-sm font-medium text-gray-700">Vehicle No. (Optional)</label>
                  <input
                    type="text"
                    id="vehicleNo"
                    name="vehicleNo"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.vehicleNo}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="stationName" className="block text-sm font-medium text-gray-700">Station Name (Optional)</label>
                  <input
                    type="text"
                    id="stationName"
                    name="stationName"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.stationName}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.dateOfBirth}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">Blood Group</label>
                  <input
                    type="text"
                    id="bloodGroup"
                    name="bloodGroup"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.bloodGroup}
                    onChange={handleFormChange}
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.status}
                    onChange={handleFormChange}
                  >
                    <option value="active">Active</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admissionMonth" className="block text-sm font-medium text-gray-700">Admission Month (for Tuition)</label>
                  <select
                    id="admissionMonth"
                    name="admissionMonth"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    value={formState.admissionMonth}
                    onChange={handleFormChange}
                  >
                    {monthOrder.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Cancel</button>
                <button type="submit" className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md">Submit Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}