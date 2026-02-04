
export async function tgRequest(method: string, body: any, token: string) {
    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    } catch (e) {
        console.error(`TG API Error [${method}]:`, e);
        return { ok: false };
    }
}

export async function sendMessage(chatId: number, text: string, token: string, markup: any = null) {
    return await tgRequest('sendMessage', {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: markup
    }, token);
}

export async function editMessage(chatId: number, messageId: number, text: string, token: string, markup: any = null) {
    return await tgRequest('editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: markup
    }, token);
}

export async function answerCallback(callbackId: string, text: string, token: string) {
    return await tgRequest('answerCallbackQuery', {
        callback_query_id: callbackId,
        text: text,
        show_alert: true
    }, token);
}
