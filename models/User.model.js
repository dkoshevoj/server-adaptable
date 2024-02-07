import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
	{
		userId: {
			type: Number,
			required: true,
			unique: true,
		},
		name: {
			type: String,
			required: true,
		},
	},
	{ versionKey: false, timestamps: true }
);

export default model('User', UserSchema);
