import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverEmail: string;
  receiverId?: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
    },
    receiverEmail: {
      type: String,
      required: [true, 'Receiver email is required'],
      lowercase: true,
      trim: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema);
export default Invitation;
