
import { supabase, showToast, user, profile, openOverlay, closeOverlay } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.5050, lng: 71.2215 }; // Default Bag'dod
let officePos = { lat: 40.5050, lng: 71.2215 }; // Market joylashuvi
let map: any = null;
let marker: any = null;
let selectedArea = "";
let currentDistanceKm = 0;

export async function renderCartView() {
    const container = document.getElementById('cartView');
    if(!container || !user) return;

    const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

    if(!cartItems?.length) {
        container.innerHTML = `
            <div style="text-align:center; padding:5rem 2rem;">
                <div style="width:120px; height:120px; background:var(--primary-light); border-radius:40px; display:inline-flex; align-items:center; justify-content:center; color:var(--primary); font-size:3.5rem; margin-bottom:2rem; animation: pulse 2s infinite;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h3 style="font-weight:900; font-size:1.5rem;">Savat bo'sh</h3>
                <p style="color:var(--gray); margin-top:0.5rem; font-weight:600;">Hali hech narsa qo'shmadingiz</p>
                <button class="btn btn-primary" style="margin-top:2.5rem; width:100%;" onclick="navTo('home')">XARID QILISH</button>
            </div>
        `;
        return;
    }

    subtotalAmount = cartItems.reduce((acc, item) => acc + (item.products.price * item.quantity), 0);

    container.innerHTML = `
        <div style="padding-bottom: 180px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <h2 style="font-weight: 900; font-size:1.8rem;">Mening Savatim</h2>
                <div style="font-size:0.8rem; font-weight:800; color:var(--gray);">${cartItems.length} mahsulot</div>
            </div>

            <div id="cartItemsList">
                ${cartItems.map(item => `
                    <div class="card" style="display:flex; gap:15px; align-items:center; padding:15px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:12px; position:relative; overflow:hidden;">
                        <img src="${item.products.image_url || item.products.images?.[0]}" style="width:75px; height:75px; border-radius:18px; object-fit:cover; background:#f8fafc;">
                        <div style="flex:1;">
                            <h4 style="font-weight:800; font-size:0.95rem; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:140px;">${item.products.name}</h4>
                            <div style="color:var(--primary); font-weight:900; font-size:1rem;">${(item.products.price * item.quantity).toLocaleString()} <small style="font-size:0.6rem;">UZS</small></div>
                            
                            <div style="display:flex; align-items:center; gap:12px; margin-top:10px; background:#f8fafc; width:fit-content; padding:4px 10px; border-radius:12px;">
                                <button onclick="updateQty(${item.product_id}, ${item.quantity - 1})" style="border:none; background:none; font-size:1.1rem; color:var(--gray); cursor:pointer;"><i class="fas fa-minus-circle"></i></button>
                                <span style="font-weight:900; font-size:0.95rem; min-width:20px; text-align:center;">${item.quantity}</span>
                                <button onclick="updateQty(${item.product_id}, ${item.quantity + 1})" style="border:none; background:none; font-size:1.1rem; color:var(--primary); cursor:pointer;"><i class="fas fa-plus-circle"></i></button>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${item.product_id})" style="position:absolute; top:15px; right:15px; width:34px; height:34px; border-radius:10px; background:#fff1f2; border:none; color:var(--danger); cursor:pointer; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-trash-alt" style="font-size:0.9rem;"></i>
                        </button>
                    </div>
                `).join('')}
            </div>

            <div style="position:fixed; bottom:90px; left:0; width:100%; padding:20px; z-index:100;">
                <div style="background:white; padding:22px; border-radius:30px; box-shadow:0 -10px 40px rgba(0,0,0,0.08); border:1px solid #f1f5f9; max-width:450px; margin:0 auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                        <span style="font-weight:800; color:var(--gray);">Jami summa:</span>
                        <span style="font-weight:900; font-size:1.4rem; color:var(--text);">${subtotalAmount.toLocaleString()} <small style="font-size:0.8rem;">UZS</small></span>
                    </div>
                    <button class="btn btn-primary" style="width:100%; height:64px; font-size:1.1rem; border-radius:20px;" onclick="openCheckout()">RASMIYLASHTIRISH <i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
        </div>
    `;
}

(window as any).updateQty = async (pId: number, newQty: number) => {
    if(newQty < 1) return removeFromCart(pId);
    await supabase.from('cart_items').update({ quantity: newQty }).eq('user_id', user.id).eq('product_id', pId);
    renderCartView();
};

export const removeFromCart = async (pId: number) => {
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', pId);
    showToast("O'chirildi");
    renderCartView();
};
(window as any).removeFromCart = removeFromCart;

(window as any).openCheckout = async () => {
    const placeholder = document.getElementById('checkoutPlaceholder');
    if(!placeholder) return;
    openOverlay('checkoutOverlay');
    
    const { data: sets } = await supabase.from('app_settings').select('*');
    const deliveryRates = sets?.find(s => s.key === 'delivery_rates')?.value || { walking_base: 5000, walking_km: 2000 };
    const office = sets?.find(s => s.key === 'office_location')?.value || { lat: 40.5050, lng: 71.2215 };
    officePos = office;

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text);"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Rasmiylashtirish</h2>
            </div>
            
            <h4 style="font-weight:900; margin-bottom:15px; font-size:1rem;">1. Hududni tanlang</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                <div class="area-opt" onclick="selectCheckoutArea('Bag\\\'dod', 40.5050, 71.2215)" id="optBagdod" style="padding:15px; border-radius:20px; border:2.5px solid #f1f5f9; text-align:center; cursor:pointer; transition:0.3s; background:#f8fafc;">
                    <i class="fas fa-building" style="font-size:1.5rem; color:var(--gray); margin-bottom:8px;"></i>
                    <div style="font-weight:800; font-size:0.8rem;">Bag'dod Markazi</div>
                </div>
                <div class="area-opt" onclick="selectCheckoutArea('Guliston', 40.4897, 68.7848)" id="optGuliston" style="padding:15px; border-radius:20px; border:2.5px solid #f1f5f9; text-align:center; cursor:pointer; transition:0.3s; background:#f8fafc;">
                    <i class="fas fa-city" style="font-size:1.5rem; color:var(--gray); margin-bottom:8px;"></i>
                    <div style="font-weight:800; font-size:0.8rem;">Guliston shahri</div>
                </div>
            </div>

            <h4 style="font-weight:900; margin-bottom:15px; font-size:1rem;">2. Aniq manzilni ko'rsating</h4>
            <div id="deliveryMap" style="height:250px; border-radius:22px; margin-bottom:20px; border:2px solid #f1f5f9;"></div>

            <h4 style="font-weight:900; margin-bottom:10px; font-size:1rem;">3. Kuryer uchun izoh (ixtiyoriy)</h4>
            <textarea id="orderComment" placeholder="Masalan: Dom kodi 123, pod'ezd 2..." style="height:80px; margin-bottom:25px;"></textarea>

            <!-- RECEIPT DESIGN -->
            <div style="background:white; border-radius:20px; border:1px solid #f1f5f9; padding:25px; position:relative; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.03);">
                <div style="text-align:center; margin-bottom:20px;">
                    <h3 style="font-weight:900; color:var(--text);">BUYURTMA CHEKI</h3>
                    <div style="font-size:0.7rem; color:var(--gray); letter-spacing:1px; font-weight:800;">ELAZ MARKET • BAG'DOD</div>
                </div>

                <div style="display:flex; flex-direction:column; gap:12px; border-top:2px dashed #e2e8f0; border-bottom:2px dashed #e2e8f0; padding:20px 0; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
                        <span style="color:var(--gray);">Savatcha:</span>
                        <span>${subtotalAmount.toLocaleString()} UZS</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
                        <span style="color:var(--gray);">Masofa:</span>
                        <span id="receiptDistance">0.0 km</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
                        <span style="color:var(--gray);">Dostavka:</span>
                        <span id="receiptDeliveryCost">0 UZS</span>
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:900; font-size:1.1rem;">JAMI TO'LOV:</span>
                    <span id="receiptTotal" style="font-weight:900; font-size:1.5rem; color:var(--primary);">${subtotalAmount.toLocaleString()} UZS</span>
                </div>

                <!-- Receipt edges decoration -->
                <div style="position:absolute; bottom:-10px; left:0; width:100%; display:flex; justify-content:space-between;">
                    ${Array.from({length: 10}).map(() => `<div style="width:20px; height:20px; background:var(--white); border-radius:50%; margin-top:-10px; transform:translateY(10px);"></div>`).join('')}
                </div>
            </div>
            
            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; height:65px; margin-top:30px; border-radius:22px; font-size:1.2rem; box-shadow:0 10px 25px rgba(34,197,94,0.3);" onclick="placeOrderFinal()">
                BUYURTMANI TASDIQLASH <i class="fas fa-check-double"></i>
            </button>
        </div>
    `;

    setTimeout(() => {
        // @ts-ignore
        map = L.map('deliveryMap').setView([officePos.lat, officePos.lng], 15);
        // @ts-ignore
        L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
            subdomains:['mt0','mt1','mt2','mt3'],
            maxZoom: 20
        }).addTo(map);

        // @ts-ignore
        marker = L.marker([officePos.lat, officePos.lng], {draggable: true}).addTo(map);
        
        const updateReceipt = () => {
            const pos = marker.getLatLng();
            selectedPos = { lat: pos.lat, lng: pos.lng };
            const dist = calculateDistance(officePos.lat, officePos.lng, pos.lat, pos.lng);
            currentDistanceKm = dist;

            // Minimal yetkazish 5000, undan keyin har km uchun 2000 (shartli)
            const cost = deliveryRates.walking_base + (Math.max(0, dist - 1) * deliveryRates.walking_km);
            
            const distEl = document.getElementById('receiptDistance');
            const delEl = document.getElementById('receiptDeliveryCost');
            const totalEl = document.getElementById('receiptTotal');
            
            if(distEl) distEl.innerText = dist.toFixed(1) + " km";
            if(delEl) delEl.innerText = Math.round(cost).toLocaleString() + " UZS";
            if(totalEl) totalEl.innerText = (subtotalAmount + Math.round(cost)).toLocaleString() + " UZS";
        };

        marker.on('dragend', updateReceipt);
        map.on('click', (e: any) => { marker.setLatLng(e.latlng); updateReceipt(); });
        updateReceipt();
    }, 200);
};

(window as any).selectCheckoutArea = (area: string, lat: number, lng: number) => {
    selectedArea = area;
    document.querySelectorAll('.area-opt').forEach(el => {
        (el as HTMLElement).style.borderColor = '#f1f5f9';
        (el as HTMLElement).style.background = '#f8fafc';
    });
    const target = document.getElementById(`opt${area === 'Bag\'dod' ? 'Bagdod' : 'Guliston'}`);
    if(target) {
        target.style.borderColor = 'var(--primary)';
        target.style.background = 'var(--primary-light)';
    }
    if(map && marker) {
        const latlng = { lat, lng };
        map.setView(latlng, area === 'Guliston' ? 14 : 16);
        marker.setLatLng(latlng);
        // Trigger receipt update
        marker.fire('dragend');
    }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(window as any).placeOrderFinal = async () => {
    const btn = document.getElementById('btnPlaceOrder') as HTMLButtonElement;
    const comment = (document.getElementById('orderComment') as HTMLTextAreaElement).value.trim();

    if(!selectedArea) return showToast("Iltimos, hududni tanlang!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> YUBORILMOQDA...';

    const deliveryCost = 5000 + (Math.max(0, currentDistanceKm - 1) * 2000);

    const { error } = await supabase.from('orders').insert({
        user_id: user?.id,
        total_price: subtotalAmount,
        latitude: selectedPos.lat,
        longitude: selectedPos.lng,
        status: 'pending',
        phone_number: profile.phone,
        address_text: `${selectedArea}, ${profile.district || ''}`,
        delivery_cost: Math.round(deliveryCost),
        // Izohni address_text'ga yoki alohida column bo'lsa o'shanga qo'shamiz
        // Hozircha address_text'ga qo'shib qo'yamiz kuryer ko'rishi uchun
        notes: comment 
    });

    if(!error) {
        await supabase.from('cart_items').delete().eq('user_id', user?.id);
        showToast("Buyurtma qabul qilindi! 🚀");
        closeOverlay('checkoutOverlay');
        (window as any).navTo('orders');
    } else {
        showToast("Xato: " + error.message);
        btn.disabled = false;
        btn.innerText = "BUYURTMANI TASDIQLASH";
    }
};
