
import { supabase } from "./index.tsx";

export async function renderSavedView() {
    const container = document.getElementById('savedView');
    if(!container) return;

    container.innerHTML = `
        <div style="padding-bottom:100px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight:900; font-size:1.8rem;">Tanlanganlar</h2>
                <div style="background:#fff1f2; color:#f43f5e; width:45px; height:45px; border-radius:14px; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-heart"></i>
                </div>
            </div>
            
            <div id="savedList" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <!-- Bo'sh holat -->
                <div style="grid-column: span 2; text-align: center; padding: 4rem 2rem;">
                    <div style="width: 100px; height: 100px; background: #f8fafc; border-radius: 35px; display: inline-flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 3rem; margin-bottom: 1.5rem;">
                        <i class="fas fa-heart-circle-xmark"></i>
                    </div>
                    <h3 style="font-weight: 800; color: var(--text);">Hozircha bo'sh</h3>
                    <p style="color: var(--gray); font-size: 0.9rem; margin-top: 0.5rem;">Sizga yoqqan mahsulotlarni bu yerda saqlab qo'yishingiz mumkin.</p>
                    <button class="btn btn-primary" style="margin-top: 2rem; width: 100%;" onclick="navTo('home')">MAHSULOTLARNI KO'RISH</button>
                </div>
            </div>
        </div>
    `;
}
