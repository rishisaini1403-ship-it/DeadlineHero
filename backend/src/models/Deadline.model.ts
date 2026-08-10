import mongoose, { Document, Schema } from 'mongoose';

export interface IDeadline extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  reminderSent: boolean;
  reminderTime: Date;
  status: 'upcoming' | 'missed' | 'completed';
  relatedTasks: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DeadlineSchema = new Schema<IDeadline>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Deadline title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['upcoming', 'missed', 'completed'],
      default: 'upcoming',
    },
    relatedTasks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for querying upcoming deadlines
DeadlineSchema.index({ user: 1, status: 1, dueDate: 1 });

const Deadline = mongoose.model<IDeadline>('Deadline', DeadlineSchema);

export default Deadline;
