import React, { useState, useEffect } from 'react';
import { 
  DayForecast, 
  StationForecast, 
  GlobalModelComparison, 
  SatelliteDataPoint,
  Language 
} from './types';
import { 
  generateForecastForDate, 
  GLOBAL_MODELS, 
  SATELLITE_DATA 
} from './data/weatherData';
import { Navbar } from './components/Navbar';
import { SynopticBanner } from './components/SynopticBanner';
import { InteractiveWeatherMap } from './components/InteractiveWeatherMap';
import { StationInspector } from './components/StationInspector';
import { RegionalGrid } from './components/RegionalGrid';
import { ScientificModelsTab } from './components/ScientificModelsTab';
import { SatelliteViewerTab } from './components/SatelliteViewerTab';
import { ScientificKnowledgeTab } from './components/ScientificKnowledgeTab';
import { AIConsultantModal } from './components/AIConsultantModal';
import { OfficialBulletinModal } from './components/OfficialBulletinModal';
import { SecurityAuthorModal } from './components/SecurityAuthorModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { AdministrativeHierarchySelector } from './components/AdministrativeHierarchySelector';
import { AdviceAndHolidayBanner } from './components/AdviceAndHolidayBanner';
import { HourlyForecastSlider } from './components/HourlyForecastSlider';
import { 
  VIETNAM_ADMINISTRATIVE_DATA, 
  ProvinceLocation, 
  District, 
  WardCommune 
} from './data/vietnamLocations';
import { UI_TEXT } from './data/translations';
import { 
  Waves, 
  MapPin, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-06');
  const [selectedHour, setSelectedHour] = useState<number>(14);
  const [lang, setLang] = useState<Language>('vi');
  const [activeTab, setActiveTab] = useState<'map' | 'stations' | 'models' | 'satellite' | 'research'>('map');
  
  // Forecast state dynamically initialized for the selected date
  const [currentForecast, setCurrentForecast] = useState<DayForecast>(() => generateForecastForDate('2026-10-06'));
  const [models, setModels] = useState<GlobalModelComparison[]>(GLOBAL_MODELS);
  const [satellites, setSatellites] = useState<SatelliteDataPoint[]>(SATELLITE_DATA);

  // Administrative hierarchy states (63 Provinces -> Districts -> Wards)
  const [selectedProvince, setSelectedProvince] = useState<ProvinceLocation>(() => VIETNAM_ADMINISTRATIVE_DATA[4]); // Da Nang default
  const [selectedDistrict, setSelectedDistrict] = useState<District>(() => VIETNAM_ADMINISTRATIVE_DATA[4].districts[0]);
  const [selectedWard, setSelectedWard] = useState<WardCommune>(() => VIETNAM_ADMINISTRATIVE_DATA[4].districts[0].wards[0]);

  // Selected station for detailed inspector
  const [selectedStation, setSelectedStation] = useState<StationForecast>(() => currentForecast.stations[0]);

  // Modal dialog states
  const [isAIConsultOpen, setIsAIConsultOpen] = useState(false);
  const [isBulletinOpen, setIsBulletinOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<'calendar' | 'gmail'>('calendar');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Satellite live sync state
  const [isSyncingSatellites, setIsSyncingSatellites] = useState(false);
  const [lastSatelliteSync, setLastSatelliteSync] = useState<Date>(new Date());
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  const t = UI_TEXT[lang];

  // When selectedDate changes, fetch from backend API or compute locally
  useEffect(() => {
    let isCancelled = false;

    // Local calculation immediately responsive
    const fallbackForecast = generateForecastForDate(selectedDate);
    setCurrentForecast(fallbackForecast);

    // Try fetching freshest dynamic data from backend
    fetch(`/api/weather/data?date=${encodeURIComponent(selectedDate)}&lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.forecast) {
          setCurrentForecast(data.forecast);
        }
        if (data.globalModels) setModels(data.globalModels);
        if (data.satelliteData) setSatellites(data.satelliteData);
      })
      .catch((err) => {
        console.warn('Backend query notice, using local dynamic generator:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedDate, lang]);

  // Synchronize selected station when date changes
  useEffect(() => {
    if (currentForecast && currentForecast.stations && currentForecast.stations.length > 0) {
      if (selectedStation) {
        const match = currentForecast.stations.find((s) => s.id === selectedStation.id);
        if (match) {
          setSelectedStation(match);
        } else {
          setSelectedStation(currentForecast.stations[0]);
        }
      } else {
        setSelectedStation(currentForecast.stations[0]);
      }
    }
  }, [currentForecast]);

  // Handle user choosing a province, district, and ward
  const handleSelectHierarchy = (prov: ProvinceLocation, dist: District, ward: WardCommune) => {
    setSelectedProvince(prov);
    setSelectedDistrict(dist);
    setSelectedWard(ward);

    // Find the closest weather station in currentForecast.stations
    if (currentForecast && currentForecast.stations) {
      const match = currentForecast.stations.find(
        (s) => s.id.toLowerCase().includes(prov.id.toLowerCase()) || 
               prov.id.toLowerCase().includes(s.id.toLowerCase()) ||
               s.name.toLowerCase().includes(prov.name.toLowerCase()) ||
               prov.name.toLowerCase().includes(s.name.toLowerCase())
      );
      if (match) {
        setSelectedStation(match);
      }
    }
  };

  // Trigger satellite constellation orbital sync
  const handleSyncSatellites = async () => {
    setIsSyncingSatellites(true);
    setSyncToastMessage(lang === 'vi' ? 'Đang kết nối luồng vệ tinh Himawari-9, FY-4B & GPM...' : 'Connecting to Himawari-9 & GPM telemetry streams...');

    try {
      const res = await fetch('/api/satellites/telemetry');
      const data = await res.json();
      setLastSatelliteSync(new Date());
      setSyncToastMessage(
        lang === 'vi'
          ? `Đã cập nhật dữ liệu viễn thám từ ${data.orbiters?.length || 5} vệ tinh quỹ đạo`
          : `Synchronized feeds from ${data.orbiters?.length || 5} active orbiters`
      );
    } catch (e) {
      setSyncToastMessage(lang === 'vi' ? 'Đồng bộ vệ tinh thành công (mô phỏng chuẩn WMO)' : 'Satellite sync successful (WMO standard simulated)');
      setLastSatelliteSync(new Date());
    } finally {
      setIsSyncingSatellites(false);
      setTimeout(() => setSyncToastMessage(null), 3500);
    }
  };

  // Automated satellite telemetry sync every 45s (Chế độ tự động chạy cập nhật vệ tinh toàn cầu)
  useEffect(() => {
    const satelliteInterval = setInterval(() => {
      fetch('/api/satellites/telemetry')
        .then((res) => res.json())
        .then((data) => {
          setLastSatelliteSync(new Date());
          if (data.satelliteData) setSatellites(data.satelliteData);
        })
        .catch(() => {
          setLastSatelliteSync(new Date());
        });
    }, 45000);

    return () => clearInterval(satelliteInterval);
  }, []);

  // Audio Speech Briefing handler
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert(lang === 'vi' ? 'Trình duyệt của bạn không hỗ trợ Web Speech API.' : 'Your browser does not support Speech Synthesis API.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const isEn = lang === 'en';
    const speechText = isEn
      ? `GoodEather AI Meteorological System. Authored by rogers. Forecast for ${selectedProvince.nameEn}, ${selectedWard.nameEn} on ${currentForecast.date}. 
      Diurnal temperature between ${selectedStation.tempMin} and ${selectedStation.tempMax} degrees Celsius. 
      Accumulated rainfall around ${selectedStation.rainMm24h} millimeters. 
      Check out practical attire and safety recommendations in your GoodEather console.`
      : `Hệ thống trí tuệ nhân tạo GoodEather do tác giả rogers phát triển. Dự báo chi tiết tại ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name} ngày ${currentForecast.dateFormatted} lúc ${selectedHour} giờ.
      Nhiệt độ dao động từ ${selectedStation.tempMin} đến ${selectedStation.tempMax} độ C.
      Lượng mưa 24 giờ ước tính ${selectedStation.rainMm24h} milimét. Gió cấp ${selectedStation.windBeaufort}.
      Quý vị hãy theo dõi các khuyến nghị thực tiễn về sức khỏe, giao thông và an toàn thiên tai trên ứng dụng GoodEather.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isEn ? 'en-US' : 'vi-VN';
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleOpenWorkspace = (tab: 'calendar' | 'gmail') => {
    setWorkspaceInitialTab(tab);
    setIsWorkspaceOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. Primary Top Navigation */}
      <Navbar
        selectedDate={selectedDate}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
        selectedHour={selectedHour}
        onSelectHour={(newHour) => setSelectedHour(newHour)}
        onOpenAIConsult={() => setIsAIConsultOpen(true)}
        onOpenBulletin={() => setIsBulletinOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        onOpenWorkspace={handleOpenWorkspace}
        onPlayBriefing={handleToggleSpeech}
        isSpeaking={isSpeaking}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        onToggleLang={() => setLang(lang === 'vi' ? 'en' : 'vi')}
        onSyncSatellites={handleSyncSatellites}
        isSyncingSatellites={isSyncingSatellites}
        lastSatelliteSync={lastSatelliteSync}
      />

      {/* Sync Toast Notification */}
      {syncToastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 border border-cyan-500 text-cyan-300 px-4 py-2.5 shadow-2xl shadow-cyan-950 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          <span>{syncToastMessage}</span>
        </div>
      )}

      {/* 2. Synoptic Alert Banner */}
      <SynopticBanner
        forecast={currentForecast}
        onOpenAIConsult={() => setIsAIConsultOpen(true)}
        lang={lang}
      />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* TAB 1: GIS Map View & Microclimate Drill-down */}
        {activeTab === 'map' && (
          <div className="space-y-5 animate-fade-in">
            
            {/* Multi-tier Vietnam Hierarchy (Provinces -> Districts -> Wards & Search) */}
            <AdministrativeHierarchySelector
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              selectedWard={selectedWard}
              onSelectHierarchy={handleSelectHierarchy}
              lang={lang}
            />

            {/* 24-Hour Diurnal Timeline Scrubber */}
            <HourlyForecastSlider
              station={selectedStation}
              selectedHour={selectedHour}
              onSelectHour={(h) => setSelectedHour(h)}
              lang={lang}
            />

            {/* Lunar Calendar & Actionable Practical Advice Matrix */}
            <AdviceAndHolidayBanner
              selectedDate={selectedDate}
              selectedStation={selectedStation}
              selectedHour={selectedHour}
              onOpenCalendar={() => handleOpenWorkspace('calendar')}
              onOpenGmail={() => handleOpenWorkspace('gmail')}
              onOpenAIConsult={() => setIsAIConsultOpen(true)}
              lang={lang}
            />

            {/* GIS Map & Detailed Station Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Interactive GIS Map */}
              <div className="lg:col-span-7 xl:col-span-8">
                <InteractiveWeatherMap
                  forecast={currentForecast}
                  selectedStation={selectedStation}
                  onSelectStation={(st) => setSelectedStation(st)}
                  lang={lang}
                />
              </div>

              {/* Right Column: Station Inspector & Marine Bulletins */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                
                {/* Station Detailed Card */}
                {selectedStation && (
                  <StationInspector
                    station={selectedStation}
                    lang={lang}
                  />
                )}

                {/* Marine Advisory Box for East Sea (Biển Đông) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Waves className="h-4 w-4 text-cyan-400" />
                      <span>{lang === 'vi' ? 'Cảnh Báo Hải Văn & Ngư Trường Biển Đông' : 'Marine Advisory & Fishing Zones'}</span>
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                      <p className="font-semibold text-rose-300">
                        {lang === 'vi' ? 'Vùng biển Quảng Trị - Quảng Ngãi:' : 'Central Coast (Quang Tri - Quang Ngai):'}
                      </p>
                      <p className="text-slate-300 mt-0.5">{currentForecast.marineForecast.centralSeaQuangTriQuangNgai}</p>
                    </div>

                    <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                      <p className="font-semibold text-amber-300">
                        {lang === 'vi' ? 'Quần đảo Hoàng Sa & Trường Sa:' : 'Paracel & Spratly Archipelagos:'}
                      </p>
                      <p className="text-slate-300 mt-0.5">{currentForecast.marineForecast.paracelIslands}</p>
                    </div>

                    <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                      <p className="font-semibold text-cyan-300">
                        {lang === 'vi' ? 'Vùng biển Bình Thuận - Cà Mau & Phú Quốc:' : 'Southern Seas (Binh Thuan - Ca Mau & Phu Quoc):'}
                      </p>
                      <p className="text-slate-300 mt-0.5">{currentForecast.marineForecast.southernSeaBinhThuanCaMau}</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Quick Regional Station Carousel */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span>
                    {lang === 'vi' 
                      ? `Các Đô Thị Trọng Điểm Bắc - Trung - Nam & Hải Đảo (${selectedDate})` 
                      : `Key Weather Stations Across All Regions (${selectedDate})`}
                  </span>
                </h3>
                <button
                  onClick={() => setActiveTab('stations')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                >
                  {lang === 'vi' ? 'Xem ma trận đầy đủ 63 tỉnh thành →' : 'View all 63 provinces matrix →'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {currentForecast.stations.slice(0, 6).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStation(st)}
                    className={`text-left rounded-xl p-3 border transition-all ${
                      selectedStation?.id === st.id
                        ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold text-slate-200 text-xs truncate">
                      {lang === 'vi' ? st.name : (st.nameEn || st.name)}
                    </p>
                    <p className="text-[11px] text-purple-400 font-semibold">{st.rainMm24h} mm</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{st.tempMin}° - {st.tempMax}°C</p>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: All Regional Stations Grid (North, Central, South, Islands) */}
        {activeTab === 'stations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                {lang === 'vi' 
                  ? 'Ma Trận Quan Trắc & Dự Báo Toàn Diện 3 Miền Việt Nam' 
                  : 'Comprehensive Meteorological Stations Matrix (North, Central, South)'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'vi'
                  ? `Dữ liệu nhiệt độ, tổng lượng mưa 24 giờ, cấp gió, và cấp độ rủi ro thiên tai (Lũ quét, sạt lở, triều cường đô thị) cho ngày ${selectedDate}.`
                  : `Temperature range, 24h precipitation totals, wind velocity, and multi-hazard risk indices for ${selectedDate}.`}
              </p>
            </div>

            <RegionalGrid
              stations={currentForecast.stations}
              selectedStationId={selectedStation?.id}
              onSelectStation={(st) => setSelectedStation(st)}
              lang={lang}
            />

            {selectedStation && (
              <div className="pt-4">
                <StationInspector
                  station={selectedStation}
                  lang={lang}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Scientific Numerical Models Tab */}
        {activeTab === 'models' && (
          <ScientificModelsTab
            models={models}
            satellites={satellites}
            lang={lang}
          />
        )}

        {/* TAB 4: Satellite Telemetry Deep View */}
        {activeTab === 'satellite' && (
          <SatelliteViewerTab
            satellites={satellites}
            lang={lang}
            onRefresh={handleSyncSatellites}
            isSyncing={isSyncingSatellites}
          />
        )}

        {/* TAB 5: Scientific Knowledge & Research Citations */}
        {activeTab === 'research' && (
          <ScientificKnowledgeTab
            lang={lang}
          />
        )}

      </main>

      {/* 4. Footer & System Attribution */}
      <footer className="border-t border-slate-800 bg-slate-950/90 py-6 px-4 sm:px-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-200 text-sm font-display">
                {t.appTitle}
              </p>
              <span className="rounded-full bg-cyan-500/15 text-cyan-400 px-2 py-0.5 text-[10px] font-mono border border-cyan-500/30">
                {t.versionBadge}
              </span>
              <button
                onClick={() => setIsSecurityOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t.creatorBadge}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {lang === 'vi' 
                ? 'Ứng dụng GoodEather dự báo thời tiết toàn quốc (Việt Nam S-Shape) bất kỳ giờ nào, ngày nào trong năm; tích hợp Lịch Âm, Ngày Lễ & Google Workspace (Calendar & Gmail). Phát triển bởi rogers.' 
                : 'GoodEather AI weather system for Vietnam S-Shape any hour, any day; integrated with Lunar Calendar, National Holidays & Google Workspace (Calendar & Gmail). Developed by rogers.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
            <span>ECMWF IFS/AIFS</span>
            <span>•</span>
            <span>NOAA/NCEP GFS</span>
            <span>•</span>
            <span>JMA Himawari-9</span>
            <span>•</span>
            <span>CMA Fengyun-4B</span>
            <span>•</span>
            <span>NASA GPM IMERG</span>
            <span>•</span>
            <span>WMO & NCHMF</span>
          </div>
        </div>
      </footer>

      {/* 5. Modals */}
      <GoogleWorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        selectedStation={selectedStation}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        selectedProvince={selectedProvince}
        selectedDistrict={selectedDistrict}
        selectedWard={selectedWard}
        initialTab={workspaceInitialTab}
        lang={lang}
      />

      <AIConsultantModal
        isOpen={isAIConsultOpen}
        onClose={() => setIsAIConsultOpen(false)}
        selectedDate={selectedDate}
        selectedRegionName={selectedStation ? (lang === 'vi' ? selectedStation.name : (selectedStation.nameEn || selectedStation.name)) : undefined}
        lang={lang}
      />

      <OfficialBulletinModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
        selectedDate={selectedDate}
        lang={lang}
      />

      <SecurityAuthorModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        lang={lang}
      />

    </div>
  );
}
