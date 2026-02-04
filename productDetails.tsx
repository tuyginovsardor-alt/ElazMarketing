
import { openOverlay, addToCart, closeOverlay } from "./index.tsx";

let currentQty = 1;

export function renderProductDetails(p: any) {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    currentQty = 1;
    const mainImg = p.image_url || p.images?.[0] || "https://via.placeholder.com/600";
    const allImgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg];

    placeholder.innerHTML = `
        <div style="padding-bottom:120px; animation: slideUp 0.3s ease-out;">
            <!-- MEDIA SECTION -->
            <div style="position:relative; width:100%; aspect-ratio:1/1; border-radius:30px; overflow:hidden; background:#f8fafc; margin-bottom:20px;">
                <img id="mainDetailImg" src="${mainImg}" style="width:100%; height:100%; object-fit:cover;">
                <div style="position:absolute; top:15px; left:15px; right:15px; display:flex; justify-content:space-between;">
                    <div style="width:45px; height:45px; background:white; border-radius:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:var(--shadow-sm);" onclick="closeOverlay('checkoutOverlay')">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                </div>
                ${p.marketing_tag ? `<div style="position:absolute; bottom:15px; left:15px; background:var(--danger); color:white; padding:6px 14px; border-radius:12px; font-weight:900; font-size:0.7rem;">${p.marketing_tag.toUpperCase()}</div>` : ''}
            </div>

            <!-- THUMBNAILS & VIDEO -->
            <div style="display:flex; gap:10px; overflow-x:auto; padding:0 5px 15px; scrollbar-width:none;">
                ${allImgs.map(img => `<img src="${img}" style="width:65px; height:65px; border-radius:15px; object-fit:cover; cursor:pointer; border:2px solid #f1f5f9;" onclick="document.getElementById('mainDetailImg').src='${img}'">`).join('')}
                ${p.video_url ? `
                    <div style="width:65px; height:65px; border-radius:15px; background:var(--dark); color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; border:2px solid #f1f5f9;" onclick="window.open('${p.video_url}', '_blank')">
                        <i class="fas fa-play"></i>
                    </div>
                ` : ''}
            </div>

            <div style="padding:0 5px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                    <div>
                        <span style="background:var(--primary-light); color:var(--primary); font-size:0.65rem; font-weight:900; padding:4px 10px; border-radius:8px; text-transform:uppercase;">${p.category}</span>
                        <h2 style="font-weight:900; font-size:1.6rem; margin-top:8px; color:var(--text);">${p.name}</h2>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:1.6rem; color:var(--primary);">${p.price.toLocaleString()} <small style="font-size:0.7rem;">UZS</small></div>
                        <div style="font-size:0.75rem; color:var(--gray); font-weight:700;">1 ${p.unit}</div>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:20px; margin-bottom:25px; background:#f8fafc; padding:12px 20px; border-radius:18px; width:fit-content;">
                    <span style="font-weight:800; color:var(--gray); font-size:0.9rem;">Miqdor:</span>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <button onclick="changeDetailQty(-1)" style="width:36px; height:36px; border-radius:10px; border:none; background:white; color:var(--gray); cursor:pointer; box-shadow:var(--shadow-sm);"><i class="fas fa-minus"></i></button>
                        <span id="detailQtyDisplay" style="font-weight:900; font-size:1.2rem; min-width:30px; text-align:center;">1</span>
                        <button onclick="changeDetailQty(1)" style="width:36px; height:36px; border-radius:10px; border:none; background:var(--primary); color:white; cursor:pointer; box-shadow:var(--shadow-sm);"><i class="fas fa-plus"></i></button>
                    </div>
                </div>

                <div class="card" style="border-radius:24px; padding:20px; border:1px solid #f1f5f9; background:#f8fafc; margin-bottom:25px;">
                    <h4 style="font-weight:900; margin-bottom:10px; font-size:0.9rem;">TA'RIF</h4>
                    <p style="font-size:0.9rem; color:var(--gray); line-height:1.6; font-weight:600;">${p.description || "Ushbu mahsulot haqida batafsil ma'lumot kiritilmagan."}</p>
                </div>

                <div style="display:flex; gap:15px; position:fixed; bottom:20px; left:20px; right:20px; max-width:410px; margin:0 auto; z-index:100;">
                    <button class="btn btn-primary" style="flex:1; height:65px; border-radius:22px; font-size:1.1rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="addToCart(${p.id}, currentQty)">
                        SAVATGA QO'SHISH <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
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
