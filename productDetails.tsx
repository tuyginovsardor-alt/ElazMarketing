
import { openOverlay, addToCart, closeOverlay, supabase, user, navTo } from "./index.tsx";

let currentQty = 1;
let initialCartQty = 0;
let productUnit = 'dona';
let currentProduct: any = null;

export async function renderProductDetails(p: any) {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;

    currentProduct = p;
    currentQty = 1;
    initialCartQty = 0;
    productUnit = p.unit?.toLowerCase().trim() || 'dona';
    const isWeight = productUnit === 'kg';
    const step = isWeight ? 0.1 : 1;

    // Savatda bor-yo'qligini tekshirish
    if (user) {
        const { data: cartItem } = await supabase.from('cart_items').select('quantity').eq('user_id', user.id).eq('product_id', p.id).maybeSingle();
        if (cartItem) {
            initialCartQty = cartItem.quantity;
            currentQty = cartItem.quantity;
        }
    }

    const mainImg = p.image_url || p.images?.[0] || "https://via.placeholder.com/600";

    placeholder.innerHTML = `
        <div id="productDetailContainer" style="padding-bottom:120px; animation: slideUp 0.3s cubic-bezier(0, 0, 0.2, 1); background:white;">
            <!-- TOP BAR -->
            <div style="position:fixed; top:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:20px; display:flex; justify-content:space-between; z-index:100;">
                <div onclick="closeOverlay('checkoutOverlay')" style="width:45px; height:45px; background:white; border-radius:15px; display:flex; align-items:center; justify-content:center; box-shadow:var(--shadow-lg); cursor:pointer;">
                    <i class="fas fa-chevron-left" style="color:var(--text);"></i>
                </div>
            </div>

            <div style="position:relative; width:100%; aspect-ratio:1/1.1; overflow:hidden; background:#f8fafc;">
                <img id="mainDetailImg" src="${mainImg}" style="width:100%; height:100%; object-fit:cover;">
            </div>

            <div style="padding:25px; border-radius: 40px 40px 0 0; background:white; margin-top:-35px; position:relative; z-index:10;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px;">
                    <div style="flex:1;">
                        <h1 style="font-weight:900; font-size:1.7rem; color:var(--text); line-height:1.2;">${p.name}</h1>
                        <span style="font-size:0.7rem; font-weight:800; color:var(--gray); text-transform:uppercase;">${p.category}</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:1.5rem; color:var(--primary);">${p.price.toLocaleString()} UZS</div>
                        <div style="font-size:0.75rem; color:var(--gray); font-weight:800;">1 ${p.unit} uchun</div>
                    </div>
                </div>

                <div style="margin-top:30px; display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:20px 25px; border-radius:24px;">
                    <span style="font-weight:900; font-size:0.9rem; color:var(--text);">Miqdor (${p.unit}):</span>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <button onclick="changeDetailQty(-${step})" style="width:44px; height:44px; border-radius:14px; background:white; border:1px solid #e2e8f0; cursor:pointer; font-size:1.2rem;"><i class="fas fa-minus"></i></button>
                        <input type="number" id="detailQtyInput" value="${currentQty}" step="${step}" min="${step}" 
                               style="width:70px; text-align:center; font-weight:900; font-size:1.2rem; background:transparent; border:none; margin:0;"
                               onchange="handleQtyManualChange(this.value)">
                        <button onclick="changeDetailQty(${step})" style="width:44px; height:44px; border-radius:14px; background:var(--primary); color:white; border:none; cursor:pointer; font-size:1.2rem;"><i class="fas fa-plus"></i></button>
                    </div>
                </div>

                <div style="margin-top:30px;">
                    <h3 style="font-size:0.9rem; font-weight:900; color:var(--text); margin-bottom:12px;">MAHSULOT HAQIDA</h3>
                    <p style="font-size:0.95rem; color:var(--gray); line-height:1.7; font-weight:600;">${p.description || "Saralangan va sifatli mahsulot."}</p>
                </div>
            </div>

            <!-- STICKY FOOTER -->
            <div id="detailFooter" style="position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:450px; background:rgba(255,255,255,0.8); backdrop-filter:blur(20px); padding:20px; border-top:1px solid #f1f5f9; z-index:200;">
                ${renderActionButton()}
            </div>
        </div>
    `;
    openOverlay('checkoutOverlay');
}

function renderActionButton() {
    const isAlreadyInCartWithThisQty = (initialCartQty > 0 && Math.abs(currentQty - initialCartQty) < 0.01);
    
    if (isAlreadyInCartWithThisQty) {
        return `
            <button class="btn btn-primary" style="width:100%; height:65px; border-radius:22px; font-size:1.1rem; background:var(--dark);" onclick="goToCheckout()">
                SAVATGA O'TISH <i class="fas fa-arrow-right" style="margin-left:8px;"></i>
            </button>
        `;
    } else {
        return `
            <button class="btn btn-primary" style="width:100%; height:65px; border-radius:22px; font-size:1.1rem;" onclick="handleAddToCart()">
                ${initialCartQty > 0 ? "MIQDORNI YANGILASH" : "SAVATGA QO'SHISH"} <i class="fas fa-cart-plus" style="margin-left:8px;"></i>
            </button>
        `;
    }
}

(window as any).handleAddToCart = async () => {
    const btn = document.querySelector('#detailFooter button') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SAVATGA QO\'SHILMOQDA...';
    
    // index.tsx dagi addToCart funksiyasi faqat qo'shadi, bizga update ham kerak bo'lishi mumkin
    // Shuning uchun bu yerda to'g'ridan-to'g'ri update qilamiz yoki index.tsx dagi addToCart ni chaqiramiz
    if (initialCartQty > 0) {
        await supabase.from('cart_items').update({ quantity: currentQty }).eq('user_id', user.id).eq('product_id', currentProduct.id);
    } else {
        await addToCart(currentProduct.id, currentQty);
    }
    
    initialCartQty = currentQty;
    const footer = document.getElementById('detailFooter');
    if (footer) footer.innerHTML = renderActionButton();
};

(window as any).goToCheckout = () => {
    closeOverlay('checkoutOverlay');
    navTo('cart');
};

(window as any).changeDetailQty = (delta: number) => {
    currentQty = parseFloat((currentQty + delta).toFixed(2));
    if(currentQty < 0.1) currentQty = 0.1;
    const input = document.getElementById('detailQtyInput') as HTMLInputElement;
    if(input) input.value = currentQty.toString();
    
    // Tugmani yangilash
    const footer = document.getElementById('detailFooter');
    if (footer) footer.innerHTML = renderActionButton();
};

(window as any).handleQtyManualChange = (val: string) => {
    let num = parseFloat(parseFloat(val).toFixed(2));
    if(isNaN(num) || num < 0.1) num = 0.1;
    currentQty = num;
    
    // Tugmani yangilash
    const footer = document.getElementById('detailFooter');
    if (footer) footer.innerHTML = renderActionButton();
};
