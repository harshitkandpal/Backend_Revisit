import mongoose ,{Schema} from 'mongoose';

const subsciptionSchema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    chennel:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    
},
{
    timestamps: true,
}
)

const Subscription = mongoose.model('Subscription', subsciptionSchema);
export default Subscription; 