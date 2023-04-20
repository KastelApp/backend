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
import Constants from '../../../Constants';

const SettingSchema = new Schema({
    User: {
        type: String,
        ref: 'Users',
        required: true,
        index: true,
    },

    Status: {
        type: String,
        required: false,
    },

    Presence: {
        type: Number,
        required: true,
        default: 0,
    },

    Tokens: {
        type: [
            {
                Token: {
                    type: String,
                    required: true,
                    index: true,
                },
                CreatedDate: {
                    type: Number,
                    required: true,
                    default: Date.now(),
                },
                Ip: {
                    type: String,
                    required: true,
                }
            }
        ],
        required: true,
        default: [],
    },

    Theme: {
        type: String,
        required: true,
        default: 'dark',
    },

    Language: { // Not Used Yet (Will be used in the future)
        type: String,
        required: true,
        default: 'en-US',
    },

    // Who can see your Status, online status, etc. (Not used yet)
    // 0 = Everyone
    // 1 = Friends
    // 2 = Nobody
    Privacy: {
        type: Number,
        required: true,
        default: 0,
    },

    Mentions: [
        {
            Message: {
                type: String,
                required: true,
                ref: 'Messages',
            },
        }
    ],

    MaxGuilds: {
        type: Number,
        required: true,
        default: Constants.Settings.Max.GuildCount,
    },

    MaxFileUploadSize: {
        type: Number,
        required: true,
        default: Constants.Settings.Max.MaxFileSize,
    }
});

export default model('Settings', SettingSchema);

export { SettingSchema }