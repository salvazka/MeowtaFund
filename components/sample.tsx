"use client"

import { ConnectModal, useCurrentAccount, useDisconnectWallet, useSignAndExecuteTransaction, useIotaClientQuery } from "@iota/dapp-kit"
import { Transaction } from "@iota/iota-sdk/transactions"
import { useState, useEffect } from "react"
import { 
  Wallet, LogOut, Heart, Cat, Gift, Sparkles, LayoutGrid, 
  Loader2, CheckCircle, Info, Utensils, Home, Stethoscope, 
  Scissors, Briefcase, ExternalLink, TrendingUp, Users, Tag,
  ArrowUpRight
} from 'lucide-react'
import { TESTNET_PACKAGE_ID, CHARITY_FUND_ID } from "@/lib/config"

// --- CONFIG EXPLORER ---
// Anda bisa ganti ke "https://iotascan.io/testnet" jika mau
const EXPLORER_BASE = "https://explorer.iota.org/testnet" 
const EXPLORER_OBJ = `${EXPLORER_BASE}/object`
const EXPLORER_TX = `${EXPLORER_BASE}/tx`

const MODULE = "crowdfunding"
const ADMIN_CAP_TYPE = `${TESTNET_PACKAGE_ID}::${MODULE}::AdminCap`

// DUMMY DATA
const MOCK_DONATIONS = [
  { user: "0x7a2...b1", amount: "50", nft: "Pixel Lion King" },
  { user: "0x3f9...c4", amount: "5", nft: "Pixel Baby Cat" },
]

export default function MeowtaFundApp() {
  const currentAccount = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  // STATE
  const [amount, setAmount] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"donate" | "inventory" | "impact" | "admin">("donate")
  
  // Notification sekarang bisa menampung Link TX Digest
  const [notification, setNotification] = useState<{
      type: 'success' | 'error', 
      message: string, 
      digest?: string // Field baru untuk Link Explorer
  } | null>(null)
  
  const [recentDonations, setRecentDonations] = useState(MOCK_DONATIONS)

  // 1. Fetch Fund Data
  const { data: fundData, refetch: refetchFund } = useIotaClientQuery("getObject", {
      id: CHARITY_FUND_ID, options: { showContent: true }
  }, { refetchInterval: 5000 })

  const currentBalance = fundData?.data?.content?.dataType === "moveObject" 
    ? Number((fundData.data.content.fields as any).balance) / 1_000_000_000 : 0
  const totalRaisedRaw = fundData?.data?.content?.dataType === "moveObject"
    ? Number((fundData.data.content.fields as any).total_raised) / 1_000_000_000 : 0
  const catsRescued = Math.floor(totalRaisedRaw / 5) 
  const GOAL_CATS = 1000 

  // 2. Fetch My NFTs
  const { data: ownedNFTs, refetch: refetchNFTs } = useIotaClientQuery("getOwnedObjects", {
    owner: currentAccount?.address || "",
    filter: { StructType: `${TESTNET_PACKAGE_ID}::${MODULE}::CatNFT` },
    options: { showContent: true }
  }, { enabled: !!currentAccount, refetchInterval: 5000 })

  const myCollection = ownedNFTs?.data?.map((obj) => {
    const fields = (obj.data?.content as any)?.fields
    return { 
      id: obj.data?.objectId, 
      name: fields?.name, 
      img: fields?.image_url, 
      rarity: fields?.rarity,
      valuation: fields?.valuation ? (Number(fields.valuation) / 1_000_000_000).toFixed(2) : "0.00"
    }
  }) || []

  const { data: adminObjects } = useIotaClientQuery("getOwnedObjects", {
    owner: currentAccount?.address || "",
    filter: { StructType: ADMIN_CAP_TYPE },
    options: { showContent: true }
  }, { enabled: !!currentAccount })
  const isAdmin = !!adminObjects?.data?.[0]?.data?.objectId;
  const adminCapId = adminObjects?.data?.[0]?.data?.objectId;

  // ACTIONS
  const handleDonate = async () => {
    if (!currentAccount || !amount) return
    try {
      const tx = new Transaction()
      const amountVal = Number(amount)
      const amountInMist = amountVal * 1_000_000_000;
      const [coinPayment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])

      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::${MODULE}::donate`,
        arguments: [tx.object(CHARITY_FUND_ID), coinPayment]
      })

      signAndExecute({ transaction: tx }, {
        onSuccess: (result) => {
          const rarity = amountVal >= 10 ? "Rare" : "Common"
          
          // TAMPILKAN LINK EXPLORER DI NOTIFIKASI
          setNotification({ 
              type: 'success', 
              message: `Donation Sent! You got ${rarity} NFT!`,
              digest: result.digest // Hash Transaksi
          })
          
          setRecentDonations(prev => [{ 
              user: "You", amount: amount, nft: rarity === "Rare" ? "Pixel Lion" : "Pixel Cat" 
          }, ...prev.slice(0, 4)])

          setAmount(""); 
          setTimeout(() => { refetchFund(); refetchNFTs(); }, 1000)
        },
        onError: (err) => { setNotification({ type: 'error', message: "Donation Failed." }); console.error(err) }
      })
    } catch (e) { console.error(e) }
  }

  const handleWithdraw = async () => {
    if (!currentAccount || !adminCapId) return
    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::${MODULE}::withdraw_funds`,
        arguments: [tx.object(adminCapId), tx.object(CHARITY_FUND_ID)]
      })
      signAndExecute({ transaction: tx }, {
        onSuccess: (result) => {
          setNotification({ 
              type: 'success', 
              message: "Withdraw Successful!",
              digest: result.digest 
          })
          setTimeout(() => { refetchFund() }, 1000)
        }
      })
    } catch (e) { console.error(e) }
  }

  useEffect(() => { if(notification) { const t = setTimeout(() => setNotification(null), 8000); return () => clearTimeout(t) } }, [notification])

  return (
    <div className="min-h-screen bg-orange-50 font-sans text-slate-800 pb-20">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl text-white shadow-md"><Cat size={24} /></div>
            <span className="text-xl font-bold text-orange-900 tracking-tight">MeowtaFund</span>
          </div>
          {currentAccount ? (
            <div className="flex items-center gap-2">
              {isAdmin && <span className="px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded uppercase">Admin</span>}
              <div className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full font-medium text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {currentAccount.address.slice(0, 6)}...
              </div>
              <button onClick={() => disconnectWallet()} className="p-2 text-slate-400 hover:text-red-500"><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={() => setModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-full font-bold text-sm shadow-lg flex gap-2 hover:bg-slate-800 transition-all"><Wallet size={16} /> Connect</button>
          )}
        </div>
      </nav>

      {/* HEADER */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white pt-12 pb-24 px-4 rounded-b-[3rem] shadow-xl text-center relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto">
          {/* LINK KE KONTRAK DI EXPLORER */}
          <a href={`${EXPLORER_OBJ}/${CHARITY_FUND_ID}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-full text-xs font-semibold border border-white/30 cursor-pointer mb-4 group">
            <CheckCircle size={12} className="text-green-300"/> 
            Verified Contract 
            <ExternalLink size={10} className="group-hover:translate-x-1 transition-transform"/>
          </a>
          
          <h1 className="text-4xl font-extrabold mb-4">Help Stray Cats 🐾</h1>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner min-w-[200px]">
              <span className="block text-xs text-orange-100 uppercase tracking-widest mb-1">Pool Balance</span>
              <span className="text-3xl font-black text-white drop-shadow-sm">{currentBalance.toLocaleString()} <span className="text-sm">IOTA</span></span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner min-w-[200px]">
               <span className="block text-xs text-orange-100 uppercase tracking-widest mb-1">Total Rescued</span>
               <div className="flex items-baseline justify-center gap-1">
                 <span className="text-3xl font-black text-white">{catsRescued}</span>
                 <span className="text-sm text-white/70">/ {GOAL_CATS}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[500px] border border-slate-100">
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button onClick={() => setActiveTab('donate')} className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'donate' ? 'text-orange-600 bg-white border-b-2 border-orange-500' : 'text-slate-400'}`}><Heart size={18} /> Donate</button>
            <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'inventory' ? 'text-orange-600 bg-white border-b-2 border-orange-500' : 'text-slate-400'}`}><Gift size={18} /> Collection</button>
            <button onClick={() => setActiveTab('impact')} className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'impact' ? 'text-orange-600 bg-white border-b-2 border-orange-500' : 'text-slate-400'}`}><Info size={18} /> Impact</button>
            {isAdmin && <button onClick={() => setActiveTab('admin')} className={`flex-1 py-5 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'admin' ? 'text-slate-900 bg-slate-100 border-b-2 border-slate-900' : 'text-slate-400'}`}><Briefcase size={18} /> Admin</button>}
          </div>

          {activeTab === 'donate' && (
            <div className="p-8 animate-fade-in">
              <div className="mb-6 bg-slate-50 rounded-xl p-3 border border-slate-100 overflow-hidden">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider"><Users size={12}/> Recent Activity</div>
                 <div className="space-y-2">
                    {recentDonations.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600"><span className="font-bold text-slate-800">{d.user}</span> donated <span className="text-orange-600 font-bold">{d.amount} IOTA</span></span>
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{d.nft}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="text-center mb-6 bg-yellow-50 p-4 rounded-2xl border border-yellow-100 relative overflow-hidden">
                <div className="flex justify-center items-center gap-2 text-yellow-800 font-bold mb-3"><Sparkles size={16}/> NFT Valuation Chance</div>
                <div className="grid grid-cols-2 gap-3 text-left">
                   <div className="bg-white p-3 rounded-xl border border-yellow-100 shadow-sm">
                      <div className="text-xs font-bold text-blue-600 mb-1">COMMON</div>
                      <div className="text-[10px] text-slate-500">Value Range:</div>
                      <div className="text-sm font-bold text-slate-800">0.5 - 1.0 IOTA</div>
                   </div>
                   <div className="bg-white p-3 rounded-xl border border-yellow-100 shadow-sm">
                      <div className="text-xs font-bold text-purple-600 mb-1">RARE</div>
                      <div className="text-[10px] text-slate-500">Value Range:</div>
                      <div className="text-sm font-bold text-slate-800">5.0 - 10.0 IOTA</div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 justify-center">
                  {[5, 10, 25, 50].map((val) => (
                    <button key={val} onClick={() => setAmount(val.toString())} className="px-4 py-2 bg-slate-100 hover:bg-orange-100 hover:text-orange-600 rounded-lg text-sm font-bold transition-colors">{val}</button>
                  ))}
                </div>
                <div className="relative">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" className="w-full pl-5 pr-20 py-5 text-3xl font-bold bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-orange-500 outline-none transition-all text-slate-800" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">IOTA</span>
                </div>
                <button onClick={handleDonate} disabled={!currentAccount || isPending || !amount} className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg disabled:opacity-50 hover:shadow-xl hover:scale-[1.01] transition-all">
                  {isPending ? <Loader2 className="animate-spin mx-auto"/> : "Donate & Mint NFT"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="p-6 bg-slate-50 min-h-[450px] animate-fade-in">
               {!currentAccount ? <div className="text-center py-20 text-slate-400">Connect wallet to view your cats.</div> : 
               (myCollection.length === 0 ? <div className="text-center py-20 text-slate-400">No cats found. Donate to rescue one!</div> :
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{myCollection.map((nft) => (
                  <div key={nft.id} className="bg-white p-3 rounded-2xl shadow-sm border group hover:border-orange-200 transition-all relative">
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-slate-100 relative">
                      <img src={`/${nft.img}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                      <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${nft.rarity === 'Rare' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{nft.rarity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-sm truncate w-24">{nft.name}</h4>
                        {/* LINK NFT KE EXPLORER */}
                        <a href={`${EXPLORER_OBJ}/${nft.id}`} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-orange-500 transition-colors" title="View on Chain">
                            <ArrowUpRight size={14}/>
                        </a>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100">
                      <Tag size={10} />
                      <span className="font-bold">Val: {nft.valuation} IOTA</span>
                    </div>
                  </div>
               ))}</div>)}
            </div>
          )}

          {activeTab === 'impact' && (
            <div className="p-6 bg-slate-50 min-h-[450px] animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <ImpactCard icon={<Utensils size={20}/>} title="Food" desc="Providing food for strays." color="text-orange-600" bg="bg-orange-100" />
                 <ImpactCard icon={<Home size={20}/>} title="Shelter" desc="Building safe havens." color="text-blue-600" bg="bg-blue-100" />
                 <ImpactCard icon={<Stethoscope size={20}/>} title="Medical" desc="Vet bills & vaccines." color="text-green-600" bg="bg-green-100" />
                 <ImpactCard icon={<Scissors size={20}/>} title="TNR" desc="Population control." color="text-purple-600" bg="bg-purple-100" />
               </div>
               <div className="bg-white rounded-2xl p-6 border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={16}/> Live Impact Stats</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1"><span>Total Funds Raised</span><span className="font-bold">{totalRaisedRaw.toLocaleString()} IOTA</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[20%]"></div></div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="p-8 animate-fade-in bg-slate-900 text-white min-h-[450px]">
               <h3 className="font-bold text-2xl mb-2 flex items-center gap-2"><Sparkles className="text-yellow-400"/> Admin Panel</h3>
               <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
                 <span className="text-slate-400 text-sm uppercase font-bold">Contract Balance</span>
                 <div className="text-4xl font-black mt-2 text-emerald-400">{currentBalance.toLocaleString()} IOTA</div>
               </div>
               <button onClick={handleWithdraw} disabled={isPending || currentBalance <= 0} className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-all disabled:opacity-50">{isPending ? <Loader2 className="animate-spin mx-auto"/> : "Withdraw All Funds"}</button>
            </div>
          )}
        </div>
      </div>
      <ConnectModal open={modalOpen} onOpenChange={setModalOpen} />
      
      {/* NOTIFICATION DENGAN LINK EXPLORER */}
      {notification && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex flex-col gap-2 z-50 bg-white border-l-4 ${notification.type === 'error' ? 'border-red-500' : 'border-emerald-500'} max-w-sm animate-fade-in`}>
            <div className="flex items-center gap-3">
                {notification.type === 'success' ? <CheckCircle size={20} className="text-emerald-500"/> : <Info size={20} className="text-red-500"/>}
                <p className="font-bold text-slate-800 text-sm">{notification.message}</p>
            </div>
            {notification.digest && (
                <a href={`${EXPLORER_TX}/${notification.digest}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-700 underline ml-8 flex items-center gap-1">
                    View Transaction on Explorer <ExternalLink size={10}/>
                </a>
            )}
        </div>
      )}
      
      <style>{`@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }`}</style>
    </div>
  )
}

const ImpactCard = ({ icon, title, desc, color, bg }: any) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow flex gap-4 items-start"><div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>{icon}</div><div><h4 className={`font-bold text-sm mb-1 ${color}`}>{title}</h4><p className="text-xs text-slate-500 leading-relaxed">{desc}</p></div></div>
)