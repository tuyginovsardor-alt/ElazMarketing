
import { openOverlay, addToCart, closeOverlay } from "./index.tsx";

let currentQty = 1;

export function renderProductDetails(p: any) {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    currentQty = 1;
    const mainImg = p.image_url || p.images?.[0] || "https://via.placeholder.com/600";
    const allImgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg];

    placeholder.innerHTML = `
        <div style="padding-bottom:120px; animation: slideUp 0.3s cubic-bezier(0, 0, 0.2, 1); background:white;">
            <!-- TOP BAR -->
            <div style="position:fixed; top:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:20px; display:flex; justify-content:space-between; z-index:100;">
                <div onclick="closeOverlay('checkoutOverlay')" style="width:45px; height:45px; background:white; border-radius:15px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg); cursor:pointer;">
                    <i class="fas fa-chevron-left" style="color:var(--text);"></i>
                </div>
                <div style="width:45px; height:45px; background:white; border-radius:15px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg); cursor:pointer;">
                    <i class="far fa-heart" style="color:var(--gray);"></i>
                </div>
            </div>

            <!-- MAIN IMAGE SLIDER -->
            <div style="position:relative; width:100%; aspect-ratio:1/1.1; overflow:hidden; background:#f8fafc;">
                <img id="mainDetailImg" src="${mainImg}" style="width:100%; height:100%; object-fit:cover;">
                ${p.marketing_tag ? `<div style="position:absolute; bottom:25px; left:20px; background:var(--danger); color:white; padding:6px 14px; border-radius:12px; font-weight:900; font-size:0.65rem; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">${p.marketing_tag.toUpperCase()}</div>` : ''}
            </div>

            <div style="padding:25px; border-radius: 40px 40px 0 0; background:white; margin-top:-35px; position:relative; z-index:10;">
                <!-- THUMBNAILS -->
                <div style="display:flex; gap:12px; overflow-x:auto; margin-bottom:25px; scrollbar-width:none;">
                    ${allImgs.map(img => `
                        <div onclick="document.getElementById('mainDetailImg').src='${img}'" style="width:70px; height:70px; border-radius:18px; overflow:hidden; border:2px solid #f1f5f9; cursor:pointer; flex-shrink:0;">
                            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                    `).join('')}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="flex:1;">
                        <span style="font-size:0.65rem; font-weight:900; color:var(--primary); background:var(--primary-light); padding:4px 12px; border-radius:10px; text-transform:uppercase; letter-spacing:0.5px;">${p.category}</span>
                        <h1 style="font-weight:900; font-size:1.7rem; color:var(--text); margin-top:10px; line-height:1.2;">${p.name}</h1>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:1.5rem; color:var(--primary);">${p.price.toLocaleString()}</div>
                        <div style="font-size:0.75rem; color:var(--gray); font-weight:800;">har bir ${p.unit} uchun</div>
                    </div>
                </div>

                <div style="margin-top:30px;">
                    <h3 style="font-size:0.9rem; font-weight:900; color:var(--text); margin-bottom:12px;">MAHSULOT HAQIDA</h3>
                    <p style="font-size:0.95rem; color:var(--gray); line-height:1.7; font-weight:600;">
                        ${p.description || "Ushbu mahsulot Bag'dod tumanidagi ELAZ MARKET do'konidan eng saralangan holda yetkazib beriladi. Sifat kafolatlangan."}
                    </p>
                </div>

                <div style="margin-top:30px; display:flex; align-items:center; gap:20px; background:#f8fafc; padding:15px 25px; border-radius:24px;">
                    <span style="font-weight:900; font-size:0.9rem; color:var(--text);">Miqdor:</span>
                    <div style="display:flex; align-items:center; gap:20px;">
                        <button onclick="changeDetailQty(-1)" style="width:40px; height:40px; border-radius:12px; background:white; border:1px solid #e2e8f0; cursor:pointer;"><i class="fas fa-minus"></i></button>
                        <span id="detailQtyDisplay" style="font-weight:900; font-size:1.3rem; min-width:30px; text-align:center;">1</span>
                        <button onclick="changeDetailQty(1)" style="width:40px; height:40px; border-radius:12px; background:var(--primary); color:white; border:none; cursor:pointer;"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>

            <!-- STICKY FOOTER -->
            <div style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.8); backdrop-filter:blur(20px); padding:20px; border-top:1px solid #f1f5f9; z-index:200; display:flex; gap:15px;">
                <button class="btn btn-primary" style="flex:1; height:65px; border-radius:22px; font-size:1.1rem;" onclick="addToCart(${p.id}, currentQty)">
                    SAVATGA QO'SHISH <i class="fas fa-cart-plus" style="margin-left:8px;"></i>
                </button>
            </div>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

(window as any).changeDetailQty = (delta: number) => {
    currentQty = Math.max(1, currentQty + delta);
    const display = document.getElementById('detailQtyDisplay');
    if(display) display.innerText = currentQty.toString();
};
