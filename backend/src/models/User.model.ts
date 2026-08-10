import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'student' | 'admin';
  points: number;
  level: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: Date;
  badges: string[];
  preferences: {
    emailNotifications: boolean;
    reminderTime: number; // hours before deadline
    theme: 'light' | 'dark';
  };
  completionHistory: Array<{
    date: Date;
    tasksCompleted: number;
    hoursWorked: number;
  }>;
  productivityData: Array<{
    date: Date;
    score: number;
  }>;
  sharedDeadlines: Array<{
    userId: mongoose.Types.ObjectId;
    deadlineId: mongoose.Types.ObjectId;
    sharedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    points: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    streak: {
      type: Number,
      default: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
      default: Date.now,
    },
    badges: {
      type: [String],
      default: [],
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      reminderTime: {
        type: Number,
        default: 24,
      },
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
    },
    completionHistory: {
      type: [{
        date: { type: Date, required: true },
        tasksCompleted: { type: Number, default: 0 },
        hoursWorked: { type: Number, default: 0 },
      }],
      default: [],
    },
    productivityData: {
      type: [{
        date: { type: Date, required: true },
        score: { type: Number, required: true },
      }],
      default: [],
    },
    sharedDeadlines: {
      type: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        deadlineId: { type: Schema.Types.ObjectId, ref: 'Deadline', required: true },
        sharedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
