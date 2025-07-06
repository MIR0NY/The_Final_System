// components/MainApp.jsx
"use client";

import { useState, useEffect } from "react";
import {
  classData,
  studentFeeTypes,
  classFeeTypes,
  allFeeTypes,
  expenseTypes,
  employeeTypes,
  monthOrder,
} from "@/lib/constants";
import PaymentsPage from "./PaymentsPage";
import StudentsPage from "./StudentsPage"; // Import the new StudentsPage component

export default function MainApp({
  currentUser,
  onLogout,
  showLoading,
  hideLoading,
  showCustomAlert,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activePage, setActivePage] = useState("students"); // Default page after login

  useEffect(() => {
    loadAllDataAndRenderUI();
  }, []);

  const loadAllDataAndRenderUI = async () => {
    showLoading();
    console.log("Attempting to load all data from Next.js APIs...");
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/students"),
      ]);

      if (!paymentsRes.ok)
        throw new Error(`Payments API failed: ${paymentsRes.statusText}`);
      if (!studentsRes.ok)
        throw new Error(`Students API failed: ${studentsRes.statusText}`);

      const payments = await paymentsRes.json();
      const students = await studentsRes.json();

      console.log("Fetched Payments:", payments); // <-- ADD THIS LOG
      console.log("Fetched Students:", students); // <-- ADD THIS LOG

      setFeePayments(payments);
      setStudentDetails(students);

      console.log("Data loaded from Next.js APIs successfully.");
    } catch (error) {
      console.error("Error loading data in MainApp:", error);
      showCustomAlert("Failed to load initial data: " + error.message, true);
    } finally {
      hideLoading();
    }
  };

  // This useEffect will now run when the component mounts AND when currentUser changes (after login)

  // Theme toggle logic (remains the same as before)
  const toggleTheme = () => {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains("light")) {
      htmlElement.classList.remove("light");
      htmlElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      htmlElement.classList.remove("dark");
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  };

  // State for all application data
  const [feePayments, setFeePayments] = useState([]);
  const [studentDetails, setStudentDetails] = useState([]);
  const [schoolExpenses, setSchoolExpenses] = useState([]);
  const [teachersInfo, setTeachersInfo] = useState([]);


  const refreshAllData = () => {
    loadAllDataAndRenderUI();
  };

  const applyRolePermissions = () => {
    console.log(
      "Applying role permissions (placeholder) for:",
      currentUser?.role
    );
    // This logic will be more robust as we add more components
  };

  useEffect(() => {
    applyRolePermissions();
  }, [currentUser]);

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" id="app-container">
      {/* Sidebar */}
      <aside
        className={`w-64 bg-white shadow-lg flex flex-col p-4 fixed lg:relative inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-30`}
      >
        <h1 className="text-2xl font-bold text-indigo-600 mb-8 text-center">
          School Admin
        </h1>
        <nav className="flex flex-col space-y-2 flex-grow">
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "payments" ? "active" : ""
            }`}
            onClick={() => handleNavClick("payments")}
          >
            <i className="fas fa-money-bill-wave w-6 text-center"></i>
            <span className="ml-3">Payments</span>
          </button>
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "expenses" ? "active" : ""
            }`}
            onClick={() => handleNavClick("expenses")}
          >
            <i className="fas fa-receipt w-6 text-center"></i>
            <span className="ml-3">Expenses</span>
          </button>
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "students" ? "active" : ""
            }`}
            onClick={() => handleNavClick("students")}
          >
            <i className="fas fa-user-graduate w-6 text-center"></i>
            <span className="ml-3">Student Details</span>
          </button>
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "teachers" ? "active" : ""
            }`}
            onClick={() => handleNavClick("teachers")}
          >
            <i className="fas fa-chalkboard-teacher w-6 text-center"></i>
            <span className="ml-3">Teacher's Info</span>
          </button>
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "teacherSalary" ? "active" : ""
            }`}
            onClick={() => handleNavClick("teacherSalary")}
          >
            <i className="fas fa-money-check-alt w-6 text-center"></i>
            <span className="ml-3">Teacher Salary</span>
          </button>
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "vehicles" ? "active" : ""
            }`}
            onClick={() => handleNavClick("vehicles")}
          >
            <i className="fas fa-bus w-6 text-center"></i>
            <span className="ml-3">Vehicle Details</span>
          </button>
          <button
            className={`sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 ${
              activePage === "dashboard" ? "active" : ""
            }`}
            onClick={() => handleNavClick("dashboard")}
          >
            <i className="fas fa-chart-pie w-6 text-center"></i>
            <span className="ml-3">Dashboard</span>
          </button>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            id="dark-mode-toggle"
            className="sidebar-btn flex items-center p-3 rounded-lg font-medium text-gray-700 w-full mb-2"
            onClick={toggleTheme}
          >
            <i
              className={`fas ${
                document.documentElement.classList.contains("dark")
                  ? "fa-sun"
                  : "fa-moon"
              } w-6 text-center`}
              id="dark-mode-icon"
            ></i>
            <span className="ml-3" id="dark-mode-text">
              {document.documentElement.classList.contains("dark")
                ? "Light Mode"
                : "Dark Mode"}
            </span>
          </button>
          <button
            id="logout-btn"
            className="sidebar-btn flex items-center p-3 rounded-lg font-medium text-red-600 hover:bg-red-100 hover:text-red-700 w-full"
            onClick={onLogout}
          >
            <i className="fas fa-sign-out-alt w-6 text-center"></i>
            <span className="ml-3">Logout ({currentUser?.email})</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden p-4 flex justify-between items-center bg-white shadow-md">
          <h1 className="text-xl font-bold text-indigo-600">School Admin</h1>
          <button
            id="menu-toggle"
            className="text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="fas fa-bars text-2xl"></i>
          </button>
        </div>
        <div id="content" className="p-4 md:p-8 flex-1 flex flex-col min-h-0"> {/* Added flex-1 flex flex-col min-h-0 */}
          {activePage === "payments" && (
            <PaymentsPage
              payments={feePayments}
              students={studentDetails}
              currentUser={currentUser}
              showCustomAlert={showCustomAlert}
              refreshData={refreshAllData}
            />
          )}
          {activePage === "expenses" && (
            <div className="text-center text-gray-500 text-xl">
              Expenses Page Content Coming Soon!
            </div>
          )}
          {activePage === "students" && (
            <StudentsPage
              students={studentDetails}
              payments={feePayments} // Pass payments for due month calculation
              currentUser={currentUser}
              showCustomAlert={showCustomAlert}
              refreshData={refreshAllData}
            />
          )}
          {activePage === "teachers" && (
            <div className="text-center text-gray-500 text-xl">
              Teacher's Info Page Content Coming Soon!
            </div>
          )}
          {activePage === "teacherSalary" && (
            <div className="text-center text-gray-500 text-xl">
              Teacher Salary Page Content Coming Soon!
            </div>
          )}
          {activePage === "vehicles" && (
            <div className="text-center text-gray-500 text-xl">
              Vehicle Details Page Content Coming Soon!
            </div>
          )}
          {activePage === "dashboard" && (
            <div className="text-center text-gray-500 text-xl">
              Dashboard Page Content Coming Soon!
            </div>
          )}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
