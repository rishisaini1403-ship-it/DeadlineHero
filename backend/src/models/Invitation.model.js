const mongoose = require('mongoose');
const { Schema } = mongoose;
const InvitationSchema = new Schema(
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

const Invitation = mongoose.model('Invitation', InvitationSchema);
module.exports = Invitation;
