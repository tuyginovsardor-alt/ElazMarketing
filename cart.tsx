
import { supabase, showToast, user, profile, openOverlay, closeOverlay, navTo, loadProfileData } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.5186, lng: 71.2185 }; 
let officePos = { lat: 40.5186, lng: 71.2185 }; 
let map: any = null;
let marker: any = null;
let currentDistanceKm = 0;
let selectedTransportType = 'walking';
let selectedPaymentMethod = 'cash'; // cash, wallet, tspay
let deliveryRates: any = { walking_base: 5000, walking_km: 2000, bicycle_base: 7000, bicycle_km: 2500, car_base: 12000, car_km: 4000 };

export async function renderCartView() {
    const container = document.getElementById('cartView');
    if(!container || !user) return;

    const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);

    if(!cartItems?.length) {
        container.innerHTML = `
            <div style="text-align:center; padding:5rem 2rem;">
                <div style="width:130px; height:130px; background:var(--primary-light); border-radius:45px; display:inline-flex; align-items:center; justify-content:center; color:var(--primary); font-size:4rem; margin-bottom:2.5rem; animation: pulse 2s infinite;">
                    <i class="fas fa-shopping-basket"></i>
                </div>
                <h3 style="font-weight:900;">Savat bo'sh</h3>
                <button class="btn btn-primary" style="margin-top:2.5rem; width:100%; height:62px; border-radius:22px;" onclick="navTo('home')">XARID QILISH</button>
            </div>
        `;
        return;
    }

    subtotalAmount = cartItems.reduce((acc, item) => acc + (item.products.price * item.quantity), 0);

    container.innerHTML = `
        <div style="padding-bottom: 260px; animation: fadeIn 0.3s ease-out;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                <h2 style="font-weight: 900; font-size:1.8rem;">Savatim</h2>
                <div style="background:var(--primary-light); color:var(--primary); padding:6px 15px; border-radius:12px; font-weight:900; font-size:0.8rem;">${cartItems.length} mahsulot</div>
            </div>
            
            <div id="cartItemsList">
                ${cartItems.map(item => `
                    <div class="card" style="display:flex; gap:18px; align-items:center; padding:18px; border-radius:28px; border:1.5px solid #f1f5f9; margin-bottom:12px; background:white; box-shadow:var(--shadow-sm);">
                        <img src="${item.products.image_url}" style="width:75px; height:75px; border-radius:20px; object-fit:cover; background:#f8fafc;">
                        <div style="flex:1;">
                            <h4 style="font-weight:800; font-size:0.95rem; color:var(--text);">${item.products.name}</h4>
                            <div style="color:var(--primary); font-weight:900; margin-top:5px; font-size:1rem;">${item.products.price.toLocaleString()} UZS</div>
                            <div style="display:flex; align-items:center; gap:10px; margin-top:10px;">
                                <div style="display:flex; align-items:center; background:#f8fafc; padding:5px; border-radius:14px; border:1.5px solid #e2e8f0; width:fit-content;">
                                    <button onclick="updateQty(${item.product_id}, ${parseFloat((item.quantity - (item.products.unit === 'kg' ? 0.1 : 1)).toFixed(2))})" style="border:none; background:white; width:28px; height:28px; border-radius:10px; box-shadow:var(--shadow-sm); cursor:pointer;">-</button>
                                    <span style="font-weight:900; margin:0 12px; font-size:0.9rem;">${item.quantity} ${item.products.unit}</span>
                                    <button onclick="updateQty(${item.product_id}, ${parseFloat((item.quantity + (item.products.unit === 'kg' ? 0.1 : 1)).toFixed(2))})" style="border:none; background:white; width:28px; height:28px; border-radius:10px; box-shadow:var(--shadow-sm); cursor:pointer;">+</button>
                                </div>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${item.product_id})" style="border:none; background:#fef2f2; color:var(--danger); width:42px; height:42px; border-radius:14px; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `).join('')}
            </div>

            <!-- PROMO CARD -->
            <div class="card" style="background:var(--gradient); color:white; border:none; border-radius:28px; padding:22px; display:flex; align-items:center; gap:18px; margin-top:15px; box-shadow: 0 10px 25px rgba(34,197,94,0.2);">
                <div style="font-size:2rem;"><i class="fas fa-gift"></i></div>
                <div>
                    <div style="font-weight:900; font-size:0.95rem;">BEPUL YETKAZISH!</div>
                    <p style="font-size:0.75rem; font-weight:700; opacity:0.9;">150,000 UZS dan oshiq xaridlar uchun yetkazib berish tekin!</p>
                </div>
            </div>

            <div style="position:fixed; bottom:calc(90px + env(safe-area-inset-bottom, 0px)); left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:22px; background:rgba(255,255,255,0.85); backdrop-filter:blur(20px); border-top:1px solid #f1f5f9; z-index:100; border-radius:32px 32px 0 0; box-shadow:0 -15px 40px rgba(0,0,0,0.06);">
                <button class="btn btn-primary" style="width:100%; height:68px; border-radius:24px; font-size:1.2rem; box-shadow: 0 12px 30px rgba(34,197,94,0.3);" onclick="openCheckout()">RASMIYLASHTIRISH (${subtotalAmount.toLocaleString()})</button>
            </div>
        </div>
    `;
}

export async function removeFromCart(pId: number) {
    if(!confirm("Mahsulot o'chirilsinmi?")) return;
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
    let cost = base + (Math.max(0, currentDistanceKm - 1) * kmPrice);
    if(subtotalAmount >= 150000) cost = 0;

    const delCostEl = document.getElementById('receiptDeliveryCost');
    const totalEl = document.getElementById('receiptTotal');
    if(delCostEl) delCostEl.innerText = cost === 0 ? "BEPUL" : Math.round(cost).toLocaleString() + " UZS";
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
    document.querySelectorAll('.pay-option').forEach(el => {
        (el as HTMLElement).style.borderColor = '#f1f5f9';
        (el as HTMLElement).style.background = 'white';
    });
    const target = document.getElementById(`pay_${method}`);
    if(target) { target.style.borderColor = 'var(--primary)'; target.style.background = 'var(--primary-light)'; }
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
        <div style="padding-bottom:120px; animation: slideUp 0.4s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:1000; padding:15px 0; border-bottom:1.5px solid #f1f5f9;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer;"></i>
                <h2 style="font-weight:900; font-size:1.3rem;">Buyurtma berish</h2>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:5px;">📍 MANZILNI BELGILANG</h4>
            <div style="position:relative; margin-bottom:25px;">
                <div id="checkoutMap" style="height:380px; width:100%; border-radius:32px; border:2.5px solid #f1f5f9; background:#f8fafc; z-index:1;"></div>
                <button onclick="window.locateOnCheckout()" style="position:absolute; bottom:20px; right:20px; width:58px; height:58px; background:var(--primary); color:white; border-radius:20px; border:none; box-shadow:0 10px 25px rgba(34,197,94,0.4); z-index:1000; cursor:pointer; font-size:1.5rem; display:flex; align-items:center; justify-content:center;">
                    <i class="fas fa-location-crosshairs"></i>
                </button>
            </div>

            <div class="card" style="border: 2px solid #f1f5f9; padding:25px; border-radius:32px; margin-bottom:25px;">
                <label style="font-weight:900; font-size:0.75rem; display:block; margin-bottom:10px; color:var(--gray);">📞 Telefon raqamingiz:</label>
                <input type="tel" id="checkoutPhone" value="${profile?.phone || ""}" placeholder="+998" style="height:62px; font-size:1.1rem; border-radius:20px;">
                <label style="font-weight:900; font-size:0.75rem; display:block; margin:20px 0 10px; color:var(--gray);">💬 Kuryerga izoh:</label>
                <textarea id="checkoutComment" placeholder="Darvoza oldida kutaman..." style="border-radius:20px; height:110px;"></textarea>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:5px;">🛵 TRANSPORT TURI</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:30px;">
                <div id="transport_walking" onclick="selectTransport('walking')" class="transport-select-card" style="padding:18px 10px; border-radius:24px; border:2.5px solid var(--primary); background:var(--primary-light); text-align:center; cursor:pointer;">
                    <i class="fas fa-walking" style="font-size:1.7rem; color:var(--primary); margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">PIYODA</div>
                </div>
                <div id="transport_bicycle" onclick="selectTransport('bicycle')" class="transport-select-card" style="padding:18px 10px; border-radius:24px; border:2.5px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-bicycle" style="font-size:1.7rem; color:#0ea5e9; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">VELO</div>
                </div>
                <div id="transport_car" onclick="selectTransport('car')" class="transport-select-card" style="padding:18px 10px; border-radius:24px; border:2.5px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-car" style="font-size:1.7rem; color:#f97316; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">MASHINA</div>
                </div>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:5px;">💳 TO'LOV USULI</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; margin-bottom:30px;">
                <div id="pay_cash" onclick="selectPaymentMethod('cash')" class="pay-option" style="padding:18px 10px; border-radius:24px; border:2.5px solid var(--primary); background:var(--primary-light); text-align:center; cursor:pointer;">
                    <i class="fas fa-money-bill-wave" style="font-size:1.7rem; color:var(--primary); margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">NAQD</div>
                </div>
                <div id="pay_wallet" onclick="selectPaymentMethod('wallet')" class="pay-option" style="padding:18px 10px; border-radius:24px; border:2.5px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-wallet" style="font-size:1.7rem; color:#8b5cf6; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">HAMYON</div>
                </div>
                <div id="pay_tspay" onclick="selectPaymentMethod('tspay')" class="pay-option" style="padding:18px 10px; border-radius:24px; border:2.5px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <div style="font-weight:900; color:#3b82f6; font-size:1.2rem; margin-bottom:8px;">TsPay</div>
                    <div style="font-size:0.65rem; font-weight:900;">KARTA</div>
                </div>
            </div>

            <div class="card" style="padding:32px; border-radius:40px; background:var(--dark); color:white; border:none; margin-bottom:30px; box-shadow: 0 15px 35px rgba(30,41,59,0.2);">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; opacity:0.7; font-size:0.85rem; font-weight:700;"><span>Mahsulotlar:</span><span>${subtotalAmount.toLocaleString()} UZS</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:20px; opacity:0.7; font-size:0.85rem; font-weight:700;"><span>Yetkazib berish:</span><span id="receiptDeliveryCost">...</span></div>
                <div style="display:flex; justify-content:space-between; margin-top:20px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.15); font-weight:900; font-size:1.6rem;"><span>JAMI:</span><span id="receiptTotal" style="color:var(--primary);">...</span></div>
            </div>

            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; height:75px; border-radius:28px; font-size:1.3rem; box-shadow:0 15px 35px rgba(34,197,94,0.35);" onclick="placeOrderFinal()">
                TASDIQLASH <i class="fas fa-check-double" style="margin-left:8px;"></i>
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
    }, 250);
};

(window as any).locateOnCheckout = () => {
    if(!navigator.geolocation) return showToast("Lokatsiya o'chiq");
    navigator.geolocation.getCurrentPosition((pos) => {
        if(map && marker) {
            const { latitude, longitude } = pos.coords;
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

    const base = deliveryRates[`${selectedTransportType}_base`] || 5000;
    const kmPrice = deliveryRates[`${selectedTransportType}_km`] || 2000;
    let deliveryCost = base + (Math.max(0, currentDistanceKm - 1) * kmPrice);
    if(subtotalAmount >= 150000) deliveryCost = 0;
    const finalTotal = subtotalAmount + Math.round(deliveryCost);

    if (selectedPaymentMethod === 'wallet') {
        await loadProfileData();
        if ((profile?.balance || 0) < finalTotal) return showToast("Mablag' yetarli emas!");
    }

    const btn = document.getElementById('btnPlaceOrder') as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> YUBORILMOQDA...';

    try {
        const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);
        const itemsSummary = cartItems.map(i => `${i.products.image_url || ""}:::${i.products.name} (${i.quantity} ${i.products.unit})`).join("|");

        const orderData = {
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
        };

        if (selectedPaymentMethod === 'tspay') {
            const { data: payRes } = await supabase.functions.invoke('clever-api', { body: { action: 'create', amount: finalTotal, user_id: user.id } });
            if (payRes?.status === 'success') {
                await supabase.from('orders').insert({ ...orderData, status: 'awaiting_payment' });
                window.location.href = payRes.transaction.url;
                return;
            }
        }

        if (selectedPaymentMethod === 'wallet') {
            await supabase.from('profiles').update({ balance: profile.balance - finalTotal }).eq('id', user.id);
            await supabase.from('transactions').insert({ user_id: user.id, amount: finalTotal, type: 'expense', description: "Buyurtma uchun to'lov" });
        }

        const { error } = await supabase.from('orders').insert(orderData);
        if(error) throw error;

        await supabase.from('cart_items').delete().eq('user_id', user?.id);
        showToast("Buyurtma berildi! 🚀");
        closeOverlay('checkoutOverlay');
        navTo('orders');
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "TASDIQLASH";
    }
};
