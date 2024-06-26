import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
   text: { type: String, required: true },
   images: [
    {
       type: String,
    }
   ],
   author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
   },
   community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community'
   },
   createdAt: {
    type: Date,
    default: Date.now
   },
   likes:[
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
      }
   ],
   parentId: {
    type: String
   },
   children: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread'
    }
   ]
});

const Thread = mongoose.models.Thread || mongoose.model('Thread', threadSchema);

export default Thread;