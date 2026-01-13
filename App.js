
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { html } from 'htm';
import { CSV_DATA, parseCSV } from './constants.js';
import { AppStatus } from './types.js';
import { 
  Camera, History, ShieldCheck, AlertCircle, 
  X, RefreshCw, Smartphone, CheckCircle2 
} from 'lucide-react';

const App = () => {
  const [products, setProducts] = useState(new Map());
  const [status, setStatus] = useState(AppStatus.IDLE);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  
  const scannerRef = useRef(null);

  useEffect(() => {
    const parsed = parseCSV(CSV_DATA);
    setProducts(parsed);
    
    const savedHistory = localStorage.getItem('tobacco_scan_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory.map((h) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        })));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveHistory = useCallback((newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('tobacco_scan_history', JSON.stringify(newHistory));
  }, []);

  const handleScan = useCallback((decodedText) => {
    const cleanCode = decodedText.replace(/\D/g, ''); 
    const product = products.get(cleanCode);
    const isApproved = !!product;
    
    const result = {
      code: cleanCode,
      timestamp: new Date(),
      isApproved,
      product
    };

    setLastResult(result);
    saveHistory([result, ...history.slice(0, 49)]);
    setStatus(AppStatus.RESULT);
    stopScanner();
  }, [products, history, saveHistory]);

  const startScanner = async () => {
    setStatus(AppStatus.SCANNING);
    setCameraError(null);
    
    setTimeout(() => {
      const html5QrCode = new window.Html5Qrcode("scanner-container");
      scannerRef.current = html5QrCode;
      
      const config = { fps: 20, qrbox: { width: 280, height: 180 } };
      
      html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => handleScan(decodedText),
        () => {}
      ).catch((err) => {
        console.error("Camera access failed", err);
        setCameraError("Camera access denied. Please ensure you are using HTTPS and have granted permissions.");
        setStatus(AppStatus.IDLE);
      });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
      }).catch((err) => console.error(err));
    }
  };

  const closeScanner = () => {
    stopScanner();
    setStatus(AppStatus.IDLE);
  };

  return html`
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white shadow-2xl overflow-hidden relative border-x border-slate-200 font-sans">
      <header className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden">
               <img 
                src="logo.png" 
                alt="4LEAF Clover" 
                className="w-full h-full object-contain p-1" 
                onError=${(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" class="w-7 h-7 text-[#006b3f]" stroke="currentColor" stroke-width="3">
                      <path d="M12 2v10m0 0l-4-4m4 4l4-4M12 12c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6z" />
                    </svg>
                  `;
                }}
              />
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase">4LEAF</h1>
              <p className="text-[#006b3f] text-[10px] font-black uppercase tracking-[0.3em]">Tobacco Scout</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <${ShieldCheck} className="w-4 h-4 text-[#006b3f]" />
            <span className="text-[10px] font-black text-[#006b3f] uppercase tracking-wider">Secure</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-32 bg-slate-50/50">
        ${status === AppStatus.IDLE && html`
          <div className="flex flex-col items-center justify-center h-full py-12 gap-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-10 rounded-full animate-pulse"></div>
              <div className="w-28 h-28 bg-white shadow-2xl border border-white rounded-[2rem] flex items-center justify-center relative">
                <${Smartphone} className="w-10 h-10 text-[#006b3f]" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#006b3f] text-white p-1.5 rounded-lg shadow-lg">
                <${CheckCircle2} className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Online</h2>
              <p className="text-slate-500 max-w-[240px] text-sm leading-relaxed font-medium mx-auto">
                Scanning engine active. Please align the product barcode with the viewfinder.
              </p>
            </div>
          </div>
        `}

        ${status === AppStatus.RESULT && lastResult && html`
          <div className=${`rounded-[2.5rem] border-2 p-8 shadow-2xl ${
            lastResult.isApproved ? 'bg-white border-emerald-500 shadow-emerald-100' : 'bg-white border-rose-500 shadow-rose-100'
          }`}>
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              ${lastResult.isApproved ? html`
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                  <${CheckCircle2} className="w-10 h-10 text-emerald-600" />
                </div>
              ` : html`
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                  <${AlertCircle} className="w-10 h-10 text-rose-600" />
                </div>
              `}
              
              <div>
                <h3 className=${`text-3xl font-black uppercase tracking-tighter leading-none ${
                  lastResult.isApproved ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  ${lastResult.isApproved ? 'Approved' : 'Restricted'}
                </h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Registry Result</p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em]">Barcode / UPC</span>
                <span className="font-mono font-black text-slate-800 text-lg tracking-tight">${lastResult.code}</span>
              </div>
              
              ${lastResult.product ? html`
                <div className="h-px bg-slate-200/60"></div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</p>
                    <h4 className="font-black text-slate-900 text-lg leading-tight mt-1">${lastResult.product.tradeName}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Manufacturer</p>
                      <p className="text-[11px] text-slate-700 font-black mt-1 uppercase truncate">${lastResult.product.manufacturer}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Package</p>
                      <p className="text-[11px] text-slate-700 font-black mt-1 uppercase">${lastResult.product.packagingStyle}</p>
                    </div>
                  </div>
                </div>
              ` : html`
                <div className="py-2">
                  <p className="text-xs text-rose-600 font-black uppercase tracking-widest text-center">
                    Product Not Found
                  </p>
                </div>
              `}
            </div>
            
            <button 
              onClick=${() => setStatus(AppStatus.IDLE)}
              className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.97]"
            >
              <${RefreshCw} className="w-3.5 h-3.5" />
              Reset Scanner
            </button>
          </div>
        `}

        ${history.length > 0 && html`
          <section className="space-y-4 mt-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <${History} className="w-4 h-4" />
                Scan History
              </h3>
              <button 
                onClick=${() => saveHistory([])}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-black uppercase tracking-[0.2em]"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              ${history.map((item, idx) => html`
                <div 
                  key=${idx} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-[#006b3f] transition-all cursor-pointer active:scale-[0.98]"
                  onClick=${() => { setLastResult(item); setStatus(AppStatus.RESULT); }}
                >
                  <div className="flex flex-col gap-0.5 max-w-[60%]">
                    <span className="text-xs font-black text-slate-900 truncate">
                      ${item.product ? item.product.tradeName : item.code}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      ${item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${item.product?.manufacturer?.split(' ')[0] || 'Unknown'}
                    </span>
                  </div>
                  <div className=${`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm ${
                    item.isApproved ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    ${item.isApproved ? 'Passed' : 'Failed'}
                  </div>
                </div>
              `)}
            </div>
          </section>
        `}

        ${cameraError && html`
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-4 text-rose-900">
            <${AlertCircle} className="w-5 h-5 shrink-0 text-rose-600" />
            <div className="text-sm">
              <p className="font-black uppercase text-[10px] tracking-[0.2em] mb-1 text-rose-800">Error</p>
              <p className="text-rose-700 font-medium leading-tight">${cameraError}</p>
            </div>
          </div>
        `}
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <button
          onClick=${status === AppStatus.SCANNING ? closeScanner : startScanner}
          className=${`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 pointer-events-auto ${
            status === AppStatus.SCANNING ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-[#006b3f] text-white shadow-emerald-200'
          }`}
        >
          ${status === AppStatus.SCANNING ? html`
            <${X} className="w-5 h-5" />
            Close Camera
          ` : html`
            <${Camera} className="w-5 h-5" />
            Launch Scanner
          `}
        </button>
      </div>

      ${status === AppStatus.SCANNING && html`
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex-1 relative overflow-hidden">
             <div id="scanner-container" className="w-full h-full"></div>
             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-[320px] h-[220px] relative rounded-3xl shadow-[0_0_0_2000px_rgba(0,0,0,0.7)]">
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-[#006b3f] rounded-tl-3xl -ml-1 -mt-1"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-[#006b3f] rounded-tr-3xl -mr-1 -mt-1"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-[#006b3f] rounded-bl-3xl -ml-1 -mb-1"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-[#006b3f] rounded-br-3xl -mr-1 -mb-1"></div>
                    <div className="absolute top-0 left-4 right-4 h-0.5 bg-emerald-400 shadow-[0_0_30px_#10b981] animate-[sweep_2.5s_ease-in-out_infinite] opacity-60"></div>
                </div>
                <div className="mt-12 flex flex-col items-center gap-3">
                   <div className="px-6 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                      <p className="text-white font-black text-[9px] uppercase tracking-[0.4em]">
                         Seeking Barcode...
                      </p>
                   </div>
                </div>
             </div>
             <div className="absolute top-10 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 bg-black/60 px-5 py-2 rounded-2xl backdrop-blur-lg border border-white/10">
                   <img src="logo.png" className="w-5 h-5 opacity-90" alt="" />
                   <span className="text-white font-black uppercase text-[9px] tracking-[0.3em]">4LEAF INC. Auditing</span>
                </div>
             </div>
          </div>
          <div className="p-10 bg-black flex items-center justify-center">
            <button 
              onClick=${closeScanner}
              className="px-12 py-4 bg-white/5 text-white rounded-xl flex items-center justify-center font-black uppercase tracking-[0.2em] text-[10px] transition-all border border-white/10 active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      `}

      <style>${`
        @keyframes sweep {
          0%, 100% { top: 10%; opacity: 0.1; }
          50% { top: 90%; opacity: 1; }
        }
      `}</style>
    </div>
  `;
};

export default App;
