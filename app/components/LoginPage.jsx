// components/LoginPage.jsx
'use client'; // This directive makes this a Client Component

import { useState } from 'react';

export default function LoginPage({ onLogin, loginMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <section className="flex flex-col items-center justify-center h-screen w-full ">
      <div className="bg-white sm:p-[20px] py-5 rounded-lg shadow-xl sm:w-1/3 max-w-md border w-[90vw] border-gray-200">
        <h2 className="text-3xl font-bold text-indigo-600 mb-6 text-center">School Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4 w-full p-10">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="login-email"
              className="mt-1 block w-full box-border p-2 border border-gray-300 rounded-md shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="login-password"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {loginMessage && (
            <div className={`text-sm ${loginMessage.isError ? 'text-red-600' : 'text-green-600'}`}>
              {loginMessage.text}
            </div>
          )}
          <button type="submit" className="btn-primary text-white font-bold py-2 px-4 rounded-lg shadow-md w-full">Login</button>
        </form>
      </div>
    </section>
  );
}