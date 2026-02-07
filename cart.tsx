
import { supabase, showToast, user, profile, openOverlay, closeOverlay } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.5050, lng: 71.2215 };
let officePos = { lat: 40.5050, lng: 71.2215 };
let map: any = null;
let marker: any = null;
let selectedArea = "";
let currentDistanceKm = 0;
let selectedPaymentMethod = 'cash'; // 'cash', 'tspay', 'balance'

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
            <h2 style="font-weight: 900; font-size:1.8rem; margin-bottom:20px;">Mening Savatim</h2>
            <div id="cartItemsList">
                ${cartItems.map(item => `
                    <div class="card" style="display:flex; gap:15px; align-items:center; padding:15px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:12px;">
                        <img src="${item.products.image_url || item.products.images?.[0]}" style="width:70px; height:70px; border-radius:18px; object-fit:cover;">
                        <div style="flex:1;">
                            <h4 style="font-weight:800; font-size:0.9rem;">${item.products.name}</h4>
                            <div style="color:var(--primary); font-weight:900; margin-top:4px;">${item.products.price.toLocaleString()} UZS</div>
                            <div style="display:flex; align-items:center; gap:15px; margin-top:8px;">
                                <div style="display:flex; align-items:center; background:#f8fafc; padding:4px; border-radius:10px; border:1px solid #e2e8f0;">
                                    <button onclick="updateQty(${item.product_id}, ${item.quantity - (item.products.unit === 'kg' ? 0.1 : 1)})" style="border:none; background:white; width:28px; height:28px; border-radius:8px; box-shadow:var(--shadow-sm);">-</button>
                                    <span style="font-weight:900; margin:0 12px; font-size:0.9rem;">${item.quantity} ${item.products.unit}</span>
                                    <button onclick="updateQty(${item.product_id}, ${item.quantity + (item.products.unit === 'kg' ? 0.1 : 1)})" style="border:none; background:white; width:28px; height:28px; border-radius:8px; box-shadow:var(--shadow-sm);">+</button>
                                </div>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${item.product_id})" style="border:none; background:none; color:var(--gray); font-size:1.1rem; padding:10px;"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `).join('')}
            </div>
            <div style="position:fixed; bottom:90px; left:50%; transform:translateX(-50%); width:100%; max-width:450px; padding:20px; background:rgba(255,255,255,0.9); backdrop-filter:blur(20px);">
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

(window as any).openCheckout = async () => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder')!;
    
    // Savatdagi ma'lumotlarni qayta olish (summary uchun)
    const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);
    const { data: sets } = await supabase.from('app_settings').select('*');
    const deliveryRates = sets?.find(s => s.key === 'delivery_rates')?.value || { walking_base: 5000, walking_km: 2000 };
    officePos = sets?.find(s => s.key === 'office_location')?.value || { lat: 40.5050, lng: 71.2215 };

    const currentPhone = profile?.phone || "";

    placeholder.innerHTML = `
        <div style="padding-bottom:120px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer;"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Buyurtmani tasdiqlash</h2>
            </div>

            <!-- BUYURTMA XULOSASI (RO'YXAT) -->
            <div class="card" style="padding:20px; border-radius:28px; background:#f8fafc; border:none; margin-bottom:20px;">
                <h4 style="font-weight:900; font-size:0.85rem; color:var(--gray); text-transform:uppercase; margin-bottom:15px; letter-spacing:0.5px;">Sizning xaridlaringiz:</h4>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    ${items?.map(item => `
                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem;">
                            <div style="flex:1; font-weight:700;">${item.products.name} <span style="color:var(--gray); font-size:0.75rem;">x ${item.quantity} ${item.products.unit}</span></div>
                            <div style="font-weight:900; color:var(--text);">${(item.products.price * item.quantity).toLocaleString()} UZS</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- TEL RAQAM SECTION -->
            <div class="card" style="border: 1.5px solid #f1f5f9; padding:20px; border-radius:24px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h4 style="font-weight:900; color:var(--text); font-size:0.9rem;">Bog'lanish uchun raqam:</h4>
                    <i class="fas fa-phone-alt" style="color:var(--primary);"></i>
                </div>
                <input type="tel" id="checkoutPhone" value="${currentPhone}" placeholder="+998 90 123 45 67" 
                       style="height:56px; border-radius:16px; border:2.5px solid #f1f5f9; padding:0 18px; font-weight:800; font-size:1.1rem; width:100%;">
                <p style="font-size:0.65rem; color:var(--gray); margin-top:8px; font-weight:700;">* Kuryer buyurtmani yetkazganda shu raqamga bog'lanadi.</p>
            </div>

            <!-- MAP SECTION -->
            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:10px;">YETKAZIB BERISH MANZILI</h4>
            <div class="card" style="padding:0; border-radius:28px; overflow:hidden; border:1.5px solid #f1f5f9; margin-bottom:25px;">
                <div id="deliveryMap" style="height:220px; width:100%;"></div>
                <div style="padding:15px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; gap:10px;">
                    <button class="btn btn-outline" style="flex:1; height:45px; font-size:0.7rem; border-radius:12px;" onclick="selectCheckoutArea('Bag\\\'dod', 40.5050, 71.2215)">BAG'DOD</button>
                    <button class="btn btn-outline" style="flex:1; height:45px; font-size:0.7rem; border-radius:12px;" onclick="selectCheckoutArea('Guliston', 40.4897, 68.7848)">GULISTON</button>
                </div>
            </div>

            <!-- PAYMENT METHODS -->
            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:10px;">TO'LOV USULI</h4>
            <div style="display:grid; grid-template-columns: 1fr; gap:12px; margin-bottom:25px;">
                <div onclick="selectPayment('cash')" id="pay_cash" class="payment-card active" style="display:flex; align-items:center; gap:15px; padding:18px; border-radius:20px; border:2px solid var(--primary); background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; border-radius:12px; background:#f0fdf4; color:#22c55e; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-money-bill-wave"></i></div>
                    <div style="flex:1;"><div style="font-weight:900; font-size:0.95rem;">Naqd pul</div><div style="font-size:0.7rem; color:var(--gray); font-weight:700;">Kuryerga yetkazilganda</div></div>
                    <i class="fas fa-check-circle" style="color:var(--primary);"></i>
                </div>
                <div onclick="selectPayment('tspay')" id="pay_tspay" class="payment-card" style="display:flex; align-items:center; gap:15px; padding:18px; border-radius:20px; border:2px solid #f1f5f9; background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; border-radius:12px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-credit-card"></i></div>
                    <div style="flex:1;"><div style="font-weight:900; font-size:0.95rem;">TsPay (Karta)</div><div style="font-size:0.7rem; color:var(--gray); font-weight:700;">Onlayn to'lov</div></div>
                    <i class="far fa-circle" style="color:#cbd5e1;"></i>
                </div>
                <div onclick="selectPayment('balance')" id="pay_balance" class="payment-card" style="display:flex; align-items:center; gap:15px; padding:18px; border-radius:20px; border:2px solid #f1f5f9; background:white; cursor:pointer;">
                    <div style="width:45px; height:45px; border-radius:12px; background:#fffbeb; color:#d97706; display:flex; align-items:center; justify-content:center; font-size:1.2rem;"><i class="fas fa-wallet"></i></div>
                    <div style="flex:1;"><div style="font-weight:900; font-size:0.95rem;">Hamyon</div><div style="font-size:0.7rem; color:var(--gray); font-weight:700;">Balans: ${(profile?.balance || 0).toLocaleString()} UZS</div></div>
                    <i class="far fa-circle" style="color:#cbd5e1;"></i>
                </div>
            </div>

            <!-- TOTAL SUMMARY -->
            <div class="card" style="padding:25px; border-radius:30px; background:var(--dark); color:white; border:none; margin-bottom:30px; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.25);">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-weight:700; opacity:0.7; font-size:0.85rem;"><span>Mahsulotlar jami:</span><span>${subtotalAmount.toLocaleString()} UZS</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-weight:700; opacity:0.7; font-size:0.85rem;"><span>Yetkazib berish:</span><span id="receiptDeliveryCost">0 UZS</span></div>
                <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); font-weight:900; font-size:1.4rem;"><span>TO'LOV SUMMASI:</span><span id="receiptTotal" style="color:var(--primary);">${subtotalAmount.toLocaleString()} UZS</span></div>
            </div>

            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; height:65px; border-radius:24px; font-size:1.2rem;" onclick="placeOrderFinal()">BUYURTMANI TASDIQLASH</button>
        </div>
    `;

    setTimeout(() => {
        // @ts-ignore
        map = L.map('deliveryMap').setView([officePos.lat, officePos.lng], 15);
        // @ts-ignore
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        // @ts-ignore
        marker = L.marker([officePos.lat, officePos.lng], {draggable: true}).addTo(map);
        
        const updateReceipt = () => {
            const pos = marker.getLatLng();
            selectedPos = { lat: pos.lat, lng: pos.lng };
            const dist = calculateDistance(officePos.lat, officePos.lng, pos.lat, pos.lng);
            currentDistanceKm = dist;
            const cost = deliveryRates.walking_base + (Math.max(0, dist - 1) * deliveryRates.walking_km);
            document.getElementById('receiptDeliveryCost')!.innerText = Math.round(cost).toLocaleString() + " UZS";
            document.getElementById('receiptTotal')!.innerText = (subtotalAmount + Math.round(cost)).toLocaleString() + " UZS";
        };
        marker.on('dragend', updateReceipt);
        updateReceipt();
    }, 200);
};

(window as any).selectPayment = (method: string) => {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-card').forEach(el => {
        (el as HTMLElement).style.borderColor = '#f1f5f9';
        const icon = el.querySelector('.fa-check-circle, .fa-circle');
        if(icon) {
            icon.className = 'far fa-circle';
            (icon as HTMLElement).style.color = '#cbd5e1';
        }
    });
    const target = document.getElementById(`pay_${method}`);
    if(target) {
        target.style.borderColor = 'var(--primary)';
        const icon = target.querySelector('i:last-child');
        if(icon) {
            icon.className = 'fas fa-check-circle';
            (icon as HTMLElement).style.color = 'var(--primary)';
        }
    }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(window as any).selectCheckoutArea = (area: string, lat: number, lng: number) => {
    selectedArea = area;
    if(map) map.setView([lat, lng], 15);
    if(marker) marker.setLatLng([lat, lng]);
};

(window as any).placeOrderFinal = async () => {
    const btn = document.getElementById('btnPlaceOrder') as HTMLButtonElement;
    const phoneInput = document.getElementById('checkoutPhone') as HTMLInputElement;
    const phone = phoneInput ? phoneInput.value.trim() : profile?.phone;

    if(!phone) return showToast("Telefon raqami kiritilishi shart!");
    if(selectedPaymentMethod === 'balance' && (profile?.balance || 0) < subtotalAmount) return showToast("Hamyonda yetarli mablag' yo'q!");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> YUBORILMOQDA...';

    const deliveryCost = 5000 + (Math.max(0, currentDistanceKm - 1) * 2000);

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
            address_text: selectedArea || "Markaz",
            delivery_cost: Math.round(deliveryCost),
            payment_method: selectedPaymentMethod
        });

        if(!error) {
            if(selectedPaymentMethod === 'balance') {
               await supabase.from('profiles').update({ balance: profile.balance - subtotalAmount }).eq('id', profile.id);
            }
            await supabase.from('cart_items').delete().eq('user_id', user?.id);
            showToast("Buyurtma qabul qilindi! 🚀");
            closeOverlay('checkoutOverlay');
            (window as any).navTo('orders');
        } else throw error;
    } catch (e: any) {
        showToast("Xato: " + e.message);
        btn.disabled = false;
        btn.innerText = "TASDIQLASH";
    }
};
