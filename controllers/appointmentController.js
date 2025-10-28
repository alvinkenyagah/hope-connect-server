const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const User = require('../models/User'); // Assuming User model is needed for populating

// @desc    Book a new appointment (Victim only)
// @route   POST /api/appointments
// @access  Private/Victim
exports.createAppointment = asyncHandler(async (req, res) => {
  const patientId = req.user.id; // From protect middleware
  const { counselorId, time, mode } = req.body;

  // Basic validation (extend as needed)
  if (!counselorId || !time) {
    res.status(400);
    throw new Error('Please provide counselor ID and appointment time.');
  }

  // 1. Check if the counselor exists and is actually a counselor
  const counselor = await User.findById(counselorId);
  if (!counselor || counselor.role !== 'counselor') {
    res.status(404);
    throw new Error('Counselor not found or invalid role.');
  }

  // 2. Prevent booking in the past
  if (new Date(time) < new Date()) {
    res.status(400);
    throw new Error('Cannot book an appointment in the past.');
  }

  // 3. Check for existing appointments at the same time for the counselor
  const conflict = await Appointment.findOne({
    counselor: counselorId,
    time: new Date(time),
    status: 'scheduled',
  });

  if (conflict) {
    res.status(400);
    throw new Error('Counselor already has an appointment scheduled at this time.');
  }

  const appointment = await Appointment.create({
    patient: patientId,
    counselor: counselorId,
    time,
    mode: mode || 'online',
    status: 'scheduled',
  });

  // Populate to return full details
  await appointment.populate('counselor', 'name email').populate('patient', 'name email');

  res.status(201).json({ appointment });
});

// @desc    Get all appointments for the logged-in user (Counselor or Victim)
// @route   GET /api/appointments
// @access  Private/Counselor, Victim
exports.getAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  // Determine the filter based on the user's role
  const filter = role === 'counselor' 
    ? { counselor: userId } 
    : { patient: userId };

  // Fetch appointments, sorting newest first
  const appointments = await Appointment.find(filter)
    .populate('patient', 'name email phone') // 'patient' is a Victim
    .populate('counselor', 'name email specialization')
    .sort({ time: -1, createdAt: -1 }); // Sort by time (latest first)

  res.status(200).json({ appointments });
});

// @desc    Update appointment status (e.g., cancel, complete)
// @route   PUT /api/appointments/:id
// @access  Private/Counselor, Victim
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const userId = req.user.id;
  const allowedStatuses = ['cancelled', 'completed'];

  if (!status || !allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status update provided.');
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  // Ensure only the patient or counselor associated with the appointment can update it
  const isPatient = appointment.patient.toString() === userId.toString();
  const isCounselor = appointment.counselor.toString() === userId.toString();

  if (!isPatient && !isCounselor) {
    res.status(403);
    throw new Error('Not authorized to update this appointment.');
  }

  // Logic: Only Counselor can mark as 'completed', both can 'cancel'
  if (status === 'completed' && !isCounselor) {
    res.status(403);
    throw new Error('Only the counselor can mark an appointment as completed.');
  }

  // Prevent updates to already completed/cancelled appointments
  if (appointment.status !== 'scheduled') {
    res.status(400);
    throw new Error(`Cannot update appointment. Status is already ${appointment.status}.`);
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({ message: `Appointment ${status} successfully.`, appointment });
});