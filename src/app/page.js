"use client";
import { useEffect, useState } from "react";

export default function DashboardAdmin() {
  // State Navigasi Tab
  const [activeTab, setActiveTab] = useState("sparepart");

  // State Data dari API
  const [spareparts, setSpareparts] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Pencarian & Form Tambah Sparepart
  const [searchSparepart, setSearchSparepart] = useState("");
  const [form, setForm] = useState({ nama_barang: "", kategori: "", stok: "", harga: "" });

  // ==========================================
  // STATE BARU KHUSUS FITUR KASIR (POP-UP)
  // ==========================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServisId, setSelectedServisId] = useState(null);
  const [biayaJasa, setBiayaJasa] = useState("");
  const [sparepartTerpakai, setSparepartTerpakai] = useState("");
  const [totalBiaya, setTotalBiaya] = useState("");

  // Fungsi Tarik Data dari Python
  const fetchData = () => {
    fetch("https://api-sensi-project.vercel.app/api/sparepart")
      .then((res) => res.json())
      .then((data) => { if (data.status === "success") setSpareparts(data.data); })
      .catch((err) => console.error("Gagal load sparepart", err));

    fetch("https://api-sensi-project.vercel.app/api/riwayat")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setRiwayat(data.data);
        setLoading(false);
      })
      .catch((err) => console.error("Gagal load riwayat", err));
  };

  useEffect(() => { fetchData(); }, []);

  // FUNGSI-FUNGSI SPAREPART (Sama persis kayak sebelumnya)
  const handleAdd = async (e) => {
    e.preventDefault();
    await fetch("https://api-sensi-project.vercel.app/api/sparepart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ nama_barang: "", kategori: "", stok: "", harga: "" });
    fetchData(); 
  };

  const handleDelete = async (id) => {
    if(confirm("Yakin mau hapus barang ini?")) {
      await fetch(`https://api-sensi-project.vercel.app/api/sparepart/${id}`, { method: "DELETE" });
      fetchData(); 
    }
  };

  const handleEditNama = async (id, namaLama) => {
    const namaBaru = prompt("Masukkan nama sparepart yang baru:", namaLama);
    if (namaBaru && namaBaru.trim() !== "" && namaBaru !== namaLama) {
      await fetch(`https://api-sensi-project.vercel.app/api/sparepart/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_barang: namaBaru })
      });
      fetchData();
    }
  };

  const handleUpdateStok = async (id, stokSekarang, perubahan) => {
    const stokBaru = stokSekarang + perubahan;
    if (stokBaru < 0) return;
    await fetch(`https://api-sensi-project.vercel.app/api/sparepart/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stok: stokBaru })
    });
    fetchData();
  };

  const filteredSpareparts = spareparts.filter(item => 
    item.nama_barang.toLowerCase().includes(searchSparepart.toLowerCase()) || 
    item.kategori.toLowerCase().includes(searchSparepart.toLowerCase())
  );

  // ==========================================
  // FUNGSI-FUNGSI RIWAYAT & KASIR
  // ==========================================
  const handleUpdateStatus = async (id, statusBaru) => {
    // JIKA ADMIN KLIK "SELESAI", MUNCULIN POP-UP KASIRNYA DULU!
    if (statusBaru === "selesai") {
      setSelectedServisId(id);
      setIsModalOpen(true);
      return; 
    }

    // Kalau tombol 'Proses' atau 'Diambil', langsung eksekusi tanpa pop-up
    try {
      const response = await fetch(`https://api-sensi-project.vercel.app/api/riwayat/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBaru }),
      });

      if (response.ok) {
        fetchData();
      } else {
        alert("Gagal mengubah status kendaraan!");
      }
    } catch (error) {
      alert("Gagal konek ke server Python!");
    }
  };

  // FUNGSI BUAT NYIMPEN DATA KASIR PAS KLIK SIMPAN DI POP-UP
  const submitKasirSelesai = async () => {
    try {
      const response = await fetch(`https://api-sensi-project.vercel.app/api/riwayat/${selectedServisId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "selesai",
          biaya_jasa: Number(biayaJasa),
          sparepart_terpakai: sparepartTerpakai,
          total_biaya: Number(totalBiaya)
        }),
      });

      if (response.ok) {
        // Bersihin form pop-up dan tutup
        setIsModalOpen(false);
        setBiayaJasa("");
        setSparepartTerpakai("");
        setTotalBiaya("");
        fetchData(); // Refresh tabel
      } else {
        alert("Gagal menyimpan data transaksi!");
      }
    } catch (error) {
      alert("Gagal konek ke server Python!");
    }
  };

  const handleDeleteRiwayat = async (id) => {
    if(confirm("Yakin mau hapus riwayat ini?")) {
      try {
        const response = await fetch(`https://api-sensi-project.vercel.app/api/riwayat/${id}`, { method: "DELETE" });
        if (response.ok) fetchData();
        else alert("Gagal menghapus data!");
      } catch (error) {
        alert("Gagal konek ke server Python!");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER DASBOR */}
        <div className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/Logo.png" alt="Sensi Project Logo" className="h-16 w-auto drop-shadow-md" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sensi Project Dashboard</h1>
              <p className="text-gray-500 mt-1">Panel Admin & Mekanik</p>
            </div>
          </div>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div> API Online
          </div>
        </div>

        {/* TAB MENU NAVIGASI */}
        <div className="flex gap-4 bg-white p-2 rounded-lg shadow">
          <button onClick={() => setActiveTab("sparepart")} className={`flex-1 py-3 px-4 text-center font-bold rounded-md ${activeTab === "sparepart" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>📦 Kelola Sparepart</button>
          <button onClick={() => setActiveTab("jadwal")} className={`flex-1 py-3 px-4 text-center font-bold rounded-md ${activeTab === "jadwal" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>📅 Jadwal Operasional</button>
          <button onClick={() => setActiveTab("riwayat")} className={`flex-1 py-3 px-4 text-center font-bold rounded-md ${activeTab === "riwayat" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>📋 Riwayat & Antrean</button>
        </div>

        {/* HALAMAN SPAREPART */}
        {activeTab === "sparepart" && (
          <div className="space-y-6 animate-fade-in">
            {/* Form Tambah Barang */}
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
              <h2 className="text-xl font-bold text-gray-700 mb-4">➕ Tambah Sparepart Baru</h2>
              <form onSubmit={handleAdd} className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm text-gray-600 font-bold">Nama Barang</label>
                  <input type="text" required value={form.nama_barang} onChange={(e) => setForm({...form, nama_barang: e.target.value})} className="w-full border p-2 rounded mt-1 text-black" />
                </div>
                <div className="w-full md:w-40">
                  <label className="block text-sm text-gray-600 font-bold">Kategori</label>
                  <input type="text" required value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})} className="w-full border p-2 rounded mt-1 text-black" />
                </div>
                <div className="w-1/2 md:w-24">
                  <label className="block text-sm text-gray-600 font-bold">Stok</label>
                  <input type="number" required value={form.stok} onChange={(e) => setForm({...form, stok: e.target.value})} className="w-full border p-2 rounded mt-1 text-black" />
                </div>
                <div className="w-1/2 md:w-32">
                  <label className="block text-sm text-gray-600 font-bold">Harga</label>
                  <input type="number" required value={form.harga} onChange={(e) => setForm({...form, harga: e.target.value})} className="w-full border p-2 rounded mt-1 text-black" />
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold h-10 shadow">Simpan</button>
              </form>
            </div>

            {/* Tabel Sparepart */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-700">Katalog & Inventaris</h2>
                <input type="text" placeholder="🔍 Cari barang..." value={searchSparepart} onChange={(e) => setSearchSparepart(e.target.value)} className="border p-2 rounded-lg w-72 text-black" />
              </div>
              <div className="p-6 h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                      <th className="py-3 px-4 border-b sticky top-0 bg-gray-100 z-10">Nama Barang</th>
                      <th className="py-3 px-4 border-b text-center sticky top-0 bg-gray-100 z-10">Stok</th>
                      <th className="py-3 px-4 border-b text-right sticky top-0 bg-gray-100 z-10">Harga</th>
                      <th className="py-3 px-4 border-b text-center sticky top-0 bg-gray-100 z-10">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    {filteredSpareparts.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-blue-50">
                        <td className="py-3 px-4">
                          <span className="font-bold block text-gray-800">{item.nama_barang}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{item.kategori}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleUpdateStok(item.id, item.stok, -1)} className="bg-gray-200 w-8 h-8 rounded-full font-bold">-</button>
                            <span className="font-bold w-8 text-lg">{item.stok}</span>
                            <button onClick={() => handleUpdateStok(item.id, item.stok, 1)} className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full font-bold">+</button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-700">Rp {item.harga.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-4 text-center space-x-2">
                          <button onClick={() => handleEditNama(item.id, item.nama_barang)} className="bg-yellow-400 px-3 py-1 rounded text-xs font-bold">Edit</button>
                          <button onClick={() => handleDelete(item.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* HALAMAN JADWAL OPERASIONAL */}
        {activeTab === "jadwal" && (
          <div className="bg-white rounded-lg shadow p-8 animate-fade-in border-t-4 border-yellow-500">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">📅 Pengaturan Jadwal</h2>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Jam Buka Otomatis:</label>
                  <input type="time" id="inputJamBuka" className="w-full border-2 p-3 rounded-lg text-black" defaultValue="09:00" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Jam Tutup Otomatis:</label>
                  <input type="time" id="inputJamTutup" className="w-full border-2 p-3 rounded-lg text-black" defaultValue="17:00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Pengumuman (Tampil di Aplikasi):</label>
                <textarea id="inputJadwal" className="w-full border-2 p-4 rounded-lg text-black h-32" defaultValue="Senin - Sabtu: 09.00 - 17.00 WIB"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Mode Operasional:</label>
                <select id="inputStatus" className="w-full border-2 p-3 rounded-lg text-black font-bold">
                  <option value="OTOMATIS">🤖 OTOMATIS (Sesuai jam)</option>
                  <option value="BUKA">🟢 MANUAL: BUKA</option>
                  <option value="TUTUP">🔴 MANUAL: TUTUP</option>
                </select>
              </div>
              <button 
                onClick={async () => {
                  await fetch("https://api-sensi-project.vercel.app/api/jadwal", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                      pengumuman: document.getElementById('inputJadwal').value, 
                      status_buka: document.getElementById('inputStatus').value, 
                      jam_buka: document.getElementById('inputJamBuka').value, 
                      jam_tutup: document.getElementById('inputJamTutup').value 
                    })
                  });
                  alert("✅ Jadwal Diperbarui!");
                }}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg">Simpan Jadwal
              </button>
            </div>
          </div>
        )}

        {/* HALAMAN RIWAYAT & ANTREAN */}
        {activeTab === "riwayat" && (
          <div className="bg-white rounded-lg shadow overflow-hidden animate-fade-in border-t-4 border-green-500">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-700">📋 Daftar Antrean & Riwayat Servis</h2>
            </div>
            <div className="p-6 overflow-x-auto min-h-[400px]">
               <table className="w-full text-left border-collapse min-w-max">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                      <th className="py-3 px-6 border-b">Tanggal</th>
                      <th className="py-3 px-6 border-b">Pelanggan & Plat</th>
                      <th className="py-3 px-6 border-b">Keluhan / Sparepart</th>
                      <th className="py-3 px-6 border-b text-center">Tagihan</th>
                      <th className="py-3 px-6 border-b text-center">Status</th>
                      <th className="py-3 px-6 border-b text-center">Aksi (Admin)</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 text-sm">
                    {riwayat.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-6 font-bold">{item.tanggal_servis}</td>
                        <td className="py-3 px-6">
                          <div className="font-semibold">{item.nama_pelanggan}</div>
                          <div className="bg-gray-200 font-mono text-center rounded px-2 py-1 mt-1 inline-block text-xs">{item.nomor_plat}</div>
                        </td>
                        <td className="py-3 px-6 max-w-xs">
                          <div className="font-semibold text-gray-800">{item.keluhan}</div>
                          {item.sparepart_terpakai && (
                            <div className="text-xs text-blue-600 mt-1">🔧 {item.sparepart_terpakai}</div>
                          )}
                        </td>
                        <td className="py-3 px-6 text-center font-bold text-red-600">
                          {item.total_biaya > 0 ? `Rp ${item.total_biaya.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                            item.status === 'diambil' ? 'bg-blue-100 text-blue-700' :
                            item.status === 'selesai' ? 'bg-green-100 text-green-700' :
                            item.status === 'proses' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center flex gap-2 justify-center">
                          {item.status !== 'proses' && item.status !== 'selesai' && item.status !== 'diambil' && <button onClick={() => handleUpdateStatus(item.id, 'proses')} className="bg-yellow-500 text-white px-3 py-1 rounded text-xs font-bold">Proses</button>}
                          
                          {/* TOMBOL SELESAI SEKARANG MANGGIL POP-UP KASIR */}
                          {item.status === 'proses' && <button onClick={() => handleUpdateStatus(item.id, 'selesai')} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">Selesai</button>}
                          
                          {item.status === 'selesai' && <button onClick={() => handleUpdateStatus(item.id, 'diambil')} className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold">Diambil</button>}
                          
                          <button onClick={() => handleDeleteRiwayat(item.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* POP-UP MODAL KASIR (MUNCUL PAS KLIK SELESAI) */}
        {/* ==================================================== */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md animate-fade-in border-t-8 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">🧾 Nota Pembayaran Servis</h2>
              <p className="text-sm text-gray-500 mb-6">Masukkan rincian biaya dan sparepart yang digunakan.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 font-bold mb-1">Biaya Jasa Mekanik (Rp)</label>
                  <input type="number" placeholder="Contoh: 50000" className="w-full border-2 border-gray-200 p-3 rounded-lg text-black focus:border-green-500 outline-none" value={biayaJasa} onChange={(e) => setBiayaJasa(e.target.value)} />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 font-bold mb-1">Sparepart yang Diganti / Dipakai</label>
                  <textarea placeholder="Contoh: 1x Oli Mesin, 1x Kampas Rem Depan" className="w-full border-2 border-gray-200 p-3 rounded-lg text-black h-24 resize-none focus:border-green-500 outline-none" value={sparepartTerpakai} onChange={(e) => setSparepartTerpakai(e.target.value)}></textarea>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 font-bold mb-1">Total Biaya Keseluruhan (Rp)</label>
                  <input type="number" placeholder="Contoh: 150000" className="w-full border-2 border-gray-200 p-3 rounded-lg text-black font-bold text-lg text-red-600 focus:border-green-500 outline-none" value={totalBiaya} onChange={(e) => setTotalBiaya(e.target.value)} />
                  <p className="text-xs text-gray-400 mt-1">*Total Biaya = Jasa Mekanik + Harga Sparepart</p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition">Batal</button>
                <button onClick={submitKasirSelesai} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md">✅ Simpan & Selesai</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}