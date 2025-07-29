import React, { useState, useEffect, useCallback } from 'react';
import { utils, writeFile } from 'xlsx';
import { ChevronsDown, HelpCircle, FileDown, Calculator, Settings, Droplets, Zap, Layers, AreaChart, Weight, Mountain, Cog, Hammer, Power, BarChart2, DollarSign, Briefcase, ExternalLink, Sparkles, BrainCircuit } from 'lucide-react';

// Helper component for styled input fields
const InputField = ({ label, unit, value, name, onChange, placeholder, tooltip, disabled = false }) => (
  <div className="relative mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor={name}>
      {label} <span className="text-cyan-400">({unit})</span>
    </label>
    <input
      type="text" 
      inputMode="decimal"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-700' : ''}`}
    />
    {tooltip && (
        <div className="absolute top-0 right-[-20px] text-gray-500 hover:text-cyan-400 cursor-pointer group">
            <HelpCircle size={16} />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700 shadow-lg">
                {tooltip}
            </div>
        </div>
    )}
  </div>
);

// Helper component for displaying results
const ResultCard = ({ title, value, unit, icon, note, searchQuery, isCurrency = false, streamNumber = null }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col justify-between h-full">
    <div>
        <div className="flex items-center space-x-4 space-x-reverse">
            {streamNumber && <div className="flex-shrink-0 bg-cyan-800 text-cyan-200 text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">{streamNumber}</div>}
            <div className="flex-1">
              <p className="text-sm text-gray-400">{title}</p>
              <p className="text-xl font-bold text-cyan-400">
                {isNaN(value) || !isFinite(value) ? '۰' : value.toLocaleString('fa-IR', { maximumFractionDigits: isCurrency ? 0 : 2 })}
              </p>
              <p className="text-xs text-gray-500">{unit}</p>
            </div>
            {searchQuery && (
                <a href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyan-400 transition" title="جستجوی آنلاین تجهیزات مشابه">
                    <ExternalLink size={20} />
                </a>
            )}
        </div>
    </div>
    {note && <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">{note}</p>}
  </div>
);

// Simple Pie Chart Component
const PieChart = ({ data, title }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="text-center text-gray-500">{title}<br/>داده‌ای برای نمایش وجود ندارد.</div>;

    let cumulativePercent = 0;
    const segments = data.map(item => {
        const percent = item.value / total;
        const startAngle = cumulativePercent * 360;
        cumulativePercent += percent;
        const endAngle = cumulativePercent * 360;
        const largeArcFlag = percent > 0.5 ? 1 : 0;
        const startX = 50 + 40 * Math.cos(Math.PI * startAngle / 180);
        const startY = 50 + 40 * Math.sin(Math.PI * startAngle / 180);
        const endX = 50 + 40 * Math.cos(Math.PI * endAngle / 180);
        const endY = 50 + 40 * Math.sin(Math.PI * endAngle / 180);
        return <path key={item.label} d={`M50,50 L${startX},${startY} A40,40 0 ${largeArcFlag},1 ${endX},${endY} Z`} fill={item.color} />;
    });

    return (
        <div className="flex flex-col items-center">
            <h4 className="text-md font-semibold text-white mb-2">{title}</h4>
            <svg viewBox="0 0 100 100" className="w-40 h-40">{segments}</svg>
            <div className="mt-4 text-xs w-full">
                {data.map(item => (
                    <div key={item.label} className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                            <span>{item.label}</span>
                        </div>
                        <span className="font-mono">{((item.value / total) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Main Application Component
export default function App() {
  const [inputs, setInputs] = useState({
    // Primary Inputs
    p: '50000', wd: '350', wh: '24', oreGrade: '1.2', totalRecovery: '85',
    // Process Inputs
    R: '90', C4_in: '2.5', acidConsumption: '15', delta_Cu: '15',
    C3_in: '2.4', Q3_in: '900', C9_in: '0.1', Q9_bleed_in: '5',
    // Heap Inputs
    oreDensity: '1.6', heapHeight: '8', leachCycle: '120',
    // Water Balance
    A: '5',
    // Organic Circuit
    ROA: '1.1', Q6_in: '940', C6_in: '0.4',
    // Acid Balance
    acidDensity: '1.84', A_con9_bleed: '20',
    // Equipment Inputs
    pumpHead: '30', pumpEfficiency: '75', motorEfficiency: '90', workIndex: '15', f80: '150000', p80: '12000', cellVoltage: '2.1', currentEfficiency: '92', plsResidenceTime: '4', raffinateResidenceTime: '6',
    // Economics Inputs (Localized for Iran)
    electricityPrice: '3500', acidPrice: '40000000', laborCount: '50', avgLaborCost: '800000000', maintenanceRate: '3',
    guarConsumption: '50', guarPrice: '500000', keroseneConsumption: '0.1', kerosenePrice: '30000', cobaltConsumption: '20', cobaltPrice: '15000000',
    // CAPEX Factors (Localized for Iran)
    pumpCostFactor: '50000000', crusherCostFactor: '150000000', rectifierCostFactor: '25000000', padCostFactor: '2500000', tankCostFactor: '12000000',
  });

  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [geminiSuggestions, setGeminiSuggestions] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
        setInputs(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateAll = useCallback(() => {
    const parsedInputs = Object.fromEntries(
        Object.entries(inputs).map(([key, value]) => [key, parseFloat(value) || 0])
    );

    const { 
        p, wd, wh, R, C4_in, acidConsumption, delta_Cu, C3_in, Q3_in, C9_in, Q9_bleed_in,
        oreGrade, totalRecovery, oreDensity, heapHeight, leachCycle,
        A, ROA, Q6_in, C6_in, acidDensity, A_con9_bleed,
        pumpHead, pumpEfficiency, motorEfficiency, workIndex, f80, p80, cellVoltage, currentEfficiency, plsResidenceTime, raffinateResidenceTime,
        electricityPrice, acidPrice, laborCount, avgLaborCost, maintenanceRate,
        guarConsumption, guarPrice, keroseneConsumption, kerosenePrice, cobaltConsumption, cobaltPrice,
        pumpCostFactor, crusherCostFactor, rectifierCostFactor, padCostFactor, tankCostFactor
    } = parsedInputs;

    // --- REVISED CALCULATION ENGINE (20 Streams) ---
    // 1. Base Production & Feed Rate
    const P_hr_ton = (wd > 0 && wh > 0) ? p / (wd * wh) : 0; // Stream 10
    const P_hr_kg = P_hr_ton * 1000;
    const hourlyOreFeedRate = (oreGrade > 0 && totalRecovery > 0 && wh > 0) ? (p / wd) / (oreGrade / 100 * totalRecovery / 100) / wh : 0; // Stream 1
    
    // 2. PLS Flow Rate (Q4)
    const Q4 = (C4_in > 0 && R > 0) ? P_hr_kg / (C4_in * (R / 100)) : 0; // Stream 4 (Q)
    const C4 = (Q4 > 0) ? (Q3_in*C3_in + Q9_bleed_in*C9_in) / Q4 : C4_in; // Stream 4 (C)

    // 3. Heap Design
    const requiredHeapArea = (heapHeight > 0 && oreDensity > 0) ? (hourlyOreFeedRate * wh * leachCycle) / (heapHeight * oreDensity) : 0;

    // 4. Process Streams Calculations
    const Q11 = Q4; // Stream 11 (Q)
    const C11 = (1 - R / 100) * C4; // Stream 11 (C)
    const Q2 = (A / 100) * Q11; // Stream 2 (Q)
    const C2 = 0; // Stream 2 (C)
    const Q19 = Q2; // Stream 19 (Q)
    const C19 = 0; // Stream 19 (C)
    const Q12 = Q11 + Q19; // Stream 12 (Q)
    const C12 = Q12 > 0 ? (Q11 * C11) / Q12 : 0; // Stream 12 (C)
    const Q5 = Q4 * ROA; // Stream 5 (Q)
    const C5 = Q5 > 0 ? ((R / 100) * C4 * Q4 + C6_in * Q6_in) / Q5 : 0; // Stream 5 (C)
    const Q8 = delta_Cu > 0 ? (P_hr_ton * 1000) / delta_Cu : 0; // Stream 8 (Q)
    const Q7 = Q8 + Q5 - Q6_in; // Stream 7 (Q)
    const C8 = C4 - delta_Cu; // Stream 8 (C) - Assumption: Rich elec conc = PLS conc
    const C7 = Q7 > 0 ? (Q5*C5 - Q6_in*C6_in + Q8*C8) / Q7 : 0; // Stream 7 (C)
    const Q13 = (acidDensity > 0) ? (acidConsumption * hourlyOreFeedRate) / (acidDensity * 1000) : 0; // Stream 13 (Q)
    const Q14 = (acidDensity > 0) ? (Q9_bleed_in * A_con9_bleed) / (1000 * acidDensity) : 0; // Stream 14 (Q)
    const Q15 = 0; // Stream 15 (Steam/Water for EW models)
    const Q17 = 0; // Stream 17 (Cathode sludge)
    const Q18 = 0; // Stream 18 (Bleed water)
    const Q20 = 0; // Stream 20 (Acid to raffinate)

    // 5. Equipment Sizing
    const g = 9.81, rho = 1000, eff_factor = (pumpEfficiency / 100) * (motorEfficiency / 100);
    const plsPumpPower = eff_factor > 0 ? (Q4 / 3600 * pumpHead * g * rho) / (eff_factor * 1000) : 0;
    const raffinatePumpPower = eff_factor > 0 ? (Q11 / 3600 * pumpHead * g * rho) / (eff_factor * 1000) : 0;
    const bondPower_kWh_t = (p80 > 0 && f80 > 0) ? workIndex * 10 * (1/Math.sqrt(p80) - 1/Math.sqrt(f80)) : 0;
    const crusherPower = bondPower_kWh_t * hourlyOreFeedRate;
    const totalCurrent = (currentEfficiency > 0) ? (P_hr_kg / 3600 * 2 * 96485) / (63.546 * (currentEfficiency / 100)) : 0;
    const rectifierPowerDC = (totalCurrent * cellVoltage) / 1000;
    const rectifierPowerAC = rectifierPowerDC / (motorEfficiency / 100);
    const plsTankVolume = Q4 * plsResidenceTime;
    const raffinateTankVolume = Q11 * raffinateResidenceTime;
    const totalPowerConsumption = plsPumpPower + raffinatePumpPower + crusherPower + rectifierPowerAC;

    // 6. CAPEX
    const capex_pumps = (plsPumpPower + raffinatePumpPower) * pumpCostFactor;
    const capex_crusher = crusherPower * crusherCostFactor;
    const capex_rectifier = rectifierPowerAC * rectifierCostFactor;
    const capex_pad = requiredHeapArea * padCostFactor;
    const capex_tanks = (plsTankVolume + raffinateTankVolume) * tankCostFactor;
    const totalCapex = capex_pumps + capex_crusher + capex_rectifier + capex_pad + capex_tanks;

    // 7. OPEX
    const annualHours = wd * wh;
    const opex_power = totalPowerConsumption * annualHours * electricityPrice;
    const annualAcidConsumption = requiredOreFeedRate * wd * acidConsumption / 1000;
    const opex_acid = annualAcidConsumption * acidPrice;
    const opex_guar = (guarConsumption / 1000) * p * guarPrice;
    const opex_kerosene = keroseneConsumption * requiredHeapArea * kerosenePrice;
    const opex_cobalt = (cobaltConsumption / 1000) * p * cobaltPrice;
    const opex_reagents = opex_acid + opex_guar + opex_kerosene + opex_cobalt;
    const opex_labor = laborCount * avgLaborCost;
    const opex_maintenance = totalCapex * (maintenanceRate / 100);
    const totalOpex = opex_power + opex_reagents + opex_labor + opex_maintenance;
    const productionCostPerTon = p > 0 ? totalOpex / p : 0;

    setResults({
      P_hr_ton, hourlyOreFeedRate, requiredHeapArea, 
      Q1: hourlyOreFeedRate, Q2, Q3: Q3_in, Q4, Q5, Q6: Q6_in, Q7, Q8, Q9: Q9_bleed_in, Q10: P_hr_ton, Q11, Q12, Q13, Q14, Q15, Q17, Q18, Q19, Q20,
      C1: 0, C2, C3: C3_in, C4, C5, C6: C6_in, C7, C8, C9: C9_in, C10: 0, C11, C12,
      plsPumpPower, raffinatePumpPower, crusherPower, rectifierPowerDC, rectifierPowerAC, plsTankVolume, raffinateTankVolume,
      totalPowerConsumption,
      capex_pumps, capex_crusher, capex_rectifier, capex_pad, capex_tanks, totalCapex,
      opex_power, opex_reagents, opex_labor, opex_maintenance, totalOpex,
      productionCostPerTon
    });
  }, [inputs]);

  useEffect(() => {
    calculateAll();
  }, [inputs, calculateAll]);

  const getGeminiSuggestions = async () => {
    if (!results.totalCapex) {
        alert('لطفاً ابتدا مقادیر را محاسبه کنید.');
        return;
    }
    setIsLoadingSuggestions(true);
    setError(null);
    setGeminiSuggestions('');

    const prompt = `
        شما یک مهندس مشاور ارشد در زمینه فرآوری مواد معدنی و متالورژی استخراجی هستید. یک طرح هیپ لیچینگ مس با مشخصات زیر به شما ارائه شده است. لطفاً یک تحلیل کارشناسی ارائه دهید و پیشنهادات مشخص و عملی برای بهینه‌سازی و کاهش هزینه‌ها بیان کنید. تحلیل شما باید شامل نقاط قوت، نقاط ضعف احتمالی و پیشنهاداتی برای بهبود در بخش‌های فرآیند، تجهیزات و اقتصاد طرح باشد.

        **خلاصه نتایج طرح:**
        - کل سرمایه‌گذاری (CAPEX): ${results.totalCapex.toLocaleString('fa-IR')} ریال
        - هزینه عملیاتی سالانه (OPEX): ${results.totalOpex.toLocaleString('fa-IR')} ریال
        - هزینه تمام شده هر تن مس: ${results.productionCostPerTon.toLocaleString('fa-IR')} ریال
        - کل توان مصرفی: ${results.totalPowerConsumption.toFixed(2)} کیلووات
        - نرخ خوراک سنگ معدن: ${results.hourlyOreFeedRate.toFixed(2)} تن در ساعت
        - مساحت پد لیچینگ: ${results.requiredHeapArea.toFixed(2)} متر مربع

        **تفکیک هزینه‌ها:**
        - هزینه برق سالانه: ${results.opex_power.toLocaleString('fa-IR')} ریال
        - هزینه مواد مصرفی سالانه: ${results.opex_reagents.toLocaleString('fa-IR')} ریال
        - هزینه نیروی انسانی سالانه: ${results.opex_labor.toLocaleString('fa-IR')} ریال

        لطفاً تحلیل خود را به زبان فارسی و در قالب زیر ارائه دهید:
        ### تحلیل کلی طرح
        (نظر کلی شما در مورد اقتصادی بودن و امکان‌سنجی طرح)
        ### نقاط قوت
        - (موردی)
        - (موردی)
        ### نقاط ضعف و ریسک‌های احتمالی
        - (موردی)
        - (موردی)
        ### پیشنهادات بهینه‌سازی
        **بخش فرآیند:**
        - (پیشنهاد مشخص برای بهبود بازیابی، کاهش مصرف اسید و ...)
        **بخش تجهیزات:**
        - (پیشنهاد مشخص برای کاهش مصرف انرژی سنگ‌شکن، بهینه‌سازی پمپ‌ها و ...)
        **بخش اقتصادی:**
        - (پیشنهاد مشخص برای کاهش هزینه‌های CAPEX یا OPEX)
    `;

    try {
        let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { contents: chatHistory };
        const apiKey = ""; // API key will be provided by the environment
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setGeminiSuggestions(text);
        } else {
            throw new Error("پاسخ معتبری از سرویس دریافت نشد.");
        }
    } catch (e) {
        setError("خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.");
        console.error(e);
    } finally {
        setIsLoadingSuggestions(false);
    }
  };

  const exportAllToExcel = () => {
    const wb = utils.book_new();

    const dashboardData = [
        { 'شاخص': 'کل سرمایه‌گذاری (CAPEX)', 'مقدار': results.totalCapex, 'واحد': 'ریال' },
        { 'شاخص': 'هزینه عملیاتی سالانه (OPEX)', 'مقدار': results.totalOpex, 'واحد': 'ریال' },
        { 'شاخص': 'هزینه تولید هر تن مس', 'مقدار': results.productionCostPerTon, 'واحد': 'ریال بر تن' },
        { 'شاخص': 'کل توان مصرفی', 'مقدار': results.totalPowerConsumption, 'واحد': 'کیلووات' },
    ];
    const ws_dashboard = utils.json_to_sheet(dashboardData);
    utils.book_append_sheet(wb, ws_dashboard, "داشبورد");

    const allData = [
        ...Object.entries(inputs).map(([k,v]) => ({'دسته': 'ورودی', 'پارامتر': k, 'مقدار': v})),
        ...Object.entries(results).map(([k,v]) => ({'دسته': 'خروجی', 'پارامتر': k, 'مقدار': v})),
    ];
    const ws_all_data = utils.json_to_sheet(allData);
    utils.book_append_sheet(wb, ws_all_data, "تمام داده‌ها");

    writeFile(wb, "گزارش_جامع_لیچینگ_ایران.xlsx");
  };
  const getConsultantNotes = () => {
      const notes = [];
      if (results.productionCostPerTon > 1500000000) { // ~3000 USD
          notes.push("هزینه تولید بالا به نظر می‌رسد. بررسی قیمت برق و راندمان تجهیزات، به خصوص سنگ‌شکن، توصیه می‌شود.");
      } else if (results.productionCostPerTon < 750000000 && results.productionCostPerTon > 0) { // ~1500 USD
          notes.push("هزینه تولید بسیار رقابتی است. این طرح از نظر اقتصادی پتانسیل بالایی دارد.");
      }

      const powerOpexPercent = results.totalOpex > 0 ? (results.opex_power / results.totalOpex) * 100 : 0;
      if (powerOpexPercent > 40) {
          notes.push("هزینه انرژی بخش عمده‌ای از هزینه‌های عملیاتی را تشکیل می‌دهد. بهینه‌سازی در بخش سنگ‌شکنی یا استفاده از تعرفه‌های صنعتی برق می‌تواند موثر باشد.");
      }
      
      if(results.requiredHeapArea > 1000000) {
          notes.push("مساحت پد مورد نیاز قابل توجه است. بررسی افزایش ارتفاع هیپ برای کاهش سطح اشغال و هزینه‌های ساخت پد مفید خواهد بود.");
      }
      
      if (notes.length === 0) {
          notes.push("پارامترهای فرآیند در محدوده معقولی قرار دارند. برای تحلیل دقیق‌تر، داده‌های واقعی آزمایشگاهی مورد نیاز است.");
      }
      return notes;
  };
  const renderDashboard = () => {
    const capexData = [
        { label: 'پد لیچینگ', value: results.capex_pad || 0, color: '#0e7490' },
        { label: 'سنگ‌شکن', value: results.capex_crusher || 0, color: '#059669' },
        { label: 'EW', value: results.capex_rectifier || 0, color: '#f59e0b' },
        { label: 'پمپ و مخازن', value: (results.capex_pumps || 0) + (results.capex_tanks || 0), color: '#6366f1' },
    ];
    const opexData = [
        { label: 'انرژی', value: results.opex_power || 0, color: '#f59e0b' },
        { label: 'نیروی انسانی', value: results.opex_labor || 0, color: '#3b82f6' },
        { label: 'نگهداری', value: results.opex_maintenance || 0, color: '#ef4444' },
        { label: 'مواد مصرفی', value: results.opex_reagents || 0, color: '#10b981' },
    ];
    const consultantNotes = getConsultantNotes();

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">داشبورد مدیریتی و گزارش مشاور</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <ResultCard title="کل سرمایه‌گذاری (CAPEX)" value={results.totalCapex || 0} unit="ریال" icon={<Briefcase className="text-blue-400" size={24}/>} isCurrency={true} />
                <ResultCard title="هزینه عملیاتی سالانه (OPEX)" value={results.totalOpex || 0} unit="ریال" icon={<DollarSign className="text-green-400" size={24}/>} isCurrency={true} />
                <ResultCard title="هزینه تولید هر تن مس" value={results.productionCostPerTon || 0} unit="ریال بر تن" icon={<BarChart2 className="text-yellow-400" size={24}/>} isCurrency={true} />
                <ResultCard title="کل توان مصرفی" value={results.totalPowerConsumption || 0} unit="کیلووات" icon={<Power className="text-red-400" size={24}/>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4">توصیه‌های مشاور</h3>
                    <ul className="space-y-3">
                        {consultantNotes.map((note, index) => (
                            <li key={index} className="flex items-start">
                                <HelpCircle className="w-5 h-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                                <p className="text-gray-300">{note}</p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 flex flex-col space-y-6">
                    <PieChart data={capexData} title="تفکیک هزینه‌های سرمایه‌گذاری (CAPEX)" />
                    <PieChart data={opexData} title="تفکیک هزینه‌های عملیاتی (OPEX)" />
                </div>
            </div>
        </div>
    );
  };
  const renderEconomics = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
        <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های اقتصادی</h2>
            <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">هزینه‌های اصلی</h3>
            <InputField label="قیمت برق" unit="ریال/کیلووات ساعت" name="electricityPrice" value={inputs.electricityPrice} onChange={handleInputChange} />
            <InputField label="قیمت اسید" unit="ریال/تن" name="acidPrice" value={inputs.acidPrice} onChange={handleInputChange} />
            <InputField label="تعداد نیروی انسانی" unit="نفر" name="laborCount" value={inputs.laborCount} onChange={handleInputChange} />
            <InputField label="متوسط هزینه سالانه هر نفر" unit="ریال" name="avgLaborCost" value={inputs.avgLaborCost} onChange={handleInputChange} />
            <InputField label="نرخ نگهداری سالانه" unit="% از CAPEX" name="maintenanceRate" value={inputs.maintenanceRate} onChange={handleInputChange} />
            
            <h3 className="text-lg font-semibold text-cyan-400 mt-6 mb-2">سایر مواد مصرفی</h3>
            <InputField label="مصرف پودر گوار" unit="گرم/تن مس" name="guarConsumption" value={inputs.guarConsumption} onChange={handleInputChange} tooltip="برای بهبود کیفیت کاتد در EW."/>
            <InputField label="قیمت پودر گوار" unit="ریال/کیلوگرم" name="guarPrice" value={inputs.guarPrice} onChange={handleInputChange} />
            <InputField label="مصرف نفت (حلال)" unit="لیتر/متر مربع پد" name="keroseneConsumption" value={inputs.keroseneConsumption} onChange={handleInputChange} tooltip="تلفات سالانه حلال آلی به دلیل تبخیر."/>
            <InputField label="قیمت نفت (حلال)" unit="ریال/لیتر" name="kerosenePrice" value={inputs.kerosenePrice} onChange={handleInputChange} />
            <InputField label="مصرف کبالت" unit="گرم/تن مس" name="cobaltConsumption" value={inputs.cobaltConsumption} onChange={handleInputChange} tooltip="برای کاهش خوردگی آندهای سربی در EW."/>
            <InputField label="قیمت کبالت" unit="ریال/کیلوگرم" name="cobaltPrice" value={inputs.cobaltPrice} onChange={handleInputChange} />

        </div>
        <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">فاکتورهای هزینه (CAPEX)</h2>
            <p className="text-xs text-gray-400 mb-4">این مقادیر تقریبی هستند و برای مناطق مختلف متفاوتند.</p>
            <InputField label="فاکتور هزینه پمپ" unit="ریال/کیلووات" name="pumpCostFactor" value={inputs.pumpCostFactor} onChange={handleInputChange} />
            <InputField label="فاکتور هزینه سنگ‌شکن" unit="ریال/کیلووات" name="crusherCostFactor" value={inputs.crusherCostFactor} onChange={handleInputChange} />
            <InputField label="فاکتور هزینه رکتیفایر" unit="ریال/کیلووات" name="rectifierCostFactor" value={inputs.rectifierCostFactor} onChange={handleInputChange} />
            <InputField label="هزینه ساخت پد" unit="ریال/متر مربع" name="padCostFactor" value={inputs.padCostFactor} onChange={handleInputChange} />
            <InputField label="هزینه ساخت مخزن" unit="ریال/متر مکعب" name="tankCostFactor" value={inputs.tankCostFactor} onChange={handleInputChange} />
        </div>
        <div className="lg:col-span-1">
             <h2 className="text-2xl font-bold text-white mb-6">نتایج اقتصادی</h2>
             <div className="space-y-4">
                 <ResultCard title="کل سرمایه‌گذاری (CAPEX)" value={results.totalCapex || 0} unit="ریال" icon={<Briefcase className="text-blue-400" size={24}/>} isCurrency={true} />
                 <ResultCard title="هزینه عملیاتی سالانه (OPEX)" value={results.totalOpex || 0} unit="ریال" icon={<DollarSign className="text-green-400" size={24}/>} isCurrency={true} />
                 <ResultCard title="هزینه تولید هر تن مس" value={results.productionCostPerTon || 0} unit="ریال بر تن" icon={<BarChart2 className="text-yellow-400" size={24}/>} isCurrency={true} />
             </div>
        </div>
    </div>
  );
  const renderProcess = () => (
    <div className="p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های کلیدی</h2>
          <InputField label="ظرفیت تولید سالانه" unit="تن" name="p" value={inputs.p} onChange={handleInputChange} />
          <InputField label="عیار سنگ معدن" unit="%" name="oreGrade" value={inputs.oreGrade} onChange={handleInputChange} />
          <InputField label="بازیابی کل" unit="%" name="totalRecovery" value={inputs.totalRecovery} onChange={handleInputChange} />
          <InputField label="بازیابی SX" unit="%" name="R" value={inputs.R} onChange={handleInputChange} />
          <InputField label="غلظت مس PLS (اولیه)" unit="گرم/لیتر" name="C4_in" value={inputs.C4_in} onChange={handleInputChange} tooltip="این غلظت مبنای محاسبه دبی PLS است."/>
          <InputField label="افت غلظت مس در EW" unit="گرم/لیتر" name="delta_Cu" value={inputs.delta_Cu} onChange={handleInputChange} />
        </div>
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-bold text-white mb-6">نتایج جامع جریان‌های فرآیندی (Streams)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <ResultCard streamNumber="1" title="سنگ معدن به هیپ" value={results.Q1 || 0} unit="تن در ساعت" />
              <ResultCard streamNumber="2" title="تبخیر از هیپ" value={results.Q2 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="3" title="PLS از هیپ" value={results.Q3 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="4" title="PLS به SX" value={results.Q4 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C4 ? results.C4.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="5" title="آلی باردار" value={results.Q5 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C5 ? results.C5.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="6" title="آلی برگشتی" value={results.Q6 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C6 ? results.C6.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="7" title="الکترولیت غنی" value={results.Q7 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C7 ? results.C7.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="8" title="الکترولیت مصرفی" value={results.Q8 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C8 ? results.C8.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="9" title="بلید PLS" value={results.Q9 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C9 ? results.C9.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="10" title="تولید کاتد" value={results.Q10 || 0} unit="تن در ساعت" />
              <ResultCard streamNumber="11" title="رافینت از SX" value={results.Q11 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C11 ? results.C11.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="12" title="رافینت به هیپ" value={results.Q12 || 0} unit="متر مکعب/ساعت" note={`غلظت: ${results.C12 ? results.C12.toFixed(2) : 0} g/L`}/>
              <ResultCard streamNumber="13" title="اسید به هیپ" value={results.Q13 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="14" title="اسید در بلید" value={results.Q14 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="15" title="بخار آب" value={results.Q15 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="17" title="لجن کاتدی" value={results.Q17 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="18" title="آب در بلید" value={results.Q18 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="19" title="آب جبرانی" value={results.Q19 || 0} unit="متر مکعب/ساعت" />
              <ResultCard streamNumber="20" title="اسید به رافینت" value={results.Q20 || 0} unit="متر مکعب/ساعت" />
          </div>
        </div>
      </div>
    </div>
  );
  const renderHeapDesign = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های طراحی هیپ</h2>
        <InputField label="عیار ماده معدنی" unit="%" name="oreGrade" value={inputs.oreGrade} onChange={handleInputChange} tooltip="درصد مس قابل لیچ در سنگ معدن." />
        <InputField label="بازیابی کل فرآیند" unit="%" name="totalRecovery" value={inputs.totalRecovery} onChange={handleInputChange} tooltip="راندمان کلی از سنگ معدن تا کاتد مس." />
        <InputField label="چگالی سنگ معدن" unit="تن/متر مکعب" name="oreDensity" value={inputs.oreDensity} onChange={handleInputChange} tooltip="جرم سنگ معدن در واحد حجم." />
        <InputField label="ارتفاع هیپ" unit="متر" name="heapHeight" value={inputs.heapHeight} onChange={handleInputChange} tooltip="ارتفاع پشته سنگ معدنی روی پد." />
        <InputField label="چرخه لیچینگ" unit="روز" name="leachCycle" value={inputs.leachCycle} onChange={handleInputChange} tooltip="مدت زمانی که سنگ معدن تحت آبیاری قرار می‌گیرد." />
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">نتایج طراحی هیپ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultCard title="نرخ خوراک ساعتی" value={results.hourlyOreFeedRate || 0} unit="تن در ساعت" icon={<Settings className="text-yellow-500" size={24}/>} />
            <ResultCard title="سطح مورد نیاز برای لیچینگ" value={results.requiredHeapArea || 0} unit="متر مربع" icon={<AreaChart className="text-green-400" size={24}/>} />
        </div>
      </div>
    </div>
  );
  const renderEquipmentSizing = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 md:p-8">
      <div className="lg:col-span-1 bg-gray-900/50 p-6 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 border-b-2 border-cyan-500 pb-2">ورودی‌های تخمین تجهیزات</h2>
        <InputField label="نرخ خوراک ساعتی" unit="تن/ساعت" name="hourlyOreFeedRate" value={results.hourlyOreFeedRate ? results.hourlyOreFeedRate.toFixed(2) : '0.00'} onChange={()=>{}} disabled={true} tooltip="این مقدار از تب طراحی هیپ محاسبه شده است."/>
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">پمپ‌ها</h3>
        <InputField label="هد دینامیکی کل" unit="متر" name="pumpHead" value={inputs.pumpHead} onChange={handleInputChange} tooltip="افت فشار کل در مسیر پمپاژ."/>
        <InputField label="راندمان پمپ" unit="%" name="pumpEfficiency" value={inputs.pumpEfficiency} onChange={handleInputChange} />
        <InputField label="راندمان الکتروموتور" unit="%" name="motorEfficiency" value={inputs.motorEfficiency} onChange={handleInputChange} />
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">سنگ‌شکن</h3>
        <InputField label="شاخص کار باند (Wi)" unit="kWh/t" name="workIndex" value={inputs.workIndex} onChange={handleInputChange} tooltip="انرژی مورد نیاز برای خردایش سنگ."/>
        <InputField label="اندازه 80% خوراک (F80)" unit="میکرون" name="f80" value={inputs.f80} onChange={handleInputChange} />
        <InputField label="اندازه 80% محصول (P80)" unit="میکرون" name="p80" value={inputs.p80} onChange={handleInputChange} />
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">الکترووینینگ</h3>
        <InputField label="ولتاژ سلول" unit="ولت" name="cellVoltage" value={inputs.cellVoltage} onChange={handleInputChange} />
        <InputField label="راندمان جریانی" unit="%" name="currentEfficiency" value={inputs.currentEfficiency} onChange={handleInputChange} />
        <h3 className="text-lg font-semibold text-cyan-400 mt-4 mb-2">مخازن</h3>
        <InputField label="زمان ماند مخزن PLS" unit="ساعت" name="plsResidenceTime" value={inputs.plsResidenceTime} onChange={handleInputChange} />
        <InputField label="زمان ماند مخزن رافینت" unit="ساعت" name="raffinateResidenceTime" value={inputs.raffinateResidenceTime} onChange={handleInputChange} />
      </div>
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6">پیشنهاد اولیه برای تجهیزات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultCard title="توان پمپ PLS" value={results.plsPumpPower || 0} unit="کیلووات" icon={<Power className="text-blue-400" size={24}/>} searchQuery={`خرید پمپ سانتریفیوژ ${Math.round(results.plsPumpPower || 0)}kW ${inputs.pumpHead}m head`} />
            <ResultCard title="توان پمپ رافینت" value={results.raffinatePumpPower || 0} unit="کیلووات" icon={<Power className="text-blue-400" size={24}/>} searchQuery={`خرید پمپ ضد اسید ${Math.round(results.raffinatePumpPower || 0)}kW ${inputs.pumpHead}m head`} />
            <ResultCard title="توان سنگ‌شکن" value={results.crusherPower || 0} unit="کیلووات" icon={<Hammer className="text-red-500" size={24}/>} searchQuery={`خرید سنگ شکن مخروطی ${Math.round(results.hourlyOreFeedRate || 0)} تن بر ساعت`} />
            <ResultCard title="توان DC رکتیفایر" value={results.rectifierPowerDC || 0} unit="کیلووات" icon={<Zap className="text-yellow-400" size={24}/>} searchQuery={`خرید رکتیفایر ${Math.round(results.rectifierPowerDC || 0)}kW`}/>
            <ResultCard title="توان AC ترانسفورماتور" value={results.rectifierPowerAC || 0} unit="کیلووات" icon={<Zap className="text-yellow-400" size={24}/>} note="با احتساب راندمان" searchQuery={`خرید ترانسفورماتور ${Math.round(results.rectifierPowerAC || 0)}kVA`}/>
            <ResultCard title="حجم مخزن PLS" value={results.plsTankVolume || 0} unit="متر مکعب" icon={<Droplets className="text-green-400" size={24}/>} />
            <ResultCard title="حجم مخزن رافینت" value={results.raffinateTankVolume || 0} unit="متر مکعب" icon={<Droplets className="text-purple-400" size={24}/>} />
        </div>
      </div>
    </div>
  );
  const FormulaTable = () => {
    const formulas = [
        { desc: 'نرخ خوراک ساعتی', formula: 'OreRate = (P/wd)/(Grade*Rec)/wh', params: 'P: تولید سالانه, wd: روز کاری, Grade: عیار, Rec: بازیابی کل, wh: ساعت کاری' },
        { desc: 'دبی محلول PLS', formula: 'Q4 = (P_hr_kg) / (C4 * R/100)', params: 'P_hr_kg: تولید ساعتی (kg), C4: غلظت مس, R: بازیابی SX' },
        { desc: 'غلظت مس رافینت', formula: 'C11 = (1 - R/100) * C4', params: 'R: بازیابی SX, C4: غلظت مس PLS' },
        { desc: 'تبخیر از هیپ', formula: 'Q2 = (A/100) * Q11', params: 'A: درصد تبخیر, Q11: دبی رافینت' },
        { desc: 'دبی آلی باردار', formula: 'Q5 = Q4 * ROA', params: 'Q4: دبی PLS, ROA: نسبت O:A' },
        { desc: 'دبی الکترولیت مصرفی', formula: 'Q8 = (P_hr_ton * 1000) / ΔCu', params: 'P_hr_ton: تولید ساعتی (ton), ΔCu: افت غلظت' },
        { desc: 'توان سنگ‌شکن (قانون باند)', formula: 'P_crusher = Wi*10*(1/√P80-1/√F80)*OreRate', params: 'Wi: شاخص کار, P80/F80: ابعاد محصول/خوراک' },
        { desc: 'توان رکتیفایر (قانون فارادی)', formula: 'P_rect = (I_total * V_cell)', params: 'I_total: جریان کل محاسبه شده از تولید, V_cell: ولتاژ سلول' },
    ];

    return (
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">جدول مرجع فرمول‌های کلیدی</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right text-gray-300">
                    <thead className="text-xs text-cyan-400 uppercase bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3">شرح</th>
                            <th scope="col" className="px-6 py-3">فرمول</th>
                            <th scope="col" className="px-6 py-3">تعریف پارامترها</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formulas.map((f, index) => (
                            <tr key={index} className="bg-gray-900 border-b border-gray-700 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium">{f.desc}</td>
                                <td className="px-6 py-4 font-mono text-left">{f.formula}</td>
                                <td className="px-6 py-4 text-xs">{f.params}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };
  const renderHelp = () => (
    <div className="p-4 md:p-8 text-gray-300 leading-loose max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6 text-center">راهنمای جامع ابزار</h2>
        <FormulaTable />
        <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">یکپارچگی محاسبات</h3>
            <p>این ابزار به صورت یکپارچه طراحی شده است. به این معنی که با تغییر پارامترهای اصلی (مانند ظرفیت تولید)، نتایج در تمام بخش‌ها، از جمله "تخمین تجهیزات" و "تحلیل اقتصادی"، به صورت خودکار به‌روزرسانی می‌شوند.</p>
        </div>
    </div>
  );

  const TabButton = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center space-x-2 space-x-reverse font-semibold px-4 py-2 rounded-t-lg transition-colors duration-300 ${
        activeTab === tabName
          ? 'bg-gray-900/50 border-b-2 border-cyan-500 text-cyan-400'
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div dir="rtl" className="bg-gray-900 min-h-screen font-sans text-white" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
       <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap" rel="stylesheet" />
      
      <header className="bg-gray-900/80 backdrop-blur-sm shadow-lg p-4 sticky top-0 z-20 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <ChevronsDown className="text-cyan-400" size={32} />
            <h1 className="text-2xl font-bold">مشاور مهندسی لیچینگ</h1>
          </div>
          <nav className="flex space-x-1 space-x-reverse border-b-0">
            <TabButton tabName="dashboard" label="داشبورد" icon={<BarChart2 size={18}/>} />
            <TabButton tabName="process" label="جریان‌های فرآیندی" icon={<Calculator size={18}/>} />
            <TabButton tabName="heap" label="طراحی هیپ" icon={<Layers size={18}/>} />
            <TabButton tabName="equipment" label="تجهیزات" icon={<Cog size={18}/>} />
            <TabButton tabName="economics" label="تحلیل اقتصادی" icon={<DollarSign size={18}/>} />
            <TabButton tabName="gemini" label="✨ تحلیل هوشمند" icon={<Sparkles size={18}/>} />
            <TabButton tabName="help" label="راهنما" icon={<HelpCircle size={18}/>} />
          </nav>
        </div>
      </header>

      <main className="container mx-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'economics' && renderEconomics()}
        {activeTab === 'equipment' && renderEquipmentSizing()}
        {activeTab === 'heap' && renderHeapDesign()}
        {activeTab === 'process' && renderProcess()}
        {activeTab === 'gemini' && renderGeminiAnalysis()}
        {activeTab === 'help' && renderHelp()}
      </main>

      <footer className="text-center p-4 text-gray-500 text-sm mt-8">
        <p>ابزار جامع امکان‌سنجی | طراح: میلاد جهانی</p>
        <button onClick={exportAllToExcel} className="mt-2 flex mx-auto items-center space-x-2 space-x-reverse bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition shadow-lg">
            <FileDown size={20} />
            <span>دانلود گزارش جامع اکسل</span>
        </button>
      </footer>
    </div>
  );
}
