
import { supabase, showToast, user, profile, openOverlay, closeOverlay, navTo } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.4851, lng: 71.2188 }; // Bag'dod (Farg'ona)
let officePos = { lat: 40.4851, lng: 71.2188 };
let map: any = null;
let marker: any = null;
let currentDistanceKm = 0;
let selectedTransportType = 'walking';
let selectedPaymentMethod = 'cash';
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
        <div style="padding-bottom: 240px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="font-weight: 900; font-size:1.8rem;">Mening Savatim</h2>
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

    const walletText = document.getElementById('walletBalanceInfo');
    if(walletText) {
        const isNotEnough = selectedPaymentMethod === 'wallet' && (profile?.balance || 0) < finalTotal;
        walletText.style.color = isNotEnough ? 'var(--danger)' : '#64748b';
    }
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
    
    const { data: items } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);
    const { data: sets } = await supabase.from('app_settings').select('*');
    if(sets) {
        deliveryRates = sets.find(s => s.key === 'delivery_rates')?.value || deliveryRates;
        officePos = sets.find(s => s.key === 'office_location')?.value || officePos;
    }

    placeholder.innerHTML = `
        <div style="padding-bottom:120px; animation: slideUp 0.3s ease-out;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:25px; position:sticky; top:0; background:white; z-index:10; padding:10px 0;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')" style="font-size:1.4rem; cursor:pointer; color:var(--text);"></i>
                <h2 style="font-weight:900; font-size:1.4rem;">Rasmiylashtirish</h2>
            </div>

            <div class="card" style="padding:20px; border-radius:28px; background:#f8fafc; border:none; margin-bottom:20px;">
                <h4 style="font-weight:900; font-size:0.8rem; color:var(--gray); text-transform:uppercase; margin-bottom:15px;">MAHSULOTLAR:</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    ${items?.map(item => `
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="${item.products.image_url || item.products.images?.[0]}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;">
                            <div style="flex:1;">
                                <div style="font-weight:700; font-size:0.85rem;">${item.products.name}</div>
                                <div style="font-size:0.7rem; color:var(--gray); font-weight:800;">${item.quantity} ${item.products.unit} x ${item.products.price.toLocaleString()}</div>
                            </div>
                            <div style="font-weight:900; font-size:0.9rem;">${(item.products.price * item.quantity).toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card" style="border: 1.5px solid #f1f5f9; padding:25px; border-radius:28px; margin-bottom:20px;">
                <label style="font-weight:900; font-size:0.8rem; display:block; margin-bottom:8px;">TEL RAQAM:</label>
                <input type="tel" id="checkoutPhone" value="${profile?.phone || ""}" placeholder="+998">
                <label style="font-weight:900; font-size:0.8rem; display:block; margin:15px 0 8px;">KURYERGA IZOH:</label>
                <textarea id="checkoutComment" placeholder="Darvozada kutaman..."></textarea>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin:20px 0 15px 10px;">TO'LOV USULI</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:25px;">
                <div id="pay_cash" onclick="selectPaymentMethod('cash')" class="payment-select-card" style="padding:15px; border-radius:22px; border:2px solid var(--primary); background:var(--primary-light); text-align:center; cursor:pointer;">
                    <i class="fas fa-money-bill-wave" style="font-size:1.4rem; color:var(--primary); margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">NAQD</div>
                </div>
                <div id="pay_wallet" onclick="selectPaymentMethod('wallet')" class="payment-select-card" style="padding:15px; border-radius:22px; border:2px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-wallet" style="font-size:1.4rem; color:#6366f1; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">HAMYON</div>
                </div>
                <div id="pay_tspay" onclick="selectPaymentMethod('tspay')" class="payment-select-card" style="padding:15px; border-radius:22px; border:2px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-credit-card" style="font-size:1.4rem; color:#f59e0b; margin-bottom:8px;"></i>
                    <div style="font-size:0.65rem; font-weight:900;">KARTA</div>
                </div>
            </div>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:10px;">YETKAZIB BERISH MANZILI</h4>
            <div id="deliveryMap" style="height:250px; width:100%; border-radius:28px; margin-bottom:15px; border:2px solid #f1f5f9;"></div>
            <p style="font-size:0.7rem; color:var(--gray); text-align:center; margin-bottom:25px; font-weight:700;"><i class="fas fa-info-circle"></i> Xaritadan aniq joylashuvingizni belgilang</p>

            <h4 style="font-weight:900; font-size:1rem; margin-bottom:15px; margin-left:10px;">TRANSPORT TURI</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px; margin-bottom:25px;">
                <div id="transport_walking" onclick="selectTransport('walking')" class="transport-select-card" style="padding:15px; border-radius:22px; border:2px solid var(--primary); background:var(--primary-light); text-align:center; cursor:pointer;">
                    <i class="fas fa-walking" style="font-size:1.4rem; color:var(--primary);"></i>
                </div>
                <div id="transport_bicycle" onclick="selectTransport('bicycle')" class="transport-select-card" style="padding:15px; border-radius:22px; border:2px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-bicycle" style="font-size:1.4rem; color:#0ea5e9;"></i>
                </div>
                <div id="transport_car" onclick="selectTransport('car')" class="transport-select-card" style="padding:15px; border-radius:22px; border:2px solid #f1f5f9; background:white; text-align:center; cursor:pointer;">
                    <i class="fas fa-car" style="font-size:1.4rem; color:#f97316;"></i>
                </div>
            </div>

            <div class="card" style="padding:25px; border-radius:32px; background:var(--dark); color:white; border:none; margin-bottom:30px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; opacity:0.8; font-size:0.8rem;"><span>Mahsulotlar:</span><span>${subtotalAmount.toLocaleString()}</span></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; opacity:0.8; font-size:0.8rem;"><span>Yetkazib berish:</span><span id="receiptDeliveryCost">0</span></div>
                <div style="display:flex; justify-content:space-between; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1); font-weight:900; font-size:1.4rem;"><span>JAMI:</span><span id="receiptTotal" style="color:var(--primary);">${subtotalAmount.toLocaleString()}</span></div>
            </div>

            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; height:68px; border-radius:24px; font-size:1.1rem;" onclick="placeOrderFinal()">
                TASDIQLASH <i class="fas fa-check-circle"></i>
            </button>
        </div>
    `;

    setTimeout(() => {
        const L = (window as any).L;
        if (!L) return;

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
        const hybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'] });

        map = L.map('deliveryMap', {
            center: [officePos.lat, officePos.lng],
            zoom: 15,
            layers: [osm]
        });

        const baseMaps = { "Ko'cha": osm, "Sputnik": satellite, "Gibrid": hybrid };
        L.control.layers(baseMaps).addTo(map);

        marker = L.marker([officePos.lat, officePos.lng], {draggable: true}).addTo(map);
        
        const onLocationChange = () => {
            const pos = marker.getLatLng();
            selectedPos = { lat: pos.lat, lng: pos.lng };
            currentDistanceKm = calculateDistance(officePos.lat, officePos.lng, pos.lat, pos.lng);
            updateCheckoutSummary();
        };
        marker.on('dragend', onLocationChange);
        onLocationChange();
    }, 300);
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2-lat1)*Math.PI/180;
    const dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

(window as any).placeOrderFinal = async () => {
    const phone = (document.getElementById('checkoutPhone') as HTMLInputElement)?.value.trim();
    if(!phone) return showToast("Telefon raqami shart!");

    if(!confirm("Buyurtmani tasdiqlaysizmi?")) return;

    const btn = document.getElementById('btnPlaceOrder') as HTMLButtonElement;
    const base = deliveryRates[`${selectedTransportType}_base`] || 5000;
    const kmPrice = deliveryRates[`${selectedTransportType}_km`] || 2000;
    const deliveryCost = base + (Math.max(0, currentDistanceKm - 1) * kmPrice);
    const finalTotal = subtotalAmount + Math.round(deliveryCost);

    if (selectedPaymentMethod === 'wallet' && (profile?.balance || 0) < finalTotal) {
        return showToast("Hamyonda mablag' yetarli emas!");
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> JARAYONDA...';

    try {
        const { data: cartItems } = await supabase.from('cart_items').select('*, products(*)').eq('user_id', user.id);
        
        // Items stringini shakllantirish: "Nomi (Soni Birligi)"
        const itemsSummary = cartItems?.map(i => `${i.products.name} (${i.quantity} ${i.products.unit})`).join("|") || "";

        const { data: newOrder, error } = await supabase.from('orders').insert({
            user_id: user?.id,
            total_price: finalTotal,
            latitude: selectedPos.lat,
            longitude: selectedPos.lng,
            status: 'pending',
            phone_number: phone,
            comment: (document.getElementById('checkoutComment') as HTMLTextAreaElement)?.value.trim(),
            address_text: "Xaritadan tanlangan manzil",
            delivery_cost: Math.round(deliveryCost),
            payment_method: selectedPaymentMethod,
            requested_transport: selectedTransportType,
            items: itemsSummary // Barcha mahsulotlar mana shu yerda saqlanadi
        }).select().single();

        if(error) throw error;

        // TsPay mantiqi (agar bo'lsa)
        if (selectedPaymentMethod === 'tspay') {
            const { data: tsData, error: tsError } = await supabase.functions.invoke('clever-api', {
                body: { action: 'create', amount: finalTotal, user_id: user.id }
            });
            if (tsData?.status === 'success' && tsData?.transaction?.url) {
                window.location.href = tsData.transaction.url;
                return;
            }
        }

        if (selectedPaymentMethod === 'wallet') {
            await supabase.from('profiles').update({ balance: (profile.balance || 0) - finalTotal }).eq('id', user.id);
            await supabase.from('transactions').insert({
                user_id: user.id,
                amount: finalTotal,
                type: 'expense',
                description: `Buyurtma #${newOrder.id.toString().substring(0,6)} uchun to'lov`
            });
        }

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
