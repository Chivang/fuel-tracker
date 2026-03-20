'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { decodeFormState, formatDistance, formatDistanceToNow } from 'date-fns';
import {lo} from 'date-fns/locale';

// 1. ໂຫຼດ Components ແບບ SSR: False
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('lo-LA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
export default function Home() {
  // --- [Hook Section] ປະກາດ Hook ທັງໝົດໄວ້ເທິງສຸດ ຫ້າມມີ IF ຂັ້ນກາງ ---
  const [stations, setStations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [icons, setIcons] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const mapRef = useRef<any>(null) // 🚩 ໃຊ້ໂຕນີ້ເພື່ອຄວບຄຸມແຜນທີ່ ໂດຍບໍ່ຕ້ອງໃຊ້ MapController

  // ຟັງຊັນດຶງຂໍ້ມູນ
  const fetchStations = async () => {
    setLoading(true)
    const { data } = await supabase.from('stations').select('*').order('name', { ascending: true })
    if (data) setStations(data)
    setLoading(false)
  }

  // ຟັງຊັນອັບເດດສະຖານະ
  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from('stations').update({ status: newStatus }).eq('id', id)
    if (!error) fetchStations()
  }

  // ຟັງຊັນຫາຕຳແໜ່ງ GPS
  const findMyLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setUserPos([latitude, longitude])
          setSelectedPos([latitude, longitude])
          setLoading(false)
        },
        () => { setLoading(false); alert("ກະລຸນາ 'Allow' ການເຂົ້າເຖິງຕຳແໜ່ງ!") },
        { enableHighAccuracy: true }
      )
    }
  }

  // Effect 1: ໂຫຼດຂໍ້ມູນ ແລະ Icons (ລັນຄັ້ງທຳອິດເທົ່ານັ້ນ)
  useEffect(() => {
    setIsMounted(true)
    fetchStations()
    
    import('leaflet').then((L) => {
      const common = { iconSize: [25, 41] as [number, number], 
        iconAnchor: [12, 41] as [number, number], 
        popupAnchor: [1, -34] as [number, number], 
        shadowSize: [41, 41] as [number, number]
      }
      setIcons({
        green: new L.Icon({ ...common, iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' }),
        red: new L.Icon({ ...common, iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' }),
        user: new L.Icon({ ...common, iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png' })
      })
    })
  }, [])

  // Effect 2: ຄອຍເບິ່ງການຍັບແຜນທີ່ (Fly To)
  useEffect(() => {
    if (selectedPos && mapRef.current) {
      mapRef.current.flyTo(selectedPos, 16, { duration: 1.5 })
    }
  }, [selectedPos])

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // --- [Render Section] ຫ້າມ Return Early ---
return (
  <main className="h-screen w-full flex flex-col font-phetsarath overflow-hidden relative">
    <header className="py-2 px-4 bg-blue-700 shadow-lg z-[9999] flex flex-col md:flex-row gap-3 md:items-center justify-between text-white">
      <h1 className="text-lg font-bold">⛽ ລາຍງານສະຖານະປໍ້ານ້ຳມັນ</h1>
      
      {/* ... ສ່ວນ Search Bar ຄືເກົ່າ ... */}
      <div className="flex flex-1 max-w-md mx-0 md:mx-4 relative z-[10000]">
        <input 
          type="text"
          placeholder="ຄົ້ນຫາຊື່ປໍ້າ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/20 border border-white/40 px-4 py-1.5 rounded-lg text-white placeholder:text-white/70 focus:outline-none focus:bg-white/30 transition-all text-sm"
        />
        {searchTerm && (
          <div className="absolute top-full left-0 w-full bg-white shadow-2xl rounded-b-lg text-slate-800 max-h-60 overflow-y-auto mt-1 z-[10001] border border-slate-200">
            {filteredStations.map(s => (
              <div key={s.id} onClick={() => { setSelectedPos([s.latitude, s.longitude]); setSearchTerm(''); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm">
                <span className="font-bold">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button onClick={fetchStations} className="bg-white text-blue-700 px-4 py-1.5 rounded-lg text-sm font-bold shadow-md">
        {loading ? '...' : '🔄 ອັບເດດ'}
      </button>
    </header>

    <div className="flex-1 relative z-0 bg-slate-100">
      {/* 🚩 ກວດສອບ icons ແລະ isMounted ພ້ອມກັນ */}
      {isMounted && icons ? (
        <MapContainer 
          key="main-map" // 🚩 ໃສ່ Key ໄວ້ບ່ອນນີ້
          center={[17.9757, 102.6331]} 
          zoom={13} 
          className="h-full w-full" 
          ref={mapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {stations.map((station) => (
            <Marker key={station.id} position={[station.latitude, station.longitude]} icon={station.status === 'available' ? icons.green : icons.red}>
              <Popup>
                <div className="p-1 min-w-[180px] text-slate-800">
                  <h3 className="font-bold text-blue-700 text-lg">{station.name}</h3>
                  <p className="text-sm opacity-70 mb-2">{station.brand}</p>
                  <p className="text-xs text-gray-500 mb-2 italic">ອັບເດດລ່າສຸດ: {formatDistanceToNow(new Date(station.updated_at), { addSuffix: true, locale: lo })}</p>
                  <div className="bg-slate-50 p-2 rounded-md border border-slate-200 text-center uppercase text-[10px] font-bold tracking-wider mb-2">Update status</div>
                  <div className="flex gap-2">
                      <button onClick={() => updateStatus(station.id, 'available')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${station.status === 'available' ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-green-600 text-green-600'}`}>
                        ມີນ້ຳມັນ
                      </button>
                      <button onClick={() => updateStatus(station.id, 'out')} className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${station.status === 'out' ? 'bg-red-600 text-white shadow-md' : 'bg-white border border-red-600 text-red-600'}`}>
                        ໝົດ
                      </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {userPos && (
            <Marker position={userPos} icon={icons.user}>
              <Popup><p className="font-bold p-1 text-slate-800">ເຈົ້າຢູ່ນີ້! 📍</p></Popup>
            </Marker>
          )}
        </MapContainer>
      ) : (
        <div className="h-full flex items-center justify-center font-bold text-blue-700 animate-pulse">
          ກຳລັງໂຫລດແຜນທີ່...
        </div>
      )}

      <button onClick={findMyLocation} className="absolute bottom-10 right-5 z-[1000] bg-white p-3 rounded-full shadow-2xl border-2 border-blue-600 active:scale-90 transition-all hover:bg-blue-50">
        <span className="text-2xl">📍</span>
      </button>
    </div>
  </main>
)
}