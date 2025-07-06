// app/api/students/route.js
import prisma from '@/lib/prisma'; // Adjust path if your `lib` folder is not at the root
import { NextResponse } from 'next/server';

// Handles GET requests to /api/students
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      // You might want to order them, e.g., by class, section, then roll
      orderBy: [
        { class: 'asc' },
        { section: 'asc' },
        { roll: 'asc' },
      ],
    });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

// Handles POST requests to /api/students (for adding a new student)
export async function POST(request) {
  try {
    const body = await request.json();

    // Basic validation (you can add more robust validation here)
    if (!body.id || !body.name || !body.class || !body.section || !body.roll || typeof body.tuitionFee === 'undefined') {
      return NextResponse.json({ error: 'Missing required student fields (id, name, class, section, roll, tuitionFee)' }, { status: 400 });
    }

    // Ensure class and roll are numbers
    body.class = parseInt(body.class);
    body.roll = parseInt(body.roll);
    body.tuitionFee = parseFloat(body.tuitionFee);
    body.vehicleFee = parseFloat(body.vehicleFee) || null; // Handle optional float

    const newStudent = await prisma.student.create({
      data: {
        id: body.id,
        name: body.name,
        class: body.class,
        section: body.section,
        roll: body.roll,
        address: body.address || null,
        guardian: body.guardian || null,
        contact: body.contact || null,
        tuitionFee: body.tuitionFee,
        vehicleNo: body.vehicleNo || null,
        vehicleFee: body.vehicleFee,
        stationName: body.stationName || null,
        dateOfBirth: body.dateOfBirth || null,
        bloodGroup: body.bloodGroup || null,
        status: body.status || 'active', // Default to active if not provided
        admissionMonth: body.admissionMonth || null,
      },
    });
    return NextResponse.json(newStudent, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('Error creating student:', error);
    // Handle unique constraint error specifically
    if (error.code === 'P2002') { // Prisma error code for unique constraint violation
        return NextResponse.json({ error: 'A student with this Class, Section, and Roll already exists.' }, { status: 409 }); // 409 Conflict
    }
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}