
import { supabase, showToast, user, profile, openOverlay, closeOverlay, navTo } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.5186, lng: 71.2185 }; 
let officePos = { lat: 40.5186, lng: 71.2185 }; 
let map: any = null;
let marker: any = null;
let currentDistanceKm = 0;
let selectedTransportType = 'walking';
let selectedPaymentMethod = 'cash';
let deliveryRates: any = { walking_base: 5000, walking_km: 2000, bicycle_base: 7000, bicycle_km: 2500, car_base: 12000, car_km: 4000 };

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
        <div style="padding-bottom: 240px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight: 900; font-size:1.8rem;">Savatim</h2>
                <div style="font-weight:800; color:var(--gray); font-size:0.9rem;">${cartItems.length} mahsulot</div>
            </div>
            <div id="cartItemsList">
                ${cartItems.map(item => `
                    <div class="card" style="display:flex; gap:15px; align-items:center; padding:15px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:12px;">
                        <img src="${item.products.image_url || item.products.images?.[0]}" style="width:70px; height:70px; border-radius:18px; object-fit:cover;">
                        <div style="flex:1;">
                            <h4 style="font-weight:800; font-size:0.9rem;">${item.products.name}</h4>
                            <div style="color:var(--primary); font-weight:900; margin-top:4px;">${item.products.price.toLocaleString()} UZS</div>
                            <div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
                                <div style="display:flex; align-items:center; background:#f8fafc; padding:4px; border-radius:10px; border:1px solid #e2e8f0;">
                                    <button onclick="updateQty(${item.product_id}, ${parseFloat((item.quantity - (item.products.unit === 'kg' ? 0.1 : 1)).toFixed(2))})" style="border:none; background:white; width:28px; height:28px; border-radius:8px; box-shadow:var(--shadow-sm); cursor:pointer;">-</button>
                                    <span style="font-weight:900; margin:0 10px; font-size:0.85rem;">${item.quantity} ${item.products.unit}</span>
                                    <button onclick="updateQty(${item.product_id}, ${parseFloat((item.quantity + (item.products.unit === 'kg' ? 0.1 : 1)).toFixed(2))})" style="border:none; background:white; width:28px; height:28px; border-radius:8px; box-shadow:var(--shadow-sm); cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${item.product_id})" style="border:none; background:none; color:var(--gray); padding:10px;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `).join('')}
            </div>
            <div style="position:fixed; bottom:calc(90px + env(safe-area-inset-bottom, 0px)); left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:20px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px); border-top:1px solid #f1f5f9; z-index:100;">
                <button class="btn btn-primary" style="width:100%; height:64px; border-radius:22px; font-size:1.1rem;" onclick="openCheckout()">DAVOM ETISH (${subtotalAmount.toLocaleString()})</button>
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
    if(newQty < 0.01) return removeFromCart(pId);
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
    const finalTotal = subtotalAmount + Math.round(cost);
    if(totalEl) totalEl.innerText = finalTotal.toLocaleString() + " UZS";
}

(window as any).selectTransport = (type: string) => {
    selectedTransportType = type;
    document.querySelectorAll('.transport-select-card').forEach(el => {
        (el as HTMLElement).style.borderColor = '#f1f5f9';
        (el as HTMLElement).style.background = 'white';
    });
    const target = document.getElementById(`transport_${type}`);
    if(target) { target.style.borderColor = 'var(--primary)'; target.style.background = 'var(--primary-light)'; }
    updateCheckoutSummary();
};

(window as any).selectPaymentMethod = (method: string) => {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-select-card').forEach(el => {
        (el as HTMLElement).style.borderColor = '#f1f5f9';
        (el as HTMLElement).style.background = 'white';
    });
    const target = document.getElementById(`pay_${method}`);
    if(target) { target.style.borderColor = 'var(--primary)'; target.style.background = 'var(--primary-light)'; }
    updateCheckoutSummary();
};

(window as any).openCheckout = async () => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder')!;
    
    const { data: sets } = await supabase.from('app_settings').select('*');
    if(sets) {
        deliveryRates = sets.find(s => s.key === 'delivery_rates')?.value || deliveryRates;
        officePos = sets.find(s => s.key === 'office_location')?.value || officePos;
    }

    placeholder.innerHTML = `
        <div style="padding-bottom:120px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px; position:sticky; top:0; background:white; z-index:1000; padding:15px 0; border-bottom:1px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer;"></i>
                <h2 style="font-weight:900; font-size:1.3rem;">Buyurtmani yakunlash</h2>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:5px;">MANZILNI BELGILANG</h4>
            <div style="position:relative; margin-bottom:20px;">
                <div id="checkoutMap" style="height:400px; width:100%; border-radius:32px; border:2.5px solid #f1f5f9; background:#f8fafc; z-index:1;"></div>
                <button onclick="window.locateOnCheckout()" style="position:absolute; bottom:20px; right:20px; width:54px; height:54px; background:var(--primary); color:white; border-radius:18px; border:none; box-shadow:0 8px 20px rgba(34,197,94,0.3); z-index:1000; cursor:pointer; font-size:1.4rem; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-location-crosshairs"></i>
                </button>
            </div>

            <div class="card" style="border: 2px solid #f1f5f9; padding:25px; border-radius:30px; margin-bottom:20px;">
                <label style="font-weight:900; font-size:0.75rem; display:block; margin-bottom:8px; color:var(--gray);">📞 TELEFON RAQAMINGIZ:</label>
                <input type="tel" id="checkoutPhone" value="${profile?.phone || ""}" placeholder="+998" style="height:58px; font-size:1.1rem; border-radius:18px;">
                <label style="font-weight:900; font-size:0.75rem; display:block; margin:15px 0 8px; color:var(--gray);">💬 KURYERGA IZOH:</label>
                <textarea id="checkoutComment" placeholder="Masalan: Darvoza yonida kutaman..." style="border-radius:18px; height:100px;"></textarea>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:5px;">TRANSPORT TURI</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:25px;">
                <div id="transport_walking" onclick="selectTransport('walking')" class="transport-select-card" style="padding:15px; border-radius:24px; border:2.5px solid var(--primary); background:var(--primary-light); text-align:center; cursor:pointer;">
                    <i class="fas fa-walking" style="font-size:1.6rem; color:var(--primary); margin-bottom:5px;"></i>
                    <div style="font-size:0.6rem; font-weight:900;">PIYODA</div>
                </div>
                <div id="transport_bicycle" onclick="selectTransport('bicycle')" class="transport-select-card" style="padding:15px; border-radius:24px; border:2.5px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-bicycle" style="font-size:1.6rem; color:#0ea5e9; margin-bottom:5px;"></i>
                    <div style="font-size:0.6rem; font-weight:900;">VELO</div>
                </div>
                <div id="transport_car" onclick="selectTransport('car')" class="transport-select-card" style="padding:15px; border-radius:24px; border:2.5px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-car" style="font-size:1.6rem; color:#f97316; margin-bottom:5px;"></i>
                    <div style="font-size:0.6rem; font-weight:900;">MASHINA</div>
                </div>
            </div>

            <div class="card" style="padding:30px; border-radius:35px; background:var(--dark); color:white; border:none; margin-bottom:30px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; opacity:0.7; font-size:0.8rem; font-weight:700;"><span>Mahsulotlar:</span><span>${subtotalAmount.toLocaleString()} UZS</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; opacity:0.7; font-size:0.8rem; font-weight:700;"><span>Yetkazib berish:</span><span id="receiptDeliveryCost">0</span></div>
                <div style="display:flex; justify-content:space-between; margin-top:20px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); font-weight:900; font-size:1.5rem;"><span>JAMI:</span><span id="receiptTotal" style="color:var(--primary);">${subtotalAmount.toLocaleString()}</span></div>
            </div>

            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; height:72px; border-radius:26px; font-size:1.2rem; box-shadow:0 12px 25px rgba(34,197,94,0.3);" onclick="placeOrderFinal()">
                TASDIQLASH <i class="fas fa-check-double"></i>
            </button>
        </div>
    `;

    setTimeout(() => {
        if(!(window as any).L) return;
        map = (window as any).L.map('checkoutMap', { zoomControl: false }).setView([officePos.lat, officePos.lng], 15);
        (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        marker = (window as any).L.marker([officePos.lat, officePos.lng], { draggable: true }).addTo(map);
        
        const updatePos = () => {
            const pos = marker.getLatLng();
            selectedPos = { lat: pos.lat, lng: pos.lng };
            currentDistanceKm = calculateDistance(officePos.lat, officePos.lng, pos.lat, pos.lng);
            updateCheckoutSummary();
        };
        marker.on('dragend', updatePos);
        updatePos();
    }, 200);
};

(window as any).locateOnCheckout = () => {
    if(!navigator.geolocation) return showToast("Lokatsiya xizmati o'chiq");
    showToast("📍 Sizning joylashuvingiz...");
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        if(map && marker) {
            map.setView([latitude, longitude], 17);
            marker.setLatLng([latitude, longitude]);
            selectedPos = { lat: latitude, lng: longitude };
            currentDistanceKm = calculateDistance(officePos.lat, officePos.lng, latitude, longitude);
            updateCheckoutSummary();
        }
    }, () => showToast("Joylashuvni aniqlab bo'lmadi."));
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(window as any).placeOrderFinal = async () => {
    const phone = (document.getElementById('checkoutPhone') as HTMLInputElement)?.value.trim();
    if(!phone) return showToast("Telefon raqami shart!");

    const btn = document.getElementById('btnPlaceOrder') as HTMLButtonElement;
    const base = deliveryRates[`${selectedTransportType}_base`] || 5000;
    const kmPrice = deliveryRates[`${selectedTransportType}_km`] || 2000;
    const deliveryCost = base + (Math.max(0, currentDistanceKm - 1) * kmPrice);
    const finalTotal = subtotalAmount + Math.round(deliveryCost);

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> YUBORILMOQDA...';

    try {
        const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);
        if(!cartItems?.length) throw new Error("Savat bo'sh");

        // Format: rasm_url:::nom (miqdor)
        const itemsSummary = cartItems.map(i => {
            const img = i.products.image_url || "";
            return `${img}:::${i.products.name} (${i.quantity} ${i.products.unit})`;
        }).join("|");

        const { error } = await supabase.from('orders').insert({
            user_id: user?.id,
            total_price: finalTotal,
            latitude: selectedPos.lat,
            longitude: selectedPos.lng,
            status: 'pending',
            phone_number: phone,
            comment: (document.getElementById('checkoutComment') as HTMLTextAreaElement)?.value.trim(),
            address_text: "Xaritada belgilangan manzil",
            delivery_cost: Math.round(deliveryCost),
            payment_method: selectedPaymentMethod,
            requested_transport: selectedTransportType,
            items: itemsSummary
        });

        if(error) throw error;

        await supabase.from('cart_items').delete().eq('user_id', user?.id);
        showToast("Buyurtma qabul qilindi! 🚀");
        closeOverlay('checkoutOverlay');
        navTo('orders');
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "TASDIQLASH";
    }
};
