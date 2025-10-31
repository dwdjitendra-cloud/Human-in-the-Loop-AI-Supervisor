import Supervisor from '../models/Supervisor.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const registerSupervisor = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  const existingSupervisor = await Supervisor.findOne({ email });
  if (existingSupervisor) {
    throw new AppError('Email already registered', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const supervisor = new Supervisor({
    email,
    password: hashedPassword,
    name,
  });

  await supervisor.save();
  logger.info(`Supervisor registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'Supervisor registered successfully',
  });
});

export const loginSupervisor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const supervisor = await Supervisor.findOne({ email });
  if (!supervisor) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, supervisor.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  supervisor.lastLogin = new Date();
  await supervisor.save();

  const token = jwt.sign(
    { id: supervisor._id, email: supervisor.email, name: supervisor.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logger.info(`Supervisor logged in: ${email}`);

  res.json({
    success: true,
    token,
    supervisor: {
      id: supervisor._id,
      name: supervisor.name,
      email: supervisor.email,
    },
  });
});

export const getAllSupervisors = asyncHandler(async (req, res) => {
  const supervisors = await Supervisor.find().select('-password');

  res.json({
    success: true,
    data: supervisors,
  });
});

export const getSupervisorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supervisor = await Supervisor.findById(id).select('-password');

  if (!supervisor) {
    throw new AppError('Supervisor not found', 404);
  }

  res.json({
    success: true,
    data: supervisor,
  });
});
