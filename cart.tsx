
import { supabase, showToast, user, profile, openOverlay, closeOverlay, navTo } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.5050, lng: 71.2215 };
let officePos = { lat: 40.5050, lng: 71.2215 };
let map: any = null;
let marker: any = null;
let selectedArea = "";
let currentDistanceKm = 0;
let selectedPaymentMethod = 'cash'; 
let selectedTransportType = 'walking'; // 'walking', 'bicycle', 'car'
let deliveryRates: any = { walking_base: 5000, walking_km: 2000, bicycle_base: 7000, bicycle_km: 2500, car_base: 10000, car_km: 3000 };

export async function renderCartView() {
    const container = document.getElementById('cartView');
    if(!container || !user) return;

    const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);

    if(!cartItems?.length) {
        container.innerHTML = `
            <div style="text-align:center; padding:5rem 2rem;">
                <div style="width:120px; height:120px; background:var(--primary-light); border-radius:40px; display:inline-flex; align-items:center; justify-content:center; color:var(--primary); font-size:3.5rem; margin-bottom:2rem;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h3 style="font-weight:900;">Savat bo'sh</h3>
                <button class="btn btn-primary" style="margin-top:2.5rem; width:100%;" onclick="navTo('home')">XARID QILISH</button>
            </div>
        `;
        return;
    }

    subtotalAmount = cartItems.reduce((acc, item) => acc + (item.products.price * item.quantity), 0);

    container.innerHTML = `
        <div style="padding-bottom: 220px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight: 900; font-size:1.8rem;">Mening Savatim</h2>
                <div style="font-weight:800; color:var(--gray); font-size:0.9rem;">${cartItems.length} mahsulot</div>
            </div>
            <div id="cartItemsList">
                ${cartItems.map(item => {
                    const isKg = item.products.unit?.toLowerCase().trim() === 'kg';
                    const step = isKg ? 0.1 : 1;
                    return `
                    <div class="card" style="display:flex; gap:15px; align-items:center; padding:15px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:12px;">
                        <img src="${item.products.image_url || item.products.images?.[0]}" style="width:70px; height:70px; border-radius:18px; object-fit:cover;">
                        <div style="flex:1;">
                            <h4 style="font-weight:800; font-size:0.9rem;">${item.products.name}</h4>
                            <div style="color:var(--primary); font-weight:900; margin-top:4px;">${item.products.price.toLocaleString()} UZS</div>
                            <div style="display:flex; align-items:center; gap:15px; margin-top:8px;">
                                <div style="display:flex; align-items:center; background:#f8fafc; padding:4px; border-radius:10px; border:1px solid #e2e8f0;">
                                    <button onclick="updateQty(${item.product_id}, ${parseFloat((item.quantity - step).toFixed(2))})" style="border:none; background:white; width:28px; height:28px; border-radius:8px; box-shadow:var(--shadow-sm);">-</button>
                                    <span style="font-weight:900; margin:0 12px; font-size:0.9rem;">${item.quantity} ${item.products.unit}</span>
                                    <button onclick="updateQty(${item.product_id}, ${parseFloat((item.quantity + step).toFixed(2))})" style="border:none; background:white; width:28px; height:28px; border-radius:8px; box-shadow:var(--shadow-sm);">+</button>
                                </div>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${item.product_id})" style="border:none; background:none; color:var(--gray); font-size:1.1rem; padding:10px;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `}).join('')}
            </div>
            <div style="position:fixed; bottom:90px; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:20px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); border-top:1px solid #f1f5f9; z-index:100;">
                <button class="btn btn-primary" style="width:100%; height:64px; border-radius:22px; font-size:1.1rem;" onclick="openCheckout()">RASMIYLASHTIRISH (${subtotalAmount.toLocaleString()})</button>
            </div>
        </div>
    `;
}

export async function removeFromCart(pId: number) {
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', pId);
    renderCartView();
}
(window as any).removeFromCart = removeFromCart;

export async function updateQty(pId: number, newQty: number) {
    if(newQty < 0.1) return removeFromCart(pId);
    await supabase.from('cart_items').update({ quantity: parseFloat(newQty.toFixed(2)) }).eq('user_id', user.id).eq('product_id', pId);
    renderCartView();
}
(window as any).updateQty = updateQty;

function updateCheckoutSummary() {
    const base = deliveryRates[`${selectedTransportType}_base`] || 5000;
    const kmPrice = deliveryRates[`${selectedTransportType}_km`] || 2000;
    const cost = base + (Math.max(0, currentDistanceKm - 1) * kmPrice);
    
    const delCostEl = document.getElementById('receiptDeliveryCost');
    const totalEl = document.getElementById('receiptTotal');
    if(delCostEl) delCostEl.innerText = Math.round(cost).toLocaleString() + " UZS";
    if(totalEl) totalEl.innerText = (subtotalAmount + Math.round(cost)).toLocaleString() + " UZS";
}

(window as any).selectTransport = (type: string) => {
    selectedTransportType = type;
    document.querySelectorAll('.transport-select-card').forEach(el => {
        (el as HTMLElement).style.borderColor = '#f1f5f9';
        (el as HTMLElement).style.background = 'white';
    });
    const target = document.getElementById(`transport_${type}`);
    if(target) {
        target.style.borderColor = 'var(--primary)';
        target.style.background = 'var(--primary-light)';
    }
    updateCheckoutSummary();
};

(window as any).openCheckout = async () => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder')!;
    
    const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);
    const { data: sets } = await supabase.from('app_settings').select('*');
    deliveryRates = sets?.find(s => s.key === 'delivery_rates')?.value || deliveryRates;
    officePos = sets?.find(s => s.key === 'office_location')?.value || { lat: 40.5050, lng: 71.2215 };

    const currentPhone = profile?.phone || "";

    placeholder.innerHTML = `
        <div style="padding-bottom:120px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Buyurtmani tasdiqlash</h2>
            </div>

            <!-- BUYURTMALAR RO'YXATI -->
            <div class="card" style="padding:20px; border-radius:28px; background:#f8fafc; border:none; margin-bottom:20px;">
                <h4 style="font-weight:900; font-size:0.85rem; color:var(--gray); text-transform:uppercase; margin-bottom:15px; letter-spacing:0.5px;">Siz sotib olayotgan mahsulotlar:</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${items?.map(item => `
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${item.products.image_url || item.products.images?.[0]}" style="width:40px; height:40px; border-radius:10px; object-fit:cover; border:1px solid #e2e8f0;">
                            <div style="flex:1;">
                                <div style="font-weight:700; font-size:0.9rem;">${item.products.name}</div>
                                <div style="font-size:0.75rem; color:var(--gray); font-weight:800;">${item.quantity} ${item.products.unit} x ${item.products.price.toLocaleString()} UZS</div>
                            </div>
                            <div style="font-weight:900; font-size:0.95rem; color:var(--text);">${(item.products.price * item.quantity).toLocaleString()} UZS</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- ALOQA VA TRANSPORT -->
            <div class="card" style="border: 1.5px solid #f1f5f9; padding:20px; border-radius:28px; margin-bottom:20px;">
                <div style="margin-bottom:20px;">
                    <label style="font-weight:900; font-size:0.85rem; display:block; margin-bottom:10px;">Telefon raqamingiz:</label>
                    <input type="tel" id="checkoutPhone" value="${currentPhone}" placeholder="+998 90 123 45 67" 
                           style="height:62px; border-radius:18px; border:2px solid #f1f5f9; padding:0 18px; font-weight:800; font-size:1.1rem; width:100%; background:white;">
                </div>
                <div>
                    <label style="font-weight:900; font-size:0.85rem; display:block; margin-bottom:10px;">Kuryer uchun izoh (ixtiyoriy):</label>
                    <textarea id="checkoutComment" placeholder="Masalan: Darvoza oldida qoldiring..." 
                              style="width:100%; height:100px; border-radius:18px; border:2px solid #f1f5f9; padding:15px; font-weight:600; font-size:0.95rem; background:#f8fafc; resize:none;"></textarea>
                </div>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:10px;">YETKAZIB BERISH USULI</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:25px;">
                <div id="transport_walking" onclick="selectTransport('walking')" class="transport-select-card" style="padding:15px; border-radius:22px; border:2px solid var(--primary); background:var(--primary-light); text-align:center; cursor:pointer; transition:0.3s;">
                    <i class="fas fa-walking" style="font-size:1.5rem; color:var(--primary); margin-bottom:8px;"></i>
                    <div style="font-size:0.7rem; font-weight:900;">PIYODA</div>
                </div>
                <div id="transport_bicycle" onclick="selectTransport('bicycle')" class="transport-select-card" style="padding:15px; border-radius:22px; border:2px solid #f1f5f9; background:white; text-align:center; cursor:pointer; transition:0.3s;">
                    <i class="fas fa-bicycle" style="font-size:1.5rem; color:#0ea5e9; margin-bottom:8px;"></i>
                    <div style="font-size:0.7rem; font-weight:900;">VELO</div>
                </div>
                <div id="transport_car" onclick="selectTransport('car')" class="transport-select-card" style="padding:15px; border-radius:22px; border:2px solid #f1f5f9; background:white; text-align:center; cursor:pointer; transition:0.3s;">
                    <i class="fas fa-car" style="font-size:1.5rem; color:#f97316; margin-bottom:8px;"></i>
                    <div style="font-size:0.7rem; font-weight:900;">MASHINA</div>
                </div>
            </div>

            <div class="card" style="padding:0; border-radius:28px; overflow:hidden; border:1.5px solid #f1f5f9; margin-bottom:25px;">
                <div id="deliveryMap" style="height:240px; width:100%;"></div>
            </div>

            <div class="card" style="padding:25px; border-radius:32px; background:var(--dark); color:white; border:none; margin-bottom:30px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; opacity:0.8; font-size:0.85rem; font-weight:700;"><span>Mahsulotlar jami:</span><span>${subtotalAmount.toLocaleString()} UZS</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; opacity:0.8; font-size:0.85rem; font-weight:700;"><span>Yetkazib berish:</span><span id="receiptDeliveryCost">0 UZS</span></div>
                <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); font-weight:900; font-size:1.5rem;"><span>JAMI:</span><span id="receiptTotal" style="color:var(--primary);">${subtotalAmount.toLocaleString()} UZS</span></div>
            </div>

            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; height:68px; border-radius:24px; font-size:1.2rem;" onclick="placeOrderFinal()">BUYURTMANI TASDIQLASH</button>
        </div>
    `;

    setTimeout(() => {
        // @ts-ignore
        map = L.map('deliveryMap').setView([officePos.lat, officePos.lng], 15);
        // @ts-ignore
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        // @ts-ignore
        marker = L.marker([officePos.lat, officePos.lng], {draggable: true}).addTo(map);
        
        const onLocationChange = () => {
            const pos = marker.getLatLng();
            selectedPos = { lat: pos.lat, lng: pos.lng };
            currentDistanceKm = calculateDistance(officePos.lat, officePos.lng, pos.lat, pos.lng);
            updateCheckoutSummary();
        };
        marker.on('dragend', onLocationChange);
        onLocationChange();
    }, 200);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(window as any).placeOrderFinal = async () => {
    const btn = document.getElementById('btnPlaceOrder') as HTMLButtonElement;
    const phoneInput = document.getElementById('checkoutPhone') as HTMLInputElement;
    const commentInput = document.getElementById('checkoutComment') as HTMLTextAreaElement;
    
    const phone = phoneInput?.value.trim() || profile?.phone;
    const comment = commentInput?.value.trim() || "";

    if(!phone) return showToast("Telefon raqami kiritilishi shart!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> BUYURTMA YUBORILMOQDA...';

    const base = deliveryRates[`${selectedTransportType}_base`] || 5000;
    const kmPrice = deliveryRates[`${selectedTransportType}_km`] || 2000;
    const deliveryCost = base + (Math.max(0, currentDistanceKm - 1) * kmPrice);

    try {
        if(!profile?.phone || profile.phone !== phone) {
            await supabase.from('profiles').update({ phone }).eq('id', profile.id);
        }

        const { error } = await supabase.from('orders').insert({
            user_id: user?.id,
            total_price: subtotalAmount,
            latitude: selectedPos.lat,
            longitude: selectedPos.lng,
            status: 'confirmed',
            phone_number: phone,
            comment: comment,
            address_text: "Xaritadan tanlangan manzil",
            delivery_cost: Math.round(deliveryCost),
            payment_method: selectedPaymentMethod,
            requested_transport: selectedTransportType
        });

        if(!error) {
            await supabase.from('cart_items').delete().eq('user_id', user?.id);
            showToast("Buyurtma muvaffaqiyatli yuborildi! 🚀");
            closeOverlay('checkoutOverlay');
            navTo('orders');
        } else throw error;
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "QAYTA URINISH";
    }
};
