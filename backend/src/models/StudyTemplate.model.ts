import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyTemplate extends Document {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  suggestedTasks: Array<{
    title: string;
    description: string;
    estimatedHours: number;
    priority: string;
  }>;
  totalEstimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudyTemplateSchema = new Schema<IStudyTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['essay', 'coding', 'presentation', 'research', 'exam-prep', 'group-project', 'general'],
    },
    icon: {
      type: String,
      default: '📚',
    },
    suggestedTasks: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        estimatedHours: { type: Number, default: 1 },
        priority: { type: String, default: 'medium' },
      },
    ],
    totalEstimatedHours: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

StudyTemplateSchema.index({ category: 1, isActive: 1 });

const StudyTemplate = mongoose.model<IStudyTemplate>('StudyTemplate', StudyTemplateSchema);

export default StudyTemplate;
