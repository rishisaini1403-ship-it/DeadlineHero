import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'archived';
  category: string;
  estimatedHours: number;
  actualHours: number;
  dueDate: Date;
  tags: string[];
  aiRecommended: boolean;
  aiPriorityScore: number;
  riskScore: number;
  riskFactors: string[];
  subtasks: Array<{
    title: string;
    description: string;
    completed: boolean;
    order: number;
  }>;
  isAIBrokenDown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'archived'],
      default: 'pending',
    },
    category: {
      type: String,
      default: 'general',
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    tags: {
      type: [String],
      default: [],
    },
    aiRecommended: {
      type: Boolean,
      default: false,
    },
    aiPriorityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskFactors: {
      type: [String],
      default: [],
    },
    subtasks: {
      type: [{
        title: { type: String, required: true },
        description: { type: String, default: '' },
        completed: { type: Boolean, default: false },
        order: { type: Number, required: true },
      }],
      default: [],
    },
    isAIBrokenDown: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
TaskSchema.index({ user: 1, status: 1, dueDate: 1 });
TaskSchema.index({ user: 1, priority: 1 });

const Task = mongoose.model<ITask>('Task', TaskSchema);

export default Task;
