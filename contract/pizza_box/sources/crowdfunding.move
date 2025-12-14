module pizza_box::crowdfunding {
    use iota::coin::{Self, Coin};
    use iota::iota::IOTA;
    // Perhatikan: string (kecil) untuk module, String (besar) untuk tipe data
    use std::string::{Self, String}; 
    use iota::balance::{Self, Balance};
    use iota::address; 
    
    // Note: Import vector, object, transfer, tx_context dihapus 
    // karena sudah otomatis ada di IOTA Move 2024 (menghilangkan warning)

    // --- STRUCTS ---

    public struct AdminCap has key {
        id: UID
    }

    public struct CatNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,
        rarity: String,
        valuation: u64,
    }

    public struct CharityFund has key {
        id: UID,
        balance: Balance<IOTA>,
        total_raised: u64,
    }

    // --- INITIALIZATION ---
    
    fun init(ctx: &mut TxContext) {
        transfer::share_object(CharityFund {
            id: object::new(ctx),
            balance: balance::zero(),
            total_raised: 0,
        });
        
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));
    }

    // --- HELPER: GENERATE FUNNY ENGLISH NAME ---
    
    fun generate_funny_name(id: &UID): String {
        // 1. Kamus Kata
        let prefixes = vector[
            b"Sir", b"Lady", b"Captain", b"Professor", b"Dr.", 
            b"Lord", b"Baron", b"General", b"Agent", b"Baby", 
            b"King", b"Queen", b"Chief", b"Master", b"Detective"
        ];

        let names = vector[
            b"Whiskers", b"Mittens", b"Felix", b"Luna", b"Garfield", 
            b"Oreo", b"Simba", b"Bella", b"Shadow", b"Tom", 
            b"Salem", b"Smokey", b"Charlie", b"Nala", b"Daisy"
        ];

        let titles = vector[
            b"the Sleepy", b"the Destroyer", b"of the Sofa", b"Lasagna Lover", 
            b"the Fluffy", b"Mouse Hunter", b"the Chonky", b"Fish Thief", 
            b"the Zoomie King", b"Void Walker", b"Box Dweller", b"Laser Chaser",
            b"of the Backyard", b"Keyboard Walker", b"Alarm Clock"
        ];

        // 2. Random logic
        let id_addr = object::uid_to_address(id);
        let bytes = address::to_bytes(id_addr);
        
        let idx1 = (*vector::borrow(&bytes, 0) as u64) % vector::length(&prefixes);
        let idx2 = (*vector::borrow(&bytes, 1) as u64) % vector::length(&names);
        let idx3 = (*vector::borrow(&bytes, 2) as u64) % vector::length(&titles);
        
        // 3. Gabungkan String (FIXED ERROR DISINI)
        // Menggunakan 'string::utf8' (kecil), bukan 'String::utf8'
        let mut full_name = string::utf8(b""); 
        
        string::append(&mut full_name, string::utf8(*vector::borrow(&prefixes, idx1)));
        string::append(&mut full_name, string::utf8(b" ")); 
        string::append(&mut full_name, string::utf8(*vector::borrow(&names, idx2)));
        string::append(&mut full_name, string::utf8(b" ")); 
        string::append(&mut full_name, string::utf8(*vector::borrow(&titles, idx3)));
        
        string::append(&mut full_name, string::utf8(b" #"));
        
        full_name
    }

    fun get_random_byte(id: &UID, offset: u64): u64 {
        let id_addr = object::uid_to_address(id);
        let bytes = address::to_bytes(id_addr);
        let len = vector::length(&bytes);
        let idx = offset % len;
        (*vector::borrow(&bytes, idx) as u64)
    }

    fun get_image_filename(index: u64): String {
        let num = (index % 12) + 1;
        if (num == 1) { string::utf8(b"1.png") }
        else if (num == 2) { string::utf8(b"2.png") }
        else if (num == 3) { string::utf8(b"3.png") }
        else if (num == 4) { string::utf8(b"4.png") }
        else if (num == 5) { string::utf8(b"5.png") }
        else if (num == 6) { string::utf8(b"6.png") }
        else if (num == 7) { string::utf8(b"7.png") }
        else if (num == 8) { string::utf8(b"8.png") }
        else if (num == 9) { string::utf8(b"9.png") }
        else if (num == 10) { string::utf8(b"10.png") }
        else if (num == 11) { string::utf8(b"11.png") }
        else { string::utf8(b"12.png") }
    }

    // --- PUBLIC FUNCTIONS ---

    public fun donate(
        fund: &mut CharityFund, 
        payment: Coin<IOTA>, 
        ctx: &mut TxContext
    ) {
        let value = coin::value(&payment);
        let sender = tx_context::sender(ctx);

        balance::join(&mut fund.balance, coin::into_balance(payment));
        fund.total_raised = fund.total_raised + value;

        let nft_uid = object::new(ctx);
        let funny_name = generate_funny_name(&nft_uid);
        let luck_factor = get_random_byte(&nft_uid, 5); 

        let threshold_10_iota: u64 = 10_000_000_000;
        
        let (desc, img_index, rarity, final_valuation) = if (value >= threshold_10_iota) {
            // RARE
            let base_val = 5_000_000_000; 
            let random_bonus = (5_000_000_000 * luck_factor) / 255;
            let img_idx = 7 + (luck_factor % 6);
            (
                string::utf8(b"A very majestic and rare guardian."),
                img_idx,
                string::utf8(b"Rare"),
                base_val + random_bonus
            )
        } else {
            // COMMON
            let base_val = 500_000_000;
            let random_bonus = (500_000_000 * luck_factor) / 255;
            let img_idx = 1 + (luck_factor % 6); 
            (
                string::utf8(b"A cute cat looking for a home."),
                img_idx,
                string::utf8(b"Common"),
                base_val + random_bonus
            )
        };

        let nft = CatNFT {
            id: nft_uid, 
            name: funny_name, 
            description: desc,
            image_url: get_image_filename(img_index),
            rarity: rarity,
            valuation: final_valuation
        };

        transfer::public_transfer(nft, sender);
    }

    public fun withdraw_funds(
        _: &AdminCap,
        fund: &mut CharityFund,
        ctx: &mut TxContext
    ) {
        let amount = balance::value(&fund.balance);
        let withdrawn_coin = coin::take(&mut fund.balance, amount, ctx);
        transfer::public_transfer(withdrawn_coin, tx_context::sender(ctx));
    }
}