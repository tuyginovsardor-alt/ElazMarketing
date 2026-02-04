
import { supabase } from "./index.tsx";
import { sendMessage } from "./botAPI.tsx";

let isPolling = false;

export async function renderAdminBot() {
    const container = document.getElementById('adminTabContent');
    if(!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 280px 1fr; gap:20px; height: calc(100vh - 180px);">
            <div style="display:flex; flex-direction:column; gap:15px;">
                <div class="card" style="padding:20px; border-radius:20px; background:white;">
                    <h3 style="font-weight:900; font-size:0.8rem; margin-bottom:15px; color:#64748b;">BOT ENGINE</h3>
                    <div style="background:#f8fafc; padding:15px; border-radius:15px; border:1px solid #e2e8f0; text-align:center;">
                        <div style="width:12px; height:12px; border-radius:50%; background:${isPolling ? '#22c55e' : '#ef4444'}; display:inline-block; margin-bottom:10px;"></div>
                        <div style="font-weight:900; font-size:0.7rem;">STATUS: ${isPolling ? 'ACTIVE' : 'OFFLINE'}</div>
                    </div>
                </div>
                <button class="btn ${isPolling ? 'btn-outline' : 'btn-primary'}" style="width:100%; height:50px; border-radius:12px;" onclick="toggleBotPolling()">
                    ${isPolling ? '<i class="fas fa-stop"></i> TO\'XTATISH' : '<i class="fas fa-play"></i> ISHGA TUSHIRISH'}
                </button>
            </div>
            <div class="card" style="background:#020617; border-radius:20px; padding:20px; color:#cbd5e1; font-family:monospace; font-size:0.7rem; overflow-y:auto;">
                <div style="color:#64748b; border-bottom:1px solid #1e293b; padding-bottom:10px; margin-bottom:10px;">[System Logs]</div>
                <div id="botLogs">Botni ishga tushirish tugmasini bosing...</div>
            </div>
        </div>
    `;
}

(window as any).toggleBotPolling = () => {
    isPolling = !isPolling;
    renderAdminBot();
    const logEl = document.getElementById('botLogs');
    if(logEl) logEl.innerText = isPolling ? "[INFO] Bot engine started. Polling updates..." : "[INFO] Bot stopped.";
};
