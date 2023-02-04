/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import { model, Schema } from 'mongoose';

const UserSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },

  Email: {
    type: String,
    required: true,
    unique: true,
  },

  EmailVerified: {
    type: Boolean,
    required: false,
  },

  Username: {
    type: String,
    required: true,
    default: 'Ghost',
  },

  Tag: {
    type: String,
    required: true,
    default: '0000',
  },

  AvatarHash: {
    type: String,
    required: false,
  },

  Password: {
    type: String,
    required: true,
  },

  PhoneNumber: {
    type: String,
    required: false,
  },

  TwoFa: {
    type: Boolean,
    required: false,
  },

  TwoFaVerified: {
    type: Boolean,
    required: false,
  },

  TwoFaSecret: {
    type: String,
    required: false,
  },

  Ips: {
    type: Array,
    required: false,
  },

  Flags: {
    type: Number,
    required: false,
  },

  Guilds: [
    {
      type: String,
      ref: 'Guilds',
    },
  ],

  Dms: [
    {
      type: String,
      required: false,
      ref: 'Dms',
    },
  ],

  GroupChats: [
    {
      type: String,
      required: false,
      ref: 'Groupchats',
    },
  ],

  Bots: [
    {
      type: String,
      ref: 'Users',
    },
  ],

  Banned: {
    type: Boolean,
    required: false,
  },

  BanReason: {
    type: String,
    required: false,
  },

  Locked: {
    type: Boolean,
    required: false,
  },

  AccountDeletionInProgress: {
    type: Boolean,
    required: false,
  }
});



export default model('Users', UserSchema);

export { UserSchema };