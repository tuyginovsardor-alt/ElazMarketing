
import { SITE_URL } from './bot-config.js';

export const KB = {
    welcome: {
        keyboard: [
            [{ text: "🔑 Kirish" }, { text: "📝 Ro'yxatdan o'tish" }],
            [{ text: "🌐 ONLINE PLATFORMA", web_app: { url: SITE_URL } }]
        ],
        resize_keyboard: true
    },
    user: {
        keyboard: [
            [{ text: "🛒 Savatim" }, { text: "👤 Profil" }],
            [{ text: "🛵 Kuryer bo'lish" }, { text: "🏢 Platforma", web_app: { url: SITE_URL } }],
            [{ text: "❌ Chiqish" }]
        ],
        resize_keyboard: true
    },
    courier: {
        keyboard: [
            [{ text: "📦 Bo'sh buyurtmalar" }, { text: "🚀 Faol buyurtmalar" }],
            [{ text: "🟢 Onlayn" }, { text: "🔴 Oflayn" }],
            [{ text: "📊 Tarix" }, { text: "👤 Profil" }],
            [{ text: "❌ Chiqish" }]
        ],
        resize_keyboard: true
    },
    share_contact: {
        keyboard: [[{ text: "📱 Telefon raqamni ulashish", request_contact: true }], [{ text: "❌ Bekor qilish" }]],
        resize_keyboard: true
    },
    cancel: {
        keyboard: [[{ text: "❌ Bekor qilish" }]],
        resize_keyboard: true
    },
    confirm_apply: (id) => ({
        inline_keyboard: [
            [{ text: "✅ TASDIQLASH VA YUBORISH", callback_data: `confirm_courier_${id}` }],
            [{ text: "❌ BEKOR QILISH", callback_data: `cancel_apply` }]
        ]
    })
};
