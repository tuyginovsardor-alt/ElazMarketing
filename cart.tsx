
import { supabase, showToast, user, profile, openOverlay, closeOverlay } from "./index.tsx";

let subtotalAmount = 0;
let selectedPos = { lat: 40.5050, lng: 71.2215 };
let officePos = { lat: 40.5050, lng: 71.2215 };
let map: any = null;
let marker: any = null;
let selectedArea = "";
let currentDistanceKm = 0;

export async function renderCartView() {
    const container = document.getElementById('cartView');
    if(!container || !user) return;

    const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

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
        <div style="padding-bottom: 180px;">
            <h2 style="font-weight: 900; font-size:1.8rem; margin-bottom:20px;">Mening Savatim</h2>
            <div id="cartItemsList">
                ${cartItems.map(item => `
                    <div class="card" style="display:flex; gap:15px; align-items:center; padding:15px; border-radius:24px; border:1px solid #f1f5f9; margin-bottom:12px; position:relative;">
                        <img src="${item.products.image_url || item.products.images?.[0]}" style="width:70px; height:70px; border-radius:18px; object-fit:cover;">
                        <div style="flex:1;">
                            <h4 style="font-weight:800; font-size:0.9rem;">${item.products.name}</h4>
                            <div style="color:var(--primary); font-weight:900;">${(item.products.price * item.quantity).toLocaleString()} UZS</div>
                            <div style="display:flex; align-items:center; gap:10px; margin-top:8px;">
                                <button onclick="updateQty(${item.product_id}, ${item.quantity - 1})" style="border:none; background:#f1f5f9; width:28px; height:28px; border-radius:8px;">-</button>
                                <span style="font-weight:900;">${item.quantity}</span>
                                <button onclick="updateQty(${item.product_id}, ${item.quantity + 1})" style="border:none; background:#f1f5f9; width:28px; height:28px; border-radius:8px;">+</button>
                            </div>
                        </div>
                        <button onclick="removeFromCart(${item.product_id})" style="border:none; background:none; color:var(--danger);"><i class="fas fa-trash"></i></button>
                    </div>
                `).join('')}
            </div>
            <div style="position:fixed; bottom:90px; left:0; width:100%; padding:20px;">
                <button class="btn btn-primary" style="width:100%; height:64px;" onclick="openCheckout()">RASMIYLASHTIRISH (${subtotalAmount.toLocaleString()} UZS)</button>
            </div>
        </div>
    `;
}

// Fix: Define removeFromCart as a local function first so it's visible to updateQty
export async function removeFromCart(pId: number) {
    if(!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', pId);
    renderCartView();
};
(window as any).removeFromCart = removeFromCart;

// Fix: Define updateQty as a local function to ensure removeFromCart is in scope
export async function updateQty(pId: number, newQty: number) {
    if(!user) return;
    if(newQty < 1) return removeFromCart(pId);
    await supabase.from('cart_items').update({ quantity: newQty }).eq('user_id', user.id).eq('product_id', pId);
    renderCartView();
};
(window as any).updateQty = updateQty;

(window as any).openCheckout = async () => {
    openOverlay('checkoutOverlay');
    const placeholder = document.getElementById('checkoutPlaceholder')!;
    const { data: sets } = await supabase.from('app_settings').select('*');
    const deliveryRates = sets?.find(s => s.key === 'delivery_rates')?.value || { walking_base: 5000, walking_km: 2000 };
    officePos = sets?.find(s => s.key === 'office_location')?.value || { lat: 40.5050, lng: 71.2215 };

    placeholder.innerHTML = `
        <div style="padding-bottom:50px;">
            <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
                <i class="fas fa-arrow-left" onclick="closeOverlay('checkoutOverlay')"></i>
                <h2 style="font-weight:900;">Rasmiylashtirish</h2>
            </div>
            <h4 style="margin-bottom:10px;">Hududni tanlang</h4>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
                <button class="btn btn-outline" onclick="selectCheckoutArea('Bag\\\'dod', 40.5050, 71.2215)" id="optBagdod">Bag'dod</button>
                <button class="btn btn-outline" onclick="selectCheckoutArea('Guliston', 40.4897, 68.7848)" id="optGuliston">Guliston</button>
            </div>
            <div id="deliveryMap" style="height:200px; border-radius:20px; margin-bottom:20px;"></div>
            <div class="card" style="padding:20px; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>Mahsulotlar:</span><b>${subtotalAmount.toLocaleString()}</b></div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>Yetkazish:</span><b id="receiptDeliveryCost">0</b></div>
                <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:900; border-top:2px dashed #ddd; padding-top:10px;"><span>JAMI:</span><span id="receiptTotal" style="color:var(--primary);">${subtotalAmount.toLocaleString()} UZS</span></div>
            </div>
            <button class="btn btn-primary" id="btnPlaceOrder" style="width:100%; margin-top:20px;" onclick="placeOrderFinal()">BUYURTMANI YUBORISH</button>
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
    btn.disabled = true;
    const deliveryCost = 5000 + (Math.max(0, currentDistanceKm - 1) * 2000);

    const { error } = await supabase.from('orders').insert({
        user_id: user?.id,
        total_price: subtotalAmount,
        latitude: selectedPos.lat,
        longitude: selectedPos.lng,
        status: 'confirmed', // To'g'ridan-to'g'ri tasdiqlangan holat
        phone_number: profile?.phone,
        address_text: selectedArea || "Noma'lum hudud",
        delivery_cost: Math.round(deliveryCost)
    });

    if(!error) {
        await supabase.from('cart_items').delete().eq('user_id', user?.id);
        showToast("Buyurtma yuborildi! 🚀");
        closeOverlay('checkoutOverlay');
        (window as any).navTo('orders');
    } else {
        showToast("Xato: " + error.message);
        btn.disabled = false;
    }
};
