
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
            [{ text: "🛵 Kuryer bo'lish" }, { text: "🏢 Platformaga o'tish", web_app: { url: SITE_URL } }],
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
    cancel: {
        keyboard: [[{ text: "❌ Bekor qilish" }]],
        resize_keyboard: true
    }
};
