import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const companySchema = new mongoose.Schema({
    companyId: {
        type: String,
        unique: true,
        required: true
    },
    companyName: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    plan: {
        type: String,
        enum: ['A', 'B', 'C'],
        default: 'A'
    },
    password: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true,
        unique: true
    },
    tenantId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

companySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Company = mongoose.model('Company', companySchema);
export default Company;
