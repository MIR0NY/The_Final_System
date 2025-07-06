// app/api/payments/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Handles GET requests to /api/payments
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId'); // Optional filter by studentId

    const payments = await prisma.payment.findMany({
      where: studentId ? { studentId: studentId } : {},
      orderBy: [
        { date: 'desc' }, // Order by date descending
        { id: 'desc' }, // Then by ID for stable order
      ],
    });
    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// Handles POST requests to /api/payments (for adding a new payment)
export async function POST(request) {
  try {
    const body = await request.json();

    // Basic validation for required fields
    if (!body.receiptNo || !body.year || !body.date || !body.studentId || !body.feeType || typeof body.amount === 'undefined' || !body.month) {
      return NextResponse.json({ error: 'Missing required payment fields' }, { status: 400 });
    }

    // Check if studentId exists in the Student table
    const existingStudent = await prisma.student.findUnique({
      where: { id: body.studentId },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: `Student with ID ${body.studentId} not found.` }, { status: 404 });
    }

    const newPayment = await prisma.payment.create({
      data: {
        receiptNo: body.receiptNo,
        year: parseInt(body.year),
        date: body.date,
        studentId: body.studentId,
        feeType: body.feeType,
        month: body.month, // This can be a single month string or comma-separated
        amount: parseFloat(body.amount),
        description: body.description || null,
      },
    });
    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}